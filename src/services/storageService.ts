import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

export const storageService = {
    uploadImage: async (file: File, path: string): Promise<string> => {
        try {
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    },

    deleteImage: async (url: string): Promise<void> => {
        if (!url) return;
        try {
            // Create a reference to the file to delete
            // Note: ref() can take a full URL and parse it correctly for Firebase Storage URLs
            const storageRef = ref(storage, url);
            await deleteObject(storageRef);
        } catch (error) {
            console.warn("Error deleting image (might not exist):", error);
        }
    }
};
