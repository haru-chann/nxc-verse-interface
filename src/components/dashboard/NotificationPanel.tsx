import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, Eye, MousePointer, UserPlus, MessageSquare, CheckCircle, Circle, Trash2, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { doc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { interactionService } from "@/services/interactionService";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

import { userService } from "@/services/userService";

interface Notification {
  id: string;
  type: "view" | "tap" | "contact_saved" | "message";
  name: string;
  email?: string;
  visitorId?: string; // [NEW]
  message?: string;
  time: string;
  location: string;
  read: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: "" });
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]); // [NEW]
  const unreadCount = notifications.filter(n => !n.read).length;

  // Long press handling
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      // 1. Listen for Notifications
      const q = query(
        collection(db, "users", currentUser.uid, "interactions"),
        orderBy("timestamp", "desc"),
        limit(100)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedNotifications: Notification[] = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();

          if (["tap", "contact_saved", "message", "contact"].includes(data.type)) {
            let name = "Someone";
            let type: Notification["type"] = "view";

            if (data.type === "tap") {
              type = "tap";
              name = "Anonymous User";
            } else if (data.type === "contact_saved" || data.type === "contact") {
              type = "contact_saved";
              name = data.name || "New Contact";
            } else if (data.type === "message") {
              type = "message";
              name = data.name || "Visitor";
            }

            loadedNotifications.push({
              id: doc.id,
              type: (data.type === 'contact' ? 'contact_saved' : type) as any,
              name: name,
              email: data.email,
              visitorId: data.visitorId, // [NEW] Keep visitorId for blocking
              message: data.message,
              location: data.metadata?.location || "Unknown Location",
              time: data.timestamp?.toDate ?
                data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                "Just now",
              read: data.read || false
            });
          }
        });
        setNotifications(loadedNotifications);
      });

      // 2. Listen for Blocked Users
      const userUnsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          setBlockedUsers(docSnap.data().blocked || []);
        }
      });

      return () => {
        unsubscribe();
        userUnsubscribe();
      };
    }
  }, [isOpen, currentUser]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await interactionService.updateInteraction(currentUser.uid, id, { read: true });
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notifications.forEach(n => {
      if (!n.read) interactionService.updateInteraction(currentUser.uid, n.id, { read: true });
    });
  };

  // [NEW] Single Delete
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    // Optimistic
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      await interactionService.deleteInteraction(currentUser.uid, id);
    } catch (error) {
      console.error("Failed to delete", error);
      toast.error("Failed to delete notification");
    }
  };

  // [NEW] Block/Unblock Logic
  const handleBlockToggle = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    const itemsToBlock = [];
    if (notification.visitorId) itemsToBlock.push(notification.visitorId);
    if (notification.email) itemsToBlock.push(notification.email);

    // Simple heuristic: If we have ANY identifier, we use the first available one to toggle
    // Ideally we should block ALL identifiers found, but for toggle UI we usually check against one.
    // Let's rely on visitorId first, then email.
    const targetIdentifier = notification.visitorId || notification.email;

    if (!targetIdentifier) {
      toast.error("Cannot block anonymous user");
      return;
    }

    const isBlocked = blockedUsers.includes(targetIdentifier);

    try {
      if (isBlocked) {
        await userService.unblockUser(currentUser.uid, targetIdentifier);
        toast.success(`Unblocked ${notification.name}`);
      } else {
        await userService.blockUser(currentUser.uid, targetIdentifier);
        toast.success(`Blocked ${notification.name} from sending messages`);
      }
    } catch (error) {
      toast.error(isBlocked ? "Failed to unblock" : "Failed to block");
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    if (newSet.size === 0) setIsSelectionMode(false);
  };

  const handleLongPressStart = (id: string) => {
    const timer = setTimeout(() => {
      setIsSelectionMode(true);
      setSelectedIds(new Set([id]));
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
    setPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  const handleDeleteSelected = async () => {
    if (!currentUser) return;
    const idsToDelete = Array.from(selectedIds);

    setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);

    try {
      await Promise.all(idsToDelete.map(id => interactionService.deleteInteraction(currentUser.uid, id)));
      toast.success(`Deleted ${idsToDelete.length} notifications`);
    } catch (error) {
      setErrorAlert({ isOpen: true, message: "Failed to delete notifications" });
    }
  };

  const requestDelete = () => {
    if (selectedIds.size > 1) {
      setShowDeleteConfirm(true);
    } else if (selectedIds.size === 1) {
      handleDeleteSelected();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "view": return Eye;
      case "tap": return MousePointer;
      case "contact_saved": return UserPlus;
      case "message": return MessageSquare;
      default: return Eye;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "view": return "viewed your profile";
      case "tap": return "tapped your card";
      case "contact_saved": return "saved your contact";
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
                {isSelectionMode ? (
                  <button
                    onClick={requestDelete}
                    className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                ) : (
                  unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )
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
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => {
                    const Icon = getIcon(notification.type);
                    const isSelected = selectedIds.has(notification.id);
                    // Determine if blocked
                    const targetIdentifier = notification.visitorId || notification.email;
                    const isBlocked = targetIdentifier ? blockedUsers.includes(targetIdentifier) : false;

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onPointerDown={() => handleLongPressStart(notification.id)}
                        onPointerUp={handleLongPressEnd}
                        onPointerLeave={handleLongPressEnd}
                        onClick={() => {
                          if (isSelectionMode) {
                            toggleSelection(notification.id);
                          } else {
                            handleMarkAsRead(notification.id);
                          }
                        }}
                        className={cn(
                          "p-4 rounded-xl cursor-pointer transition-all group relative flex items-center gap-3",
                          isSelected ? "bg-primary/10 border-primary" :
                            notification.read
                              ? "bg-muted/50 hover:bg-muted"
                              : "bg-primary/5 border border-primary/20 hover:bg-primary/10",
                          isSelectionMode && "pl-3"
                        )}
                      >
                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        )}

                        <div className="flex gap-3 flex-1 min-w-0 group-hover:pr-14 transition-all">
                          {/* Avatar Pattern */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-foreground font-bold">
                              {(notification.name || "Visitor").charAt(0)}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-foreground truncate flex items-center gap-2">
                                  {notification.name || "Visitor"}
                                  {isBlocked && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Blocked</span>}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Icon className="w-3 h-3" />
                                  {getTypeLabel(notification.type)}
                                </p>
                              </div>
                              {!notification.read && !isSelectionMode && (
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                              )}
                            </div>

                            {notification.message && (
                              <p className="text-sm text-foreground/80 mt-2 italic">
                                "{notification.message}"
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-muted-foreground">{notification.time}</p>
                            </div>
                          </div>
                        </div>

                        {/* Hover Actions (Delete & Block) - Only show when NOT selection mode */}
                        {!isSelectionMode && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm p-1 rounded-lg border border-white/10 shadow-lg">
                            {/* Block Button - Only for messages or identifies */}
                            {targetIdentifier && (
                              <button
                                onClick={(e) => handleBlockToggle(notification, e)}
                                className={cn(
                                  "p-2 rounded-md transition-colors",
                                  isBlocked ? "text-red-400 hover:bg-red-500/20" : "text-muted-foreground hover:bg-white/10 hover:text-red-400"
                                )}
                                title={isBlocked ? "Unblock User" : "Block User"}
                              >
                                <AlertTriangle className={cn("w-4 h-4", isBlocked && "fill-current")} />
                              </button>
                            )}

                            <button
                              onClick={(e) => handleDelete(notification.id, e)}
                              className="p-2 rounded-md text-muted-foreground hover:bg-white/10 hover:text-destructive transition-colors"
                              title="Delete Notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteSelected}
                title="Delete Notifications"
                description={`Are you sure you want to delete ${selectedIds.size} notifications? This cannot be undone.`}
                confirmText="Delete All"
                cancelText="Cancel"
                type="danger"
              />

              {/* View All Link */}
              <div className="p-4 border-t border-border">
                <Link
                  to="/dashboard/interactions"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors group"
                  onClick={onClose}
                >
                  View All Interactions
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>
          </motion.div>
          <ErrorAlert
            isOpen={errorAlert.isOpen}
            onClose={() => setErrorAlert({ ...errorAlert, isOpen: false })}
            message={errorAlert.message}
          />
        </>
      )}
    </AnimatePresence>
  );
};

