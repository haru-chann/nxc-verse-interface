import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface QRDesign {
    id: string;
    userId: string;
    name: string;
    data: string; // The content of the QR code
    options: any; // visual options
    createdAt?: any;
}

export const qrService = {
    saveQRDesign: async (userId: string, design: Omit<QRDesign, "id" | "userId">) => {
        try {
            const id = crypto.randomUUID();
            const docRef = doc(db, "qr_codes", id);
            await setDoc(docRef, {
                ...design,
                id,
                userId,
                createdAt: new Date(),
            });
            return id;
        } catch (error) {
            console.error("Error saving QR design:", error);
            throw error;
        }
    },

    getUserQRDesigns: async (userId: string): Promise<QRDesign[]> => {
        try {
            const q = query(collection(db, "qr_codes"), where("userId", "==", userId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map((doc) => doc.data() as QRDesign);
        } catch (error) {
            console.error("Error getting QR designs:", error);
            throw error;
        }
    },

    deleteQRDesign: async (id: string) => {
        try {
            await deleteDoc(doc(db, "qr_codes", id));
        } catch (error) {
            console.error("Error deleting QR design:", error);
            throw error;
        }
    },

    updateQRDesign: async (id: string, updates: Partial<QRDesign>) => {
        try {
            await setDoc(doc(db, "qr_codes", id), updates, { merge: true });
        } catch (error) {
            console.error("Error updating QR design:", error);
            throw error;
        }
    }
};
