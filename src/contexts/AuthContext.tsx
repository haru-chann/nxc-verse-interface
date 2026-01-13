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
                if (data?.isBanned) {
                    await auth.signOut();
                    toast.error("Account Suspended", {
                        description: "Your account has been banned by an administrator."
                    });
                }
            }
        }, (error) => {
            console.error("Auth listener error", error);
        });

        return () => unsubscribe();
    }, [currentUser]);

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
