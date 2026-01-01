import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Twitter, Linkedin, Instagram, Github, Globe, MapPin, Lock, QrCode, ExternalLink, Download, UserPlus, Link as LinkIcon, Briefcase, User } from "lucide-react";
import { toast } from "sonner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { userService } from "@/services/userService";
import { interactionService } from "@/services/interactionService";
import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

const PublicProfile = () => {
  const { uid } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: "" });

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Only message state needed now
  const [message, setMessage] = useState("");

  // Log View on Mount


  // Log View on Mount
  useEffect(() => {
    if (uid) {
      interactionService.logInteraction(uid, "view", { source: 'web' });
    }
  }, [uid]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!uid) return;
      try {
        const data = await userService.getUserProfile(uid);
        if (data) {
          setProfileData(data);
        } else {
          setError("Profile not found");
        }
      } catch (err: any) {
        console.error(err);
        if (err.code === 'permission-denied') {
          setError("Access Denied: Please check Firestore Security Rules. Public read access is required.");
        } else {
          setError("Failed to load profile: " + (err.message || "Unknown error"));
        }
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [uid]);

  const handleSaveContact = () => {
    if (!profileData) return;

    // Log interaction
    if (uid) {
      interactionService.logInteraction(uid, "contact_saved");
    }

    // Generate VCard format
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profileData.firstName || ""} ${profileData.lastName || ""}
N:${profileData.lastName || ""};${profileData.firstName || ""};;;
TITLE:${profileData.title || ""}
ORG:${profileData.company || ""}
EMAIL:${profileData.email || ""}
TEL:${profileData.phone || ""}
NOTE:${profileData.bio || ""}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profileData.firstName || "contact"}_${profileData.lastName || "info"}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Contact saved to your device!");
  };

  const handleUnlock = async () => {
    if (!uid) return;
    setLoading(true); // Using local loading state or a specific one for unlocking would be better, but re-using loading is okay if we handle UI

    try {
      const verifyPin = httpsCallable(functions, 'verifyPin');
      const result = await verifyPin({ uid, pin });
      const data = result.data as any;

      if (data.privateContents) {
        // Merge private contents into profile data to display them
        setProfileData(prev => ({
          ...prev,
          privateContents: data.privateContents
        }));
        setIsUnlocked(true);
        setShowPinInput(false);
        toast.success("Private content unlocked!");
      }
    } catch (error: any) {
      console.error("Error verifying PIN:", error);
      setErrorAlert({ isOpen: true, message: error.message || "Incorrect PIN" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }

    if (!message.trim()) {
      setErrorAlert({ isOpen: true, message: "Please enter a message" });
      return;
    }

    if (!uid) return;

    try {
      await interactionService.logInteraction(uid, "message", {
        message: message,
        email: currentUser.email,
        name: currentUser.displayName || "Anonymous User",
        senderId: currentUser.uid // Traceability
      });
      toast.success("Message sent successfully!");
      setMessage("");
    } catch (err) {
      setErrorAlert({ isOpen: true, message: "Failed to send message" });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-foreground">Loading profile...</div>;
  if (error || !profileData) return <div className="min-h-screen flex items-center justify-center text-foreground">Profile not found</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
        <div className="absolute inset-0 bg-gradient-mesh" />
        <motion.div
          className="absolute inset-0"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          style={{
            background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.3), transparent 50%)",
          }}
        />
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto px-4 -mt-24 relative z-10">
        {/* Avatar & Basic Info */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-neon-md overflow-hidden relative"
          >
            {/* If photoURL exists, show it, else default User icon */}
            {profileData.photoURL ? (
              <img src={profileData.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <User className="w-16 h-16 text-primary" />
              </div>
            )}
          </motion.div>
          <h1 className="text-3xl font-bold font-display text-foreground mb-1">
            {profileData.displayName || `${profileData.firstName} ${profileData.lastName}`}
          </h1>
          <p className="text-lg text-primary mb-2">{profileData.title}</p>
          <div className="text-muted-foreground flex flex-col items-center gap-1">
            {profileData.company && <p>{profileData.company}</p>}
            {profileData.location && (
              <p className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profileData.location}
              </p>
            )}
          </div>
        </motion.div>

        {/* Save Contact Button */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <NeonButton className="w-full px-4" onClick={handleSaveContact}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5" />
                <span className="font-bold text-lg">Save Contact</span>
              </div>
              <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                <Download className="w-5 h-5" />
              </div>
            </div>
          </NeonButton>
        </motion.div>

        {/* Bio */}
        {profileData.bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6 mb-6">
              <p className="text-foreground text-center">{profileData.bio}</p>
            </GlassCard>
          </motion.div>
        )}

        {/* Social Links */}
        {profileData.links && profileData.links.length > 0 && (
          <motion.div
            className="space-y-3 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {profileData.links.map((link: any, index: number) => (
              <motion.a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card-hover flex items-center gap-4 p-4 rounded-2xl group"
                whileHover={{ x: 4 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <LinkIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="flex-1 font-medium text-foreground">{link.title || link.url}</span>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.a>
            ))}
          </motion.div>
        )}

        {/* Portfolio */}
        {profileData.portfolioItems && profileData.portfolioItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold font-display text-foreground mb-4">Portfolio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {profileData.portfolioItems.map((item: any, index: number) => (
                <GlassCard key={index} variant="hover" className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground mt-2">{item.description}</p>}
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-6 mb-8">
            <h2 className="text-xl font-bold font-display text-foreground mb-4">Get in Touch</h2>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <textarea
                rows={3}
                placeholder="Your Message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground resize-none"
              />
              <NeonButton type="submit" className="w-full">Send Message</NeonButton>
            </form>
          </GlassCard>
        </motion.div>

        {/* PIN Locked Section */}
        {profileData.pinEnabled && profileData.privateContents && profileData.privateContents.length > 0 && !isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-6 text-center">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold font-display text-foreground mb-2">Private Content</h2>
              <p className="text-muted-foreground mb-4">Enter PIN to unlock additional information</p>

              {showPinInput ? (
                <div className="space-y-4">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground text-center text-2xl tracking-widest"
                  />
                  <div className="flex gap-3">
                    <NeonButton variant="outline" className="flex-1" onClick={() => setShowPinInput(false)}>
                      Cancel
                    </NeonButton>
                    <NeonButton className="flex-1" onClick={handleUnlock}>
                      Unlock
                    </NeonButton>
                  </div>
                </div>
              ) : (
                <NeonButton variant="outline" onClick={() => setShowPinInput(true)}>
                  Unlock with PIN
                </NeonButton>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Unlocked Private Content */}
        {isUnlocked && profileData.privateContents && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-6" variant="neon">
              <h2 className="text-xl font-bold font-display text-foreground mb-4">Private Information</h2>
              <div className="space-y-3">
                {profileData.privateContents.map((content: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-foreground font-medium">{content.title}</p>
                    <p className="text-muted-foreground text-sm">{content.content}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* QR Code Preview */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
            <QrCode className="w-4 h-4" />
            Scan QR code for this profile
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Powered by{" "}
            <a href="/" className="text-primary hover:underline">
              NXC Badge Verse
            </a>
          </p>
        </div>

        <ConfirmDialog
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          onConfirm={() => navigate("/login")}
          title="Login Required"
          description="Please log in to send a secure message to this user."
          confirmText="Log In"
          cancelText="Cancel"
          type="info"
        />
      </div>
      <ErrorAlert
        isOpen={errorAlert.isOpen}
        onClose={() => setErrorAlert({ ...errorAlert, isOpen: false })}
        message={errorAlert.message}
      />
    </div>
  );
};

export default PublicProfile;
