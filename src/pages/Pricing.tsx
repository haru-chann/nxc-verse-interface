import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for getting started",
    features: [
      "1 Digital Profile",
      "Basic QR Code",
      "5 Links",
      "Basic Analytics",
      "NXC Branding",
      "Email Support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: { monthly: 12, yearly: 99 },
    description: "For professionals who mean business",
    features: [
      "Unlimited Profiles",
      "Custom QR Codes",
      "Unlimited Links",
      "Advanced Analytics",
      "No Branding",
      "Custom Themes",
      "Contact Export",
      "Priority Support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Business",
    price: { monthly: 49, yearly: 399 },
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Team Management",
      "Analytics Dashboard",
      "API Access",
      "Custom Domain",
      "White-label Option",
      "Dedicated Support",
      "SLA Guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const cardAddons = [
  { name: "Starter Pack", cards: 1, price: 29, description: "1 Metal NFC Card" },
  { name: "Professional", cards: 3, price: 69, description: "3 Metal NFC Cards" },
  { name: "Team Pack", cards: 10, price: 199, description: "10 Metal NFC Cards" },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

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
            <p className="text-primary font-medium mb-4">PRICING</p>
            <h1 className="font-display text-5xl sm:text-6xl font-bold mb-6">
              Simple, Transparent{" "}
              <GradientText animate>Pricing</GradientText>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Choose the plan that's right for you. Upgrade or downgrade anytime.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-4 p-1 rounded-xl bg-muted">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Yearly
                <span className="ml-2 text-xs opacity-80">Save 30%</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}
                <GlassCard
                  variant={plan.popular ? "neon" : "hover"}
                  className={`p-8 h-full flex flex-col ${plan.popular ? "border-primary/50" : ""}`}
                >
                  <h3 className="text-2xl font-bold font-display text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold font-display text-foreground">
                      ${isYearly ? plan.price.yearly : plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">
                      /{isYearly ? "year" : "month"}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/signup" className="w-full">
                    <NeonButton
                      variant={plan.popular ? "primary" : "outline"}
                      className="w-full"
                      glow={plan.popular}
                    >
                      {plan.cta}
                    </NeonButton>
                  </Link>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Card Add-ons */}
      <section className="py-32 relative bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Premium <GradientText>NFC Cards</GradientText>
            </h2>
            <p className="text-xl text-muted-foreground">
              Add physical cards to your digital profile
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {cardAddons.map((addon, index) => (
              <motion.div
                key={addon.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard variant="hover" className="p-8 text-center">
                  <h3 className="text-xl font-bold font-display text-foreground mb-2">
                    {addon.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">{addon.description}</p>
                  <p className="text-4xl font-bold font-display text-foreground mb-6">
                    ${addon.price}
                  </p>
                  <Link to="/store">
                    <NeonButton variant="outline" className="w-full">
                      Shop Now
                    </NeonButton>
                  </Link>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl font-bold mb-4">
              Have Questions?
            </h2>
            <p className="text-muted-foreground mb-8">
              Check out our FAQ or contact our support team
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/faqs">
                <NeonButton variant="outline" glow={false}>View FAQs</NeonButton>
              </Link>
              <Link to="/contact">
                <NeonButton>Contact Support</NeonButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
