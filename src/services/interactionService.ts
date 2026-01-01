import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Interaction {
    id: string;
    profileId: string;
    type: "view" | "tap" | "contact_saved" | "message";
    visitorId?: string;
    timestamp: any;
    metadata?: any;
    // For messages
    name?: string;
    email?: string;
    message?: string;
    read?: boolean;
}

export const interactionService = {
    logInteraction: async (profileId: string, type: string, extraData: any = {}) => {
        try {
            await addDoc(collection(db, "users", profileId, "interactions"), {
                type,
                timestamp: serverTimestamp(),
                ...extraData,
                read: false
            });
        } catch (error) {
            console.error("Error logging interaction:", error);
        }
    },

    getInteractions: async (profileId: string): Promise<Interaction[]> => {
        try {
            // Note: Use simple query without compound index unless needed
            const q = query(
                collection(db, "users", profileId, "interactions")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Interaction));
        } catch (error) {
            console.error("Error getting interactions:", error);
            throw error;
        }
    },
    updateInteraction: async (profileId: string, interactionId: string, data: Partial<Interaction>) => {
        try {
            const docRef = doc(db, "users", profileId, "interactions", interactionId);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating interaction:", error);
            throw error;
        }
    },

    deleteInteraction: async (profileId: string, interactionId: string) => {
        try {
            const docRef = doc(db, "users", profileId, "interactions", interactionId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting interaction:", error);
            throw error;
        }
    },
};
