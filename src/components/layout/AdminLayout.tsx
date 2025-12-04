import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  BarChart3,
  Palette,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const adminMenuItems = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "Users", path: "/admin/users", icon: Users },
  { name: "Orders", path: "/admin/orders", icon: Package },
  { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { name: "Templates", path: "/admin/templates", icon: Palette },
  { name: "Content", path: "/admin/content", icon: FileText },
  { name: "Moderation", path: "/admin/moderation", icon: Shield },
];

export const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 256 }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/admin" className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-warning flex items-center justify-center flex-shrink-0"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-destructive-foreground font-bold text-lg">A</span>
            </motion.div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-display text-lg font-bold text-sidebar-foreground whitespace-nowrap overflow-hidden"
                >
                  Admin Panel
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {adminMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                      isActive
                        ? "bg-destructive/20 text-destructive"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <AnimatePresence>
                      {!sidebarCollapsed && (
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
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-3 px-3 py-3 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-20 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="h-full px-4 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-xs font-medium">
                Admin Mode
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View Site
              </Link>
              <button className="relative p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 p-1.5 pr-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-destructive to-warning flex items-center justify-center">
                      <span className="text-sm font-bold text-white">A</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">Admin</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/login" className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <motion.main
          className="p-4 lg:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};
