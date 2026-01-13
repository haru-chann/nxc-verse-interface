import { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "./DashboardSidebar";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { Bell, User, LogOut, ExternalLink, AlertTriangle, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,

  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { NeonButton } from "@/components/ui/NeonButton";
import { useAuth } from "@/contexts/AuthContext";
import { userService, UserProfile } from "@/services/userService";
import { collection, query, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DashboardProvider } from "@/contexts/DashboardContext";

export const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // [NEW]
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  // Warning System State
  const [warningAlert, setWarningAlert] = useState<{ open: boolean; message: string | null }>({ open: false, message: null });

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        try {
          const data = await userService.getUserProfile(currentUser.uid);
          setProfile(data);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchProfile();

    if (currentUser) {
      // Real-time listener for Unread Notifications
      // Filter out 'view' type alerts to avoid constant blinking
      const q = query(
        collection(db, "users", currentUser.uid, "interactions"),
        limit(100) // Fetch latest 100 interactions to check for unread
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const hasImportantUnread = snapshot.docs.some((doc) => {
          const data = doc.data();
          return !data.read && ["tap", "contact_saved", "message"].includes(data.type);
        });
        setHasUnread(hasImportantUnread);
      });



      // Real-time listener for User Profile (specifically for Warnings)
      const userUnsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data as UserProfile); // Keep profile up to date

          // Check for warning
          if (data.warning && !data.warning.seen) {
            setWarningAlert({ open: true, message: data.warning.message });
          }
        }
      });

      return () => {
        unsubscribe();
        userUnsubscribe();
      };
    }
  }, [currentUser]);

  const handleDismissWarning = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        "warning.seen": true
      });
      setWarningAlert({ open: false, message: null });
    } catch (error) {
      console.error("Error dismissing warning", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-background">
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Notification Panel */}
        <NotificationPanel
          isOpen={notificationOpen}
          onClose={() => setNotificationOpen(false)}
        />

        <div
          className={cn(
            "min-h-screen transition-all duration-300 pb-20 lg:pb-0",
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          )}
        >
          {/* Top Header */}
          <header className="sticky top-0 z-30 h-20 bg-background/80 backdrop-blur-xl border-b border-border">
            <div className="h-full px-4 lg:px-8 flex items-center justify-between">
              {/* Mobile Menu Trigger & Brand */}
              <div className="flex items-center gap-3 lg:hidden mr-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 -ml-2 rounded-xl text-foreground/70 hover:bg-muted"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <span className="font-display font-bold text-lg tracking-tight">NXC Badge Verse</span>
              </div>

              {/* Search Removed */}
              <div className="flex-1 max-w-md hidden lg:block" />

              {/* Actions */}
              <div className="flex items-center gap-4">
                {/* View Profile Button */}
                <Link
                  to={currentUser ? `/u/${currentUser.uid}` : "#"}
                  target="_blank"
                  className="hidden sm:flex"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-sm font-medium text-primary transition-colors border border-primary/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Profile
                  </motion.div>
                </Link>

                {/* Notifications */}
                <button
                  onClick={() => setNotificationOpen(true)}
                  className="relative p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {hasUnread && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                  )}
                </button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 p-1.5 pr-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
                        {currentUser?.photoURL || profile?.photoURL ? (
                          <img src={currentUser?.photoURL || profile?.photoURL} alt={profile?.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-primary-foreground" />
                        )}
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-foreground">
                        {profile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0]}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/settings">
                        <User className="w-4 h-4 mr-2" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={currentUser ? `/u/${currentUser.uid}` : "#"} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Public Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
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


      {/* Global Warning Alert */}
      <AlertDialog open={warningAlert.open}>
        <AlertDialogContent className="border-l-4 border-l-red-500 bg-background text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500 font-bold text-xl">
              <AlertTriangle className="w-6 h-6" />
              Official Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground text-base py-4">
              {warningAlert.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDismissWarning} className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto">
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardProvider >
  );
};
