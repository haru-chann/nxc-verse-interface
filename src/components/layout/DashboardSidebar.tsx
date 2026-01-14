import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  LayoutDashboard,
  User,
  CreditCard,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sparkles,
  QrCode,
  Activity,
  Users
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Public Profile", path: "/dashboard/profile", icon: User },
  { name: "QR Builder", path: "/dashboard/qr-builder", icon: QrCode },
  { name: "Interactions", path: "/dashboard/interactions", icon: Activity },
  { name: "Contacts", path: "/dashboard/contacts", icon: Users },
  { name: "My Cards", path: "/dashboard/my-cards", icon: CreditCard },
  { name: "Settings", path: "/dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean; // [NEW]
  onMobileClose: () => void; // [NEW]
}

export const DashboardSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: DashboardSidebarProps) => {
  const location = useLocation();
  const { currentUser, isAdmin } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    onMobileClose();
  }, [location.pathname]);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-sidebar-primary/10">
            <img src="/nxcverse.svg" alt="NXC Badge Verse Logo" className="w-full h-full object-contain" />
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="font-display text-lg font-bold text-sidebar-foreground">
              NXC Badge <span className="text-primary">Verse</span>
            </span>
          )}
        </Link>
        {/* Mobile Close Button */}
        {mobileOpen && (
          <button onClick={onMobileClose} className="lg:hidden p-2 text-sidebar-foreground/70 hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      < nav className="flex-1 py-6 px-3 overflow-y-auto custom-scrollbar" >
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-neon-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary-foreground")} />

                  {(!collapsed || mobileOpen) && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}

                  {collapsed && !mobileOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {item.name}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}

          {/* Admin Link */}
          {isAdmin && (
            <li>
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  location.pathname.startsWith("/admin") && "bg-sidebar-primary text-sidebar-primary-foreground shadow-neon-sm"
                )}
              >
                <ShieldCheck className={cn("w-5 h-5 flex-shrink-0", location.pathname.startsWith("/admin") && "text-sidebar-primary-foreground")} />
                {(!collapsed || mobileOpen) && (
                  <span className="text-sm font-medium">Admin Panel</span>
                )}
                {collapsed && !mobileOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    Admin Panel
                  </div>
                )}
              </Link>
            </li>
          )}
        </ul>
      </nav >
    </>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border z-50 lg:hidden flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
        initial={false}
        animate={{ width: collapsed ? 80 : 256 }}
      >
        <SidebarContent />

        {/* Footer (Desktop Only Toggle) */}
        <div className="p-3 border-t border-sidebar-border mt-auto">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-3 px-3 py-3 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
};
