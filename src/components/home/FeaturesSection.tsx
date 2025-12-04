import { motion } from "framer-motion";
import { GlassCard } from "../ui/GlassCard";
import { GradientText } from "../ui/GradientText";
import {
  Nfc,
  QrCode,
  BarChart3,
  Users,
  Palette,
  Shield,
  Zap,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Nfc,
    title: "NFC Technology",
    description: "Tap-to-share with premium metal NFC cards. Works with all smartphones instantly.",
  },
  {
    icon: QrCode,
    title: "Dynamic QR Codes",
    description: "Customizable QR codes that link to your profile. Update content without reprinting.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track every interaction, view counts, and engagement metrics in real-time.",
  },
  {
    icon: Users,
    title: "Contact Management",
    description: "Capture leads automatically. Export contacts to your CRM or spreadsheet.",
  },
  {
    icon: Palette,
    title: "Custom Themes",
    description: "Design your profile with beautiful themes, colors, and layouts. Stand out uniquely.",
  },
  {
    icon: Shield,
    title: "Privacy Controls",
    description: "PIN-protected advanced sections. Control who sees what information.",
  },
  {
    icon: Zap,
    title: "Instant Updates",
    description: "Update your profile anytime. Changes reflect immediately across all your cards.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Connect with anyone worldwide. No app required - works in any browser.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background-secondary to-background" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <motion.p
            className="text-primary font-medium mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            POWERFUL FEATURES
          </motion.p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Everything You Need to{" "}
            <GradientText>Connect</GradientText>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete platform for digital identity management. From premium cards to powerful analytics.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard variant="hover" className="p-6 h-full">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <feature.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground mb-2 font-display">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
