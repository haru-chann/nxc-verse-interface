import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { ArrowLeft, Truck, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { planService, Plan } from "@/services/planService";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ShippingDetails {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    landmark: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingPlan, setFetchingPlan] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    // Read plan from URL
    const searchParams = new URLSearchParams(window.location.search);
    const planId = searchParams.get("plan");

    const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
        fullName: currentUser?.displayName || "",
        email: currentUser?.email || "",
        phone: "",
        address: "",
        landmark: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
    });

    // Fetch Dynamic Plan
    useEffect(() => {
        const loadPlan = async () => {
            if (!planId) {
                setFetchingPlan(false);
                return;
            }
            try {
                const plan = await planService.getPlan(planId);
                if (plan) {
                    setSelectedPlan(plan);
                } else {
                    toast.error("Plan not found");
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load plan details");
            } finally {
                setFetchingPlan(false);
            }
        };
        loadPlan();
    }, [planId]);

    const orderItem = selectedPlan ? {
        id: selectedPlan.id,
        name: selectedPlan.name,
        price: selectedPlan.price,
        currency: "INR",
        description: selectedPlan.description
    } : {
        // Fallback or empty state
        id: "unknown",
        name: "Unknown Plan",
        price: 0,
        currency: "INR",
        description: ""
    };

    // Sync user details when they load
    useEffect(() => {
        if (currentUser) {
            setShippingDetails(prev => ({
                ...prev,
                fullName: prev.fullName || currentUser.displayName || "",
                email: prev.email || currentUser.email || ""
            }));
        }
    }, [currentUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setShippingDetails((prev) => ({ ...prev, [name]: value }));
    };

    // Ensure customization data is present
    useEffect(() => {
        // If we are on a plan that requires customization (all of them now), and we have no data
        if (planId && !location.state?.customizationData) {
            toast.error("Please fill out the customization form first.");
            navigate(`/dashboard/customize/${planId}`);
        }
    }, [planId, location.state, navigate]);

    const validateFields = () => {
        const { fullName, email, phone, address, landmark, city, state, zipCode } = shippingDetails;
        if (!fullName || !email || !phone || !address || !landmark || !city || !state || !zipCode) {
            toast.error("All fields including Landmark are mandatory.");
            return false;
        }
        return true;
    };

    // Unified Error Handler
    const handlePaymentError = (error: any, context: string) => {
        console.error(`${context} Error:`, error);
        setLoading(false);

        let title = "Checkout Failed";
        let description = error.message || "An unexpected error occurred.";

        // Decode specific Firebase Error Codes
        if (error.code === 'functions/unauthenticated') {
            title = "Authentication Error";
            description = "Your session may have expired. Please refresh the page or sign in again.";
        } else if (error.code === 'functions/nauthyet') { // Typo protection
            description = "Network issue. Please check your connection.";
        } else if (error.code === 'functions/not-found') {
            title = "Plan Not Found";
            description = "This plan configuration seems to be missing on the server.";
        }

        toast.error(title, {
            description: description,
            action: {
                label: "Retry",
                onClick: () => window.location.reload()
            }
        });
    };

    const handleMockPayment = async () => {
        if (!validateFields()) return;
        if (!currentUser) {
            toast.error("Please sign in to continue.");
            navigate("/login");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Processing Mock Payment...");

        try {
            await currentUser.getIdToken(true);
            const verifyMockPurchase = httpsCallable(functions, 'verifyMockPurchase');

            await verifyMockPurchase({
                planId: selectedPlan?.id || "unknown",
                shippingDetails,
                customization: location.state?.customizationData || {},
                formSnapshot: location.state?.formFields || []
            });

            toast.dismiss(toastId);
            toast.success("Mock Payment Successful!");
            setTimeout(() => navigate("/dashboard/my-cards"), 2000);

        } catch (error: any) {
            toast.dismiss(toastId);
            handlePaymentError(error, "Mock Payment");
        }
    };

    const handleRazorpayPayment = async () => {
        if (!validateFields()) return;
        if (!currentUser) {
            toast.error("Please sign in to continue.");
            navigate("/login");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Initializing Secure Checkout...");

        try {
            await currentUser.getIdToken(true);

            // 1. Load Script
            const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
            if (!res) throw new Error("Razorpay SDK failed to load");

            // 2. Call Cloud Function
            const createPurchase = httpsCallable(functions, 'createPurchase');
            const verifyPurchase = httpsCallable(functions, 'verifyPurchase');

            const orderResponse: any = await createPurchase({
                planId: selectedPlan?.id || "unknown",
                shippingDetails,
                customization: location.state?.customizationData || {},
                formSnapshot: location.state?.formFields || []
            });

            const { razorpayOrderId, orderId: dbOrderId, amount, key } = orderResponse.data;

            // 3. Open Razorpay Options
            const options = {
                key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: amount,
                currency: "INR",
                name: "NXC Badge Verse",
                description: selectedPlan?.name || "Premium Plan",
                image: "/nxcverse.svg",
                order_id: razorpayOrderId, // CRITICAL: Locks the amount
                handler: async function (response: any) {
                    toast.loading("Verifying Payment...", { id: toastId });

                    try {
                        // 4. Verify Signature (Server-Side)
                        await verifyPurchase({
                            dbOrderId,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });

                        toast.dismiss(toastId);
                        toast.success("Payment Verified! Order Placed.");
                        setTimeout(() => navigate("/dashboard/my-cards"), 2000);

                    } catch (verifyErr) {
                        toast.dismiss(toastId);
                        handlePaymentError(verifyErr, "Verification");
                    }
                },
                prefill: {
                    name: shippingDetails.fullName,
                    email: shippingDetails.email,
                    contact: shippingDetails.phone
                },
                theme: {
                    color: "#ff0080"
                },
                modal: {
                    ondismiss: function () {
                        toast.dismiss(toastId);
                        setLoading(false);
                    }
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (error: any) {
            toast.dismiss(toastId);
            handlePaymentError(error, "Order Creation");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 lg:hidden"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <h1 className="text-3xl font-bold font-display text-foreground mb-2">Checkout</h1>

                {fetchingPlan ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading Plan Details...
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <p className="text-muted-foreground">Complete your purchase for the <span className="text-primary font-bold">{orderItem.name}</span>.</p>
                    </div>
                )}
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
                {/* Left Column: Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Customization Note - if data present */}
                    {location.state?.customizationData && (
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex gap-4">
                            <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-green-500 mb-1">Customization Details Received</h3>
                                <p className="text-sm text-muted-foreground">
                                    We have received your personalization details. Proceed to payment.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Shipping Form */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-xl font-bold text-foreground">
                            <Truck className="w-5 h-5 text-primary" />
                            <h2>Shipping Details</h2>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Full Name *</label>
                                    <input
                                        name="fullName"
                                        value={shippingDetails.fullName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Phone Number *</label>
                                    <input
                                        name="phone"
                                        value={shippingDetails.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Email Address *</label>
                                <input
                                    name="email"
                                    value={shippingDetails.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Street Address *</label>
                                <input
                                    name="address"
                                    value={shippingDetails.address}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                                    placeholder="123 Main St, Apt 4B"
                                />
                            </div>

                            {/* Landmark */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Landmark *</label>
                                <input
                                    name="landmark"
                                    value={shippingDetails.landmark}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                                    placeholder="Near City Mall"
                                />
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">City *</label>
                                    <input
                                        name="city"
                                        value={shippingDetails.city}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                                        placeholder="Mumbai"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">State *</label>
                                    <input
                                        name="state"
                                        value={shippingDetails.state}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                                        placeholder="Maharashtra"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">ZIP Code *</label>
                                    <input
                                        name="zipCode"
                                        value={shippingDetails.zipCode}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                                        placeholder="400001"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Order Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold font-display text-foreground">Order Summary</h2>
                            <Link to="/pricing?minimal=true" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors underline">
                                Change Plan
                            </Link>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                                <div className="w-16 h-16 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full border-2 border-white/20" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-foreground">{orderItem.name}</h3>
                                    <p className="text-sm text-muted-foreground">{orderItem.description}</p>
                                </div>
                                <div className="font-bold text-foreground">₹{orderItem.price}</div>
                            </div>
                        </div>

                        <div className="border-t border-border pt-4 space-y-2 mb-6">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>₹{orderItem.price}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border mt-2">
                                <span>Total</span>
                                <span>₹{orderItem.price}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <NeonButton
                                className="w-full py-4 text-lg"
                                onClick={handleRazorpayPayment}
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Pay with Razorpay"}
                            </NeonButton>

                            <div className="text-center text-xs text-muted-foreground uppercase tracking-widest my-2">- OR -</div>

                            <button
                                onClick={handleMockPayment}
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-secondary/80 hover:bg-secondary text-secondary-foreground font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Mock Pay (Test Mode)
                            </button>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Secure SSL Encryption</span>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
};

// Helper to load script
const loadScript = (src: string) => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

export default Checkout;
