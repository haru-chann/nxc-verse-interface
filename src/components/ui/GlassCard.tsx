import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "hover" | "neon" | "metal";
  glow?: boolean;
  children: React.ReactNode;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", glow = false, children, ...props }, ref) => {
    const variants = {
      default: "glass-card",
      hover: "glass-card-hover",
      neon: "glass-card neon-border-animated",
      metal: "metal-card",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          variants[variant],
          glow && "shadow-neon-sm",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
