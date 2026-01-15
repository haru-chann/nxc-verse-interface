import { doc, getDoc, updateDoc, setDoc, collection, getDocs, deleteDoc, query, runTransaction, where, limit, Timestamp, serverTimestamp, deleteField, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    username?: string;
    usernameLastChanged?: Timestamp;
    nfcId?: string;
    firstName?: string;
    lastName?: string;
    photoURL?: string;
    bio?: string;
    location?: string;
    role?: string;
    coverImage?: string;
    isBanned?: boolean;
    isPublic?: boolean;
    isWallpaperBlurred?: boolean;
    company?: string;
    title?: string;
    phone?: string;
    links?: Array<{ title: string; url: string }>;
    portfolioItems?: Array<{ title: string; category: string; imageUrl?: string; description?: string }>;
    privateMetadata?: any[];
    privateContents?: any[];
    visuals?: {
        goldRing?: boolean;
        royalTexture?: boolean;
        customBranding?: boolean;
    };
    stats?: {
        views?: number;
        taps?: number;
    };
    // Add other fields as needed
}

export const userService = {
    getUserProfile: async (uid: string): Promise<UserProfile | null> => {
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as UserProfile;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
    },

    updateUserProfile: async (uid: string, data: Partial<UserProfile>) => {
        try {
            const docRef = doc(db, "users", uid);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    },

    // Analytics
    incrementProfileView: async (uid: string) => {
        try {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, {
                "stats.views": increment(1)
            });
        } catch (error: any) {
            // If field doesn't exist, we might need set with merge, but update usually fails if doc doesn't exist.
            // If doc exists but field doesn't, update with dot notation works in Firestore (creates map).
            console.error("Error incrementing view:", error);
        }
    },

    registerTap: async (nfcId: string, viewerUid?: string): Promise<{ uid: string; username?: string } | null> => {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("nfcId", "==", nfcId), limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                const uid = docSnap.id;
                const data = docSnap.data() as UserProfile;

                // Increment taps (ONLY if not the owner)
                if (uid !== viewerUid) {
                    await updateDoc(docSnap.ref, {
                        "stats.taps": increment(1)
                    });
                }

                return { uid, username: data.username };
            }
            return null;
        } catch (error) {
            console.error("Error registering tap:", error);
            throw error;
        }
    },

    // Username System
    checkUsernameAvailable: async (username: string): Promise<boolean> => {
        try {
            const normalizedUsername = username.toLowerCase();
            const usernameRef = doc(db, "usernames", normalizedUsername);
            const usernameSnap = await getDoc(usernameRef);
            return !usernameSnap.exists();
        } catch (error) {
            console.error("Error checking username availability:", error);
            throw error;
        }
    },

    claimUsername: async (uid: string, username: string, role: string = "user"): Promise<void> => {
        const normalizedUsername = username.toLowerCase();

        // CASE 1: REMOVAL (Empty Username)
        if (!username) {
            try {
                await runTransaction(db, async (transaction) => {
                    const userRef = doc(db, "users", uid);
                    const userDoc = await transaction.get(userRef);

                    if (!userDoc.exists()) {
                        throw new Error("User profile not found.");
                    }

                    const userData = userDoc.data() as UserProfile;

                    // If they have a username, remove it from 'usernames' collection
                    if (userData.username) {
                        const oldUsernameRef = doc(db, 'usernames', userData.username.toLowerCase());
                        transaction.delete(oldUsernameRef);
                    }

                    // Update user profile to remove username field
                    transaction.update(userRef, {
                        username: deleteField(),
                        usernameLastChanged: serverTimestamp()
                    });
                });
                return;
            } catch (error) {
                console.error("Error removing username:", error);
                throw error;
            }
        }

        // CASE 2: CLAIMING / UPDATING (Non-empty Username)

        // 1. Validation
        // Regex: Alphanumeric and underscore only
        const validFormat = /^[a-zA-Z0-9_]+$/.test(username);
        if (!validFormat) {
            throw new Error("Username can only contain letters, numbers, and underscores.");
        }

        // Min length: 5 chars, unless admin
        if (role !== "admin" && role !== "super_admin" && username.length < 5) {
            throw new Error("Username must be at least 5 characters long.");
        }

        // 2. Transaction
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "users", uid);
                const usernameRef = doc(db, "usernames", normalizedUsername);

                const userDoc = await transaction.get(userRef);
                const usernameDoc = await transaction.get(usernameRef);

                if (!userDoc.exists()) {
                    throw new Error("User profile not found.");
                }

                const userData = userDoc.data() as UserProfile;

                // CHECK: User Update Restriction
                // If user is trying to CHANGE an existing username, and they are NOT admin
                if (userData.username && userData.username !== username && role !== "admin" && role !== "super_admin") {
                    throw new Error("You cannot change your username. You can only remove it and set a fresh one if available.");
                }

                // Check 30-day lock (Skip for admins)
                // Note: Since users can't "change" directly, this lock effectively prevents "Delete -> Create New" spam if we want.
                // But the user prompt implied admins change "whenever they want".
                // If we block updates for users completely, the 30-day lock is less relevant for updates, but maybe relevant for re-creation?
                // Let's keep it for safety to prevent spamming the system with new usernames every minute.
                if (userData.usernameLastChanged && role !== "admin" && role !== "super_admin") {
                    const lastChanged = userData.usernameLastChanged.toDate();
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - lastChanged.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < 30) {
                        // Exception: If they currently have NO username, allow them to set one even if they removed it recently?
                        // The user said "admins should be able to change whenever they want".
                        // Logic: If I just deleted my username, I am creating a "new" identity.
                        // Ideally, we shouldn't lock them out if they made a mistake deleting it.
                        // Let's RELAX this check if they currently don't have a username (userData.username is undefined).
                        if (userData.username) {
                            throw new Error(`You can change your username again in ${30 - diffDays} days.`);
                        }
                    }
                }

                // Check if username is taken (by someone else)
                if (usernameDoc.exists()) {
                    if (usernameDoc.data().uid !== uid) {
                        throw new Error("Username is already taken.");
                    }
                    // If it's the same user, we allow update (case change etc)
                }

                // Prepare updates
                const updates: any = {
                    username: username, // Save original casing for display
                    usernameLastChanged: serverTimestamp()
                };

                // Remove old username reservation if exists and is different
                if (userData.username) {
                    const oldUsernameRef = doc(db, 'usernames', userData.username.toLowerCase());
                    if (userData.username.toLowerCase() !== normalizedUsername) {
                        transaction.delete(oldUsernameRef);
                    }
                }

                // Reserve new username
                transaction.set(usernameRef, { uid });
                // Update user profile
                transaction.update(userRef, updates);
            });
        } catch (error) {
            console.error("Error claiming username:", error);
            throw error;
        }
    },

    getUserByUsername: async (username: string): Promise<UserProfile | null> => {
        try {
            const normalizedUsername = username.toLowerCase();
            const usernameRef = doc(db, "usernames", normalizedUsername);
            const usernameSnap = await getDoc(usernameRef);

            if (!usernameSnap.exists()) {
                return null;
            }

            const uid = usernameSnap.data().uid;
            return await userService.getUserProfile(uid);
        } catch (error) {
            console.error("Error fetching user by username:", error);
            throw error;
        }
    },

    getUserByNfcId: async (nfcId: string): Promise<UserProfile | null> => {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("nfcId", "==", nfcId), limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data() as UserProfile;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user by NFC ID:", error);
            throw error;
        }
    },

    ensureNfcId: async (uid: string): Promise<string> => {
        try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data() as UserProfile;
                if (userData.nfcId) {
                    return userData.nfcId;
                }
            }

            // Generate new immutable NFC ID (random alphanumeric string)
            const nfcId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            await updateDoc(userRef, { nfcId });
            return nfcId;
        } catch (error) {
            console.error("Error ensuring NFC ID:", error);
            throw error;
        }
    },

    updateUserPrivateData: async (uid: string, data: any) => {
        try {
            // First, delete any existing private data to avoid duplicates/orphaned pins
            const secretsRef = collection(db, "users", uid, "secrets");
            const snapshot = await getDocs(secretsRef);
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Create new doc with PIN as ID
            // Default to 'main' if no PIN provided (should not happen in proper flow, but fallback)
            const docId = data.pin || "main";
            const docRef = doc(db, "users", uid, "secrets", docId);
            await setDoc(docRef, data, { merge: true });
        } catch (error) {
            console.error("Error updating private data:", error);
            throw error;
        }
    },

    // For Editor (Owner) - Fetches whatever is there
    getUserPrivateData: async (uid: string) => {
        try {
            const secretsRef = collection(db, "users", uid, "secrets");
            const snapshot = await getDocs(secretsRef);
            if (!snapshot.empty) {
                return snapshot.docs[0].data();
            }
            return null;
        } catch (error) {
            // It's okay if it doesn't exist yet, return null
            return null;
        }
    },

    // For Public Profile - Fetches specific PIN doc
    getPrivateDataByPin: async (uid: string, pin: string) => {
        try {
            const docRef = doc(db, "users", uid, "secrets", pin);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            throw error;
        }
    },

    // Blocking System
    blockUser: async (uid: string, targetIdentifier: string) => {
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const blocked = data.blocked || [];
                if (!blocked.includes(targetIdentifier)) {
                    await updateDoc(docRef, {
                        blocked: [...blocked, targetIdentifier]
                    });
                }
            }
        } catch (error) {
            console.error("Error blocking user:", error);
            throw error;
        }
    },

    unblockUser: async (uid: string, targetIdentifier: string) => {
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const blocked = data.blocked || [];
                const newBlocked = blocked.filter((id: string) => id !== targetIdentifier);
                await updateDoc(docRef, {
                    blocked: newBlocked
                });
            }
        } catch (error) {
            console.error("Error unblocking user:", error);
            throw error;
        }
    }
};
