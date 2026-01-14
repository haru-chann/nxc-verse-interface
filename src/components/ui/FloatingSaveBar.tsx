import { motion, AnimatePresence } from "framer-motion";
import { NeonButton } from "./NeonButton";
import { Loader2, Save } from "lucide-react";

interface FloatingSaveBarProps {
    onSave: () => void;
    loading?: boolean;
    isOpen: boolean;
    disabled?: boolean;
    label?: string;
}

export const FloatingSaveBar = ({
    onSave,
    loading = false,
    isOpen,
    disabled = false,
    label = "Save Changes"
}: FloatingSaveBarProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="pointer-events-auto bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-6 pr-2 shadow-2xl flex items-center gap-4 max-w-md w-full"
                    >
                        <div className="flex-1 text-sm text-gray-400 font-medium">
                            You have unsaved changes
                        </div>
                        <NeonButton
                            onClick={onSave}
                            disabled={loading || disabled}
                            size="sm"
                            className="px-6"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {label}
                        </NeonButton>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
