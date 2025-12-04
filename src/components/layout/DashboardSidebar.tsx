import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Palette,
  QrCode,
  Activity,
  Users,
  Download,
  Shield,
  Package,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Profile Editor", path: "/dashboard/profile", icon: User },
  { name: "Theme Customizer", path: "/dashboard/themes", icon: Palette },
  { name: "QR Builder", path: "/dashboard/qr-builder", icon: QrCode },
  { name: "Interaction Log", path: "/dashboard/interactions", icon: Activity },
  { name: "Contacts", path: "/dashboard/contacts", icon: Users },
  { name: "Export Center", path: "/dashboard/export", icon: Download },
  { name: "Security", path: "/dashboard/security", icon: Shield },
  { name: "Order Tracking", path: "/dashboard/orders", icon: Package },
  { name: "Account Settings", path: "/dashboard/settings", icon: Settings },
  { name: "Billing", path: "/dashboard/billing", icon: CreditCard },
];

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const DashboardSidebar = ({ collapsed, onToggle }: DashboardSidebarProps) => {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
        initial={false}
        animate={{ width: collapsed ? 80 : 256 }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-primary-foreground font-bold text-lg">N</span>
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-display text-lg font-bold text-sidebar-foreground whitespace-nowrap overflow-hidden"
                >
                  NXC Badge
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto custom-scrollbar">
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
                    <AnimatePresence>
                      {!collapsed && (
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
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                        {item.name}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
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

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2">
          {menuItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}
          <Link
            to="/dashboard/settings"
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-muted-foreground"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </Link>
        </div>
      </nav>
    </>
  );
};
