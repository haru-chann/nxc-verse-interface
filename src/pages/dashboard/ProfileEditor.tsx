import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { userService, UserProfile } from "@/services/userService";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { FloatingSaveBar } from "@/components/ui/FloatingSaveBar";

import { User, Link as LinkIcon, Image, Plus, GripVertical, Trash2, Save, Building, MapPin, Phone, Globe, Lock, Briefcase, Eye, EyeOff, Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { storageService } from "@/services/storageService";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
}

interface PrivateContent {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
}

const ProfileEditor = () => {
  const { currentUser } = useAuth();
  const [profileData, setProfileData] = useState<Partial<UserProfile> & {
    title?: string,
    company?: string,
    phone?: string,
    isWallpaperBlurred?: boolean,
  }>({
    displayName: "",
    firstName: "",
    lastName: "",
    email: "",
    title: "",
    bio: "",
    company: "",
    location: "",
    phone: "",
    photoURL: "",
    coverImage: "",
    isWallpaperBlurred: false,
  });

  // State initialization for other fields...
  // In a real app we would load these from DB too
  const [isPublic, setIsPublic] = useState(true);
  const [links, setLinks] = useState<{ id: number; title: string; url: string; icon: string }[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [privateContents, setPrivateContents] = useState<PrivateContent[]>([]);
  const [pinEnabled, setPinEnabled] = useState(true);
  const [pin, setPin] = useState("1234");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: "" });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [username, setUsername] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameLastChanged, setUsernameLastChanged] = useState<any>(null);

  const [initialData, setInitialData] = useState<any>(null); // Store deep copy of initial state for undo detection

  // Helper to get current state snapshot for comparison
  const getCurrentState = () => ({
    ...profileData,
    links,
    portfolioItems,
    privateContents,
    isPublic,
    pinEnabled,
    pin,
    username // Track username in combined state for save button
  });

  // Effect to check for changes
  useEffect(() => {
    if (!initialData) return;
    const currentState = getCurrentState();
    const hasChanges = JSON.stringify(currentState) !== JSON.stringify(initialData);
    setHasUnsavedChanges(hasChanges);
  }, [profileData, links, portfolioItems, privateContents, isPublic, pinEnabled, pin, username, initialData]);

  // Username Availability Checker (Debounced)
  useEffect(() => {
    const checkAvailability = async () => {
      // IF empty (removing username) OR unchanged -> All good
      if (!username || username === initialUsername) {
        setUsernameAvailable(null);
        setUsernameError("");
        return;
      }

      // Format Validation
      const validFormat = /^[a-zA-Z0-9_]+$/.test(username);
      if (!validFormat) {
        setUsernameError("Alphanumeric & underscores only");
        setUsernameAvailable(false);
        return;
      }

      // Length Validation (Client-side, simplistic - server decides admin exception, but we can hint)
      // We'll let server handle the admin exception completely for simplicity, or we can check role if avail.
      if (username.length < 5 && profileData.role !== 'admin') {
        setUsernameError("Min 5 characters");
        setUsernameAvailable(false);
        return;
      }

      setIsCheckingUsername(true);
      setUsernameError("");

      try {
        const available = await userService.checkUsernameAvailable(username);
        setUsernameAvailable(available);
        if (!available) setUsernameError("Username taken");
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [username, initialUsername, profileData.role]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      try {
        const data = await userService.getUserProfile(currentUser.uid);
        const privateData = await userService.getUserPrivateData(currentUser.uid);

        if (data) {
          console.log("Loaded profile data:", data); // Debug log

          // Define profile state once to ensure key order consistency between state and initialData
          const profileState = {
            displayName: data.displayName || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: currentUser.email || "",
            title: (data as any).title || "",
            bio: data.bio || "",
            company: (data as any).company || "",
            location: data.location || "",
            phone: (data as any).phone || "",
            photoURL: (data as any).photoURL || "",
            coverImage: (data as any).coverImage || "",
            isWallpaperBlurred: (data as any).isWallpaperBlurred || false,
          };

          setProfileData(profileState);

          // Load extended data if available
          if ((data as any).links) setLinks((data as any).links);
          if ((data as any).portfolioItems) setPortfolioItems((data as any).portfolioItems);
          if ((data as any).isPublic !== undefined) setIsPublic((data as any).isPublic);

          // Username
          if (data.username) {
            setUsername(data.username);
            setInitialUsername(data.username);
          }
          if (data.usernameLastChanged) {
            setUsernameLastChanged(data.usernameLastChanged);
          }

          // Load private data
          if (privateData) {
            setPrivateContents((privateData as any).privateContents || []);
            setPinEnabled((privateData as any).pinEnabled !== undefined ? (privateData as any).pinEnabled : true);
            setPin((privateData as any).pin || "1234");
          } else {
            if ((data as any).privateContents) setPrivateContents((data as any).privateContents);
            if ((data as any).pinEnabled !== undefined) setPinEnabled((data as any).pinEnabled);
            if ((data as any).pin) setPin((data as any).pin);
          }

          setInitialData({
            ...profileState,
            links: (data as any).links || [],
            portfolioItems: (data as any).portfolioItems || [],
            privateContents: privateData ? ((privateData as any).privateContents || []) : ((data as any).privateContents || []),
            isPublic: (data as any).isPublic !== undefined ? (data as any).isPublic : true,
            pinEnabled: privateData ? ((privateData as any).pinEnabled !== undefined ? (privateData as any).pinEnabled : true) : ((data as any).pinEnabled !== undefined ? (data as any).pinEnabled : true),
            pin: privateData ? ((privateData as any).pin || "1234") : ((data as any).pin || "1234"),
            username: data.username || ""
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  // Modals state
  const [newPortfolioItem, setNewPortfolioItem] = useState<{ title: string, description: string, category: string, imageUrl?: string }>({ title: "", description: "", category: "" });
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState<number | null>(null);

  const [newPrivateContent, setNewPrivateContent] = useState<{ title: string, content: string, imageUrl?: string }>({ title: "", content: "" });
  const [showAddPrivate, setShowAddPrivate] = useState(false);
  const [editingPrivateId, setEditingPrivateId] = useState<number | null>(null);

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const toastId = toast.loading("Uploading wallpaper...");
    try {
      const path = `users/${currentUser.uid}/wallpaper_${Date.now()}`;

      // Delete old wallpaper if exists
      if (profileData.coverImage) {
        await storageService.deleteImage(profileData.coverImage);
      }

      const url = await storageService.uploadImage(file, path);
      setProfileData((prev: any) => ({ ...prev, coverImage: url }));

      toast.success("Wallpaper uploaded!");
    } catch (err: any) {
      console.error(err);
      setErrorAlert({ isOpen: true, message: "Failed to upload wallpaper: " + (err.message || "Unknown error") });
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleRemoveWallpaper = async () => {
    if (!currentUser || !profileData.coverImage) return;

    try {
      const toastId = toast.loading("Removing wallpaper...");
      await storageService.deleteImage(profileData.coverImage);

      await userService.updateUserProfile(currentUser.uid, {
        coverImage: ""
      });

      setProfileData(prev => ({ ...prev, coverImage: "" }));
      toast.dismiss(toastId);
      toast.success("Wallpaper removed");
    } catch (error: any) {
      console.error(error);
      setErrorAlert({ isOpen: true, message: "Failed to remove wallpaper" });
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const updateData = {
        displayName: `${profileData.firstName} ${profileData.lastName}`.trim(),
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        bio: profileData.bio,
        location: profileData.location,
        title: profileData.title,
        company: profileData.company,
        phone: profileData.phone,
        email: profileData.email,
        // Detailed fields
        links: links,
        portfolioItems: portfolioItems,
        coverImage: profileData.coverImage,
        photoURL: profileData.photoURL,
        isPublic: isPublic,
        isWallpaperBlurred: profileData.isWallpaperBlurred,
        // Save metadata (titles) to public profile so visitors know what's locked
        privateMetadata: privateContents.map(item => ({ id: item.id, title: item.title })),
        // Save pinEnabled flag so public profile knows to show the locked section
        pinEnabled: pinEnabled,
      };

      const privateUpdateData = {
        privateContents: privateContents,
        pinEnabled: pinEnabled,
        pin: pin,
      };

      // 1. Handle Username Claim if changed
      if (username !== initialUsername) {
        // Only block if there's an actual error, OR if it's NOT empty and NOT available
        if (usernameError || (username && usernameAvailable === false)) {
          throw new Error("Invalid username. Please fix errors before saving.");
        }
        // The role param is important for the length exception
        await userService.claimUsername(currentUser.uid, username, profileData.role || "user");
        // Update initial so we don't re-claim
        setInitialUsername(username);
      }

      await userService.updateUserProfile(currentUser.uid, updateData);
      // await userService.updateUserProfile(currentUser.uid, updateData); // Duplicate call removed
      await userService.updateUserPrivateData(currentUser.uid, privateUpdateData);

      // Update initial data to current state so button disappears
      setInitialData(getCurrentState());

      toast.success("Profile saved successfully!");
    } catch (error: any) {
      console.error(error);
      setErrorAlert({ isOpen: true, message: getFriendlyErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Simple validation
    if (file.size > 5 * 1024 * 1024) {
      setErrorAlert({ isOpen: true, message: "File size must be less than 5MB" });
      return;
    }

    try {
      const toastId = toast.loading("Uploading image...");

      // Delete old image if exists
      if (profileData.photoURL) {
        await storageService.deleteImage(profileData.photoURL);
      }

      const path = `users/${currentUser.uid}/profile_avatar_${Date.now()}`;
      const url = await storageService.uploadImage(file, path);

      // Update local state immediately for preview
      setProfileData(prev => ({ ...prev, photoURL: url }));


      await userService.updateUserProfile(currentUser.uid, {
        photoURL: url
      });

      toast.dismiss(toastId);
      toast.success("Profile picture updated!");
    } catch (error: any) {
      console.error(error);
      setErrorAlert({ isOpen: true, message: "Failed to upload image: " + (error.message || "Unknown error") });
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser || !profileData.photoURL) return;

    try {
      const toastId = toast.loading("Removing photo...");

      // Delete from storage
      await storageService.deleteImage(profileData.photoURL);

      // Update DB
      await userService.updateUserProfile(currentUser.uid, {
        photoURL: ""
      });

      // Update State
      setProfileData(prev => ({ ...prev, photoURL: "" }));


      toast.dismiss(toastId);
      toast.success("Profile photo removed");
    } catch (error: any) {
      console.error(error);
      setErrorAlert({ isOpen: true, message: "Failed to remove photo" });
    }
  };

  // Portfolio Handlers
  const handleEditPortfolio = (item: PortfolioItem) => {
    setNewPortfolioItem({
      title: item.title,
      description: item.description,
      category: item.category,
      imageUrl: item.imageUrl
    });
    setEditingPortfolioId(item.id);
    setShowAddPortfolio(true);
  };

  const addPortfolioItem = () => {
    if (!newPortfolioItem.title || !newPortfolioItem.category) {
      setErrorAlert({ isOpen: true, message: "Please fill in title and category" });
      return;
    }

    if (editingPortfolioId) {
      // Update existing
      setPortfolioItems(portfolioItems.map(item =>
        item.id === editingPortfolioId ? { ...item, ...newPortfolioItem } : item
      ));
      toast.success("Portfolio item updated!");
      setEditingPortfolioId(null);
    } else {
      // Add new
      setPortfolioItems([...portfolioItems, { ...newPortfolioItem, id: Date.now() }]);
      toast.success("Portfolio item added!");
    }

    setNewPortfolioItem({ title: "", description: "", category: "" });
    setShowAddPortfolio(false);
  };

  const cancelEditPortfolio = () => {
    setNewPortfolioItem({ title: "", description: "", category: "" });
    setEditingPortfolioId(null);
    setShowAddPortfolio(false);
  }

  const removePortfolioItem = async (id: number) => {
    const item = portfolioItems.find(i => i.id === id);
    if (item && item.imageUrl) {
      try {
        await storageService.deleteImage(item.imageUrl);
      } catch (e) {
        console.error("Failed to delete portfolio image:", e);
      }
    }
    setPortfolioItems(portfolioItems.filter(item => item.id !== id));
    toast.success("Portfolio item removed");
  };

  // Private Content Handlers
  const handleEditPrivate = (item: PrivateContent) => {
    setNewPrivateContent({
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl
    });
    setEditingPrivateId(item.id);
    setShowAddPrivate(true);
  };

  const addPrivateContent = () => {
    if (!newPrivateContent.title || !newPrivateContent.content) {
      setErrorAlert({ isOpen: true, message: "Please fill in all fields" });
      return;
    }

    if (editingPrivateId) {
      // Update existing
      setPrivateContents(privateContents.map(item =>
        item.id === editingPrivateId ? { ...item, ...newPrivateContent } : item
      ));
      toast.success("Private content updated!");
      setEditingPrivateId(null);
    } else {
      // Add new
      setPrivateContents([...privateContents, { ...newPrivateContent, id: Date.now() }]);
      toast.success("Private content added!");
    }

    setNewPrivateContent({ title: "", content: "" });
    setShowAddPrivate(false);
  };

  const cancelEditPrivate = () => {
    setNewPrivateContent({ title: "", content: "" });
    setEditingPrivateId(null);
    setShowAddPrivate(false);
  }

  const removePrivateContent = async (id: number) => {
    const item = privateContents.find(i => i.id === id);
    if (item && item.imageUrl) {
      try {
        await storageService.deleteImage(item.imageUrl);
      } catch (e) {
        console.error("Failed to delete private image:", e);
      }
    }
    setPrivateContents(privateContents.filter(item => item.id !== id));
    toast.success("Private content removed");
  };

  const handlePinChange = (newPin: string) => {
    if (newPin.length <= 6 && /^\d*$/.test(newPin)) {
      setPin(newPin);
    }
  };

  // Subscription Limits Hook
  const { maxLinks, maxPortfolioItems, maxPrivateContentItems, features: planFeatures, loading: limitsLoading } = useSubscriptionLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  const handleAddLink = () => {
    if (links.length >= maxLinks) {
      setUpgradeReason(`You've reached the limit of ${maxLinks} links for your active plans.`);
      setShowUpgradeModal(true);
      return;
    }
    setLinks([...links, { id: Date.now(), title: "", url: "", icon: "link" }]);
  };

  return (
    <div className="w-full min-h-screen bg-background pb-8">
      <div className="w-full h-full space-y-8">

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Limit Reached"
          description={upgradeReason}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between sticky top-16 lg:top-0 z-40 bg-background/80 backdrop-blur-md py-4 border-b border-border/50 gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display text-foreground">Profile Editor</h1>
            <p className="text-sm lg:text-base text-muted-foreground mt-1">Customize your digital identity</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Basic Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden relative group">
                  {profileData.photoURL ? (
                    <img src={profileData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-primary-foreground">
                      {profileData.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
                    </span>
                  )}

                  {profileData.photoURL && (
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 className="w-6 h-6 text-destructive" />
                    </button>
                  )}
                </div>
                <div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <NeonButton variant="outline" size="sm" className="pointer-events-none">Change Photo</NeonButton>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG up to 5MB</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                    placeholder="Display Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Username
                    {usernameLastChanged && profileData.role !== 'admin' && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        (Locked: {(() => {
                          const diff = Math.ceil((30 * 24 * 60 * 60 * 1000 - (Date.now() - usernameLastChanged.toDate().getTime())) / (1000 * 60 * 60 * 24));
                          return diff > 0 && diff <= 30 ? `${diff} days left` : "Can change";
                        })()})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 flex items-center justify-center">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full pl-10 pr-10 py-3 rounded-xl bg-muted border ${usernameError ? "border-destructive" :
                        (usernameAvailable && username !== initialUsername && username.length > 0) ? "border-green-500" :
                          "border-border"
                        } focus:outline-none text-foreground`}
                      placeholder="username (optional)"
                      maxLength={20}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {isCheckingUsername && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                    </div>
                  </div>
                  {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
                  {!usernameError && username && usernameAvailable && username !== initialUsername && (
                    <p className="text-xs text-green-500 mt-1">Available!</p>
                  )}
                  {!usernameError && (
                    <p className="text-xs text-muted-foreground mt-1">
                      View Link: <span className="text-primary">
                        {username ? `${window.location.host}/@${username}` : `${window.location.host}/u/${currentUser?.uid}`}
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                  <input
                    type="text"
                    value={profileData.title || ""}
                    onChange={(e) => {
                      setProfileData({ ...profileData, title: e.target.value });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                    placeholder="Job Title"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => {
                      setProfileData({ ...profileData, firstName: e.target.value });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => {
                      setProfileData({ ...profileData, lastName: e.target.value });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                <textarea
                  rows={3}
                  value={profileData.bio}
                  onChange={(e) => {
                    setProfileData({ ...profileData, bio: e.target.value });
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground resize-none"
                />
              </div>
            </div>
          </GlassCard>

          {/* Contact & Company Info */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Contact & Company
            </h2>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    Company Name
                  </label>
                  <input
                    name="company"
                    autoComplete="organization"
                    type="text"
                    value={profileData.company}
                    onChange={(e) => {
                      setProfileData({ ...profileData, company: e.target.value });
                    }}
                    placeholder="Your company name"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Location
                  </label>
                  <input
                    name="location"
                    autoComplete="address-level2"
                    type="text"
                    value={profileData.location}
                    onChange={(e) => {
                      setProfileData({ ...profileData, location: e.target.value });
                    }}
                    placeholder="City, Country"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Phone Number
                </label>
                <input
                  name="phone"
                  autoComplete="tel"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => {
                    setProfileData({ ...profileData, phone: e.target.value });
                  }}
                  placeholder="+1 555-123-4567"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Phone number will only be included in CSV exports if your profile is public.
                </p>
              </div>

              {/* Public Profile Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Public Profile</p>
                    <p className="text-sm text-muted-foreground">Allow anyone to view your profile and include phone in exports</p>
                  </div>
                </div>
                <Switch checked={isPublic} onCheckedChange={(checked) => {
                  setIsPublic(checked);

                }} />
              </div>
            </div>
          </GlassCard>

          {/* Links */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                Links
              </h2>
              <NeonButton variant="outline" size="sm" onClick={handleAddLink}>
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </NeonButton>
            </div>
            <div className="space-y-3">
              {links.map((link) => (
                <motion.div
                  key={link.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 group"
                  layout
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => {
                      setLinks(links.map(l => l.id === link.id ? { ...l, title: e.target.value } : l));

                    }}
                    placeholder="Title"
                    className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => {
                      setLinks(links.map(l => l.id === link.id ? { ...l, url: e.target.value } : l));

                    }}
                    placeholder="URL"
                    className="flex-[2] px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
                  />
                  <button
                    onClick={() => {
                      setLinks(links.filter(l => l.id !== link.id));

                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Wallpaper Settings */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Wallpaper
              </h2>
            </div>
            <div className="space-y-4">
              <div className="relative h-32 rounded-xl bg-muted overflow-hidden group">
                {profileData.coverImage ? (
                  <div
                    className={`absolute inset-0 bg-cover bg-center ${profileData.isWallpaperBlurred ? 'blur-sm' : ''}`}
                    style={{ backgroundImage: `url(${profileData.coverImage})` }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
                )}

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {!planFeatures.wallpaper ? (
                    <NeonButton size="sm" onClick={() => {
                      setUpgradeReason("Custom Wallpapers are a premium feature.");
                      setShowUpgradeModal(true);
                    }}>
                      <Lock className="w-4 h-4 mr-2" /> Unlock Wallpaper
                    </NeonButton>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleWallpaperUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <NeonButton variant="outline" size="sm" className="pointer-events-none">Change Wallpaper</NeonButton>
                    </>
                  )}

                  {profileData.coverImage && planFeatures.wallpaper && (
                    <button
                      onClick={handleRemoveWallpaper}
                      className="ml-2 p-2 rounded-xl bg-background/80 hover:bg-destructive/90 text-foreground hover:text-white transition-colors z-20"
                      title="Remove Wallpaper"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                <span className="text-sm font-medium text-foreground">Blur Wallpaper</span>
                <Switch
                  checked={profileData.isWallpaperBlurred || false}
                  onCheckedChange={(checked) => {
                    setProfileData(prev => ({ ...prev, isWallpaperBlurred: checked }));

                  }}
                />
              </div>
            </div>
          </GlassCard>

          {/* Portfolio Section */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Portfolio
              </h2>
              <NeonButton
                variant={editingPortfolioId ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  if (!planFeatures.portfolio) {
                    setUpgradeReason("The Portfolio feature is not included in your current plan.");
                    setShowUpgradeModal(true);
                    return;
                  }

                  if (portfolioItems.length >= maxPortfolioItems && !editingPortfolioId) {
                    setUpgradeReason(`You've reached the limit of ${maxPortfolioItems} portfolio items.`);
                    setShowUpgradeModal(true);
                    return;
                  }

                  if (editingPortfolioId && showAddPortfolio) {
                    setShowAddPortfolio(!showAddPortfolio);
                    if (showAddPortfolio) cancelEditPortfolio();
                  } else {
                    setShowAddPortfolio(true);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {editingPortfolioId && showAddPortfolio ? "Editing Item" : "Add Item"}
              </NeonButton>
            </div>

            {/* Lock Warning for Portfolio */}
            {!planFeatures.portfolio && portfolioItems.length === 0 && (
              <div className="p-8 text-center border border-white/10 rounded-xl bg-muted/20 flex flex-col items-center gap-2">
                <Lock className="w-8 h-8 text-muted-foreground" />
                <h3 className="font-bold">Portfolio Locked</h3>
                <p className="text-sm text-muted-foreground mb-4">Upgrade your plan to showcase your work.</p>
                <NeonButton size="sm" onClick={() => {
                  setUpgradeReason("Upgrade to unlock the Portfolio feature.");
                  setShowUpgradeModal(true);
                }}>Unlock Feature</NeonButton>
              </div>
            )}

            {/* Add Portfolio Form */}
            {showAddPortfolio && planFeatures.portfolio && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 rounded-xl bg-muted/50 border border-border space-y-3"
              >
                <input
                  type="text"
                  placeholder="Project Title"
                  value={newPortfolioItem.title}
                  onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newPortfolioItem.description}
                  onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                />

                {/* Upload Image for Portfolio */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !currentUser) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("File size must be less than 5MB");
                        return;
                      }
                      const toastId = toast.loading("Uploading portfolio image...");
                      try {
                        // Delete previous image if it exists (cleanup)
                        if (newPortfolioItem.imageUrl) {
                          await storageService.deleteImage(newPortfolioItem.imageUrl);
                        }

                        const path = `users/${currentUser.uid}/portfolio_${Date.now()}`;
                        const url = await storageService.uploadImage(file, path);
                        setNewPortfolioItem(prev => ({ ...prev, imageUrl: url }));
                        toast.success("Image uploaded!");
                      } catch (err: any) {
                        console.error(err);
                        setErrorAlert({ isOpen: true, message: "Failed to upload image: " + (err.message || "") });
                      } finally {
                        toast.dismiss(toastId);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full px-4 py-3 rounded-xl bg-muted border border-border flex items-center justify-center gap-2 transition-colors ${newPortfolioItem.imageUrl ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/50'}`}>
                    {newPortfolioItem.imageUrl ? (
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-primary" />
                        <span className="text-primary font-medium">Image Uploaded</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (newPortfolioItem.imageUrl) {
                              await storageService.deleteImage(newPortfolioItem.imageUrl);
                              setNewPortfolioItem(prev => ({ ...prev, imageUrl: "" }));
                              toast.success("Image removed");
                            }
                          }}
                          className="p-1 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-colors relative z-20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Image className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Upload Image (Optional)</span>
                      </>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Category (e.g., Design, Development)"
                  value={newPortfolioItem.category}
                  onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                />
                <div className="flex gap-2">
                  <NeonButton size="sm" onClick={addPortfolioItem}>
                    {editingPortfolioId ? "Update Item" : "Add Item"}
                  </NeonButton>
                  <NeonButton variant="outline" size="sm" onClick={cancelEditPortfolio}>Cancel</NeonButton>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              {portfolioItems.map((item) => (
                <motion.div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 group"
                  layout
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <Briefcase className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                    <span className="inline-block text-xs px-2 py-1 rounded-full bg-primary/10 text-primary mt-1">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPortfolio(item)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <span className="sr-only">Edit</span>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removePortfolioItem(item.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Private Content Section */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Private Content
                </h2>
              </div>
              <NeonButton
                variant={editingPrivateId ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  if (!planFeatures.privateContent) {
                    setUpgradeReason("Private Content is not included in your current plan.");
                    setShowUpgradeModal(true);
                    return;
                  }

                  if (privateContents.length >= maxPrivateContentItems && !editingPrivateId) {
                    setUpgradeReason(`You've reached the limit of ${maxPrivateContentItems} private content items.`);
                    setShowUpgradeModal(true);
                    return;
                  }

                  if (!pinEnabled || !pin) {
                    toast.error("Please enable PIN lock and set a PIN first");
                    return;
                  }

                  if (editingPrivateId && showAddPrivate) {
                    setShowAddPrivate(!showAddPrivate);
                    if (showAddPrivate) cancelEditPrivate();
                  } else {
                    setShowAddPrivate(true);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {editingPrivateId && showAddPrivate ? "Editing Content" : "Add Content"}
              </NeonButton>
            </div>

            {/* Lock Warning for Private Content */}
            {!planFeatures.privateContent && privateContents.length === 0 && (
              <div className="p-8 text-center border border-white/10 rounded-xl bg-muted/20 flex flex-col items-center gap-2 mb-6">
                <Lock className="w-8 h-8 text-muted-foreground" />
                <h3 className="font-bold">Private Mode Locked</h3>
                <p className="text-sm text-muted-foreground mb-4">Upgrade to share exclusive content behind a PIN.</p>
                <NeonButton size="sm" onClick={() => {
                  setUpgradeReason("Upgrade to unlock Private Content features.");
                  setShowUpgradeModal(true);
                }}>Unlock Feature</NeonButton>
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4">
              This content will only be visible to visitors who enter the correct PIN.
            </p>

            {/* PIN Settings */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">PIN Lock</p>
                    <p className="text-sm text-muted-foreground">Require PIN to view private content</p>
                  </div>
                </div>
                <Switch checked={pinEnabled} onCheckedChange={(checked) => {
                  setPinEnabled(checked);

                }} />
              </div>

              {pinEnabled && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-foreground">Your PIN:</label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      value={pin}
                      onChange={(e) => handlePinChange(e.target.value)}
                      maxLength={6}
                      className="w-32 px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground text-center tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">6 digits</span>
                </div>
              )}
            </div>

            {/* Add Private Content Form */}
            {showAddPrivate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 rounded-xl bg-muted/50 border border-border space-y-3"
              >
                <input
                  type="text"
                  placeholder="Title (e.g., Personal Email, Private Phone)"
                  value={newPrivateContent.title}
                  onChange={(e) => setNewPrivateContent({ ...newPrivateContent, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                />
                <input
                  type="text"
                  placeholder="Content"
                  value={newPrivateContent.content}
                  onChange={(e) => setNewPrivateContent({ ...newPrivateContent, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                />

                {/* Upload Image for Private Content */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !currentUser) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("File size must be less than 5MB");
                        return;
                      }
                      const toastId = toast.loading("Uploading private image...");
                      try {
                        // Cleanup old image
                        if (newPrivateContent.imageUrl) {
                          await storageService.deleteImage(newPrivateContent.imageUrl);
                        }

                        const path = `users/${currentUser.uid}/private_${Date.now()}`;
                        const url = await storageService.uploadImage(file, path);
                        setNewPrivateContent(prev => ({ ...prev, imageUrl: url }));
                        toast.success("Image uploaded!");
                      } catch (err: any) {
                        console.error(err);
                        setErrorAlert({ isOpen: true, message: "Failed to upload image: " + (err.message || "") });
                      } finally {
                        toast.dismiss(toastId);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full px-4 py-3 rounded-xl bg-muted border border-border flex items-center justify-center gap-2 transition-colors ${newPrivateContent.imageUrl ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/50'}`}>
                    {newPrivateContent.imageUrl ? (
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-primary" />
                        <span className="text-primary font-medium">Image Uploaded</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (newPrivateContent.imageUrl) {
                              await storageService.deleteImage(newPrivateContent.imageUrl);
                              setNewPrivateContent(prev => ({ ...prev, imageUrl: "" }));
                              toast.success("Image removed");
                            }
                          }}
                          className="p-1 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-colors relative z-20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Image className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Upload Image (Optional, visible after unlock)</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <NeonButton size="sm" onClick={addPrivateContent}>Add</NeonButton>
                  <NeonButton variant="outline" size="sm" onClick={() => setShowAddPrivate(false)}>Cancel</NeonButton>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              {privateContents.map((item) => (
                <motion.div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 group"
                  layout
                >
                  <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">{item.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPrivate(item)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <span className="sr-only">Edit</span>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removePrivateContent(item.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar / Preview / Extra Actions could go here if needed, or just clear empty space in lg layout */}
        <div className="space-y-6">
          {/* We can put preview button or tips here */}
          <GlassCard className="p-6 sticky top-24">
            <h3 className="text-lg font-bold font-display text-foreground mb-4">Tips</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <span>Upload a high-quality profile picture for the best impression.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <span>Add a blurred wallpaper to make your text pop.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <span>Use the Private Content section for sensitive info like personal phone numbers.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <span>Keep your PIN secure and share it only with trusted contacts.</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>

      <ErrorAlert
        isOpen={errorAlert.isOpen}
        onClose={() => setErrorAlert({ ...errorAlert, isOpen: false })}
        message={errorAlert.message}
      />

      <FloatingSaveBar
        isOpen={hasUnsavedChanges}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  );
};

export default ProfileEditor;
