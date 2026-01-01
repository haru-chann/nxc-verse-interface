import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Target, Heart, Zap, Globe, Users, Award } from "lucide-react";

const stats = [
  { value: 50000, suffix: "+", label: "Active Users" },
  { value: 150, suffix: "+", label: "Countries" },
  { value: 2, suffix: "M+", label: "Connections" },
  { value: 99, suffix: "%", label: "Uptime" },
];

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We're on a mission to revolutionize how professionals connect and share their identity in the digital age.",
  },
  {
    icon: Heart,
    title: "User-Centric",
    description: "Every feature we build starts with our users. Their success is our success.",
  },
  {
    icon: Zap,
    title: "Innovation First",
    description: "We constantly push the boundaries of what's possible with NFC and QR technology.",
  },
  {
    icon: Globe,
    title: "Global Impact",
    description: "Building a global community of connected professionals, one tap at a time.",
  },
];

const team = [
  { name: "Alex Rivera", role: "CEO & Founder", avatar: "AR" },
  { name: "Jordan Lee", role: "CTO", avatar: "JL" },
  { name: "Sam Chen", role: "Head of Design", avatar: "SC" },
  { name: "Morgan Taylor", role: "Head of Product", avatar: "MT" },
];

const About = () => {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-mesh" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-primary font-medium mb-4">ABOUT US</p>
            <h1 className="font-display text-5xl sm:text-6xl font-bold mb-6">
              Redefining{" "}
              <GradientText animate>Digital Identity</GradientText>
            </h1>
            <p className="text-xl text-muted-foreground">
              We believe in a world where sharing your professional identity is as simple as a tap. NXC Badge Verse is building the future of networking.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <p className="text-4xl sm:text-5xl font-bold font-display text-foreground">
                  <AnimatedCounter to={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-muted-foreground mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-4xl font-bold mb-6">
                Our <GradientText>Story</GradientText>
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  NXC Badge Verse was born from a simple frustration: the traditional business card was dead, but nothing had truly replaced it for the digital age.
                </p>
                <p>
                  Founded in 2024, we set out to create a platform that combines the elegance of premium materials with the power of digital technology. Our metal NFC cards aren't just business cards—they're a statement.
                </p>
                <p>
                  Today, we serve over 50,000 professionals worldwide, helping them make lasting impressions and meaningful connections every single day.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <GlassCard className="p-8 aspect-square flex items-center justify-center">
                <motion.div
                  className="text-9xl font-bold font-display text-primary/20"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  NXC
                </motion.div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-32 relative bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Our <GradientText>Values</GradientText>
            </h2>
            <p className="text-xl text-muted-foreground">What drives us every day</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard variant="hover" className="p-6 h-full text-center">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <value.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 font-display">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {value.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Meet the <GradientText>Team</GradientText>
            </h2>
            <p className="text-xl text-muted-foreground">The people building the future</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard variant="hover" className="p-6 text-center">
                  <motion.div
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-2xl font-bold text-primary-foreground">
                      {member.avatar}
                    </span>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-foreground font-display">
                    {member.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">{member.role}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
