import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ArrowLeft, Upload, Trash2, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { storageService } from "@/services/storageService";
import { useAuth } from "@/contexts/AuthContext";

interface FormField {
    id: string;
    label: string;
    type: 'text' | 'image' | 'textarea' | 'email' | 'phone' | 'radio' | 'mcq';
    required: boolean;
    placeholder?: string;
    options?: string[];
}

export const CustomizeOrder = () => {
    const { planId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [fields, setFields] = useState<FormField[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (planId) {
            fetchForm(planId);
        }
    }, [planId]);

    const fetchForm = async (id: string) => {
        try {
            const safeId = id.replace(/\//g, '_');
            const docRef = doc(db, "forms", safeId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setFields(docSnap.data().fields || []);
            } else {
                setFields([]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load customization form");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (fieldId: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleImageUpload = async (fieldId: string, file: File) => {
        if (!file) return;

        if (!currentUser) {
            toast.error("You must be logged in to upload images.");
            return;
        }

        // If replacing, delete old one first
        if (formData[fieldId]) {
            try {
                await storageService.deleteImage(formData[fieldId]);
            } catch (err) {
                console.warn("Failed to delete old image", err);
            }
        }

        setUploading(prev => ({ ...prev, [fieldId]: true }));
        try {
            const path = `uploads/${currentUser.uid}/${Date.now()}_${file.name}`;
            const url = await storageService.uploadImage(file, path);
            setFormData(prev => ({ ...prev, [fieldId]: url }));
            toast.success("Image uploaded");
        } catch (error: any) {
            console.error("Upload Error:", error);
            const msg = error.code === 'storage/unauthorized'
                ? "Permission denied. Please check your login."
                : "Upload failed. Please try again.";
            toast.error(msg);
        } finally {
            setUploading(prev => ({ ...prev, [fieldId]: false }));
        }
    };

    const handleRemoveImage = async (fieldId: string) => {
        const url = formData[fieldId];
        if (!url) return;

        if (confirm("Are you sure you want to remove this image?")) {
            setUploading(prev => ({ ...prev, [fieldId]: true }));
            try {
                await storageService.deleteImage(url);
                setFormData(prev => {
                    const newData = { ...prev };
                    delete newData[fieldId];
                    return newData;
                });
                toast.success("Image removed");
            } catch (error) {
                console.error(error);
                toast.error("Failed to remove image");
            } finally {
                setUploading(prev => ({ ...prev, [fieldId]: false }));
            }
        }
    };

    const handleNext = () => {
        // Validation
        let hasError = false;
        for (const field of fields) {
            if (field.required && !formData[field.id]) {
                toast.error(`"${field.label}" is required`);
                hasError = true;
            }
        }

        if (hasError) return;

        navigate("/dashboard/checkout?plan=" + planId, {
            state: {
                customizationData: formData,
                formFields: fields // Pass labels too so we can show them nicely later
            }
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    const getPlanName = () => {
        if (!planId) return 'NFC Card';
        // Convert slug back to Title Case (e.g. ultra_premium -> Ultra Premium)
        return planId
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="pt-20 pb-20 max-w-2xl mx-auto px-4 animate-in fade-in duration-500">
            <button
                onClick={() => navigate("/pricing?minimal=true")}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Plans
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold font-display text-foreground mb-2">
                    Customize your <span className="text-primary">{getPlanName()}</span>
                </h1>
                <p className="text-muted-foreground">Please fill in the details below to personalize your card.</p>
            </div>

            <GlassCard className="p-6 md:p-8 space-y-8">
                {fields.length === 0 ? (
                    <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-foreground">Customization Form Missing</h3>
                        <p className="text-muted-foreground mb-6">
                            This plan requires a customization form, but none was found.
                            <br />
                            Please contact support to resolve this issue.
                        </p>
                        <NeonButton onClick={() => navigate("/contact")} className="w-full">
                            Contact Support
                        </NeonButton>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            {fields.map(field => (
                                <div key={field.id} className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex gap-1">
                                        {field.label}
                                        {field.required && <span className="text-red-500">*</span>}
                                    </label>

                                    {field.type === 'textarea' ? (
                                        <textarea
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full h-32 px-4 py-3 rounded-xl bg-black/20 border border-white/10 focus:border-primary focus:outline-none resize-none"
                                            placeholder={field.placeholder}
                                        />
                                    ) : field.type === 'image' ? (
                                        <div className="space-y-3">
                                            {formData[field.id] ? (
                                                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 group">
                                                    <img src={formData[field.id]} alt="Upload" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-4">
                                                        <input
                                                            type="file"
                                                            id={`replace-${field.id}`}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => e.target.files?.[0] && handleImageUpload(field.id, e.target.files[0])}
                                                        />
                                                        <label
                                                            htmlFor={`replace-${field.id}`}
                                                            className="cursor-pointer px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors shadow-lg"
                                                            title="Change Image"
                                                        >
                                                            Change
                                                        </label>
                                                        <button
                                                            onClick={() => handleRemoveImage(field.id)}
                                                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors shadow-lg"
                                                            title="Remove Image"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                    {uploading[field.id] && (
                                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                                            <div className="animate-spin text-primary">⏳</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        id={`upload-${field.id}`}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(field.id, e.target.files[0])}
                                                    />
                                                    <label
                                                        htmlFor={`upload-${field.id}`}
                                                        className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-black/20 hover:bg-black/40"
                                                    >
                                                        {uploading[field.id] ? (
                                                            <div className="animate-spin text-primary">⏳</div>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-6 h-6 text-muted-foreground" />
                                                                <span className="text-sm text-muted-foreground">Click to upload image</span>
                                                            </>
                                                        )}
                                                    </label>
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, WEBP</p>
                                        </div>
                                    ) : field.type === 'radio' ? (
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {field.options?.map((option, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleInputChange(field.id, option)}
                                                    className={`px-4 py-3 rounded-xl border text-left transition-all
                                                        ${formData[field.id] === option
                                                            ? 'bg-primary/20 border-primary text-primary font-bold shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                                                            : 'bg-black/20 border-white/10 text-muted-foreground hover:bg-white/5 hover:border-white/20'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                                                            ${formData[field.id] === option ? 'border-primary' : 'border-white/30'}
                                                        `}>
                                                            {formData[field.id] === option && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                        </div>
                                                        {option}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : field.type === 'mcq' ? (
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {field.options?.map((option, idx) => {
                                                const isSelected = formData[field.id] === option;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleInputChange(field.id, option)}
                                                        className={`px-4 py-3 rounded-xl border text-left transition-all
                                                            ${isSelected
                                                                ? 'bg-primary/20 border-primary text-primary font-bold shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                                                                : 'bg-black/20 border-white/10 text-muted-foreground hover:bg-white/5 hover:border-white/20'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                                                                ${isSelected ? 'border-primary bg-primary' : 'border-white/30'}
                                                            `}>
                                                                {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                                                            </div>
                                                            {option}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type}
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 focus:border-primary focus:outline-none"
                                            placeholder={field.placeholder}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <NeonButton onClick={handleNext} className="w-full py-4 text-lg">
                                Proceed to Checkout
                            </NeonButton>
                        </div>
                    </>
                )}
            </GlassCard>
        </div>
    );
};
