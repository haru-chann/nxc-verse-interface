import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";

export interface UsageStats {
    contactsCount: number; // Total contacts saved (permanent)
    exportsCount: number;  // Exports in current month (resets)
    monthKey: string;      // "YYYY-MM"
}

export const usageService = {
    getUsageStats: async (userId: string): Promise<UsageStats> => {
        const currentMonth = format(new Date(), "yyyy-MM");

        // 1. Get Global Stats (Contacts count)
        // We can either query the collection size or keep a counter. 
        // For efficiency/simplicity, let's query the specific usage doc we maintain.
        const usageRef = doc(db, "users", userId, "usage", "stats");
        const monthRef = doc(db, "users", userId, "usage", `monthly_${currentMonth}`);

        let contactsCount = 0;
        let exportsCount = 0;

        try {
            const usageSnap = await getDoc(usageRef);
            if (usageSnap.exists()) {
                contactsCount = usageSnap.data().contactsCount || 0;
            }

            const monthSnap = await getDoc(monthRef);
            if (monthSnap.exists()) {
                exportsCount = monthSnap.data().exportsCount || 0;
            }

            return { contactsCount, exportsCount, monthKey: currentMonth };
        } catch (error) {
            console.error("Error fetching usage stats:", error);
            // Return zeros on error to be safe, or could throw
            return { contactsCount: 0, exportsCount: 0, monthKey: currentMonth };
        }
    },

    incrementExportCount: async (userId: string): Promise<void> => {
        const currentMonth = format(new Date(), "yyyy-MM");
        const monthRef = doc(db, "users", userId, "usage", `monthly_${currentMonth}`);

        try {
            await setDoc(monthRef, {
                exportsCount: increment(1),
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error incrementing export count:", error);
            throw error;
        }
    },

    // Call this when a contact is added
    incrementContactCount: async (userId: string): Promise<void> => {
        const usageRef = doc(db, "users", userId, "usage", "stats");
        try {
            await setDoc(usageRef, {
                contactsCount: increment(1),
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error incrementing contact count:", error);
        }
    },

    // Call this when a contact is deleted
    decrementContactCount: async (userId: string): Promise<void> => {
        const usageRef = doc(db, "users", userId, "usage", "stats");
        try {
            await setDoc(usageRef, {
                contactsCount: increment(-1),
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error decrementing contact count:", error);
        }
    },

    // Helper to sync contact count if it gets out of sync (can run this on load occasionally)
    syncContactCount: async (userId: string, actualCount: number): Promise<void> => {
        const usageRef = doc(db, "users", userId, "usage", "stats");
        await setDoc(usageRef, {
            contactsCount: actualCount,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }
};
