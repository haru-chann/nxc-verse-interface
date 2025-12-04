import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NeonBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  glow?: boolean;
  className?: string;
}

export const NeonBadge = ({ 
  children, 
  variant = "default", 
  glow = false,
  className 
}: NeonBadgeProps) => {
  const variants = {
    default: "bg-primary/20 text-primary border-primary/30",
    success: "bg-success/20 text-success border-success/30",
    warning: "bg-warning/20 text-warning border-warning/30",
    error: "bg-destructive/20 text-destructive border-destructive/30",
    info: "bg-accent/20 text-accent border-accent/30",
  };

  return (
    <motion.span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
        variants[variant],
        glow && "shadow-neon-sm",
        className
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {children}
    </motion.span>
  );
};
