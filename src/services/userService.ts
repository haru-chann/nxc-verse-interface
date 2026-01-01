import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
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
            const docRef = doc(db, "users", uid, "secrets", "main");
            await setDoc(docRef, data, { merge: true });
        } catch (error) {
            console.error("Error updating private data:", error);
            throw error;
        }
    },

    getUserPrivateData: async (uid: string) => {
        try {
            const docRef = doc(db, "users", uid, "secrets", "main");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            // It's okay if it doesn't exist yet, return null or empty
            return null;
        }
    },
};
