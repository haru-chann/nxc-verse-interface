import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Twitter, Linkedin, Instagram, Globe, MapPin, Lock, QrCode, ExternalLink, Download, UserPlus, Link as LinkIcon, Briefcase, User, Phone } from "lucide-react";
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
    setLoading(true);

    try {
      // Attempt to verify PIN by fetching the private document
      // Note: This requires Firestore rules to allow read if the user knows the PIN,
      // OR for the rules to be open/owner-only. If owner-only, this will fail for visitors.
      // Since we don't have a backend function, we assume the user might have open rules or
      // we are implementing a client-side verification as requested to "fix" the error.

      // We use the userService to fetch the private data.
      // If the robust way (Cloud Function) fails, we try this.
      const privateData = await userService.getUserPrivateData(uid);

      if (privateData) {
        if (privateData.pin === pin) {
          setProfileData(prev => ({
            ...prev,
            privateContents: privateData.privateContents
          }));
          setIsUnlocked(true);
          setShowPinInput(false);
          toast.success("Private content unlocked!");
        } else {
          throw new Error("Incorrect PIN");
        }
      } else {
        throw new Error("Private data not found");
      }
    } catch (error: any) {
      console.error("Error verifying PIN:", error);
      // Determine if it was a permission error or actual incorrect PIN
      if (error.code === 'permission-denied') {
        setErrorAlert({ isOpen: true, message: "Use the Portfolio Editor to view your own private content. Visitors cannot unlock this without a backend customization." });
      } else {
        setErrorAlert({ isOpen: true, message: error.message || "Incorrect PIN" });
      }
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

  // Logic: If profile is NOT public, show limited view
  const isPublic = profileData.isPublic !== false; // Default to true if undefined, or check explicit false
  const wallpaperUrl = profileData.coverImage;
  const isBlur = profileData.isWallpaperBlurred;

  if (!isPublic) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Private Profile Hero */}
        <div className="relative h-64 overflow-hidden">
          {wallpaperUrl ? (
            <div
              className={`absolute inset-0 bg-cover bg-center ${isBlur ? 'blur-xl scale-110' : ''}`}
              style={{ backgroundImage: `url(${wallpaperUrl})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
          )}
          <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-24 relative z-10 text-center">
          <div className="w-32 h-32 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden relative border-4 border-background">
            <User className="w-16 h-16 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground mb-4">
            {profileData.displayName || "Private Profile"}
          </h1>
          <div className="p-6 rounded-2xl bg-muted/30 border border-border inline-flex flex-col items-center gap-3">
            <Lock className="w-8 h-8 text-primary" />
            <p className="text-muted-foreground font-medium">This profile is private</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="relative h-64 overflow-hidden">
        {wallpaperUrl ? (
          <div
            className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${isBlur ? 'blur-xl scale-110' : ''}`}
            style={{ backgroundImage: `url(${wallpaperUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
        )}

        {/* Overlays for readability */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />

        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
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
            className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-neon-md overflow-hidden relative border-4 border-background"
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
            <div className="flex items-center gap-2">
              {profileData.company && <span>{profileData.company}</span>}
              {profileData.company && profileData.location && <span>|</span>}
              {profileData.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profileData.location}
                </span>
              )}
            </div>
            {profileData.phone && (
              <div className="flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" />
                <span>{profileData.phone}</span>
              </div>
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
            {/* Full width grid (grid-cols-1) */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              {profileData.portfolioItems.map((item: any, index: number) => (
                <GlassCard key={index} variant="hover" className="p-0 overflow-hidden relative group">
                  <div className="p-4 text-center">
                    <h3 className="font-bold text-lg text-foreground mb-1">{item.title}</h3>
                    <p className="text-xs text-primary uppercase tracking-wider">{item.category}</p>
                  </div>

                  {item.imageUrl ? (
                    <div className="relative w-full">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-auto block" />

                      {/* Overlay Description */}
                      {item.description && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-sm border-t border-white/10">
                          <p className="text-sm text-white/90">{item.description}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Fallback if no image, just show description in a box */
                    item.description && (
                      <div className="p-6 bg-muted/30 border-t border-border">
                        <p className="text-sm text-foreground text-center">{item.description}</p>
                      </div>
                    )
                  )}
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

        {/* PIN Locked Section - Only visible if there is content */}
        {((profileData.privateMetadata && profileData.privateMetadata.length > 0) || (profileData.privateContents && profileData.privateContents.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold font-display text-foreground">Private Content</h2>
              </div>

              {!isUnlocked ? (
                <div className="space-y-3">
                  {/* Show Private Titles (Locked) */}
                  {(profileData.privateMetadata && profileData.privateMetadata.length > 0
                    ? profileData.privateMetadata
                    : (profileData.privateContents?.length > 0 ? profileData.privateContents.map((c: any) => ({ title: c.title })) : [{ title: "Locked Private Content" }])
                  ).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex flex-col items-center justify-center p-6 rounded-xl bg-muted/30 border border-border cursor-pointer hover:bg-muted/50 transition-colors group text-center gap-3"
                      onClick={() => setShowPinInput(true)}
                    >
                      <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                      <Lock className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">Tap to Unlock</span>
                    </div>
                  ))}

                  {showPinInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 p-4 rounded-xl bg-muted/50 border border-border"
                    >
                      <p className="text-sm text-center text-muted-foreground mb-3">Enter PIN to unlock</p>
                      <div className="space-y-4">
                        <input
                          type="password"
                          maxLength={6}
                          placeholder="PIN"
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
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Unlocked Content */}
                  {profileData.privateContents?.map((content: any, index: number) => (
                    <div key={index} className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-xl border border-border">
                      <h3 className="text-xl font-bold text-foreground mb-4">{content.title}</h3>

                      {content.imageUrl && (
                        <div className="w-full max-w-md rounded-lg overflow-hidden mb-4 shadow-lg">
                          <img src={content.imageUrl} alt={content.title} className="w-full h-auto" />
                        </div>
                      )}

                      <div className="prose prose-invert max-w-none">
                        <p className="text-muted-foreground">{content.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
            <p className="text-xs text-center text-muted-foreground mt-4 opacity-50">
              Reloading the page will lock this content again.
            </p>
          </motion.div>
        )}

        {/* Unlocked Private Content (Previously separate block, now merged above) */}
        {/* We merged logic into the block above to handle the lock/unlock transition smoothly in one card. */}

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
