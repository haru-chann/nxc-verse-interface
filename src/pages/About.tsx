import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Target, Heart, Zap, Globe, Users, Award } from "lucide-react";
import { useContent } from "@/hooks/useContent";

const defaultValues = [
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

const defaultTeam = [
  { name: "Ritesh Martawar", role: "Founder & Developer", avatar: "RM" },
  { name: "Vishal Pandey", role: "Co-Founder & Developer", avatar: "VP" },
  { name: "Ishaan Apte", role: "Designer", avatar: "IA" },
  { name: "Meghant Darji", role: "Product Head", avatar: "MD" },
  { name: "Saksham Jiddewar", role: "Marketing Strategist", avatar: "SJ" },
];

const defaultStory = [
  "NXC Badge Verse was born in November 2024 from one fearless idea — professional identity should feel powerful, futuristic, and alive.",
  "Built by students with ambition that refuses to shrink, we created a digital visiting card platform engineered like a blockbuster: precise, immersive, and built to last.",
  "Led by Ritesh Martawar with the strength of Vishal Pandey, Ishaan Apte, and Meghant Darji, this isn’t just tech. It’s a statement. And it’s only the beginning."
];

const About = () => {
  const { content } = useContent('about', { story: defaultStory, values: defaultValues, team: defaultTeam });

  // Dynamic Data with Fallbacks
  const story = content?.story || defaultStory;
  const values = content?.values || defaultValues;
  const team = content?.team || defaultTeam;

  // Helper to map icon names if we stored them as strings in DB (future proofing), currently DB stores static list so we might loose icons if we fully dynamic them without a map.
  // For now, let's assume 'values' from DB might not have the actual Icon component if saved via JSON. 
  // BUT, our CMSAbout uses a hardcoded defaultValues which HAS icons. 
  // If we save via CMS, we likely strip the icon component. 
  // We should map titles to icons or use a fallback.
  const getIcon = (title: string, index: number) => {
    const iconMap: any = { "Mission-Driven": Target, "User-Centric": Heart, "Innovation First": Zap, "Global Impact": Globe };
    return iconMap[title] || [Target, Heart, Zap, Globe][index % 4];
  };

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

      {/* Story Section */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-5xl sm:text-6xl font-bold mb-12">
              Our <GradientText>Story</GradientText>
            </h2>
            <div className="prose prose-lg dark:prose-invert mx-auto space-y-8">
              {story.map((paragraph: string, i: number) => (
                <p key={i} className="text-xl md:text-2xl leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>
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

          <div className="flex flex-wrap justify-center gap-6">
            {values.map((value: any, index: number) => {
              const Icon = getIcon(value.title, index);
              return (
                <motion.div
                  key={value.title || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]"
                >
                  <GlassCard variant="hover" className="p-6 h-full text-center">
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Icon className="w-7 h-7 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 font-display">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {value.description}
                    </p>
                  </GlassCard>
                </motion.div>
              )
            })}
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

          {/* Changed from grid to flex-wrap to center 5 items nicely */}
          <div className="flex flex-wrap justify-center gap-8">
            {team.map((member: any, index: number) => (
              <motion.div
                key={member.name || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] max-w-xs"
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
