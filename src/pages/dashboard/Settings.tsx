import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { storageService } from "@/services/storageService";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { toast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Camera,
} from "lucide-react";
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";

const Settings = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // New State for Confirm Dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: "" });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newContactAlerts: true,
    profileViewAlerts: true,
  });

  // Load user data
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      try {
        const data = await userService.getUserProfile(currentUser.uid);

        // Load Notification Settings
        const settingsDoc = await getDoc(doc(db, "users", currentUser.uid, "settings", "notifications"));
        if (settingsDoc.exists()) {
          setNotifications(prev => ({ ...prev, ...settingsDoc.data() }));
        }

        if (data) {
          setFormData(prev => ({
            ...prev,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: currentUser.email || "",
            phone: (data as any).phone || "",
          }));
        }
      } catch (error) {
        console.error(error);
        setErrorAlert({ isOpen: true, message: "Failed to load profile data. Please refresh the page." });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      // Update Firestore
      await userService.updateUserProfile(currentUser.uid, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
      } as any);

      // Update Auth Profile (so it reflects in header immediately)
      await updateProfile(currentUser, {
        displayName: `${formData.firstName} ${formData.lastName}`.trim()
      });

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error: any) {
      console.error(error);
      setErrorAlert({ isOpen: true, message: getFriendlyErrorMessage(error) });
    }
  };

  const handleSavePassword = async () => {
    if (!currentUser || !currentUser.email) return;

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorAlert({ isOpen: true, message: "New passwords do not match." });
      return;
    }
    if (formData.newPassword.length < 8) {
      setErrorAlert({ isOpen: true, message: "Password must be at least 8 characters." });
      return;
    }

    if (!formData.currentPassword) {
      setErrorAlert({ isOpen: true, message: "Please enter your current password to confirm changes." });
      return;
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, formData.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, formData.newPassword);

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error(error);
      setErrorAlert({ isOpen: true, message: getFriendlyErrorMessage(error) });
    }
  };

  const handleSaveNotifications = async () => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "users", currentUser.uid, "settings", "notifications"), notifications);
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorAlert({ isOpen: true, message: "File size must be less than 5MB" });
      return;
    }

    try {
      // Cleanup old image
      if (currentUser.photoURL) {
        await storageService.deleteImage(currentUser.photoURL);
      }

      const path = `users/${currentUser.uid}/account_photo_${Date.now()}`;
      const url = await storageService.uploadImage(file, path);

      // Update Auth Profile ONLY (Not Firestore)
      await updateProfile(currentUser, { photoURL: url });

      toast({
        title: "Success",
        description: "Profile photo updated.",
      });
      // Force reload to see changes if context doesn't auto-update immediately
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      setErrorAlert({ isOpen: true, message: getFriendlyErrorMessage(error) });
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentUser) return;
    try {
      // Cleanup old image
      if (currentUser.photoURL) {
        await storageService.deleteImage(currentUser.photoURL);
      }

      await updateProfile(currentUser, { photoURL: "" });

      toast({
        title: "Success",
        description: "Profile photo removed.",
      });
      window.location.reload();
    } catch (error: any) {
      setErrorAlert({ isOpen: true, message: "Failed to remove photo" });
    }
  };

  const confirmDeleteAccount = async () => {
    if (!currentUser) return;

    setDeleteLoading(true);
    try {
      await deleteUser(currentUser);

      // Navigate immediately and toast
      navigate("/");
      toast({
        title: "Account Deleted",
        description: "We are sorry to see you go.",
      });
    } catch (error: any) {
      console.error("Delete account error", error);
      setErrorAlert({ isOpen: true, message: getFriendlyErrorMessage(error) });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">
          Account <GradientText>Settings</GradientText>
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and security</p>
      </div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-foreground">Profile Information</h2>
              <p className="text-sm text-muted-foreground">Update your personal details</p>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="text-3xl font-bold text-primary-foreground">
                    {formData.firstName?.[0] || currentUser?.email?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 border border-border flex items-center justify-center transition-colors cursor-pointer overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Camera className="w-4 h-4 text-foreground" />
              </div>
            </div>
            <div>
              <p className="text-foreground font-medium">Profile Photo</p>
              <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
              {currentUser?.photoURL && (
                <button
                  onClick={handleRemoveAvatar}
                  className="mt-2 text-xs text-destructive hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
              <input
                name="firstName"
                autoComplete="given-name"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-muted rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
              <input
                name="lastName"
                autoComplete="family-name"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-muted rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <input
                name="email"
                autoComplete="email"
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 bg-muted/50 rounded-xl border border-border focus:outline-none text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
              <input
                name="phone"
                autoComplete="tel"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-muted rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
              />
            </div>
          </div>

          <NeonButton onClick={handleSaveProfile}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </NeonButton>
        </GlassCard>
      </motion.div>

      {/* Password Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-foreground">Password & Security</h2>
              <p className="text-sm text-muted-foreground">Manage your password and 2FA</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 pr-12 bg-muted rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 bg-muted rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-muted rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                />
              </div>
            </div>
          </div>

          <NeonButton onClick={handleSavePassword}>
            <Shield className="w-4 h-4 mr-2" />
            Update Password
          </NeonButton>
        </GlassCard>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-foreground">Notifications</h2>
              <p className="text-sm text-muted-foreground">Configure how you receive alerts</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {[
              { key: "emailNotifications", label: "Email Notifications", desc: "Receive updates via email" },
              { key: "pushNotifications", label: "Push Notifications", desc: "Browser push notifications" },

              { key: "newContactAlerts", label: "New Contact Alerts", desc: "When someone saves your contact" },
              { key: "profileViewAlerts", label: "Profile View Alerts", desc: "When someone views your profile" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <p className="text-foreground font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      [item.key]: !notifications[item.key as keyof typeof notifications],
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-border"
                    }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-all ${notifications[item.key as keyof typeof notifications] ? "left-7" : "left-1"
                      }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <NeonButton onClick={handleSaveNotifications}>
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </NeonButton>
        </GlassCard>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassCard className="p-6 border-destructive/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-foreground">Danger Zone</h2>
              <p className="text-sm text-muted-foreground">Irreversible actions</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-4">
            Once you delete your account, there is no going back. All your data, profiles, and analytics will be permanently removed.
          </p>

          <button
            onClick={handleDeleteClick}
            className="px-4 py-2 rounded-xl border border-destructive text-destructive hover:bg-destructive/10 font-medium transition-colors"
          >
            Delete Account
          </button>
        </GlassCard>
      </motion.div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account?"
        description="Are you absolutely sure? This action cannot be undone and will permanently delete your account and all associated data."
        confirmText="Yes, Delete Account"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
      <ErrorAlert
        isOpen={errorAlert.isOpen}
        onClose={() => setErrorAlert({ ...errorAlert, isOpen: false })}
        message={errorAlert.message}
      />
    </div>
  );
};

export default Settings;
