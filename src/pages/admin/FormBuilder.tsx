import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Plus, Trash2, Save, ArrowLeft, GripVertical, Image as ImageIcon, Type, CheckCircle2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

interface FormField {
    id: string;
    label: string;
    type: 'text' | 'image' | 'textarea' | 'email' | 'phone' | 'radio' | 'mcq';
    required: boolean;
    placeholder?: string;
    options?: string[];
}

export const FormBuilder = () => {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<string>("");
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [fields, setFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    useEffect(() => {
        if (selectedPlan) {
            fetchForm(selectedPlan);
        }
    }, [selectedPlan]);

    const fetchPlans = async () => {
        try {
            const docRef = doc(db, "site_content", "store");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().products) {
                const products = docSnap.data().products;
                // Filter out free plans for the default selection logic
                const paidPlans = products.filter((p: any) => p.name !== 'Free' && p.price !== 'Free' && p.path !== '/signup');
                setAvailablePlans(products); // Keep all in state, but we filter in render. Actually better to filter here? 
                // Let's filter in render to keep state raw, BUT we need to select a valid one.

                if (paidPlans.length > 0) {
                    setSelectedPlan(paidPlans[0].name);
                } else if (products.length > 0) {
                    setSelectedPlan(products[0].name);
                }
            } else {
                toast.error("No plans found in store");
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
            toast.error("Failed to load plans");
        }
    };

    const getPlanId = (name: string) => {
        // STRICT: Always use name-based slug. 
        // This guarantees that Pricing (which uses name slug) and FormBuilder match 100%.
        return name.toLowerCase().replace(/\s+/g, '_');
    };

    const fetchForm = async (planName: string) => {
        setLoading(true);
        setFields([]);

        const plan = availablePlans.find(p => p.name === planName);
        if (!plan) {
            setLoading(false);
            return;
        }

        // Priority 1: Use the explicit Path/ID defined in CMS (matches Pricing page navigation)
        // If path is like '/platinum', strip slash. If it's 'plan_123', use as is.
        const routingId = (plan.path && plan.path !== '/order') ? plan.path.replace(/^\//, '') : plan.id;

        // Priority 2: Fallback to name slug (Legacy / existing forms created before fix)
        const legacySlug = planName.toLowerCase().replace(/\s+/g, '_');

        try {
            // Try explicit Routing ID first (Correct behavior)
            let docSnap = await getDoc(doc(db, "forms", routingId));

            // Fallback: Try Legacy Name Slug
            if (!docSnap.exists() && legacySlug !== routingId) {
                const legacySnap = await getDoc(doc(db, "forms", legacySlug));
                if (legacySnap.exists()) {
                    console.log("Found legacy form by name slug");
                    docSnap = legacySnap;
                }
            }

            if (docSnap.exists()) {
                setFields(docSnap.data().fields || []);
            } else {
                setFields([]);
            }
        } catch (error) {
            console.error(error);
            setFields([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddField = () => {
        const newField: FormField = {
            id: `field_${Date.now()}`,
            label: "New Field",
            type: "text",
            required: true,
            placeholder: "",
            options: []
        };
        setFields([...fields, newField]);
    };

    const handleRemoveField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const handleFieldChange = (id: string, key: keyof FormField, value: any) => {
        setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    const handleMoveField = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === fields.length - 1) return;

        const newFields = [...fields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];

        setFields(newFields);
    };

    const handleSave = async () => {
        if (fields.length === 0) {
            toast.warning("Form is empty. Are you sure?");
        }
        setSaving(true);

        const plan = availablePlans.find(p => p.name === selectedPlan);
        if (!plan) {
            toast.error("Invalid plan selected");
            setSaving(false);
            return;
        }

        // Use the same ID logic as fetchForm
        const routingId = (plan.path && plan.path !== '/order') ? plan.path.replace(/^\//, '') : plan.id;

        try {
            await setDoc(doc(db, "forms", routingId), {
                planId: routingId,
                planName: selectedPlan,
                updatedAt: new Date(),
                fields: fields
            });
            toast.success("Form saved successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save form");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pt-20 max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate("/admin")}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold font-display text-foreground">
                        Form <span className="text-primary">Builder</span>
                    </h1>
                    <p className="text-muted-foreground">Create customization forms for each plan.</p>
                </div>

                <NeonButton onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
                    Save Form
                </NeonButton>
            </div>

            {/* Plan Selector */}
            <div className="flex gap-4 overflow-x-auto pb-2">
                {availablePlans
                    .filter(plan => plan.name !== 'Free' && plan.price !== 'Free' && plan.path !== '/signup')
                    .map((plan, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedPlan(plan.name)}
                            className={`px-4 py-2 rounded-xl border transition-all whitespace-nowrap
                                ${selectedPlan === plan.name
                                    ? 'bg-primary/20 border-primary text-primary font-bold'
                                    : 'bg-muted/30 border-white/10 text-muted-foreground hover:bg-white/5'
                                }
                            `}
                        >
                            {plan.name}
                        </button>
                    ))}
            </div>

            <div className="space-y-4">
                {fields.map((field, index) => (
                    <GlassCard key={field.id} className="p-4 group">
                        <div className="flex items-start gap-4">
                            <div className="flex flex-col gap-2 mt-2">
                                <button
                                    onClick={() => handleMoveField(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    title="Move Up"
                                >
                                    <ArrowUp className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <div className="text-muted-foreground cursor-grab active:cursor-grabbing px-1">
                                    <GripVertical className="w-4 h-4" />
                                </div>
                                <button
                                    onClick={() => handleMoveField(index, 'down')}
                                    disabled={index === fields.length - 1}
                                    className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    title="Move Down"
                                >
                                    <ArrowDown className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Field Label</label>
                                    <input
                                        value={field.label}
                                        onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                        placeholder="e.g. Name on Card"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Input Type</label>
                                    <select
                                        value={field.type}
                                        onChange={(e) => handleFieldChange(field.id, 'type', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-foreground [&>option]:bg-black"
                                    >
                                        <option value="text">Text Input</option>
                                        <option value="textarea">Long Text / Bio</option>
                                        <option value="image">Image Upload</option>
                                        <option value="email">Email</option>
                                        <option value="phone">Phone</option>
                                        <option value="radio">Radio Select (Single Answer)</option>
                                        <option value="mcq">MCQ (Single Answer)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Placeholder (Optional)</label>
                                    <input
                                        value={field.placeholder || ''}
                                        onChange={(e) => handleFieldChange(field.id, 'placeholder', e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                        placeholder="Enter text to show when empty..."
                                    />
                                </div>

                                <div className="flex items-center gap-4 pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={field.required}
                                            onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-500 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm">Required</span>
                                    </label>

                                    <button
                                        onClick={() => handleRemoveField(field.id)}
                                        className="ml-auto text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                                        title="Delete Field"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Options Editor for Radio Select or MCQ */}
                        {(field.type === 'radio' || field.type === 'mcq') && (
                            <div className="mt-4 pl-12 border-t border-white/5 pt-4">
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Options</label>
                                <div className="space-y-2">
                                    {field.options?.map((option, optIndex) => (
                                        <div key={optIndex} className="flex gap-2">
                                            <input
                                                value={option}
                                                onChange={(e) => {
                                                    const newOptions = [...(field.options || [])];
                                                    newOptions[optIndex] = e.target.value;
                                                    handleFieldChange(field.id, 'options', newOptions);
                                                }}
                                                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm"
                                                placeholder={`Option ${optIndex + 1}`}
                                            />
                                            <button
                                                onClick={() => {
                                                    const newOptions = field.options?.filter((_, i) => i !== optIndex);
                                                    handleFieldChange(field.id, 'options', newOptions);
                                                }}
                                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const newOptions = [...(field.options || []), "New Option"];
                                            handleFieldChange(field.id, 'options', newOptions);
                                        }}
                                        className="text-xs text-primary flex items-center gap-1 hover:text-primary/80"
                                    >
                                        <Plus className="w-3 h-3" /> Add Option
                                    </button>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                ))}

                <button
                    onClick={handleAddField}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Field
                </button>
            </div>

        </div>
    );
};
