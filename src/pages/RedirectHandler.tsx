import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { interactionService } from "@/services/interactionService";

const RedirectHandler = () => {
    const { cardId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const handleRedirect = async () => {
            if (!cardId) {
                navigate("/");
                return;
            }

            try {
                // 1. Look up card owner
                const cardRef = doc(db, "cards", cardId);
                const cardSnap = await getDoc(cardRef);

                if (cardSnap.exists()) {
                    const data = cardSnap.data();
                    const uid = data.uid;

                    if (uid) {
                        // 2. Log Interaction (Tap)
                        try {
                            await interactionService.logInteraction(uid, "tap", {
                                location: "Unknown",
                                device: navigator.userAgent,
                                source: "NFC Card",
                                cardId: cardId
                            });
                        } catch (logError) {
                            console.error("Failed to log interaction", logError);
                        }

                        // 3. Redirect to Profile
                        window.location.href = `/u/${uid}`;
                        return;
                    }
                }

                // Card not found or not linked
                navigate("/404"); // Or a specific "Card not active" page

            } catch (error) {
                console.error("Error handling redirect:", error);
                navigate("/");
            }
        };

        handleRedirect();
    }, [cardId, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground">Redirecting...</h2>
                <p className="text-muted-foreground">Reading card data</p>
            </div>
        </div>
    );
};

export default RedirectHandler;
