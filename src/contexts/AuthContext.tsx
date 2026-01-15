import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner"; // Assuming sonner is available globally or I need to check where it is used. It is used in other files.

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    loading: true,
    logout: async () => { },
    isAdmin: false,
    isSuperAdmin: false,
    refreshClaims: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkClaims = async (user: User) => {
        try {
            const tokenResult = await user.getIdTokenResult(true); // Force refresh
            setIsAdmin(!!tokenResult.claims.admin);
            setIsSuperAdmin(!!tokenResult.claims.super_admin);
        } catch (error) {
            console.error("Error fetching claims", error);
            setIsAdmin(false);
            setIsSuperAdmin(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // We don't force refresh here to avoid rate limits, unless needed.
                // But for admins, accurate claims are vital. 
                // Let's get the token result (cached is fine initially, but we might want to force if role just changed)
                const tokenResult = await user.getIdTokenResult();
                setIsAdmin(!!tokenResult.claims.admin);
                setIsSuperAdmin(!!tokenResult.claims.super_admin);
            } else {
                setIsAdmin(false);
                setIsSuperAdmin(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Real-time Ban Check & Role Sync
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid), async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();

                // 1. Check Ban Status
                if (data?.isBanned) {
                    await auth.signOut();
                    toast.error("Account Suspended", {
                        description: "Your account has been banned by an administrator."
                    });
                    return;
                }

                // 2. Check for Role Updates (Sync Custom Claims)
                // If Firestore says admin/super_admin but local state disagrees, or vice versa, refresh token.
                // We use a simplified check: if the role in DB is different from what we expect based on current claims, refresh.
                // Since claims are "hidden", we'll just force refresh if the doc updates and we want to be sure.
                // improved optimization: only refresh if the role field specifically changed or if we suspect a mismatch.
                // For critical admin promotions, just refresh is safer but might be rate limited if doc updates frequently.
                // Let's check:
                const dbRole = data?.role;
                // We can't easily peek claims without parsing token, but we have isAdmin/isSuperAdmin state.
                const hasAdminClaim = isAdmin || isSuperAdmin;
                const shouldHaveAdminClaim = dbRole === 'admin' || dbRole === 'super_admin';

                if (hasAdminClaim !== shouldHaveAdminClaim) {
                    console.log("Role mismatch detected, refreshing claims...");

                    // Force refresh to see if the backend has updated the claims yet
                    const tokenResult = await currentUser.getIdTokenResult(true);
                    const newIsAdmin = !!tokenResult.claims.admin;
                    const newIsSuperAdmin = !!tokenResult.claims.super_admin;
                    const newHasClaim = newIsAdmin || newIsSuperAdmin;

                    // Only toast if the sync actually SUCCEEDED
                    if (newHasClaim === shouldHaveAdminClaim) {
                        setIsAdmin(newIsAdmin);
                        setIsSuperAdmin(newIsSuperAdmin);
                        toast.success("Permissions Synced", { description: "Your admin access is now active." });
                    } else {
                        console.log("Claims validation pending... (Backend sync in progress)");
                        // Do not toast here. We wait for the next snapshot or manual refresh.
                    }
                } else if (dbRole === 'super_admin' && !isSuperAdmin) {
                    // Specific case: admin -> super_admin promotion
                    const tokenResult = await currentUser.getIdTokenResult(true);
                    if (tokenResult.claims.super_admin) {
                        setIsSuperAdmin(true);
                        setIsAdmin(true);
                        toast.success("Permissions Upgraded", { description: "You are now a Super Admin." });
                    }
                }
            }
        }, (error) => {
            console.error("Auth listener error", error);
        });

        return () => unsubscribe();
    }, [currentUser, isAdmin, isSuperAdmin]);

    const refreshClaims = async () => {
        if (currentUser) {
            await checkClaims(currentUser);
        }
    };

    const logout = () => auth.signOut();

    const value = {
        currentUser,
        loading,
        logout,
        isAdmin,
        isSuperAdmin,
        refreshClaims
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
