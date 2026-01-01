import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info" | "success";
    loading?: boolean;
}

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger",
    loading = false,
}: ConfirmDialogProps) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case "danger":
                return <AlertCircle className="w-8 h-8 text-destructive" />;
            case "warning":
                return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
            case "success":
                return <CheckCircle2 className="w-8 h-8 text-green-500" />;
            default:
                return <Info className="w-8 h-8 text-primary" />;
        }
    };

    const getColorClass = () => {
        switch (type) {
            case "danger":
                return "bg-destructive/10 border-destructive/20";
            case "warning":
                return "bg-yellow-500/10 border-yellow-500/20";
            case "success":
                return "bg-green-500/10 border-green-500/20";
            default:
                return "bg-primary/10 border-primary/20";
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative z-10 w-full max-w-sm"
                >
                    {/* Glowing Effect based on type */}
                    <div className={`absolute -inset-1 bg-gradient-to-r rounded-2xl blur opacity-20 animate-pulse ${type === 'danger' ? 'from-destructive via-red-500 to-destructive' :
                            type === 'warning' ? 'from-yellow-500 via-orange-500 to-yellow-500' :
                                'from-primary via-accent to-primary'
                        }`} />

                    <GlassCard className="p-6 relative text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getColorClass()}`}>
                            {getIcon()}
                        </div>

                        <h2 className="text-xl font-bold font-display text-foreground mb-2">{title}</h2>
                        <p className="text-muted-foreground mb-6 text-sm">{description}</p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <NeonButton
                                onClick={onConfirm}
                                disabled={loading}
                                variant={type === 'danger' ? 'primary' : 'outline'} // Use primary style for danger to make it prominent but red? NeonButton usually is primary color. 
                                // Let's rely on the fact that NeonButton is usually "Primary". 
                                // Typically "Delete" is Red. NeonButton might not support 'destructive' variant. 
                                // Looking at NeonButton usage, it has 'variant', 'glow'.
                                // I will assume standard NeonButton is fine, or I might need to style it manually if NeonButton logic is strict.
                                // For now, I'll use standard NeonButton but if type is danger, I'll try to override style via className if possible.
                                className={type === 'danger' ? "!bg-destructive !shadow-[0_0_20px_rgba(239,68,68,0.5)] !border-destructive/50 hover:!bg-destructive/90" : ""}
                            >
                                {loading ? "Processing..." : confirmText}
                            </NeonButton>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmDialog;
