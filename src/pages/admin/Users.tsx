import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, limit, where, doc, updateDoc, startAfter, DocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { Loader2, Search, Shield, ShieldCheck, User, Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { format } from "date-fns";
import { adminService } from "@/services/adminService";

const USERS_PER_PAGE = 10;

export const AdminUsers = () => {
    const { currentUser, isSuperAdmin } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination
    const [lastDocs, setLastDocs] = useState<DocumentSnapshot[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Action state
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'promote' | 'demote' | 'ban' | 'unban',
        user: any
    } | null>(null);

    const fetchUsers = async (pageIndex = 1, direction: 'next' | 'prev' | 'init' = 'init') => {
        setLoading(true);
        try {
            const usersRef = collection(db, "users");
            let q;

            if (searchQuery) {
                if (searchQuery.includes('@')) {
                    q = query(usersRef, where("email", "==", searchQuery));
                } else {
                    // Fallback for name search: fetch recent 50 and filter client side
                    q = query(usersRef, orderBy("createdAt", "desc"), limit(50));
                }
            } else {
                // Base Query: Always sort by createdAt to ensure all users (even legacy) are retrieved.
                // Strict filters on 'admin' or 'role' fields cause legacy users (undefined fields) to disappear.
                let constraints: any[] = [
                    orderBy("createdAt", "desc"),
                    limit(USERS_PER_PAGE)
                ];

                if (direction === 'next' && lastDocs[pageIndex - 2]) {
                    constraints.push(startAfter(lastDocs[pageIndex - 2]));
                }
                else if (direction === 'prev' && pageIndex > 1) {
                    if (lastDocs[pageIndex - 2]) {
                        constraints.push(startAfter(lastDocs[pageIndex - 2]));
                    }
                }

                q = query(usersRef, ...constraints);
            }

            const snapshot = await getDocs(q);
            const rawUsers: any[] = [];
            snapshot.forEach(doc => {
                rawUsers.push({ id: doc.id, ...(doc.data() as any) });
            });

            // Client-side Logic
            let finalUsers = rawUsers;

            // Only apply role logic on main list, not specific search
            if (!searchQuery || !searchQuery.includes('@')) {
                if (!isSuperAdmin) {
                    // Normal Admin: Hide Admins/SuperAdmins
                    // We filter client-side to be safe with sparse data (users missing fields)
                    finalUsers = finalUsers.filter(u => u.role !== 'admin' && u.role !== 'super_admin' && u.admin !== true);
                } else {
                    // Super Admin: Sort admins to the top of this page
                    finalUsers.sort((a, b) => {
                        const aIsAdmin = a.role === 'admin' || a.role === 'super_admin' || a.admin === true;
                        const bIsAdmin = b.role === 'admin' || b.role === 'super_admin' || b.admin === true;
                        if (aIsAdmin && !bIsAdmin) return -1;
                        if (!aIsAdmin && bIsAdmin) return 1;
                        return 0; // Keep createdAt order otherwise
                    });
                }

                if (searchQuery && !searchQuery.includes('@')) {
                    const lowerTerm = searchQuery.toLowerCase();
                    finalUsers = finalUsers.filter(u =>
                        u.displayName?.toLowerCase().includes(lowerTerm) ||
                        u.email?.toLowerCase().includes(lowerTerm)
                    );
                    setHasMore(false);
                } else if (!searchQuery) {
                    // Pagination updates
                    if (snapshot.docs.length > 0) {
                        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
                        if (direction === 'next' || (direction === 'init' && pageIndex === 1)) {
                            const newLastDocs = [...lastDocs];
                            newLastDocs[pageIndex - 1] = lastVisible;
                            setLastDocs(newLastDocs);
                        }
                        setHasMore(snapshot.docs.length === USERS_PER_PAGE);
                    } else {
                        setHasMore(false);
                    }
                }
            }

            setUsers(finalUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
            // toast.error("Failed to fetch users. Check console for index errors.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [isSuperAdmin]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setLastDocs([]);
        fetchUsers(1, 'init');
    };

    const handleNextPage = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchUsers(nextPage, 'next');
    };

    const handlePrevPage = () => {
        if (page <= 1) return;
        const prevPage = page - 1;
        setPage(prevPage);
        fetchUsers(prevPage, 'prev');
    };

    // --- Actions ---

    const handlePromote = async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        try {
            await updateDoc(doc(db, "users", confirmAction.user.id), {
                role: 'admin',
                admin: true
            });
            toast.success(`${confirmAction.user.email} is now an Admin`);
            await adminService.logAction(
                "User Promoted",
                confirmAction.user.email,
                "Promoted to Admin",
                currentUser?.displayName || "Admin"
            );
            fetchUsers(page, 'init'); // Refresh current page
        } catch (err) {
            console.error(err);
            toast.error("Failed to update user role");
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    const handleDemote = async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        try {
            if (confirmAction.user.role === 'super_admin') {
                toast.error("Cannot modify Super Admin");
                return;
            }
            await updateDoc(doc(db, "users", confirmAction.user.id), {
                role: 'user',
                admin: false
            });
            toast.success("Admin privileges removed");
            await adminService.logAction(
                "User Demoted",
                confirmAction.user.email,
                "Removed Admin Access",
                currentUser?.displayName || "Admin"
            );
            fetchUsers(page, 'init');
        } catch (err) {
            console.error(err);
            toast.error("Failed to update user role");
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    const handleBan = async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        try {
            if (confirmAction.user.role === 'super_admin' || confirmAction.user.role === 'admin') {
                if (!isSuperAdmin) {
                    toast.error("You cannot ban an admin.");
                    return;
                }
                if (confirmAction.user.role === 'super_admin') {
                    toast.error("Cannot ban Super Admin.");
                    return;
                }
            }

            await updateDoc(doc(db, "users", confirmAction.user.id), {
                isBanned: true
            });
            toast.success("User banned successfully");
            await adminService.logAction(
                "User Banned",
                confirmAction.user.email,
                "Banned via User Management",
                currentUser?.displayName || "Admin"
            );
            fetchUsers(page, 'init');
        } catch (err) {
            console.error(err);
            toast.error("Failed to ban user");
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    const handleUnban = async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        try {
            await updateDoc(doc(db, "users", confirmAction.user.id), {
                isBanned: false
            });
            toast.success("User unbanned successfully");
            await adminService.logAction(
                "User Unbanned",
                confirmAction.user.email,
                "Unbanned via User Management",
                currentUser?.displayName || "Admin"
            );
            fetchUsers(page, 'init');
        } catch (err) {
            console.error(err);
            toast.error("Failed to unban user");
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    const getActionHandler = () => {
        switch (confirmAction?.type) {
            case 'promote': return handlePromote;
            case 'demote': return handleDemote;
            case 'ban': return handleBan;
            case 'unban': return handleUnban;
            default: return () => { };
        }
    };

    const getActionTitle = () => {
        switch (confirmAction?.type) {
            case 'promote': return "Make User Admin?";
            case 'demote': return "Remove Admin Access?";
            case 'ban': return "Ban User?";
            case 'unban': return "Unban User?";
            default: return "Confirm Action";
        }
    };

    const getActionDescription = () => {
        const email = confirmAction?.user?.email || 'this user';
        switch (confirmAction?.type) {
            case 'promote': return `Are you sure you want to promote ${email} to Admin capabilities?`;
            case 'demote': return `Are you sure you want to remove Admin access from ${email}?`;
            case 'ban': return `Are you sure you want to BAN ${email}? They will be logged out immediately and unable to access the platform.`;
            case 'unban': return `Are you sure you want to UNBAN ${email}? They will regain access to the platform.`;
            default: return "";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-foreground">
                        User <GradientText>Management</GradientText>
                    </h1>
                    <p className="text-muted-foreground mt-1">View and manage registered users</p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search email or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50"
                    />
                </form>
            </div>

            {/* Desktop Table View */}
            <GlassCard className="hidden md:block overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">User</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Role</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Joined</th>
                                <th className="text-right p-4 font-medium text-muted-foreground text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className={`hover:bg-white/5 transition-colors ${user.isBanned ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground flex items-center gap-2">
                                                        {user.displayName || 'No Name'}
                                                        {user.isBanned && <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold">Banned</span>}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {user.role === 'super_admin' ? (
                                                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/20 flex items-center gap-1">
                                                        <ShieldCheck className="w-3 h-3" /> Super Admin
                                                    </span>
                                                ) : user.role === 'admin' ? (
                                                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/20 flex items-center gap-1">
                                                        <Shield className="w-3 h-3" /> Admin
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-full bg-white/5 text-muted-foreground text-xs border border-white/5 flex items-center gap-1">
                                                        <User className="w-3 h-3" /> User
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-foreground">
                                                {user.createdAt?.seconds
                                                    ? format(new Date(user.createdAt.seconds * 1000), "MMM d, yyyy")
                                                    : "Unknown"}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Promote/Demote - Only Super Admin can promote/demote */}
                                                {isSuperAdmin && user.role !== 'super_admin' && (
                                                    <>
                                                        {user.role === 'admin' ? (
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'demote', user })}
                                                                className="p-2 hover:bg-yellow-500/10 text-yellow-400 rounded-lg transition-colors text-xs font-medium"
                                                                title="Remove Admin Access"
                                                            >
                                                                Demote
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'promote', user })}
                                                                className="p-2 hover:bg-green-500/10 text-green-400 rounded-lg transition-colors text-xs font-medium"
                                                                title="Make Admin"
                                                            >
                                                                Promote
                                                            </button>
                                                        )}
                                                    </>
                                                )}

                                                {/* Ban/Unban */}
                                                {user.role !== 'super_admin' && (
                                                    currentUser?.uid !== user.id && (
                                                        user.isBanned ? (
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'unban', user })}
                                                                className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors text-xs font-bold px-3"
                                                            >
                                                                Unban
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'ban', user })}
                                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors text-xs font-bold px-3"
                                                            >
                                                                Ban
                                                            </button>
                                                        )
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-white/5 rounded-xl border border-white/10">
                        No users found.
                    </div>
                ) : (
                    users.map(user => (
                        <GlassCard key={user.id} className={`p-4 ${user.isBanned ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground flex items-center gap-2">
                                            {user.displayName || 'No Name'}
                                            {user.isBanned && <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold">Banned</span>}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {user.role === 'super_admin' ? (
                                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold border border-purple-500/20 flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Super Admin
                                        </span>
                                    ) : user.role === 'admin' ? (
                                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/20 flex items-center gap-1">
                                            <Shield className="w-3 h-3" /> Admin
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground text-[10px] border border-white/5 flex items-center gap-1">
                                            <User className="w-3 h-3" /> User
                                        </span>
                                    )}
                                    <div className="text-[10px] text-muted-foreground">
                                        Joined: {user.createdAt?.seconds
                                            ? format(new Date(user.createdAt.seconds * 1000), "MMM d, yyyy")
                                            : "Unknown"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                                {isSuperAdmin && user.role !== 'super_admin' && (
                                    <>
                                        {user.role === 'admin' ? (
                                            <button
                                                onClick={() => setConfirmAction({ type: 'demote', user })}
                                                className="p-2 hover:bg-yellow-500/10 text-yellow-400 rounded-lg transition-colors text-xs font-medium"
                                            >
                                                Demote
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmAction({ type: 'promote', user })}
                                                className="p-2 hover:bg-green-500/10 text-green-400 rounded-lg transition-colors text-xs font-medium"
                                            >
                                                Promote
                                            </button>
                                        )}
                                    </>
                                )}

                                {user.role !== 'super_admin' && (
                                    currentUser?.uid !== user.id && (
                                        user.isBanned ? (
                                            <button
                                                onClick={() => setConfirmAction({ type: 'unban', user })}
                                                className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors text-xs font-bold px-3"
                                            >
                                                Unban
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmAction({ type: 'ban', user })}
                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors text-xs font-bold px-3"
                                            >
                                                Ban
                                            </button>
                                        )
                                    )
                                )}
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
            {/* Pagination Controls */}
            {!loading && !searchQuery.includes('@') && (
                <GlassCard className="mt-4 p-1">
                    <div className="p-4 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Page {page}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={page === 1}
                                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleNextPage}
                                disabled={!hasMore}
                                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </GlassCard>
            )}

            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={getActionHandler()}
                title={getActionTitle()}
                description={getActionDescription()}
                confirmText={getActionTitle().split('?')[0]}
                type={confirmAction?.type === 'ban' || confirmAction?.type === 'demote' ? 'danger' : 'info'}
                loading={actionLoading}
            />
        </div >
    );
};
