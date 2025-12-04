import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface NeonButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = "primary", size = "md", glow = true, children, onClick, disabled, type = "button" }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl overflow-hidden group";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary-glow",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
      ghost: "bg-transparent text-foreground hover:bg-muted",
      outline: "bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground",
    };
    
    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const glowStyles = glow ? {
      primary: "hover:shadow-neon-md",
      secondary: "hover:shadow-card-hover",
      ghost: "",
      outline: "hover:shadow-neon-md",
    } : { primary: "", secondary: "", ghost: "", outline: "" };

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glowStyles[variant],
          "shine-effect",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        whileHover={disabled ? {} : { scale: 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
      >
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);

NeonButton.displayName = "NeonButton";
