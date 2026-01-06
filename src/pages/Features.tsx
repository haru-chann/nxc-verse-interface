import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { Link } from "react-router-dom";
import {
  Nfc, QrCode, BarChart3, Users, Palette, Shield, Zap, Globe,
  Smartphone, Download, Lock, Layers, Sparkles, Check
} from "lucide-react";

const mainFeatures = [
  {
    icon: Nfc,
    title: "Premium NFC Cards",
    description: "Metal NFC cards with instant tap-to-share. Works with all smartphones, no app needed.",
    details: ["Metal & plastic options", "Custom engraving", "Multiple finishes", "Replaceable"],
  },
  {
    icon: QrCode,
    title: "Dynamic QR Codes",
    description: "Generate beautiful QR codes that link to your profile. Update content anytime.",
    details: ["Custom colors", "Logo embedding", "Analytics tracking", "Downloadable"],
  },
  {
    icon: Palette,
    title: "Profile Customization",
    description: "Design your digital identity with stunning themes, custom colors, and layouts.",
    details: ["50+ themes", "Custom wallpapers", "Section ordering", "Font choices"],
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track every profile view, tap, and interaction with detailed insights.",
    details: ["Real-time data", "Geographic insights", "Device breakdown", "Time analysis"],
  },
  {
    icon: Users,
    title: "Contact Management",
    description: "Capture leads automatically when visitors engage with your profile.",
    details: ["Auto-capture", "CRM export", "CSV/PDF export", "Contact notes"],
  },
  {
    icon: Shield,
    title: "Privacy Controls",
    description: "Control who sees what with PIN-protected sections and visibility settings.",
    details: ["PIN lock", "Section privacy", "Link expiry", "View limits"],
  },
];

const additionalFeatures = [
  { icon: Smartphone, title: "Mobile Optimized", description: "Perfect experience on any device" },
  { icon: Download, title: "Easy Export", description: "Download contacts in any format" },
  { icon: Lock, title: "Secure", description: "Enterprise-grade encryption" },
  { icon: Layers, title: "Integrations", description: "Connect with your tools" },
  { icon: Globe, title: "Global CDN", description: "Fast loading worldwide" },
  { icon: Zap, title: "Instant Updates", description: "Changes reflect immediately" },
];

const Features = () => {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-mesh" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-primary font-medium mb-4">FEATURES</p>
            <h1 className="font-display text-5xl sm:text-6xl font-bold mb-6">
              Powerful Tools for{" "}
              <GradientText animate>Professionals</GradientText>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Everything you need to create, share, and track your digital identity
            </p>
            <Link to="/signup">
              <NeonButton size="lg">
                Get Started Free
              </NeonButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-32">
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                className={`flex flex-col lg:flex-row gap-12 items-center ${index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {/* Content */}
                <div className="flex-1">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <feature.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                  <h2 className="text-3xl font-bold font-display text-foreground mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    {feature.description}
                  </p>
                  <ul className="grid grid-cols-2 gap-3">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual */}
                <motion.div className="flex-1 w-full" whileHover={{ scale: 1.02 }}>
                  <GlassCard className="p-8 aspect-video flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <feature.icon className="w-24 h-24 text-primary/30" />
                    </motion.div>
                  </GlassCard>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-32 relative bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              And <GradientText>Much More</GradientText>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard variant="hover" className="p-6">
                  <feature.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-6">
              Ready to Experience the <GradientText>Future?</GradientText>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of professionals already using NXC Badge
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/pricing">
                <NeonButton variant="outline" size="lg" glow={false}>View Pricing</NeonButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Features;
