import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { planService, Plan, DEFAULT_PLANS } from "@/services/planService";
import { usageService, UsageStats } from "@/services/usageService";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SubscriptionLimits {
    maxLinks: number;
    maxContacts: number;
    maxExports: number;
    maxPortfolioItems: number; // New
    maxPrivateContentItems: number; // New
    features: {
        portfolio: boolean;
        privateContent: boolean;
        customBranding: boolean;
        wallpaper: boolean; // New
    };
    visuals: {
        goldRing: boolean;
        royalTexture: boolean;
    };
    usage: UsageStats;
    isFinite: {
        contacts: boolean;
        exports: boolean;
    };
    activePlanNames: string[];
    loading: boolean;
    refresh: () => Promise<void>;
}

export const useSubscriptionLimits = () => {
    const { currentUser } = useAuth();
    const [limits, setLimits] = useState<SubscriptionLimits>({
        maxLinks: DEFAULT_PLANS[0].limits.links, // Default Free
        maxContacts: DEFAULT_PLANS[0].limits.contacts,
        maxExports: DEFAULT_PLANS[0].limits.exports,
        maxPortfolioItems: DEFAULT_PLANS[0].limits.portfolioItems || 0,
        maxPrivateContentItems: DEFAULT_PLANS[0].limits.privateContentItems || 0,
        features: DEFAULT_PLANS[0].features,
        visuals: DEFAULT_PLANS[0].visuals,
        usage: { contactsCount: 0, exportsCount: 0, monthKey: "" },
        isFinite: { contacts: true, exports: true },
        activePlanNames: ["Free"],
        loading: true,
        refresh: async () => { }
    });

    useEffect(() => {
        if (!currentUser) {
            setLimits(prev => ({ ...prev, loading: false }));
            return;
        }

        let unsubscribeOrders: () => void;

        const setupRealtimeListener = async () => {
            try {
                // 1. Fetch Plans (cacheable, could be realtime too but less critical)
                const allPlans = await planService.getAllPlans();

                // 2. Setup Real-time Listener for Orders
                const ordersRef = collection(db, "orders");
                const q = query(ordersRef, where("userId", "==", currentUser.uid));

                unsubscribeOrders = onSnapshot(q, async (snapshot) => {
                    const activeOrders = snapshot.docs
                        .map(d => d.data())
                        .filter(o => !['cancelled', 'refunded', 'payment_failed', 'pending_verification'].includes(o.status));

                    // 3. Stack Limits Calculation
                    // Fetch the dynamic 'free' plan from the loaded plans (which includes Firestore updates)
                    const freePlan = allPlans.find(p => p.id === 'free') || DEFAULT_PLANS[0];

                    let totalLinks = freePlan.limits.links;
                    let totalContacts = freePlan.limits.contacts;
                    let totalExports = freePlan.limits.exports;
                    let totalPortfolioItems = freePlan.limits.portfolioItems || 0;
                    let totalPrivateContentItems = freePlan.limits.privateContentItems || 0;

                    let hasPortfolio = freePlan.features.portfolio;
                    let hasPrivate = freePlan.features.privateContent;
                    let hasBranding = freePlan.features.customBranding;
                    let hasWallpaper = freePlan.features.wallpaper;

                    let hasGoldRing = freePlan.visuals.goldRing;
                    let hasTexture = freePlan.visuals.royalTexture;
                    let hasCustomBranding = freePlan.features.customBranding;

                    const planNames: string[] = [freePlan.name];

                    activeOrders.forEach(order => {
                        const planId = order.planId;
                        const plan = allPlans.find(p => p.id === planId);

                        if (plan) {
                            // If the plan is 'free', don't double count (though activeOrders rarely has 'free')
                            if (plan.id === 'free') return;

                            totalLinks += plan.limits.links;
                            totalContacts += plan.limits.contacts;
                            totalExports += plan.limits.exports;
                            totalPortfolioItems += (plan.limits.portfolioItems || 0);
                            totalPrivateContentItems += (plan.limits.privateContentItems || 0);

                            if (plan.features.portfolio) hasPortfolio = true;
                            if (plan.features.privateContent) hasPrivate = true;
                            if (plan.features.customBranding) hasBranding = true;
                            if (plan.features.wallpaper) hasWallpaper = true;

                            if (plan.visuals.goldRing) hasGoldRing = true;
                            if (plan.visuals.royalTexture) hasTexture = true;
                            if (plan.features.customBranding) hasCustomBranding = true;

                            planNames.push(plan.name);
                        } else {
                            console.warn(`[Limits] Plan not found for order ${order.id}: ${planId}`);
                        }
                    });

                    // 4. Fetch Usage (Wait for this async)
                    const usage = await usageService.getUsageStats(currentUser.uid);

                    // 5. Determine Finiteness
                    const isInfiniteContacts = totalContacts > 500000;
                    const isInfiniteExports = totalExports > 500000;

                    // Sync Visuals
                    try {
                        // Dynamic import to avoid cycles if strictly needed, or just import top-level
                        const { userService } = await import("@/services/userService");
                        const currentProfile = await userService.getUserProfile(currentUser.uid);

                        if (currentProfile) {
                            const needsUpdate =
                                currentProfile.visuals?.goldRing !== hasGoldRing ||
                                currentProfile.visuals?.royalTexture !== hasTexture ||
                                currentProfile.visuals?.customBranding !== hasCustomBranding;

                            if (needsUpdate) {
                                await userService.updateUserProfile(currentUser.uid, {
                                    visuals: {
                                        goldRing: hasGoldRing,
                                        royalTexture: hasTexture,
                                        customBranding: hasCustomBranding
                                    }
                                } as any);
                            }
                        }
                    } catch (err) {
                        console.error("Error syncing visuals:", err);
                    }

                    setLimits({
                        maxLinks: totalLinks,
                        maxContacts: totalContacts,
                        maxExports: totalExports,
                        maxPortfolioItems: totalPortfolioItems,
                        maxPrivateContentItems: totalPrivateContentItems,
                        features: {
                            portfolio: hasPortfolio,
                            privateContent: hasPrivate,
                            customBranding: hasBranding,
                            wallpaper: hasWallpaper
                        },
                        visuals: {
                            goldRing: hasGoldRing,
                            royalTexture: hasTexture
                        },
                        usage,
                        isFinite: {
                            contacts: !isInfiniteContacts,
                            exports: !isInfiniteExports
                        },
                        activePlanNames: [...new Set(planNames)],
                        loading: false,
                        refresh: async () => { /* No-op, realtime now */ }
                    });
                });
            } catch (error) {
                console.error("Error setting up limits listener:", error);
                setLimits(prev => ({ ...prev, loading: false }));
            }
        };

        setupRealtimeListener();

        return () => {
            if (unsubscribeOrders) unsubscribeOrders();
        };
    }, [currentUser]);

    return limits;
};
