import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { userService, UserProfile } from "@/services/userService";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

import { User, Link as LinkIcon, Image, Plus, GripVertical, Trash2, Save, Building, MapPin, Phone, Globe, Lock, Briefcase, Eye, EyeOff, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { storageService } from "@/services/storageService";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";

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
}

const ProfileEditor = () => {
  const { currentUser } = useAuth();
  const [profileData, setProfileData] = useState<Partial<UserProfile> & {
    title?: string,
    company?: string,
    phone?: string,
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

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      try {
        const data = await userService.getUserProfile(currentUser.uid);
        const privateData = await userService.getUserPrivateData(currentUser.uid);

        if (data) {
          console.log("Loaded profile data:", data); // Debug log
          setProfileData({
            displayName: data.displayName || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: currentUser.email || "",
            bio: data.bio || "",
            location: data.location || "",
            title: (data as any).title || "",
            company: (data as any).company || "",

            phone: (data as any).phone || "",
            photoURL: (data as any).photoURL || "",
            coverImage: (data as any).coverImage || "",
          });

          // Load extended data if available
          if ((data as any).links) setLinks((data as any).links);
          if ((data as any).portfolioItems) setPortfolioItems((data as any).portfolioItems);
          if ((data as any).isPublic !== undefined) setIsPublic((data as any).isPublic);

          // Load private data from secure path if available, otherwise fallback to public doc (migration)
          if (privateData) {
            setPrivateContents((privateData as any).privateContents || []);
            setPinEnabled((privateData as any).pinEnabled !== undefined ? (privateData as any).pinEnabled : true);
            setPin((privateData as any).pin || "1234");
          } else {
            // Fallback for old data structure
            if ((data as any).privateContents) setPrivateContents((data as any).privateContents);
            if ((data as any).pinEnabled !== undefined) setPinEnabled((data as any).pinEnabled);
            if ((data as any).pin) setPin((data as any).pin);
          }

          // If the cached profile has photoURL, ensure we use it (though DashboardLayout handles the header, the editor needs to show it too)
          // The editor primarily uses the file input preview or the big initial avatar.
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
  const [newPrivateContent, setNewPrivateContent] = useState({ title: "", content: "" });
  const [showAddPrivate, setShowAddPrivate] = useState(false);

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

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // We need to send ALL fields that we want to persist, expanding the UserProfile interface in userService might be needed if title/company aren't there.
      // But for now we cast to any or assume userService handles partials.
      // Important: We must ensure we aren't losing data.

      const updateData = {
        displayName: `${profileData.firstName} ${profileData.lastName}`.trim(),
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        bio: profileData.bio,
        location: profileData.location,
        title: profileData.title,
        company: profileData.company,
        phone: profileData.phone,
        // Detailed fields
        links: links,
        portfolioItems: portfolioItems,
        coverImage: profileData.coverImage,
        photoURL: profileData.photoURL,
        isPublic: isPublic,
      };

      const privateUpdateData = {
        privateContents: privateContents,
        pinEnabled: pinEnabled,
        pin: pin,
      };

      await userService.updateUserProfile(currentUser.uid, updateData);
      await userService.updateUserPrivateData(currentUser.uid, privateUpdateData);
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

      // We DON'T update Auth Profile here because this is the Public Profile picture (independent)
      // We accept that user has to click "Save Changes" to persist to DB, 
      // OR we can auto-save just this field to DB like previously?
      // The previous code did: await userService.updateUserProfile(currentUser.uid, { photoURL: url });
      // Let's stick to saving to DB immediately for better UX on images
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

  const addPortfolioItem = () => {
    if (!newPortfolioItem.title || !newPortfolioItem.category) {
      setErrorAlert({ isOpen: true, message: "Please fill in title and category" });
      return;
    }
    setPortfolioItems([...portfolioItems, { ...newPortfolioItem, id: Date.now() }]);
    setNewPortfolioItem({ title: "", description: "", category: "" });
    setShowAddPortfolio(false);
    toast.success("Portfolio item added!");
  };

  const removePortfolioItem = (id: number) => {
    setPortfolioItems(portfolioItems.filter(item => item.id !== id));
    toast.success("Portfolio item removed");
  };

  const addPrivateContent = () => {
    if (!newPrivateContent.title || !newPrivateContent.content) {
      setErrorAlert({ isOpen: true, message: "Please fill in all fields" });
      return;
    }
    setPrivateContents([...privateContents, { ...newPrivateContent, id: Date.now() }]);
    setNewPrivateContent({ title: "", content: "" });
    setShowAddPrivate(false);
    toast.success("Private content added!");
  };

  const removePrivateContent = (id: number) => {
    setPrivateContents(privateContents.filter(item => item.id !== id));
    toast.success("Private content removed");
  };

  const handlePinChange = (newPin: string) => {
    if (newPin.length <= 4 && /^\d*$/.test(newPin)) {
      setPin(newPin);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Profile Editor</h1>
          <p className="text-muted-foreground mt-1">Customize your digital identity</p>
        </div>
        <NeonButton onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </NeonButton>
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
                  <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                  <input
                    type="text"
                    value={profileData.title || ""}
                    onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
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
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="text"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:outline-none text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                <textarea
                  rows={3}
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
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
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    Company Name
                  </label>
                  <input
                    name="company"
                    autoComplete="organization"
                    type="text"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    placeholder="Your company name"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Location
                  </label>
                  <input
                    name="location"
                    autoComplete="address-level2"
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Phone Number
                </label>
                <input
                  name="phone"
                  autoComplete="tel"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
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
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
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
              <NeonButton variant="outline" size="sm" onClick={() => setLinks([...links, { id: Date.now(), title: "", url: "", icon: "link" }])}>
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
                    onChange={(e) => setLinks(links.map(l => l.id === link.id ? { ...l, title: e.target.value } : l))}
                    placeholder="Title"
                    className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => setLinks(links.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))}
                    placeholder="URL"
                    className="flex-[2] px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
                  />
                  <button
                    onClick={() => setLinks(links.filter(l => l.id !== link.id))}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Portfolio Section */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Portfolio
              </h2>
              <NeonButton variant="outline" size="sm" onClick={() => setShowAddPortfolio(!showAddPortfolio)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </NeonButton>
            </div>

            {/* Add Portfolio Form */}
            {showAddPortfolio && (
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
                  <div className={`w-full px-4 py-3 rounded-xl bg-muted border border-border flex items-center justify-center gap-2 ${newPortfolioItem.imageUrl ? 'text-primary' : 'text-muted-foreground'}`}>
                    {newPortfolioItem.imageUrl ? (
                      <>
                        <Image className="w-4 h-4" />
                        <span>Image Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Image className="w-4 h-4" />
                        <span>Upload Image (Optional)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Image Upload for Portfolio */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !currentUser) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setErrorAlert({ isOpen: true, message: "File size must be less than 5MB" });
                        return;
                      }
                      const toastId = toast.loading("Uploading portfolio image...");
                      try {
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
                  <div className={`w-full px-4 py-3 rounded-xl bg-muted border border-border flex items-center justify-center gap-2 ${newPortfolioItem.imageUrl ? 'text-primary' : 'text-muted-foreground'}`}>
                    {newPortfolioItem.imageUrl ? (
                      <>
                        <Image className="w-4 h-4" />
                        <span>Image Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Image className="w-4 h-4" />
                        <span>Upload Image (Optional)</span>
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
                  <NeonButton size="sm" onClick={addPortfolioItem}>Add</NeonButton>
                  <NeonButton variant="outline" size="sm" onClick={() => setShowAddPortfolio(false)}>Cancel</NeonButton>
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
                  <button
                    onClick={() => removePortfolioItem(item.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Private Content Section */}
          <GlassCard className="p-6" variant="neon">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Private Content
              </h2>
              <NeonButton variant="outline" size="sm" onClick={() => setShowAddPrivate(!showAddPrivate)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </NeonButton>
            </div>

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
                <Switch checked={pinEnabled} onCheckedChange={setPinEnabled} />
              </div>

              {pinEnabled && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-foreground">Your PIN:</label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      value={pin}
                      onChange={(e) => handlePinChange(e.target.value)}
                      maxLength={4}
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
                  <span className="text-xs text-muted-foreground">4 digits</span>
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
                  <button
                    onClick={() => removePrivateContent(item.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Wallpaper */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              Wallpaper
            </h2>
            <div className="aspect-video relative rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden group">
              <input
                type="file"
                accept="image/*"
                onChange={handleWallpaperUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              {profileData.coverImage ? (
                <img src={profileData.coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}

              <div className="text-center relative z-10 p-4 bg-background/50 backdrop-blur-sm rounded-xl transition-opacity group-hover:opacity-100">
                <Image className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Click to upload wallpaper</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Live Preview</h3>
            <GlassCard className="p-4 aspect-[9/16] overflow-hidden">
              <div className="h-full rounded-xl bg-gradient-to-b from-primary/10 to-background flex flex-col items-center pt-8 overflow-y-auto custom-scrollbar">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 overflow-hidden shadow-neon-sm">
                  {profileData.photoURL ? (
                    <img src={profileData.photoURL} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary-foreground">
                      {profileData.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-foreground text-center px-4">
                  {profileData.displayName || `${profileData.firstName} ${profileData.lastName}`}
                </h4>
                <p className="text-sm text-muted-foreground">{profileData.title}</p>
                {profileData.company && (
                  <p className="text-xs text-muted-foreground mt-1">{profileData.company}</p>
                )}
                {profileData.location && (
                  <p className="text-xs text-muted-foreground">{profileData.location}</p>
                )}
                {profileData.bio && (
                  <div className="mt-4 px-4 w-full">
                    <p className="text-xs text-center text-muted-foreground line-clamp-4">{profileData.bio}</p>
                  </div>
                )}
                <div className="mt-4 w-full px-4 space-y-2">
                  {links.filter(l => l.title).map((link) => (
                    <div key={link.id} className="p-3 rounded-xl bg-muted/50 text-center text-sm text-foreground">
                      {link.title}
                    </div>
                  ))}
                </div>
                {portfolioItems.length > 0 && (
                  <div className="mt-4 w-full px-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Portfolio</p>
                    <div className="grid grid-cols-2 gap-2">
                      {portfolioItems.slice(0, 4).map((item) => (
                        <div key={item.id} className="p-2 rounded-lg bg-muted/50 text-center">
                          <Briefcase className="w-4 h-4 text-primary mx-auto mb-1" />
                          <p className="text-[10px] text-foreground truncate">{item.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pinEnabled && privateContents.length > 0 && (
                  <div className="mt-4 w-full px-4">
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">PIN Protected</p>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
      <ErrorAlert
        isOpen={errorAlert.isOpen}
        onClose={() => setErrorAlert({ ...errorAlert, isOpen: false })}
        message={errorAlert.message}
      />
    </div>
  );
};

export default ProfileEditor;
