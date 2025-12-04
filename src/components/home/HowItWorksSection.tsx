import { motion } from "framer-motion";
import { GradientText } from "../ui/GradientText";
import { Check } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create Your Profile",
    description: "Sign up and build your digital identity with our intuitive profile editor. Add links, portfolio, contact info, and more.",
    features: ["Custom wallpapers", "Social links", "Portfolio blocks", "Contact forms"],
  },
  {
    number: "02",
    title: "Choose Your Card",
    description: "Select from our premium metal card collection. Each card comes with embedded NFC and a unique QR code.",
    features: ["Metal finish options", "Custom engraving", "Multiple designs", "Express shipping"],
  },
  {
    number: "03",
    title: "Share & Connect",
    description: "Tap your card or show your QR code. Visitors see your stunning profile instantly, no app needed.",
    features: ["One-tap sharing", "Works with all phones", "No app required", "Instant access"],
  },
  {
    number: "04",
    title: "Track & Grow",
    description: "Monitor your profile views, track interactions, and export leads. Turn connections into opportunities.",
    features: ["Real-time analytics", "Lead capture", "Export contacts", "Growth insights"],
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-primary font-medium mb-4">HOW IT WORKS</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Get Started in{" "}
            <GradientText>Minutes</GradientText>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to transform how you share your identity
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-24">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className={`flex flex-col lg:flex-row gap-12 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              {/* Content */}
              <div className="flex-1">
                <motion.span
                  className="text-7xl font-bold font-display text-primary/20"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  {step.number}
                </motion.span>
                <h3 className="text-3xl font-bold font-display text-foreground mt-4 mb-4">
                  {step.title}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {step.description}
                </p>
                <ul className="space-y-3">
                  {step.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual */}
              <motion.div
                className="flex-1 w-full"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="glass-card p-8 rounded-3xl aspect-video flex items-center justify-center relative overflow-hidden group">
                  {/* Placeholder Visual */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                  <motion.div
                    className="relative z-10 text-8xl font-bold font-display text-primary/30"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    {step.number}
                  </motion.div>
                  {/* Glow Effect */}
                  <motion.div
                    className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                    style={{
                      background: "radial-gradient(circle at center, hsl(var(--primary) / 0.2), transparent 70%)",
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
