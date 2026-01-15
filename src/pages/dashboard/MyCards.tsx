import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { Loader2, CreditCard, CheckCircle2, Circle, Plus, AlertCircle, Sparkles, Edit2, Lock } from "lucide-react";
import { GradientText } from "@/components/ui/GradientText";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { NeonButton } from "@/components/ui/NeonButton";

interface TimelineStep {
    status: string;
    date: string | null;
    completed: boolean;
}

interface Order {
    id: string;
    item: {
        name: string;
        description: string;
        price: number;
    };
    status: string;
    paymentId: string;
    createdAt: any;
    timeline: TimelineStep[];
    planId: string;
    customization?: Record<string, any>;
    formSnapshot?: { id: string; label: string; type: string }[];
}

// Helper to get features based on planId (fallback since we didn't store features in order item initially)
// Helper to get features based on planId (using loaded plans)
const getFeaturesForPlan = (planId: string, allPlans: any[]) => {
    const plan = allPlans.find(p => p.id === planId);
    if (!plan) return ["NFC Card", "Digital Profile"];

    const feats = [];
    if (plan.limits.links > 0) feats.push(`${plan.limits.links} Links Limit`);
    if (plan.limits.contacts > 10000) feats.push("Unlimited Contacts");
    else feats.push(`${plan.limits.contacts} Contacts`);

    if (plan.features.portfolio) feats.push("Portfolio Enabled");
    if (plan.features.privateContent) feats.push("Private Content Mode");
    if (plan.features.customBranding) feats.push("Custom Branding");

    // Add some generics if list is short
    if (feats.length < 2) feats.push("Premium NFC Card");

    return feats;
};

const MyCards = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [allPlans, setAllPlans] = useState<any[]>([]); // Store plans locally
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    // Fetch Plans First
    useEffect(() => {
        const fetchPlans = async () => {
            const plans = await import("@/services/planService").then(m => m.planService.getAllPlans());
            setAllPlans(plans);
        };
        fetchPlans();
    }, []);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!currentUser) return;

            try {
                const q = query(
                    collection(db, "orders"),
                    where("userId", "==", currentUser.uid)
                );

                const querySnapshot = await getDocs(q);
                const fetchedOrders: any[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedOrders.push({ id: doc.id, ...doc.data() });
                });

                // Client-side sort to avoid needing a Firestore Index
                fetchedOrders.sort((a, b) => {
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    return dateB - dateA;
                });

                setOrders(fetchedOrders);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [currentUser]);

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-display text-foreground mb-2">
                        My <GradientText>Cards</GradientText>
                    </h1>
                    <p className="text-muted-foreground">Manage your physical NXC cards and track shipments.</p>
                </div>
            </div>

            {orders.length === 0 ? (
                <GlassCard className="p-12 text-center flex flex-col items-center justify-center">
                    <CreditCard className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">No Cards Found</h3>
                    <p className="text-muted-foreground mb-6">You haven't ordered any NXC Cards yet.</p>
                    <Link to="/pricing?minimal=true">
                        <NeonButton>
                            Order Your Card Now
                        </NeonButton>
                    </Link>
                </GlassCard>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => {
                        const features = getFeaturesForPlan(order.planId, allPlans);
                        const deliveredStep = order.timeline?.find(s => s.status === 'Delivered' && s.completed);

                        return (
                            <GlassCard key={order.id} className="overflow-hidden relative">
                                {/* Status Badge - Absolute Top Right */}
                                {order.status !== 'delivered' && (
                                    <div className={`absolute top-0 right-0 px-4 py-2 text-xs font-bold uppercase rounded-bl-xl
                                        ${order.status === 'shipped' ? 'bg-blue-500/20 text-blue-500' :
                                            'bg-primary/20 text-primary'
                                        }
                                    `}>
                                        {order.status.replace('_', ' ')}
                                    </div>
                                )}

                                {/* Card Header / Main Info */}
                                <div
                                    className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => toggleExpand(order.id)}
                                >
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Card Visual / Icon */}
                                        <div className="w-full md:w-auto flex justify-center md:justify-start">
                                            <div className="w-32 h-20 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/20 flex items-center justify-center shadow-lg relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
                                                {/* Chip */}
                                                <div className="absolute top-4 left-4 w-5 h-4 rounded-sm bg-yellow-500/80" />
                                                <CreditCard className="w-8 h-8 text-white/50" />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 space-y-2">
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground">{order.item.name}</h3>
                                                <p className="text-sm font-mono text-muted-foreground">ID: {order.id.slice(0, 8).toUpperCase()}</p>
                                            </div>

                                            {/* Features List */}
                                            <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-3">
                                                {features.map((feat, i) => (
                                                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <div className="w-1 h-1 rounded-full bg-primary" />
                                                        {feat}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Tap to expand hint */}
                                    <div className="mt-4 text-center md:text-left text-xs text-muted-foreground opacity-50">
                                        {expandedOrderId === order.id ? "Tap to collapse details" : "Tap to view tracking details"}
                                    </div>
                                </div>

                                {/* Expanded Content (Timeline) */}
                                <AnimatePresence>
                                    {expandedOrderId === order.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/10 bg-black/20"
                                        >
                                            <div className="p-6">
                                                {/* Customization Details */}
                                                <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 text-primary" />
                                                            Card Details
                                                        </h4>
                                                        {order.status === 'order_received' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/dashboard/edit-order/${order.id}`);
                                                                }}
                                                                className="text-xs px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-bold flex items-center gap-1"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                                Edit Details
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        {/* DEBUG INFO - Remove after verification */}
                                                        {/* <pre className="col-span-2 text-[10px] text-red-500 bg-white/10 p-2 rounded overflow-auto">
                                                            {JSON.stringify({ cust: order.customization, snap: order.formSnapshot }, null, 2)}
                                                        </pre> */}

                                                        {order.formSnapshot && order.formSnapshot.length > 0 ? (
                                                            order.formSnapshot.map(field => (
                                                                <div key={field.id}>
                                                                    <p className="text-xs text-muted-foreground uppercase mb-1">{field.label}</p>
                                                                    {field.type === 'image' ? (
                                                                        <img src={order.customization?.[field.id]} alt={field.label} className="w-20 h-12 object-cover rounded border border-white/20" />
                                                                    ) : (
                                                                        <p className="text-sm text-foreground font-medium">{order.customization?.[field.id] || "—"}</p>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            Object.entries(order.customization || {}).map(([key, value]) => (
                                                                <div key={key}>
                                                                    <p className="text-xs text-muted-foreground uppercase mb-1">{key}</p>
                                                                    <p className="text-sm text-foreground font-medium">{String(value)}</p>
                                                                </div>
                                                            ))
                                                        )}

                                                        {(!order.customization || Object.keys(order.customization).length === 0) && (!order.formSnapshot || order.formSnapshot.length === 0) && (
                                                            <div className="col-span-2 text-sm text-muted-foreground italic">
                                                                No customization details found for this order.
                                                            </div>
                                                        )}
                                                    </div>

                                                    {order.status === 'order_received' ? (
                                                        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-yellow-500/80 flex items-start gap-2">
                                                            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                                            Note: You can edit these details while the order is processing. Once it moves to "Processing", edits will be locked.
                                                        </div>
                                                    ) : order.status === 'delivered' ? (
                                                        <div className="mt-4 pt-4 border-t border-white/5 text-center">
                                                            <p className="text-sm text-green-400 font-medium">
                                                                <CheckCircle2 className="w-4 h-4 inline-block mr-2" />
                                                                Delivered on {deliveredStep?.date ? format(new Date(deliveredStep.date), "PPP") : "Unknown Date"}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground flex items-start gap-2 opacity-60">
                                                            <Lock className="w-3 h-3 mt-0.5 shrink-0" />
                                                            Details are locked to ensure production accuracy.
                                                        </div>
                                                    )}
                                                </div>

                                                {order.status !== 'delivered' && (
                                                    <>
                                                        <h4 className="text-sm font-bold text-muted-foreground mb-6 uppercase tracking-wider">Order Timeline</h4>

                                                        <div className="relative pl-2">
                                                            {/* Vertical Line */}
                                                            <div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-white/10" />

                                                            <div className="space-y-8 relative z-10">
                                                                {order.timeline?.map((step, index) => {
                                                                    const isCompleted = step.completed;
                                                                    const isCurrent = !step.completed && (index === 0 || order.timeline[index - 1].completed);

                                                                    return (
                                                                        <div key={index} className="flex gap-4 items-start">
                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors bg-background
                                                                                ${isCompleted ? 'bg-primary border-primary text-black' :
                                                                                    isCurrent ? 'border-primary text-primary shadow-[0_0_10px_rgba(255,0,128,0.5)]' :
                                                                                        'border-white/20 text-muted-foreground'}
                                                                            `}>
                                                                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> :
                                                                                    isCurrent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Circle className="w-4 h-4" />}
                                                                            </div>
                                                                            <div className="pt-1">
                                                                                <h5 className={`font-bold text-sm transition-colors ${isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                                    {step.status}
                                                                                </h5>
                                                                                {step.date && (
                                                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                                                        {format(new Date(step.date), "PPP p")}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Post-pay/Customization Note if waiting */}
                                                {order.status === 'order_received' && (
                                                    <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-3">
                                                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                                                        <p className="text-sm text-blue-200">
                                                            {(order.customization && Object.keys(order.customization).length > 0)
                                                                ? "We have received your order and customization details! Production will begin shortly."
                                                                : "We have received your order! Our team will contact you shortly to finalize your customization details."
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Delivered Date Footer */}

                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </GlassCard>
                        );
                    })}

                </div>
            )}

            {/* Bottom Action for existing users */}
            {orders.length > 0 && (
                <div className="flex justify-center pt-8 pb-4">
                    <NeonButton onClick={() => navigate("/pricing?minimal=true")} className="w-full sm:w-auto flex items-center justify-center gap-2">
                        Buy Another Card
                    </NeonButton>
                </div>
            )}
        </div>
    );
};

export default MyCards;
