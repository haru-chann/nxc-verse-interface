import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export const AdminRoute = () => {
    const { currentUser, isAdmin, loading } = useAuth();

    console.log("AdminRoute Check:", { currentUser: currentUser?.email, isAdmin, loading });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Strict check: Must be logged in AND have admin claim
    if (!currentUser || !isAdmin) {
        console.warn("AdminRoute: Access Denied", { currentUser: !!currentUser, isAdmin });
        // Redirect to home or login, or even a 403 page
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
