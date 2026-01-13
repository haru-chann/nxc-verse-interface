import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, GripVertical } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { planService } from "@/services/planService";

interface Product {
    id: string;
    name: string;
    price: string | number;
    description: string;
    features: string[];
    highlight: boolean;
    buttonText: string;
    path: string;
}

const defaultProducts: Product[] = [
    {
        id: "free",
        name: "Free",
        price: "Free",
        description: "Essential networking tools",
        features: ["Digital Profile Only", "5 Links limit", "1 QR option"],
        highlight: false,
        buttonText: "Get Started",
        path: "/signup"
    },
    {
        id: "plus",
        name: "Plus",
        price: 499,
        description: "The standard for professionals",
        features: ["Digital Profile", "Matte NFC Card", "10 Links limit"],
        highlight: false,
        buttonText: "Order Now",
        path: "/order"
    },
    {
        id: "platinum",
        name: "Platinum",
        price: 999,
        description: "Stand out with custom design",
        features: ["Everything in Plus", "Custom Design", "Priority Support"],
        highlight: true,
        buttonText: "Order Now",
        path: "/order"
    },
    {
        id: "ultra",
        name: "Ultra Premium",
        price: 1499,
        description: "The ultimate impression",
        features: [
            "Everything in Plus",
            "Custom Metal NFC Card",
            "Unlimited contact storage",
            "Private content mode",
        ],
        highlight: false,
        buttonText: "Order Now",
        path: "/order"
    }
];

export const CMSStore = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, "site_content", "store");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().products) {
                setProducts(docSnap.data().products);
            } else {
                setProducts(defaultProducts); // Fallback
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch store content");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "site_content", "store"), { products }, { merge: true });

            // Sync with Plan System
            // We import planService dynamically or just use the imported one if available
            // Assuming planService is imported. If not, I'll add the import in the next step.
            await planService.syncFromCMS(products);

            toast.success("Store content updated & Plans synced!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const updateProduct = (index: number, field: keyof Product, value: any) => {
        const newProducts = [...products];
        newProducts[index] = { ...newProducts[index], [field]: value };
        setProducts(newProducts);
    };

    const updateFeature = (productIndex: number, featureIndex: number, value: string) => {
        const newProducts = [...products];
        const newFeatures = [...newProducts[productIndex].features];
        newFeatures[featureIndex] = value;
        newProducts[productIndex].features = newFeatures;
        setProducts(newProducts);
    };

    const addFeature = (productIndex: number) => {
        const newProducts = [...products];
        newProducts[productIndex].features.push("New Feature");
        setProducts(newProducts);
    };

    const removeFeature = (productIndex: number, featureIndex: number) => {
        const newProducts = [...products];
        newProducts[productIndex].features.splice(featureIndex, 1);
        setProducts(newProducts);
    };

    const addProduct = () => {
        const newProduct: Product = {
            id: `plan_${Date.now()}`,
            name: "New Plan",
            price: 0,
            description: "New plan description",
            features: ["Feature 1", "Feature 2"],
            highlight: false,
            buttonText: "Order Now",
            path: "/order"
        };
        setProducts([...products, newProduct]);
        toast.success("New plan added. Remember to save!");
    };

    const handleRemoveProduct = (index: number) => {
        if (confirm("Are you sure you want to delete this plan?")) {
            const newProducts = [...products];
            newProducts.splice(index, 1);
            setProducts(newProducts);
            toast.success("Plan removed. Remember to save!");
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading Store...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-display">Manage Products</h2>
                <div className="flex gap-2">
                    <NeonButton onClick={addProduct} variant="outline" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add New Plan
                    </NeonButton>
                    <NeonButton onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </NeonButton>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {products.map((product, pIndex) => (
                    <GlassCard key={pIndex} className="p-6 space-y-4 relative group">
                        <button
                            onClick={() => handleRemoveProduct(pIndex)}
                            className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded"
                            title="Delete Plan"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>

                        <div className="flex justify-between items-start pr-8">
                            <div className="space-y-1 w-full mr-4">
                                <label className="text-xs text-muted-foreground">Product Name</label>
                                <input
                                    value={product.name}
                                    onChange={(e) => updateProduct(pIndex, 'name', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground font-bold"
                                />
                            </div>
                            <div className="space-y-1 w-32">
                                <label className="text-xs text-muted-foreground">Price</label>
                                <input
                                    value={product.price}
                                    onChange={(e) => updateProduct(pIndex, 'price', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground text-right"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Description</label>
                            <input
                                value={product.description}
                                onChange={(e) => updateProduct(pIndex, 'description', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">URL Path / ID (for customization)</label>
                            <input
                                value={product.path || product.id}
                                onChange={(e) => updateProduct(pIndex, 'path', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground text-sm font-mono"
                                placeholder="e.g. platinum"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground block">Features List</label>
                            {product.features.map((feature, fIndex) => (
                                <div key={fIndex} className="flex gap-2">
                                    <input
                                        value={feature}
                                        onChange={(e) => updateFeature(pIndex, fIndex, e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-foreground text-sm"
                                    />
                                    <button
                                        onClick={() => removeFeature(pIndex, fIndex)}
                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addFeature(pIndex)}
                                className="text-xs text-primary flex items-center gap-1 hover:text-primary/80 mt-2"
                            >
                                <Plus className="w-3 h-3" /> Add Feature
                            </button>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={product.highlight}
                                    onChange={(e) => updateProduct(pIndex, 'highlight', e.target.checked)}
                                    className="rounded border-white/10 bg-white/5 text-primary"
                                />
                                Highlight as Popular
                            </label>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                    <p className="text-muted-foreground mb-4">No plans found.</p>
                    <NeonButton onClick={addProduct} variant="outline" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create First Plan
                    </NeonButton>
                </div>
            )}
        </div>
    );
};
