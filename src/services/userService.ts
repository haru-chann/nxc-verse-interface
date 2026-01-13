import { doc, getDoc, updateDoc, setDoc, collection, getDocs, deleteDoc, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
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
