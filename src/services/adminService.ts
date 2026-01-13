import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    deleteDoc,
    doc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AdminAction {
    id?: string;
    action: string; // e.g., "User Banned", "Report Dismissed"
    target: string; // e.g., "John Doe" or Order ID
    details?: string;
    adminName: string;
    timestamp: any;
}

const COLLECTION_NAME = "admin_actions";
const MAX_LOGS = 10;

export const adminService = {
    /**
     * Logs an admin action and ensures only the latest 10 actions are kept.
     */
    logAction: async (action: string, target: string, details: string = "", adminName: string = "Admin") => {
        try {
            // 1. Add new action
            await addDoc(collection(db, COLLECTION_NAME), {
                action,
                target,
                details,
                adminName,
                timestamp: serverTimestamp()
            });

            // 2. Prune old actions to keep only MAX_LOGS
            // We fetch slightly more than max to see if we need to delete
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy("timestamp", "desc")
            );

            const snapshot = await getDocs(q);

            if (snapshot.size > MAX_LOGS) {
                // Delete all docs after the MAX_LOGS-th index
                const docsToDelete = snapshot.docs.slice(MAX_LOGS);
                const deletePromises = docsToDelete.map(d => deleteDoc(doc(db, COLLECTION_NAME, d.id)));
                await Promise.all(deletePromises);
            }

        } catch (error) {
            console.error("Error logging admin action:", error);
            // Don't throw, logging failure shouldn't block the main action
        }
    },

    /**
     * Fetches the recent actions.
     */
    getRecentActions: async () => {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy("timestamp", "desc"),
            limit(MAX_LOGS)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminAction));
    }
};
