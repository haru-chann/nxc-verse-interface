import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, getDocs, orderBy, limit, where, doc, updateDoc, onSnapshot, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { adminService } from "@/services/adminService";
import {
    Users,
    Package,
    TrendingUp,
    Clock,
    ShieldCheck,
    Trash2,
    Plus,
    Mail,
    Loader2
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { NeonButton } from "@/components/ui/NeonButton";
import { toast } from "sonner";
import { GradientText } from "@/components/ui/GradientText";
import { format } from "date-fns";

export const AdminDashboard = () => {
    const { currentUser, isSuperAdmin } = useAuth();

    // Force refresh claims on mount
    useEffect(() => {
        if (currentUser) {
            currentUser.getIdTokenResult(true).catch(console.error);
        }
    }, [currentUser]);

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        revenue: 0
    });

    // Unified Activity State
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Stats (Parallel)
                const usersCountPromise = getCountFromServer(collection(db, "users"));
                const ordersSnapPromise = getDocs(collection(db, "orders"));

                // 2. Fetch Recent Items for Activity Feed (Parallel)
                const recentOrdersPromise = getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10)));
                const recentReportsPromise = getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(10)));
                const recentAdminActionsPromise = adminService.getRecentActions();

                const [usersCount, ordersSnap, recentOrders, recentReports, recentActions] = await Promise.all([
                    usersCountPromise,
                    ordersSnapPromise,
                    recentOrdersPromise,
                    recentReportsPromise,
                    recentAdminActionsPromise
                ]);

                // Process Stats
                let totalOrders = 0;
                let pendingOrders = 0;
                let revenue = 0;

                ordersSnap.forEach(doc => {
                    const data = doc.data();
                    totalOrders++;
                    if (data.status !== 'delivered') pendingOrders++;
                    if (data.amount) revenue += Number(data.amount);
                });

                setStats({
                    totalUsers: usersCount.data().count,
                    totalOrders,
                    pendingOrders,
                    revenue
                });

                // Process Aggregate Feed
                const orderItems = recentOrders.docs.map(d => ({
                    type: 'order',
                    id: d.id,
                    data: d.data(),
                    timestamp: d.data().createdAt
                }));

                const reportItems = recentReports.docs.map(d => ({
                    type: 'report',
                    id: d.id,
                    data: d.data(),
                    timestamp: d.data().createdAt
                }));

                const actionItems = recentActions.map(a => ({
                    type: 'admin_action',
                    id: a.id,
                    data: a,
                    timestamp: a.timestamp
                }));

                // Combine and Sort
                const allActivity = [...orderItems, ...reportItems, ...actionItems].sort((a, b) => {
                    const timeA = a.timestamp?.seconds || 0;
                    const timeB = b.timestamp?.seconds || 0;
                    return timeB - timeA;
                }).slice(0, 10); // Take top 10 most recent

                setRecentActivity(allActivity);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div>
                <p className="text-primary font-medium mb-2">OVERVIEW</p>
                <h1 className="text-3xl font-bold font-display text-foreground mb-2">
                    Dashboard <GradientText>Insights</GradientText>
                </h1>
                <p className="text-muted-foreground">Welcome back, <span className="text-primary font-bold">{currentUser?.displayName || 'Admin'}</span></p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/admin/users" className="block transition-transform hover:scale-[1.02]">
                    <GlassCard className="p-6 cursor-pointer hover:border-blue-500/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Users</p>
                                <h3 className="text-2xl font-bold text-foreground">{stats.totalUsers}</h3>
                            </div>
                        </div>
                    </GlassCard>
                </Link>

                <Link to="/admin/orders" className="block transition-transform hover:scale-[1.02]">
                    <GlassCard className="p-6 cursor-pointer hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Orders</p>
                                <h3 className="text-2xl font-bold text-foreground">{stats.totalOrders}</h3>
                            </div>
                        </div>
                    </GlassCard>
                </Link>

                <Link to="/admin/orders?filter=pending" className="block transition-transform hover:scale-[1.02]">
                    <GlassCard className="p-6 cursor-pointer hover:border-yellow-500/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-500">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Orders</p>
                                <h3 className="text-2xl font-bold text-foreground">{stats.pendingOrders}</h3>
                            </div>
                        </div>
                    </GlassCard>
                </Link>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-foreground">₹{stats.revenue.toLocaleString()}</h3>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="grid lg:grid-cols-1 gap-8">
                {/* Recent Activity Feed */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold font-display text-foreground">Recent Activity</h2>
                    <div className="space-y-4">
                        {recentActivity.map(item => {
                            const date = item.timestamp?.seconds
                                ? format(new Date(item.timestamp.seconds * 1000), "PP p")
                                : "Just now";

                            if (item.type === 'order') {
                                return (
                                    <Link
                                        to={`/admin/orders?orderId=${item.id}`}
                                        key={item.id}
                                        className="block transition-transform hover:scale-[1.01]"
                                    >
                                        <GlassCard className="p-4 flex items-center justify-between group hover:bg-white/5 transition-colors border-l-4 border-l-purple-500 cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-purple-500" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">
                                                        New Order <span className="text-muted-foreground">#{item.id.slice(0, 6)}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        <span className="text-purple-400 font-medium">{item.data.shippingDetails?.fullName || "User"}</span> purchased {item.data.item?.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">{date}</div>
                                                <div className={`text-[10px] uppercase font-bold mt-1 ${item.data.status === 'delivered' ? 'text-green-500' : 'text-yellow-500'
                                                    }`}>
                                                    {item.data.status}
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </Link>
                                );
                            }

                            if (item.type === 'report') {
                                return (
                                    <Link
                                        to={`/admin/reports?reportId=${item.id}`}
                                        key={item.id}
                                        className="block transition-transform hover:scale-[1.01]"
                                    >
                                        <GlassCard className="p-4 flex items-center justify-between group hover:bg-white/5 transition-colors border-l-4 border-l-red-500 cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                                    <ShieldCheck className="w-5 h-5 text-red-500" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">User Report</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Report against <span className="text-red-400 font-medium">{item.data.reportedUserName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">{date}</div>
                                                <div className="text-[10px] text-muted-foreground/60 mt-1">
                                                    In: {item.data.reasons?.[0] || "Review"}
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </Link>
                                );
                            }

                            // Admin Action
                            return (
                                <GlassCard key={item.id} className="p-4 flex items-center justify-between group hover:bg-white/5 transition-colors border-l-4 border-l-blue-500">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-foreground">{item.data.action}</div>
                                            <div className="text-xs text-muted-foreground">
                                                <span className="text-blue-400">{item.data.adminName}</span> • {item.data.target}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground">{date}</div>
                                        {item.data.details && (
                                            <div className="text-[10px] text-muted-foreground/60 max-w-[200px] truncate mt-1">
                                                {item.data.details}
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            );
                        })}

                        {recentActivity.length === 0 && (
                            <div className="text-muted-foreground text-sm italic py-8 text-center bg-white/5 rounded-xl">
                                No recent activity recorded.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
