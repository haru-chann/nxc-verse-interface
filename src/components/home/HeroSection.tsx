import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { NeonButton } from "../ui/NeonButton";
import { GradientText } from "../ui/GradientText";
import { AnimatedCounter } from "../ui/AnimatedCounter";
import { ArrowRight, Sparkles, Zap, QrCode, Nfc } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      {/* Floating Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">The Future of Digital Identity</span>
            </motion.div>

            {/* Heading */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Share Your{" "}
              <GradientText animate>Identity</GradientText>
              <br />
              With One Tap
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-lg">
              NXC Badge Verse transforms how you connect. Premium NFC cards and QR codes that link to your stunning digital profile. Track every interaction, build relationships.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/signup">
                <NeonButton size="lg">
                  Get Your Badge
                  <ArrowRight className="ml-2 w-5 h-5" />
                </NeonButton>
              </Link>
              <Link to="#" onClick={(e) => {
                e.preventDefault();
                // TODO: Replace with actual shop URL
                alert('Shop Cards - Coming soon!');
              }}>
                <NeonButton variant="outline" size="lg" glow={false}>
                  Shop Cards
                </NeonButton>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-3xl font-bold font-display text-foreground">
                  <AnimatedCounter to={50000} suffix="+" />
                </p>
                <p className="text-muted-foreground text-sm">Active Users</p>
              </div>
              <div>
                <p className="text-3xl font-bold font-display text-foreground">
                  <AnimatedCounter to={2} suffix="M+" />
                </p>
                <p className="text-muted-foreground text-sm">Connections Made</p>
              </div>
              <div>
                <p className="text-3xl font-bold font-display text-foreground">
                  <AnimatedCounter to={99} suffix="%" />
                </p>
                <p className="text-muted-foreground text-sm">Satisfaction</p>
              </div>
            </div>
          </motion.div>

          {/* Right - 3D Card Display */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex items-center justify-center"
          >
            {/* Glow Background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-80 h-80 bg-primary/30 rounded-full blur-[100px]"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>

            {/* Main Card */}
            <motion.div
              className="relative z-10"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="metal-card w-80 h-48 p-6 relative overflow-hidden group cursor-pointer card-3d">
                {/* Card Shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
                
                {/* NFC Icon */}
                <motion.div
                  className="absolute top-4 right-4"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Nfc className="w-8 h-8 text-primary" />
                </motion.div>

                {/* QR Code */}
                <motion.div
                  className="absolute bottom-4 right-4 p-2 bg-white rounded-lg"
                  whileHover={{ scale: 1.1 }}
                >
                  <QrCode className="w-12 h-12 text-background" />
                </motion.div>

                {/* Card Content */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground tracking-widest mb-1">NXC BADGE</p>
                    <h3 className="text-xl font-bold text-foreground font-display">John Doe</h3>
                    <p className="text-sm text-muted-foreground">Product Designer</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                </div>

                {/* Edge Glow Effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    boxShadow: "0 0 20px hsl(var(--primary) / 0.5), inset 0 0 20px hsl(var(--primary) / 0.1)",
                  }}
                />
              </div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              className="absolute -top-8 -left-8 p-4 glass-card rounded-2xl"
              animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
            >
              <Zap className="w-6 h-6 text-primary" />
            </motion.div>
            <motion.div
              className="absolute -bottom-8 -right-8 p-4 glass-card rounded-2xl"
              animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            >
              <QrCode className="w-6 h-6 text-accent" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <motion.div
            className="w-1.5 h-3 rounded-full bg-primary"
            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};
