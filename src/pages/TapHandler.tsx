import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userService } from "@/services/userService";
import { interactionService } from "@/services/interactionService";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const TapHandler = () => {
    const { nfcId } = useParams();
    const navigate = useNavigate();
    const { currentUser, loading } = useAuth();
    const [error, setError] = useState("");

    useEffect(() => {
        // Wait for auth to initialize so we know if it's the owner tapping
        if (loading) return;

        const handleTap = async () => {
            if (!nfcId) {
                setError("Invalid Card ID");
                return;
            }

            try {
                // Register tap and get destination (pass currentUser.uid to exclude self-taps)
                const result = await userService.registerTap(nfcId, currentUser?.uid);

                if (result) {
                    // Log the interaction for Analytics/Graphs
                    // Only log if it's NOT the owner (tap count logic already handles exclusion, 
                    // but we should probably mirror that logic here or let logic log it? 
                    // registerTap returns null if it fails, but doesn't tell us if it was excluded.
                    // However, 'registerTap' only increments stats. We should only log interaction if not own profile.
                    if (result.uid !== currentUser?.uid) {
                        try {
                            await interactionService.logInteraction(result.uid, "tap", {
                                name: "Anonymous User", // Taps are usually anonymous
                                via: "nfc"
                            });
                        } catch (logErr) {
                            console.error("Failed to log tap interaction", logErr);
                        }
                    }

                    // Decide redirect path: @username (preferred) or /u/uid
                    const targetPath = result.username
                        ? `/@${result.username}?origin=tap`
                        : `/u/${result.uid}?origin=tap`;

                    // Redirect with state AND query param to INVALIDATE view count (Taps != Views)
                    navigate(targetPath, { replace: true, state: { fromTap: true } });
                } else {
                    setError("Card not linked to any user.");
                }
            } catch (err) {
                console.error("Tap error:", err);
                setError("Failed to process card.");
            }
        };

        handleTap();
    }, [nfcId, navigate, currentUser, loading]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
                <p className="text-red-500 text-lg mb-4">{error}</p>
                <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-400">Reading card...</p>
            </div>
        </div>
    );
};

export default TapHandler;
