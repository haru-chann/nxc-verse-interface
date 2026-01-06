import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "Free",
    description: "Essential networking tools",
    features: [
      "Digital Profile Only",
      "5 Links limit",
      "100 characters Bio limit",
      "1 QR option",
      "Save 50 contacts/month",
      "Free forever",
    ],
    cta: "Get Started",
    popular: false,
    path: "/signup",
  },
  {
    name: "Plus",
    price: 499,
    description: "The standard for professionals",
    features: [
      "Digital Profile",
      "Matte finished NFC Card",
      "10 Links limit",
      "Bio length up to 500 chars",
      "Multiple QR Options",
      "Save 1000 contacts/month",
    ],
    cta: "Order Now",
    popular: false,
    path: "/order",
  },
  {
    name: "Platinum",
    price: 999,
    description: "Stand out with custom design",
    features: [
      "Everything in Plus",
      "Customized NFC Card design",
      "Priority Support",
    ],
    cta: "Order Now",
    popular: true,
    path: "/order",
  },
  {
    name: "Ultra Premium",
    price: 1499,
    description: "The ultimate impression",
    features: [
      "Everything in Plus",
      "Custom Metal NFC Card",
      "Unlimited contact storage",
      "Private content mode",
    ],
    cta: "Order Now",
    popular: false,
    path: "/order",
  },
];

const Pricing = () => {
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
            <p className="text-xl text-muted-foreground">
              Choose the perfect NXC Card for your needs. Premium quality at unbeatable prices.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Updated grid for 4 items: 1 col mobile, 2 col tablet, 4 col desktop */}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                  className={`p-6 h-full flex flex-col ${plan.popular ? "border-primary/50" : ""}`}
                >
                  <h3 className="text-xl font-bold font-display text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-6 h-8">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold font-display text-foreground">
                      {typeof plan.price === 'number' ? `₹${plan.price}` : plan.price}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground text-sm leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={plan.path} className="w-full">
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

      {/* CTA */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Upgrade Your Networking?
            </h2>
            <p className="text-muted-foreground mb-8">
              Order your NXC Card today and make a lasting impression.
            </p>
            <Link to="/order">
              <NeonButton glow>Order Now</NeonButton>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
