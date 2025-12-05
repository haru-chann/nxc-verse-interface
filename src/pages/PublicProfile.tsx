import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Twitter, Linkedin, Instagram, Github, Globe, MapPin, Lock, QrCode, ExternalLink, Download, UserPlus } from "lucide-react";
import { toast } from "sonner";

const socialLinks = [
  { icon: Globe, label: "Website", url: "https://johndoe.com" },
  { icon: Linkedin, label: "LinkedIn", url: "https://linkedin.com/in/johndoe" },
  { icon: Twitter, label: "Twitter", url: "https://twitter.com/johndoe" },
  { icon: Github, label: "GitHub", url: "https://github.com/johndoe" },
  { icon: Instagram, label: "Instagram", url: "https://instagram.com/johndoe" },
];

const portfolioItems = [
  { title: "Brand Identity Project", category: "Design" },
  { title: "E-commerce Platform", category: "Development" },
  { title: "Mobile App UI", category: "Design" },
];

const profileData = {
  firstName: "John",
  lastName: "Doe",
  title: "Product Designer",
  company: "NXC Badge",
  email: "john@nxcbadge.com",
  phone: "+1 555 123 4567",
  location: "San Francisco, CA",
  website: "https://johndoe.com",
  bio: "Passionate about creating beautiful digital experiences. 10+ years in product design. Currently building the future of digital identity at NXC Badge."
};

const PublicProfile = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  const handleSaveContact = () => {
    // Generate VCard format
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profileData.firstName} ${profileData.lastName}
N:${profileData.lastName};${profileData.firstName};;;
TITLE:${profileData.title}
ORG:${profileData.company}
EMAIL:${profileData.email}
TEL:${profileData.phone}
URL:${profileData.website}
ADR:;;${profileData.location};;;;
NOTE:${profileData.bio}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profileData.firstName}_${profileData.lastName}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Contact saved to your device!");
  };

  const handleUnlock = () => {
    if (pin === "1234") {
      setIsUnlocked(true);
      setShowPinInput(false);
      toast.success("Private content unlocked!");
    } else {
      toast.error("Incorrect PIN");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Please fill all fields");
      return;
    }
    toast.success("Message sent successfully!");
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
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
      <div className="max-w-2xl mx-auto px-4 -mt-24 pb-20 relative z-10">
        {/* Avatar & Basic Info */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-neon-md"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <span className="text-4xl font-bold text-primary-foreground">JD</span>
          </motion.div>
          <h1 className="text-3xl font-bold font-display text-foreground mb-1">{profileData.firstName} {profileData.lastName}</h1>
          <p className="text-lg text-primary mb-2">{profileData.title}</p>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" />
            {profileData.location}
          </p>
        </motion.div>

        {/* Save Contact Button */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <NeonButton className="w-full" onClick={handleSaveContact}>
            <UserPlus className="w-5 h-5 mr-2" />
            Save Contact
            <Download className="w-4 h-4 ml-2" />
          </NeonButton>
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6 mb-6">
            <p className="text-foreground text-center">{profileData.bio}</p>
          </GlassCard>
        </motion.div>

        {/* Social Links */}
        <motion.div
          className="space-y-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {socialLinks.map((link, index) => (
            <motion.a
              key={link.label}
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
                <link.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="flex-1 font-medium text-foreground">{link.label}</span>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.a>
          ))}
        </motion.div>

        {/* Portfolio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold font-display text-foreground mb-4">Portfolio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {portfolioItems.map((item, index) => (
              <GlassCard key={index} variant="hover" className="p-4">
                <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 mb-3" />
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </GlassCard>
            ))}
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-6 mb-8">
            <h2 className="text-xl font-bold font-display text-foreground mb-4">Get in Touch</h2>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
              />
              <input
                type="email"
                placeholder="Your Email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
              />
              <textarea
                rows={3}
                placeholder="Your Message"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground resize-none"
              />
              <NeonButton type="submit" className="w-full">Send Message</NeonButton>
            </form>
          </GlassCard>
        </motion.div>

        {/* PIN Locked Section */}
        {!isUnlocked && (
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
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-6" variant="neon">
              <h2 className="text-xl font-bold font-display text-foreground mb-4">Private Information</h2>
              <div className="space-y-3">
                <p className="text-foreground"><span className="text-muted-foreground">Email:</span> {profileData.email}</p>
                <p className="text-foreground"><span className="text-muted-foreground">Phone:</span> {profileData.phone}</p>
                <p className="text-foreground"><span className="text-muted-foreground">Company:</span> {profileData.company}</p>
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
      </div>
    </div>
  );
};

export default PublicProfile;
