import { userService } from "@/services/userService";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, updateDoc, Timestamp, where, limit, startAfter, DocumentSnapshot, getCountFromServer } from "firebase/firestore";
import { Loader2, Package, Search, Calendar, ChevronDown, ChevronUp, Edit2, Check, Link2, MapPin, Phone, Mail, User as UserIcon, Filter, Clock, Copy, Download, Sparkles } from "lucide-react";
import { GradientText } from "@/components/ui/GradientText";
import { format } from "date-fns";
import { toast } from "sonner";
import { NeonButton } from "@/components/ui/NeonButton";

interface Order {
    id: string;
    userId: string;
    item: {
        name: string;
        price: number;
        description: string;
    };
    status: "order_received" | "processing" | "shipped" | "delivered";
    shippingDetails: {
        fullName: string;
        email: string;
        phone: string;
        address: string;
        landmark?: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    createdAt: any;
    timeline: any[];
    customization?: Record<string, any>;
    formSnapshot?: { id: string; label: string; type: string }[];
}

const statusColors = {
    order_received: "bg-gray-500/20 text-gray-400",
    processing: "bg-yellow-500/20 text-yellow-400",
    shipped: "bg-purple-500/20 text-purple-400",
    delivered: "bg-green-500/20 text-green-400",
};

const AdminOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [userDetailsCache, setUserDetailsCache] = useState<Record<string, any>>({});

    // Pagination State
    const [lastDocs, setLastDocs] = useState<DocumentSnapshot[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0); // [NEW]
    const ORDERS_PER_PAGE = 10;
    const totalPages = Math.ceil(totalCount / ORDERS_PER_PAGE); // [NEW]

    // Smart Management States
    const [showPendingOnly, setShowPendingOnly] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Initial Filter from URL
    useEffect(() => {
        const filterParam = searchParams.get("filter");
        if (filterParam === "pending") {
            setShowPendingOnly(true);
        }
    }, [searchParams]);

    // Filter Logic - Server Side now
    const fetchOrders = async (pageIndex = 1, direction: 'next' | 'prev' | 'init' = 'init') => {
        setLoading(true);
        try {
            // [NEW] Deep Linking Check
            const deepMatchId = searchParams.get("orderId");
            if (deepMatchId && direction === 'init' && pageIndex === 1) {
                // If we have a deep link ID, we fetch JUST that order to ensure it's visible and expanded
                const docRef = doc(db, "orders", deepMatchId);
                const docSnap = await getDocs(query(collection(db, "orders"), where("__name__", "==", deepMatchId))); // specialized query or getDoc 

                // Better to use getDoc usually, but to keep type consistency with array:
                if (!docSnap.empty) {
                    const fetchedOrder = { id: docSnap.docs[0].id, ...docSnap.docs[0].data() } as Order;
                    setOrders([fetchedOrder]);
                    setExpandedOrderId(deepMatchId);
                    setHasMore(false); // Disable pagination logic when showing single deep-linked item
                    setLoading(false);
                    return; // EXIT EARLY
                }
            }

            const ordersRef = collection(db, "orders");
            let constraints: any[] = [
                orderBy("createdAt", "desc"),
                limit(ORDERS_PER_PAGE)
            ];

            // Apply Filters
            const filterConstraints: any[] = [];
            const PAID_STATUSES = ["order_received", "processing", "shipped", "delivered"];

            if (showPendingOnly) {
                // "Pending" in UI context means "Pending Fulfillment" (Paid but not delivered)
                filterConstraints.push(where("status", "in", ["order_received", "processing", "shipped"]));
            } else if (statusFilter !== 'all') {
                filterConstraints.push(where("status", "==", statusFilter));
            } else {
                // Default "All" view now only shows PAID orders
                filterConstraints.push(where("status", "in", PAID_STATUSES));
            }

            // Combine constraints
            constraints.push(...filterConstraints);

            // Pagination Cursor Logic
            if (direction === 'next' && lastDocs[pageIndex - 2]) {
                constraints.push(startAfter(lastDocs[pageIndex - 2]));
            } else if (direction === 'prev' && pageIndex > 1) {
                // For prev, we go to pageIndex (which is prevPage). 
                // The cursor for Page N is the last doc of Page N-1.
                // So for Page 2, we need last doc of Page 1.
                // lastDocs array: [End of Page 1, End of Page 2, ...]
                // Index 0 is End of Page 1.
                // So for Page 2 (index 2-2 = 0), we use lastDocs[0].
                // For Page 1, we don't startAfter.
                if (lastDocs[pageIndex - 2]) {
                    constraints.push(startAfter(lastDocs[pageIndex - 2]));
                }
            }

            let querySnapshot;

            try {
                const q = query(ordersRef, ...constraints);
                querySnapshot = await getDocs(q);
            } catch (indexError: any) {
                // FALLBACK: If index is missing, fetch WITHOUT status filters
                if (indexError?.message?.includes("index")) {
                    console.warn("Index missing, falling back to simple query.");
                    toast.error("Missing Index: Filters disabled. Showing all orders.", { duration: 5000 });

                    // Simple query: Date sort only (Standard index usually exists)
                    // We must still respect pagination if possible, but let's reset to basics for safety
                    const fallbackConstraints = [
                        orderBy("createdAt", "desc"),
                        limit(ORDERS_PER_PAGE)
                    ];

                    // Try to keep pagination cursor if it exists
                    if (direction === 'next' && lastDocs[pageIndex - 2]) {
                        fallbackConstraints.push(startAfter(lastDocs[pageIndex - 2]));
                    } else if (direction === 'prev' && pageIndex > 1 && lastDocs[pageIndex - 2]) {
                        fallbackConstraints.push(startAfter(lastDocs[pageIndex - 2]));
                    }

                    const fallbackQ = query(ordersRef, ...fallbackConstraints);
                    querySnapshot = await getDocs(fallbackQ);
                } else {
                    throw indexError; // Re-throw other errors
                }
            }

            const fetchedOrders: Order[] = [];
            querySnapshot.forEach((doc) => {
                fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
            });

            // Pagination State Updates
            if (fetchedOrders.length > 0) {
                const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

                if (direction === 'next' || (direction === 'init' && pageIndex === 1)) {
                    const newLastDocs = [...lastDocs];
                    // If init page 1, reset
                    if (direction === 'init' && pageIndex === 1) {
                        setLastDocs([lastVisible]);
                    } else {
                        // Store cursor for current page end
                        newLastDocs[pageIndex - 1] = lastVisible;
                        setLastDocs(newLastDocs);
                    }
                }
                setHasMore(fetchedOrders.length === ORDERS_PER_PAGE);
            } else {
                setHasMore(false);
            }

            setOrders(fetchedOrders);
        } catch (error: any) {
            console.error("Error fetching orders:", error);
            // Log full error to help debug
            toast.error("Failed to fetch: " + (error?.message || "Unknown Error"));
        } finally {
            setLoading(false);
        }
    };

    // Refetch when filters change (Count + Reset)
    useEffect(() => {
        const resetAndFetch = async () => {
            setPage(1);
            setLastDocs([]);

            // Fetch Count
            try {
                const ordersRef = collection(db, "orders");
                const constraints: any[] = [];
                const PAID_STATUSES = ["order_received", "processing", "shipped", "delivered"];

                if (showPendingOnly) {
                    constraints.push(where("status", "in", ["order_received", "processing", "shipped"]));
                } else if (statusFilter !== 'all') {
                    constraints.push(where("status", "==", statusFilter));
                } else {
                    // Default count also respects Paid Only
                    constraints.push(where("status", "in", PAID_STATUSES));
                }
                const countQuery = query(ordersRef, ...constraints);
                const snapshot = await getCountFromServer(countQuery);
                setTotalCount(snapshot.data().count);
            } catch (error) {
                console.error("Error fetching count:", error);
            }

            await fetchOrders(1, 'init');
        };

        resetAndFetch();
    }, [showPendingOnly, statusFilter]);

    // Handlers for Pagination Controls
    const handleNextPage = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchOrders(nextPage, 'next');
    };

    const handlePrevPage = () => {
        if (page <= 1) return;
        const prevPage = page - 1;
        setPage(prevPage);
        fetchOrders(prevPage, 'prev');
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            const orderRef = doc(db, "orders", orderId);
            const currentOrder = orders.find(o => o.id === orderId);
            if (!currentOrder) return;

            let updatedTimeline = [...currentOrder.timeline];
            const statusMap: Record<string, string> = {
                "order_received": "Order Received",
                "processing": "Processing",
                "shipped": "Shipped",
                "delivered": "Delivered"
            };

            const targetTimelineStatus = statusMap[newStatus];

            if (targetTimelineStatus) {
                updatedTimeline = updatedTimeline.map(step => {
                    if (step.status === targetTimelineStatus) {
                        return { ...step, completed: true, date: new Date().toISOString() };
                    }
                    return step;
                });
            }

            await updateDoc(orderRef, {
                status: newStatus,
                timeline: updatedTimeline
            });

            toast.success(`Order status updated to ${newStatus}`);
            fetchOrders();

        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleExpand = async (orderId: string) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);

        if (expandedOrderId !== orderId) {
            const order = orders.find(o => o.id === orderId);
            if (order && !userDetailsCache[order.userId]) {
                try {
                    const userProfile = await userService.getUserProfile(order.userId);
                    if (userProfile) {
                        setUserDetailsCache(prev => ({ ...prev, [order.userId]: userProfile }));
                    }
                } catch (error) {
                    console.error("Failed to fetch user details for order", orderId, error);
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-primary font-medium mb-2">ADMIN PANEL</p>
                    <h1 className="text-3xl font-bold font-display text-foreground">
                        Order <GradientText>Management</GradientText>
                    </h1>
                </div>
                <NeonButton onClick={fetchOrders} variant="outline" className="gap-2">
                    <Clock className="w-4 h-4" />
                    Refresh
                </NeonButton>
            </div>

            {/* Smart Controls */}
            <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <button
                    onClick={() => {
                        setShowPendingOnly(!showPendingOnly);
                        setStatusFilter('all'); // Reset specific filter if toggling pending
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-medium ${showPendingOnly
                        ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                        : "bg-black/20 border-white/10 text-muted-foreground hover:bg-white/5"
                        }`}
                >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${showPendingOnly ? "border-yellow-500 bg-yellow-500" : "border-muted-foreground"}`}>
                        {showPendingOnly && <Check className="w-3 h-3 text-black" />}
                    </div>
                    Only Pending Orders
                </button>

                <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-lg border border-white/10">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setShowPendingOnly(false); // Disable pending toggle if selecting manual
                        }}
                        className="bg-transparent border-none text-sm text-foreground focus:ring-0 outline-none cursor-pointer"
                    >
                        <option value="all" className="bg-zinc-900">All Statuses</option>
                        <option value="order_received" className="bg-zinc-900">Order Received</option>
                        <option value="processing" className="bg-zinc-900">Processing</option>
                        <option value="shipped" className="bg-zinc-900">Shipped</option>
                        <option value="delivered" className="bg-zinc-900">Delivered</option>
                    </select>
                </div>

                <div className="ml-auto text-sm text-muted-foreground bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                    Page {page} of {totalPages || 1}
                </div>
            </div>

            <div className="space-y-4">
                {orders.map((order) => (
                    <GlassCard key={order.id} className="overflow-hidden">
                        <div
                            className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => toggleExpand(order.id)}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                {/* Order Quick Info */}
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-lg">{order.item.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                            <span className="font-mono">#{order.id.slice(0, 8)}</span>
                                            <span>•</span>
                                            <span>{format(order.createdAt?.toDate ? order.createdAt.toDate() : new Date(), "PPP")}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge (Read Only in Header) */}
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all
                                            ${order.status === 'order_received' ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' :
                                                order.status === 'processing' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                                    order.status === 'shipped' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                                        'bg-green-500/10 border-green-500/20 text-green-400'}
                                        `}>
                                            <div className={`w-2 h-2 rounded-full ${order.status === 'order_received' ? 'bg-gray-400' :
                                                order.status === 'processing' ? 'bg-yellow-400' :
                                                    order.status === 'shipped' ? 'bg-purple-400' : 'bg-green-400'
                                                } animate-pulse`} />

                                            <span className="pr-2">{order.status.replace('_', ' ')}</span>
                                        </div>
                                    </div>

                                    <div className="p-2 rounded-lg border border-white/5 bg-black/40 text-muted-foreground">
                                        {expandedOrderId === order.id ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                            {expandedOrderId === order.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-white/10 bg-black/20"
                                >
                                    <div className="p-6 space-y-8">
                                        {/* Status Management Section */}
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <h4 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center justify-between">
                                                Update Order Status
                                                {updatingId === order.id && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                                            </h4>

                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { id: 'order_received', label: 'Order Received', color: 'gray' },
                                                    { id: 'processing', label: 'Processing', color: 'yellow' },
                                                    { id: 'shipped', label: 'Shipped', color: 'purple' },
                                                    { id: 'delivered', label: 'Delivered', color: 'green' }
                                                ].map((statusOption) => {
                                                    const isActive = order.status === statusOption.id;
                                                    return (
                                                        <button
                                                            key={statusOption.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStatusUpdate(order.id, statusOption.id);
                                                            }}
                                                            disabled={updatingId === order.id || isActive}
                                                            className={`
                                                                relative px-4 py-2 rounded-lg text-sm font-medium transition-all border
                                                                ${isActive
                                                                    ? `bg-${statusOption.color}-500/20 border-${statusOption.color}-500/50 text-${statusOption.color}-400 shadow-[0_0_15px_rgba(0,0,0,0.3)]`
                                                                    : 'bg-black/40 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20'
                                                                }
                                                                disabled:opacity-50 disabled:cursor-not-allowed
                                                            `}
                                                        >
                                                            {isActive && (
                                                                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-${statusOption.color}-500 animate-pulse`} />
                                                            )}
                                                            {statusOption.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-8">
                                            {/* Customer Details */}
                                            <div className="space-y-6">
                                                <h4 className="font-bold text-foreground flex items-center gap-2 border-b border-white/10 pb-2">
                                                    <UserIcon className="w-4 h-4 text-primary" />
                                                    Customer Details
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-3 rounded-lg bg-white/5 space-y-1 group relative">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-xs text-muted-foreground">Name</p>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.shippingDetails.fullName); toast.success("Copied Name"); }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                                                            >
                                                                <Copy className="w-3 h-3 text-muted-foreground" />
                                                            </button>
                                                        </div>
                                                        <p className="font-medium text-foreground">{order.shippingDetails.fullName}</p>
                                                    </div>
                                                    <div className="p-3 rounded-lg bg-white/5 space-y-1 group relative">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-xs text-muted-foreground">Phone</p>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.shippingDetails.phone); toast.success("Copied Phone"); }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                                                            >
                                                                <Copy className="w-3 h-3 text-muted-foreground" />
                                                            </button>
                                                        </div>
                                                        <p className="font-medium text-foreground">{order.shippingDetails.phone}</p>
                                                    </div>
                                                    <div className="p-3 rounded-lg bg-white/5 space-y-1 col-span-1 md:col-span-2 group relative">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-xs text-muted-foreground">Email</p>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.shippingDetails.email); toast.success("Copied Email"); }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                                                            >
                                                                <Copy className="w-3 h-3 text-muted-foreground" />
                                                            </button>
                                                        </div>
                                                        <p className="font-medium text-foreground">{order.shippingDetails.email}</p>
                                                    </div>
                                                </div>

                                                <div className="p-4 rounded-lg bg-white/5 space-y-3 group relative">
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const fullAddress = `${order.shippingDetails.address}, ${order.shippingDetails.city}, ${order.shippingDetails.state} - ${order.shippingDetails.zipCode}`;
                                                                navigator.clipboard.writeText(fullAddress);
                                                                toast.success("Copied Address");
                                                            }}
                                                            className="p-1.5 hover:bg-white/10 rounded transition-all"
                                                        >
                                                            <Copy className="w-3 h-3 text-muted-foreground" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                                        <div className="text-sm text-foreground pr-6">
                                                            <p>{order.shippingDetails.address}</p>
                                                            {order.shippingDetails.landmark && (
                                                                <p className="text-muted-foreground">Landmark: {order.shippingDetails.landmark}</p>
                                                            )}
                                                            <p>{order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.zipCode}</p>
                                                            <p>{order.shippingDetails.country}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Context & Links */}
                                            <div className="space-y-6">
                                                <h4 className="font-bold text-foreground flex items-center gap-2 border-b border-white/10 pb-2">
                                                    <Link2 className="w-4 h-4 text-primary" />
                                                    Order Context
                                                </h4>

                                                <div className="p-4 rounded-lg bg-white/5 space-y-4">

                                                    {/* User Links Section */}
                                                    {userDetailsCache[order.userId] && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* NFC Tap Link (Primary) */}
                                                            <div className="p-3 bg-black/40 rounded border border-white/10 relative overflow-hidden group">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <p className="text-xs text-primary font-bold uppercase tracking-wider">Tap Link (Write to Card)</p>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const nfcId = userDetailsCache[order.userId].nfcId;
                                                                            if (nfcId) {
                                                                                const link = `${window.location.origin}/t/${nfcId}`;
                                                                                navigator.clipboard.writeText(link);
                                                                                toast.success("Copied NFC Link");
                                                                            }
                                                                        }}
                                                                        disabled={!userDetailsCache[order.userId].nfcId}
                                                                        className="text-xs text-primary hover:underline disabled:opacity-50"
                                                                    >
                                                                        Copy
                                                                    </button>
                                                                </div>

                                                                {userDetailsCache[order.userId].nfcId ? (
                                                                    <>
                                                                        <p className="text-sm font-mono truncate text-yellow-500 font-bold">
                                                                            {`${window.location.origin}/t/${userDetailsCache[order.userId].nfcId}`}
                                                                        </p>
                                                                        <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                                    </>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-destructive text-xs">Missing NFC ID</span>
                                                                        <button
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                try {
                                                                                    toast.loading("Generating NFC ID...");
                                                                                    const newId = await userService.ensureNfcId(order.userId);
                                                                                    setUserDetailsCache(prev => ({
                                                                                        ...prev,
                                                                                        [order.userId]: { ...prev[order.userId], nfcId: newId }
                                                                                    }));
                                                                                    toast.dismiss();
                                                                                    toast.success("NFC ID Generated!");
                                                                                } catch (err) {
                                                                                    toast.dismiss();
                                                                                    toast.error("Failed to generate ID");
                                                                                }
                                                                            }}
                                                                            className="px-2 py-0.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs rounded border border-primary/20 transition-colors"
                                                                        >
                                                                            Generate Now
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Profile Link (Secondary) */}
                                                            <div className="p-3 bg-black/40 rounded border border-white/10 opacity-70 hover:opacity-100 transition-opacity">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <p className="text-xs text-muted-foreground">Public Profile</p>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const link = userDetailsCache[order.userId].username
                                                                                ? `${window.location.origin}/@${userDetailsCache[order.userId].username}`
                                                                                : `${window.location.origin}/u/${order.userId}`;
                                                                            navigator.clipboard.writeText(link);
                                                                            toast.success("Copied Profile Link");
                                                                        }}
                                                                        className="text-xs text-muted-foreground hover:text-white"
                                                                    >
                                                                        Copy
                                                                    </button>
                                                                </div>
                                                                <p className="text-sm font-mono truncate text-muted-foreground">
                                                                    {userDetailsCache[order.userId].username
                                                                        ? `/@${userDetailsCache[order.userId].username}`
                                                                        : `/u/${order.userId}`
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground mb-1">Plan Purchased</p>
                                                                <p className="font-medium text-foreground text-lg">{order.item.name}</p>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Ordered: {format(order.createdAt?.toDate ? order.createdAt.toDate() : new Date(), "PPP p")}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{order.item.description}</p>
                                                    </div>

                                                    <div className="pt-4 border-t border-white/10">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <p className="text-xs text-muted-foreground">Internal User ID</p>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.userId); toast.success("Copied ID"); }}
                                                                className="p-1 hover:bg-white/10 rounded transition-all flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                                                            >
                                                                <Copy className="w-3 h-3" /> Copy
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/10">
                                                            <code className="text-sm text-primary flex-1 break-all">
                                                                {order.userId}
                                                            </code>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-white/10">
                                                        <h5 className="text-xs font-bold text-muted-foreground mb-3 uppercase flex items-center gap-2">
                                                            <Sparkles className="w-3 h-3 text-primary" />
                                                            Customization Data
                                                        </h5>
                                                        {order.customization && Object.keys(order.customization).length > 0 ? (
                                                            <div className="space-y-3">
                                                                {order.formSnapshot ? (
                                                                    order.formSnapshot.map(field => (
                                                                        <div key={field.id} className="bg-black/20 p-3 rounded border border-white/10">
                                                                            <p className="text-xs text-muted-foreground uppercase mb-1">{field.label}</p>
                                                                            {field.type === 'image' ? (
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="relative w-16 h-16 rounded bg-black overflow-hidden border border-white/10 group/img">
                                                                                        <img
                                                                                            src={order.customization?.[field.id]}
                                                                                            alt={field.label}
                                                                                            className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                                                                                            onError={(e) => {
                                                                                                e.currentTarget.style.display = 'none';
                                                                                                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-white/5');
                                                                                                e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span class="text-[10px] text-muted-foreground text-center px-1">Img Error</span>');
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex flex-col gap-2">
                                                                                        <button
                                                                                            onClick={async (e) => {
                                                                                                e.stopPropagation();
                                                                                                try {
                                                                                                    const response = await fetch(order.customization?.[field.id]);
                                                                                                    const blob = await response.blob();
                                                                                                    const url = window.URL.createObjectURL(blob);
                                                                                                    const a = document.createElement('a');
                                                                                                    a.href = url;
                                                                                                    a.download = `image-${field.label}-${Date.now()}.png`; // improved filename
                                                                                                    document.body.appendChild(a);
                                                                                                    a.click();
                                                                                                    window.URL.revokeObjectURL(url);
                                                                                                    document.body.removeChild(a);
                                                                                                    toast.success("Download started");
                                                                                                } catch (err) {
                                                                                                    console.error("Download failed", err);
                                                                                                    toast.error("Download failed. Opening in new tab...");
                                                                                                    window.open(order.customization?.[field.id], '_blank');
                                                                                                }
                                                                                            }}
                                                                                            className="text-xs flex items-center gap-1 text-primary hover:underline"
                                                                                        >
                                                                                            <Download className="w-3 h-3" /> Download
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                navigator.clipboard.writeText(order.customization?.[field.id]);
                                                                                                toast.success("Link copied");
                                                                                            }}
                                                                                            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-white"
                                                                                        >
                                                                                            <Copy className="w-3 h-3" /> Copy Link
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <p className="text-sm font-medium text-foreground truncate">{order.customization?.[field.id]}</p>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            navigator.clipboard.writeText(order.customization?.[field.id] || "");
                                                                                            toast.success("Copied");
                                                                                        }}
                                                                                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-muted-foreground"
                                                                                        title="Copy"
                                                                                    >
                                                                                        <Copy className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    // Fallback for no snapshot
                                                                    Object.entries(order.customization).map(([key, value]) => (
                                                                        <div key={key} className="bg-black/20 p-3 rounded border border-white/10">
                                                                            <p className="text-xs text-muted-foreground uppercase mb-1">{key}</p>
                                                                            <p className="text-sm font-medium">{String(value)}</p>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground italic">No customization data.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </GlassCard>
                ))}

                {/* Pagination Controls */}
                {!loading && (
                    <div className="flex justify-center pt-8 gap-4">
                        <NeonButton
                            onClick={handlePrevPage}
                            disabled={page === 1}
                            variant="outline"
                            className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronDown className="w-4 h-4 rotate-90" /> {/* Left Arrow via rotation or use ArrowLeft */}
                            Previous
                        </NeonButton>
                        <NeonButton
                            onClick={handleNextPage}
                            disabled={!hasMore}
                            variant="outline"
                            className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronDown className="w-4 h-4 -rotate-90" /> {/* Right Arrow */}
                        </NeonButton>
                    </div>
                )}

                {orders.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No orders found matching the filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
