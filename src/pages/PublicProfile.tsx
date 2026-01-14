import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  Download, UserPlus, Link as LinkIcon, Briefcase, User, Phone, Building, Mail, Crown, MoreVertical, Flag, AlertTriangle, MapPin, Lock, ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { userService } from "@/services/userService";
import { interactionService } from "@/services/interactionService";
import { collection, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const PublicProfile = () => {
  const { uid } = useParams();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: "" });

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  // Replaced simple boolean with action string for smarter redirects
  const [loginPromptAction, setLoginPromptAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Report System State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReasons, setReportReasons] = useState<string[]>([]);
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const REPORT_REASONS = [
    "Inappropriate Content",
    "Spam or Scam",
    "Harassment or Bullying",
    "Impersonation",
    "Other"
  ];

  const isOwnProfile = currentUser?.uid === uid;

  // Log View on Mount
  useEffect(() => {
    if (uid && !authLoading) {
      // Don't log views from the profile owner
      if (currentUser?.uid === uid) return;

      const visitorData = currentUser ? {
        visitorId: currentUser.uid,
        name: currentUser.displayName || "Anonymous User",
        email: currentUser.email,
        source: 'web'
      } : { source: 'web' };

      interactionService.logInteraction(uid, "view", visitorData);
    }
  }, [uid, currentUser, authLoading]);

  // Handle Redirect Actions (e.g. after login)
  useEffect(() => {
    if (!authLoading && currentUser && !loading) {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");

      if (action === "report") {
        // Clear param to prevent loop/re-open? 
        // handleReportOpen(); // Reuse logic
        setIsReportOpen(true);
      } else if (action === "message") {
        const contactElement = document.getElementById("contact-form");
        if (contactElement) {
          contactElement.scrollIntoView({ behavior: "smooth" });
          toast({ title: "Ready to Message", description: "You can now send your message." });
        }
      }
    }
  }, [authLoading, currentUser, loading]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!uid) return;
      try {
        const data = await userService.getUserProfile(uid);
        if (data) {
          // If user is banned, hide their profile completely (act as 404)
          if (data.isBanned) {
            setError("Page Not Found");
            return;
          }
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

  const handleSaveContact = async () => {
    if (!profileData || !uid) return;

    if (!currentUser) {
      setLoginPromptAction("save_contact");
      return;
    }

    try {
      setLoading(true); // Re-use loading state or add a local one if needed, but safe to use basic loading for short op

      // 1. Save to Current User's Contacts
      const contactData = {
        name: profileData.displayName || `${profileData.firstName} ${profileData.lastName}`,
        email: profileData.email || "",
        phone: profileData.phone || "",
        company: profileData.company || "",
        title: profileData.title || "",
        location: profileData.location || "",
        photoURL: profileData.photoURL || "",
        originalProfileId: uid,
        savedAt: serverTimestamp(),
        source: "web_profile"
      };

      await setDoc(doc(db, "users", currentUser.uid, "contacts", uid), contactData);

      // 2. Log Interaction for the Profile Owner
      await interactionService.logInteraction(uid, "contact_saved", {
        savedBy: currentUser.uid,
        name: currentUser.displayName || "Anonymous",
        email: currentUser.email
      });

      toast({
        title: "Saved",
        description: "Contact saved to your Dashboard check your contacts!",
      });

    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!uid) return;
    setLoading(true);

    try {
      // Attempt to verify PIN by fetching the specific document with PIN as ID
      // This works because Firestore rules allow getting a document if you know its ID
      const privateData = await userService.getPrivateDataByPin(uid, pin);

      if (privateData) {
        setProfileData(prev => ({
          ...prev,
          privateContents: privateData.privateContents
        }));
        setIsUnlocked(true);
        setShowPinInput(false);
        toast({
          title: "Unlocked",
          description: "Private content unlocked!",
        });
      } else {
        throw new Error("Incorrect PIN");
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
      setLoginPromptAction("message");
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
      toast({
        title: "Sent",
        description: "Message sent successfully!",
      });
      setMessage("");
    } catch (err) {
      setErrorAlert({ isOpen: true, message: "Failed to send message" });
    }
  };

  const handleReportOpen = async () => {
    if (!currentUser) {
      setLoginPromptAction("report");
      return;
    }

    // Check if simple user (not handling block check here yet, doing it on action or optimistic)
    // But per requirement: "when a user tries again to report the user should see that he already reported"

    if (!uid) return;

    try {
      setLoading(true);
      // Check existing report using deterministic ID
      const reportId = `${currentUser.uid}_${uid}`;
      const reportRef = doc(db, "reports", reportId);
      const reportSnap = await getDoc(reportRef);

      if (reportSnap.exists()) {
        toast({
          title: "Already Reported",
          description: "You have already submitted a report for this user.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setLoading(false);
      setIsReportOpen(true);
    } catch (error) {
      console.error("Error checking report status:", error);
      setLoading(false);
      // If permission denied (cannot read reports), we might assume they haven't reported or just let them try and fail on write?
      // But for better UX let's open dialog. Firestore rules should allow 'get' on own report.
      setIsReportOpen(true);
    }
  };

  const toogleReason = (reason: string) => {
    setReportReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmitReport = async () => {
    if (!uid || !currentUser) return;

    if (reportReasons.length === 0) {
      toast({
        title: "Reason Required",
        description: "Please select at least one reason for reporting.",
        variant: "destructive"
      });
      return;
    }

    if (reportDescription.length > 200) {
      toast({
        title: "Description too long",
        description: "Please keep description under 200 characters.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingReport(true);

    try {
      const reportId = `${currentUser.uid}_${uid}`;
      const reportData = {
        reporterId: currentUser.uid,
        reportedUserId: uid,
        reporterName: currentUser.displayName || "Anonymous", // Helpful for admin
        reportedUserName: profileData.displayName || "Unknown",
        reasons: reportReasons,
        description: reportDescription,
        status: "pending",
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "reports", reportId), reportData);

      toast({
        title: "Report Submitted",
        description: "Thank you. We will review your report shortly.",
      });

      setIsReportOpen(false);
      setReportReasons([]);
      setReportDescription("");

    } catch (error) {
      console.error("Report submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-foreground">Loading profile...</div>;
  if (error || !profileData) return <div className="min-h-screen flex items-center justify-center text-foreground">Profile not found</div>;

  // Logic: If profile is NOT public, show limited view
  const isPublic = profileData.isPublic !== false; // Default to true if undefined, or check explicit false
  const wallpaperUrl = profileData.coverImage;
  const isBlur = profileData.isWallpaperBlurred;

  // Visuals from Plan
  const hasGoldRing = profileData?.visuals?.goldRing;
  const hasRoyalTexture = profileData?.visuals?.royalTexture;
  const hasCustomBranding = profileData?.visuals?.customBranding;

  if (!isPublic) {
    return (
      <div className={`min-h-screen bg-background pb-20 ${hasRoyalTexture ? 'bg-texture-gold' : ''}`}>
        {hasRoyalTexture && <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/gold-scale.png')] opacity-[0.05] pointer-events-none z-0" />}

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
          <div className={`w-32 h-32 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden relative border-4 ${hasGoldRing ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'border-background'}`}>
            <User className="w-16 h-16 text-muted-foreground" />
            {hasGoldRing && <div className="absolute inset-0 border-2 border-yellow-500 rounded-3xl animate-pulse-gold pointer-events-none" />}
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
    <div className={`min-h-screen bg-background pb-20 relative ${hasRoyalTexture ? 'bg-texture-gold' : ''}`}>
      {hasRoyalTexture && <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/gold-scale.png')] opacity-[0.05] pointer-events-none z-0" />}

      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors">
              <MoreVertical className="w-6 h-6" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleReportOpen} className="text-destructive focus:text-destructive cursor-pointer">
              <Flag className="w-4 h-4 mr-2" />
              Report User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
          <div className="text-muted-foreground flex flex-col items-center gap-2 mt-2">
            <div className="flex flex-wrap justify-center items-center gap-2">
              {profileData.company && (
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  <span>{profileData.company}</span>
                </div>
              )}

              {profileData.company && profileData.location && (
                <span className="text-muted-foreground/40 text-sm">|</span>
              )}

              {profileData.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{profileData.location}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center items-center gap-2">
              {profileData.email && (
                <a href={`mailto:${profileData.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>{profileData.email}</span>
                </a>
              )}

              {profileData.email && profileData.phone && (
                <span className="text-muted-foreground/40 text-sm">|</span>
              )}

              {profileData.phone && (
                <a href={`tel:${profileData.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>{profileData.phone}</span>
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Save Contact Button - Hidden for Owner */}
        {!isOwnProfile && (
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
        )}

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

        {/* Contact Form - Hidden for Owner */}
        {!isOwnProfile && (
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
        )}

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
        {!hasCustomBranding && (
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <a href="/" className="text-foreground hover:no-underline">
                <span className="hover:underline">NXC Badge </span>
                <span className="text-primary font-bold hover:underline">Verse</span>
              </a>
            </p>
          </div>
        )}

        <ConfirmDialog
          isOpen={!!loginPromptAction}
          onClose={() => setLoginPromptAction(null)}
          onConfirm={() => {
            const actionParam = loginPromptAction === "report" ? "report" : loginPromptAction === "message" ? "message" : "";
            const redirectUrl = actionParam
              ? `/login?redirect=${encodeURIComponent(`${window.location.pathname}?action=${actionParam}`)}`
              : "/login";
            navigate(redirectUrl);
          }}
          title="Login Required"
          description={
            loginPromptAction === "report" ? "Please log in to submit a report." :
              loginPromptAction === "message" ? "Please log in to send a secure message." :
                "Please log in to continue."
          }
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

      {/* Report Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Report User
            </DialogTitle>
            <DialogDescription>
              Help us keep the community safe. Reports are anonymous to the user.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-3">
              <Label className="text-foreground">Why are you reporting this user?</Label>
              <div className="grid gap-2">
                {REPORT_REASONS.map((reason) => (
                  <div key={reason} className="flex items-center space-x-2">
                    <Checkbox
                      id={`reason-${reason}`}
                      checked={reportReasons.includes(reason)}
                      onCheckedChange={() => toogleReason(reason)}
                    />
                    <Label
                      htmlFor={`reason-${reason}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {reason}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-desc" className="text-foreground">Additional Details (Optional)</Label>
              <Textarea
                id="report-desc"
                placeholder="Provide more context (max 200 chars)..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value.slice(0, 200))}
                className="resize-none h-24"
              />
              <div className="text-xs text-muted-foreground text-right">
                {reportDescription.length}/200
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <NeonButton variant="outline" onClick={() => setIsReportOpen(false)}>
              Cancel
            </NeonButton>
            <NeonButton
              onClick={handleSubmitReport}
              disabled={isSubmittingReport || reportReasons.length === 0}
              className="bg-destructive hover:bg-destructive/90 border-destructive/50 shadow-none text-white"
            >
              {isSubmittingReport ? "Submitting..." : "Submit Report"}
            </NeonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicProfile;
