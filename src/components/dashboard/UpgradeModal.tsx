import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { X, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    requiredPlan?: string; // Optional, to highlight a specific plan
}

export const UpgradeModal = ({
    isOpen,
    onClose,
    title = "Upgrade Required",
    description = "You've reached the limit of your current plan. Upgrade to unlock more features and capacity!"
}: UpgradeModalProps) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-md"
                >
                    <GlassCard variant="neon" className="relative p-8 text-center flex flex-col items-center gap-6 border-yellow-500/30">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2 animate-pulse">
                            <Crown className="w-8 h-8 text-yellow-500" />
                        </div>

                        {/* Content */}
                        <div>
                            <h2 className="text-2xl font-bold font-display text-foreground mb-2 flex items-center justify-center gap-2">
                                <span className="bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                                    {title}
                                </span>
                                <Sparkles className="w-5 h-5 text-yellow-500" />
                            </h2>
                            <p className="text-muted-foreground">{description}</p>
                        </div>

                        {/* Actions */}
                        <div className="w-full flex flex-col gap-3">
                            <NeonButton
                                onClick={() => navigate("/pricing")}
                                className="w-full justify-center"
                                variant="primary"
                            >
                                View Plans & Upgrade
                            </NeonButton>
                            <button
                                onClick={onClose}
                                className="text-sm text-muted-foreground hover:text-white transition-colors py-2"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
