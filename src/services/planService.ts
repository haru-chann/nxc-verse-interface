import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc, onSnapshot } from "firebase/firestore";

export interface PlanLimits {
    links: number;
    contacts: number;
    exports: number;
    portfolioItems: number; // New numeric limit
    privateContentItems: number; // New numeric limit
}

export interface PlanFeatures {
    portfolio: boolean;
    privateContent: boolean;
    customBranding: boolean;
    wallpaper: boolean;
}

export interface PlanVisuals {
    goldRing: boolean;
    royalTexture: boolean;
}

export interface Plan {
    id: string; // 'free', 'plus', 'platinum', 'ultra' or custom
    name: string;
    price: number;
    description: string;
    limits: PlanLimits;
    features: PlanFeatures;
    visuals: PlanVisuals;
    isPopular?: boolean;
    isActive: boolean; // To soft delete/hide plans
    tierOrder: number; // For sorting (0=free, 10=ultra)
}

// Default fallback plans if Firestore is empty
export const DEFAULT_PLANS: Plan[] = [
    {
        id: "free",
        name: "Free",
        price: 0,
        description: "Essential networking tools",
        limits: { links: 2, contacts: 50, exports: 5, portfolioItems: 1, privateContentItems: 0 },
        features: { portfolio: true, privateContent: false, customBranding: false, wallpaper: false },
        visuals: { goldRing: false, royalTexture: false },
        tierOrder: 0,
        isActive: true
    },
    {
        id: "plus",
        name: "Plus",
        price: 499,
        description: "The standard for professionals",
        limits: { links: 5, contacts: 500, exports: 30, portfolioItems: 5, privateContentItems: 0 },
        features: { portfolio: true, privateContent: false, customBranding: true, wallpaper: true },
        visuals: { goldRing: false, royalTexture: false },
        tierOrder: 1,
        isActive: true
    },
    {
        id: "platinum",
        name: "Platinum",
        price: 999,
        description: "Stand out with custom design",
        limits: { links: 5, contacts: 999999, exports: 100, portfolioItems: 10, privateContentItems: 0 }, // Unlimited contacts represented by high number
        features: { portfolio: true, privateContent: false, customBranding: true, wallpaper: true },
        visuals: { goldRing: true, royalTexture: false },
        tierOrder: 2,
        isPopular: true,
        isActive: true
    },
    {
        id: "ultra",
        name: "Ultra",
        price: 1499,
        description: "The ultimate impression",
        limits: { links: 10, contacts: 999999, exports: 999999, portfolioItems: 20, privateContentItems: 5 },
        features: { portfolio: true, privateContent: true, customBranding: true, wallpaper: true },
        visuals: { goldRing: true, royalTexture: true },
        tierOrder: 3,
        isActive: true
    }
];

export const planService = {
    getAllPlans: async (): Promise<Plan[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, "plans"));

            // 1. Get all plans currently in Firestore
            const firestorePlans = querySnapshot.docs.map(doc => {
                const data = doc.data() as Plan;
                const defaultPlan = DEFAULT_PLANS.find(p => p.id === data.id);

                if (defaultPlan) {
                    return {
                        ...defaultPlan,
                        ...data,
                        limits: { ...defaultPlan.limits, ...data.limits },
                        features: { ...defaultPlan.features, ...data.features },
                        visuals: { ...defaultPlan.visuals, ...data.visuals }
                    };
                }
                return data;
            });

            // 2. Identify which Default Plans are NOT in Firestore yet
            const missingDefaults = DEFAULT_PLANS.filter(
                defPlan => !firestorePlans.some(fp => fp.id === defPlan.id)
            );

            // 3. Combine both lists
            const allPlans = [...firestorePlans, ...missingDefaults];

            return allPlans.sort((a, b) => (a.tierOrder || 0) - (b.tierOrder || 0));
        } catch (error) {
            console.error("Error fetching plans:", error);
            return DEFAULT_PLANS;
        }
    },

    subscribeToPlans: (onPlansUpdated: (plans: Plan[]) => void) => {
        const q = collection(db, "plans");
        return onSnapshot(q, (snapshot) => {
            const firestorePlans = snapshot.docs.map(doc => {
                const data = doc.data() as Plan;
                const defaultPlan = DEFAULT_PLANS.find(p => p.id === data.id);

                if (defaultPlan) {
                    return {
                        ...defaultPlan,
                        ...data,
                        limits: { ...defaultPlan.limits, ...data.limits },
                        features: { ...defaultPlan.features, ...data.features },
                        visuals: { ...defaultPlan.visuals, ...data.visuals }
                    };
                }
                return data;
            });

            const missingDefaults = DEFAULT_PLANS.filter(
                defPlan => !firestorePlans.some(fp => fp.id === defPlan.id)
            );

            const allPlans = [...firestorePlans, ...missingDefaults];
            const sortedPlans = allPlans.sort((a, b) => (a.tierOrder || 0) - (b.tierOrder || 0));

            onPlansUpdated(sortedPlans);
        });
    },

    getPlan: async (planId: string): Promise<Plan | null> => {
        try {
            const docRef = doc(db, "plans", planId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as Plan;
            }
            // Fallback to default if not found in DB (for initial setup)
            return DEFAULT_PLANS.find(p => p.id === planId) || null;
        } catch (error) {
            console.error("Error fetching plan:", error);
            return null;
        }
    },

    savePlan: async (plan: Plan): Promise<void> => {
        await setDoc(doc(db, "plans", plan.id), plan);
    },

    deletePlan: async (planId: string): Promise<void> => {
        await deleteDoc(doc(db, "plans", planId));
    },

    // Helper to seed defaults if needed
    seedDefaults: async () => {
        for (const plan of DEFAULT_PLANS) {
            await setDoc(doc(db, "plans", plan.id), plan);
        }
    },

    // Sync Products from CMS to Plans collection
    syncFromCMS: async (cmsProducts: any[]) => {
        for (const product of cmsProducts) {
            // We use the product ID or a slugified name as the Plan ID
            // Prefer ID if stable, but some logic used name. Let's standardise on product.id if possible, 
            // but AdminPlans was using name-slug. Let's support both or migrate.
            // CMSStore uses `plan_${timestamp}` for new products.

            // To be safe and support existing manual links:
            // If product has a clean ID like "platinum", usage is fine.
            // If it's "plan_123", usage is fine.

            const planId = product.id;
            const planRef = doc(db, "plans", planId);
            const planSnap = await getDoc(planRef);

            if (planSnap.exists()) {
                // Update specific fields only (Price, Name, Desc)
                // Do NOT overwrite limits or features
                await setDoc(planRef, {
                    name: product.name,
                    price: Number(product.price) || 0,
                    description: product.description,
                    isActive: true
                }, { merge: true });
            } else {
                // Create new Plan with defaults
                const newPlan: Plan = {
                    id: planId,
                    name: product.name,
                    price: Number(product.price) || 0,
                    description: product.description,
                    limits: { links: 0, contacts: 0, exports: 0, portfolioItems: 0, privateContentItems: 0 },
                    features: { portfolio: false, privateContent: false, customBranding: false, wallpaper: false },
                    visuals: { goldRing: false, royalTexture: false },
                    tierOrder: 99, // Put at end
                    isActive: true
                };
                await setDoc(planRef, newPlan);
            }
        }
    }
};
