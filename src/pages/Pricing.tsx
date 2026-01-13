import { motion } from "framer-motion";
import { useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { useNavigate, Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useContent } from "@/hooks/useContent";

const defaultPlans = [
  {
    id: "free",
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
    highlight: false,
    buttonText: "Get Started"
  },
  {
    id: "plus",
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
    path: "plus",
    highlight: false,
    buttonText: "Order Now"
  },
  {
    id: "platinum",
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
    path: "platinum",
    highlight: true,
    buttonText: "Order Now"
  },
  {
    id: "ultra",
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
    path: "ultra",
    highlight: false,
    buttonText: "Order Now"
  },
];

const Pricing = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { content } = useContent('store', { products: defaultPlans });

  // Use content.products if available, otherwise defaults
  const plans = content?.products || defaultPlans;

  // Check if we are in minimal mode to preserve it or use it
  const searchParams = new URLSearchParams(window.location.search);
  const isMinimal = searchParams.get("minimal") === "true";

  // Sync CMS Data with Plans Collection
  useEffect(() => {
    if (content?.products) {
      // Async sync to ensure 'plans' collection has all these products
      import("@/services/planService").then(({ planService }) => {
        planService.syncFromCMS(content.products);
      });
    }
  }, [content]);

  const handleOrder = (planId: string) => {
    if (planId === "/signup") {
      navigate("/signup");
      return;
    }

    // Navigate to customization first
    const targetUrl = `/dashboard/customize/${encodeURIComponent(planId)}${isMinimal ? '?minimal=true' : ''}`;

    if (currentUser) {
      navigate(targetUrl);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    }
  };

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
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan: any, index: number) => (
              <motion.div
                key={plan.name || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {(plan.popular || plan.highlight) && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}
                <GlassCard
                  variant={(plan.popular || plan.highlight) ? "neon" : "hover"}
                  className={`p-6 h-full flex flex-col ${(plan.popular || plan.highlight) ? "border-primary/50" : ""}`}
                >
                  <h3 className="text-xl font-bold font-display text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-6 h-8">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold font-display text-foreground">
                      {!isNaN(Number(plan.price)) && plan.price !== "" ? `₹${plan.price}` : plan.price}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features?.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground text-sm leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <NeonButton
                    variant={(plan.popular || plan.highlight) ? "primary" : "outline"}
                    className="w-full"
                    glow={plan.popular || plan.highlight}
                    onClick={() => handleOrder(plan.id || plan.path || "/order")}
                  >
                    {plan.cta || plan.buttonText || "Order Now"}
                  </NeonButton>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-6">
            Ready to Upgrade Your Network?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of professionals who have already switched to NXC Badge Verse.
          </p>
          {/* Button removed as per request */}
        </div>
      </section>
    </div>
  );
};

export default Pricing;
