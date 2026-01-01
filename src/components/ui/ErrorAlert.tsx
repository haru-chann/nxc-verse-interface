import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
}

export const ErrorAlert = ({ isOpen, onClose, title = "Error", message }: ErrorAlertProps) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="border-destructive/50 bg-background/95 backdrop-blur-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertCircle className="h-6 w-6" />
                        <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-foreground text-base">
                        {message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={onClose}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground w-full sm:w-auto"
                    >
                        Okay, got it
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
