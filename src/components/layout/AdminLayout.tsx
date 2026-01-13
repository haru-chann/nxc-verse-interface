import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
    LayoutDashboard,
    Package,
    FileText,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    LogOut,
    ShieldCheck,
    Users,
    Globe,
    ClipboardList,
    CreditCard,
    Menu,
    X
} from "lucide-react";

const adminMenuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Reports", path: "/admin/reports", icon: ShieldAlert },
    { name: "Orders", path: "/admin/orders", icon: Package },
    { name: "Forms", path: "/admin/forms", icon: ClipboardList },
    { name: "Content (CMS)", path: "/admin/cms", icon: FileText },
];

export const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, isSuperAdmin } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
                {(isMobile || !collapsed) && (
                    <Link to="/admin" className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="font-display font-bold text-xl whitespace-nowrap">
                            Admin<span className="text-primary">Panel</span>
                        </span>
                    </Link>
                )}
                {/* Desktop Collapsed Logo */}
                {!isMobile && collapsed && (
                    <div className="w-full flex justify-center">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>
                )}

                {/* Mobile Close Button */}
                {isMobile && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 text-muted-foreground hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}

                {/* Desktop Collapse Button */}
                {!isMobile && (
                    <>
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className={cn(
                                "hidden lg:block p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground",
                                collapsed && "hidden"
                            )}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        {collapsed && (
                            <button
                                onClick={() => setCollapsed(false)}
                                className="hidden lg:flex absolute top-6 right-[-12px] w-6 h-6 bg-border rounded-full items-center justify-center hover:bg-primary hover:text-white transition-colors z-50"
                            >
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 overflow-y-auto custom-scrollbar">
                <ul className="space-y-1">
                    {adminMenuItems.map((item) => {
                        const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/admin");
                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={() => isMobile && setMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-primary/10 text-primary shadow-sm"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                                    <AnimatePresence>
                                        {(isMobile || !collapsed) && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: "auto" }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                            >
                                                {item.name}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>

                                    {/* Tooltip for collapsed state (Desktop only) */}
                                    {!isMobile && collapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-md border border-border">
                                            {item.name}
                                        </div>
                                    )}
                                </Link>
                            </li>
                        );
                    })}

                    {/* Super Admin Section */}
                    {isSuperAdmin && (
                        <>
                            <li className="mt-6 pt-6 border-t border-white/10">
                                {(isMobile || !collapsed) && <div className="px-3 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Super Admin</div>}
                            </li>
                            <li>
                                <Link
                                    to="/admin/plans"
                                    onClick={() => isMobile && setMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                        location.pathname === "/admin/plans"
                                            ? "bg-primary/10 text-primary shadow-sm"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <CreditCard className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/admin/plans" && "text-primary")} />
                                    <AnimatePresence>
                                        {(isMobile || !collapsed) && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: "auto" }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                            >
                                                Plans
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                    {!isMobile && collapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-md border border-border">
                                            Plans
                                        </div>
                                    )}
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <Link to="/dashboard" onClick={() => isMobile && setMobileOpen(false)}>
                    <button className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground mb-2", !isMobile && collapsed ? "justify-center" : "")}>
                        <Globe className="w-5 h-5" />
                        {(isMobile || !collapsed) && <span className="text-sm font-medium">Public Site</span>}
                    </button>
                </Link>
                <button
                    onClick={handleLogout}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors",
                        !isMobile && collapsed ? "justify-center" : ""
                    )}
                >
                    <LogOut className="w-5 h-5" />
                    {(isMobile || !collapsed) && <span className="text-sm font-medium">Logout</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 -ml-2 rounded-xl text-foreground/70 hover:bg-muted"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-display font-bold text-lg tracking-tight">Admin Panel</span>
                </div>
            </div>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        />
                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 w-64 bg-[#0a0a0a] border-r border-white/10 z-50 lg:hidden"
                        >
                            <SidebarContent isMobile={true} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar (Permanent) */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 80 : 260 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={cn(
                    "hidden lg:block fixed left-0 top-0 bottom-0 z-50 bg-[#0a0a0a] border-r border-white/10 overflow-hidden",
                    collapsed ? "w-[80px]" : "w-[260px]"
                )}
            >
                <SidebarContent isMobile={false} />
            </motion.aside>

            {/* Main Content */}
            <main
                className={cn(
                    "flex-1 transition-all duration-300 min-h-screen bg-background pt-16 lg:pt-0",
                    collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"
                )}
            >
                <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
