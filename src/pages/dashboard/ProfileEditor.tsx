import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { User, Link as LinkIcon, Image, Plus, GripVertical, Trash2, Save } from "lucide-react";

const ProfileEditor = () => {
  const [links, setLinks] = useState([
    { id: 1, title: "Website", url: "https://johndoe.com", icon: "globe" },
    { id: 2, title: "LinkedIn", url: "https://linkedin.com/in/johndoe", icon: "linkedin" },
    { id: 3, title: "Twitter", url: "https://twitter.com/johndoe", icon: "twitter" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Profile Editor</h1>
          <p className="text-muted-foreground mt-1">Customize your digital identity</p>
        </div>
        <NeonButton>
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
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-foreground">JD</span>
                </div>
                <div>
                  <NeonButton variant="outline" size="sm">Change Photo</NeonButton>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG up to 5MB</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
                  <input type="text" defaultValue="John Doe" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                  <input type="text" defaultValue="Product Designer" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                <textarea rows={3} defaultValue="Passionate about creating beautiful digital experiences." className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground resize-none" />
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
              <NeonButton variant="outline" size="sm">
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
                  <input type="text" defaultValue={link.title} className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
                  <input type="text" defaultValue={link.url} className="flex-[2] px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
                  <button className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
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
            <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer">
              <div className="text-center">
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
              <div className="h-full rounded-xl bg-gradient-to-b from-primary/10 to-background flex flex-col items-center pt-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary-foreground">JD</span>
                </div>
                <h4 className="font-bold text-foreground">John Doe</h4>
                <p className="text-sm text-muted-foreground">Product Designer</p>
                <div className="mt-6 w-full px-4 space-y-2">
                  {links.map((link) => (
                    <div key={link.id} className="p-3 rounded-xl bg-muted/50 text-center text-sm text-foreground">
                      {link.title}
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
