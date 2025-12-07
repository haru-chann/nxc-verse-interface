import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Bell, X, Eye, MousePointer, UserPlus, MessageSquare, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "view" | "tap" | "contact" | "message";
  name: string;
  email: string;
  message?: string;
  time: string;
  location: string;
  avatar?: string;
  read: boolean;
}

const recentInteractions: Notification[] = [
  { id: "1", type: "contact", name: "Sarah Chen", email: "sarah@example.com", time: "2 min ago", location: "San Francisco, CA", read: false },
  { id: "2", type: "view", name: "Michael Brown", email: "michael@company.com", time: "15 min ago", location: "New York, NY", read: false },
  { id: "3", type: "tap", name: "Emily Davis", email: "emily@startup.io", time: "1 hour ago", location: "London, UK", read: true },
  { id: "4", type: "message", name: "Alex Johnson", email: "alex@tech.co", message: "Great meeting you at the conference!", time: "2 hours ago", location: "Tokyo, Japan", read: true },
  { id: "5", type: "view", name: "Jessica Wilson", email: "jessica@design.co", time: "3 hours ago", location: "Paris, France", read: true },
  { id: "6", type: "contact", name: "David Lee", email: "david@agency.com", time: "5 hours ago", location: "Sydney, AU", read: true },
];

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>(recentInteractions);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "view": return Eye;
      case "tap": return MousePointer;
      case "contact": return UserPlus;
      case "message": return MessageSquare;
      default: return Eye;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "view": return "viewed your profile";
      case "tap": return "tapped your card";
      case "contact": return "saved your contact";
      case "message": return "sent you a message";
      default: return "interacted with you";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:bg-transparent lg:backdrop-blur-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-card border-l border-border z-50 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-5 h-5 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold font-display text-foreground">Recent Interactions</h2>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto h-[calc(100%-64px)] custom-scrollbar">
              <div className="p-4 space-y-3">
                {notifications.map((notification, index) => {
                  const Icon = getIcon(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "p-4 rounded-xl cursor-pointer transition-all group",
                        notification.read
                          ? "bg-muted/50 hover:bg-muted"
                          : "bg-primary/5 border border-primary/20 hover:bg-primary/10"
                      )}
                    >
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-foreground font-bold">
                            {notification.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-foreground truncate">{notification.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Icon className="w-3 h-3" />
                                {getTypeLabel(notification.type)}
                              </p>
                            </div>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                          
                          {notification.message && (
                            <p className="text-sm text-foreground/80 mt-2 italic">
                              "{notification.message}"
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">{notification.location}</p>
                            <p className="text-xs text-muted-foreground">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* View All Link */}
              <div className="p-4 border-t border-border">
                <a
                  href="/dashboard/interactions"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors group"
                >
                  View All Interactions
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
