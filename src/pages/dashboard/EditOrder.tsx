import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { FloatingSaveBar } from "@/components/ui/FloatingSaveBar";
import { ArrowLeft, Upload, Check, AlertTriangle, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { storageService } from "@/services/storageService";
import { useAuth } from "@/contexts/AuthContext";

export const EditOrder = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [order, setOrder] = useState<any>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [initialFormData, setInitialFormData] = useState<Record<string, any>>({});
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (orderId && currentUser) {
            fetchOrderAndForm(orderId);
        }
    }, [orderId, currentUser]);

    const fetchOrderAndForm = async (id: string) => {
        try {
            // 1. Fetch Order
            const orderRef = doc(db, "orders", id);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                setError("Order not found");
                setLoading(false);
                return;
            }

            const orderData = orderSnap.data();

            // Verify Ownership
            if (orderData.userId !== currentUser?.uid) {
                setError("Unauthorized access");
                setLoading(false);
                return;
            }

            // Verify Status (Only allow 'order_received')
            if (orderData.status !== 'order_received') {
                toast.error("This order is already processing and cannot be edited.");
                navigate('/dashboard/my-cards');
                return;
            }

            setOrder({ id: orderSnap.id, ...orderData });
            setFormData(orderData.customization || {});
            setInitialFormData(orderData.customization || {});

            // 2. Fetch Form Definition (using strict name slug logic)
            // The planId stored in order should match the strict slug logic now (e.g. "ultra_premium")
            const planId = orderData.planId;
            const formRef = doc(db, "forms", planId); // planId should be the slug
            const formSnap = await getDoc(formRef);

            if (formSnap.exists()) {
                setFields(formSnap.data().fields || []);
            } else {
                // Fallback: try to use formSnapshot from the order itself if available
                if (orderData.formSnapshot) {
                    setFields(orderData.formSnapshot);
                }
            }

        } catch (err) {
            console.error(err);
            setError("Failed to load order details");
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
            toast.error("Session expired. Please reload.");
            return;
        }

        // If replacing, delete old one first (optional, but good for cleanup)
        if (formData[fieldId]) {
            try {
                // Note: Deleting assumes we own the file. 
                // We'll skip strict delete error handling to avoid blocking new uploads
                await storageService.deleteImage(formData[fieldId]);
            } catch (err) {
                console.warn("Failed to delete old image", err);
            }
        }

        setUploading(prev => ({ ...prev, [fieldId]: true }));
        try {
            // Use safe path
            const path = `uploads/${currentUser.uid}/${Date.now()}_${file.name}`;
            const url = await storageService.uploadImage(file, path);
            setFormData(prev => ({ ...prev, [fieldId]: url }));
            toast.success("Image updated");
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

    const handleSave = async () => {
        if (!order || !orderId) return;

        // Validation
        let hasError = false;
        for (const field of fields) {
            if (field.required && !formData[field.id]) {
                toast.error(`"${field.label}" is required`);
                hasError = true;
            }
        }
        if (hasError) return;

        setSaving(true);
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                customization: formData,
                formSnapshot: fields // Update snapshot in case fields changed (optional but good)
            });
            toast.success("Order details updated successfully");
            setInitialFormData(formData); // Reset dirty state
            navigate('/dashboard/my-cards');
        } catch (error) {
            console.error(error);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Error</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <NeonButton onClick={() => navigate('/dashboard/my-cards')}>Back to My Cards</NeonButton>
            </div>
        );
    }

    return (
        <div className="pt-20 pb-20 max-w-2xl mx-auto px-4 animate-in fade-in duration-500">
            <button
                onClick={() => navigate("/dashboard/my-cards")}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to My Cards
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold font-display text-foreground mb-2">
                    Edit Order <span className="text-primary">#{order?.id?.slice(0, 8)}</span>
                </h1>
                <p className="text-muted-foreground">
                    Update your customization details.
                    <br />
                    <span className="text-yellow-500 text-sm">
                        Note: You can only edit this while the order is in "Order Received" status.
                    </span>
                </p>
            </div>

            <GlassCard className="p-6 md:p-8 space-y-8">
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
                                            {/* Always visible actions for better UX */}
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
                                                >
                                                    Change
                                                </label>
                                                <button
                                                    onClick={() => {
                                                        if (confirm("Remove this image?")) {
                                                            const newFormData = { ...formData };
                                                            delete newFormData[field.id];
                                                            setFormData(newFormData);
                                                            // Optional: Trigger delete from storage if verified
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-red-500/80 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors shadow-lg flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Remove
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
                                </div>
                            ) : (
                                <input
                                    type={field.type === 'mcq' ? 'text' : field.type} // Fallback for complex types in simple edit
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 focus:border-primary focus:outline-none"
                                    placeholder={field.placeholder}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="pt-6 border-t border-white/10 flex gap-4">
                    <button
                        onClick={() => navigate('/dashboard/my-cards')}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </GlassCard>

            <FloatingSaveBar
                isOpen={isDirty}
                onSave={handleSave}
                loading={saving}
            />
        </div>
    );
};
