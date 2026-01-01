import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { NeonButton } from "../ui/NeonButton";
import { GradientText } from "../ui/GradientText";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const CTASection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[150px]"
          style={{ willChange: "transform, opacity" }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[150px]"
          style={{ willChange: "transform, opacity" }}
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Start Free Today</span>
          </motion.div>

          {/* Heading */}
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Ready to Transform Your{" "}
            <GradientText animate>Networking?</GradientText>
          </h2>

          {/* Description */}
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of professionals who've already upgraded to the future of digital identity. Get started in minutes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <NeonButton size="lg">
                Create Free Profile
                <ArrowRight className="ml-2 w-5 h-5" />
              </NeonButton>
            </Link>
            <div onClick={() => toast.info("Coming Soon!!")} className="cursor-pointer">
              <NeonButton variant="outline" size="lg" glow={false}>
                Shop Premium Cards
              </NeonButton>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              Free forever plan
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              Cancel anytime
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
