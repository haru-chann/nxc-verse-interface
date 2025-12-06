import { useState } from "react";
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
  CreditCard,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Camera,
} from "lucide-react";

const Settings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1 234 567 8900",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    newContactAlerts: true,
    profileViewAlerts: true,
  });

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handleSavePassword = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (formData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
    setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notifications Updated",
      description: "Your notification preferences have been saved.",
    });
  };

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
                <span className="text-3xl font-bold text-primary-foreground">JD</span>
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 border border-border flex items-center justify-center transition-colors">
                <Camera className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <div>
              <p className="text-foreground font-medium">Profile Photo</p>
              <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-muted rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-muted rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-muted rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
              <input
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
              { key: "weeklyDigest", label: "Weekly Digest", desc: "Summary of your weekly activity" },
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
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-all ${
                      notifications[item.key as keyof typeof notifications] ? "left-7" : "left-1"
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

      {/* Billing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-foreground">Billing & Plan</h2>
              <p className="text-sm text-muted-foreground">Manage your subscription</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground font-medium">Current Plan</span>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">$12/month • Renews on Jan 15, 2025</p>
          </div>

          <div className="flex gap-3">
            <NeonButton variant="outline" glow={false}>
              Change Plan
            </NeonButton>
            <NeonButton variant="ghost" glow={false}>
              View Invoices
            </NeonButton>
          </div>
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

          <button className="px-4 py-2 rounded-xl border border-destructive text-destructive hover:bg-destructive/10 font-medium transition-colors">
            Delete Account
          </button>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Settings;
