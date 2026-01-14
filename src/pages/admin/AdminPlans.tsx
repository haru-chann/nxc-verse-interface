import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { planService, Plan, DEFAULT_PLANS } from "@/services/planService";
import { toast } from "sonner";
import { Loader2, Plus, Edit2, Save, X, Check, Trash2, Shield, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const AdminPlans = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [initialEditingPlan, setInitialEditingPlan] = useState<Plan | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [cmsProducts, setCmsProducts] = useState<any[]>([]);

    // Real-time Load
    useEffect(() => {
        const unsubscribe = planService.subscribeToPlans((updatedPlans) => {
            setPlans(updatedPlans);
            setLoading(false);
        });
        fetchCmsProducts();
        return () => unsubscribe();
    }, []);

    const fetchCmsProducts = async () => {
        try {
            const docRef = doc(db, "site_content", "store");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().products) {
                setCmsProducts(docSnap.data().products);
            }
        } catch (error) {
            console.error("Failed to fetch CMS products", error);
        }
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan({ ...plan });
        setInitialEditingPlan({ ...plan });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        const newPlan: Plan = {
            id: `plan_${Date.now()}`,
            name: "New Plan",
            price: 0,
            description: "",
            limits: { links: 0, contacts: 0, exports: 0, portfolioItems: 0, privateContentItems: 0 },
            features: { portfolio: false, privateContent: false, customBranding: false, wallpaper: false },
            visuals: { goldRing: false, royalTexture: false },
            tierOrder: plans.length,
            isActive: true
        };
        setEditingPlan(newPlan);
        setInitialEditingPlan(newPlan);
        setIsModalOpen(true);
    };

    const handleLinkProduct = (productName: string) => {
        if (!editingPlan) return;
        const product = cmsProducts.find(p => p.name === productName);
        if (product) {
            // Generate ID same as FormBuilder: lowercase, underscores
            const linkedId = product.name.toLowerCase().replace(/\s+/g, '_');
            setEditingPlan({
                ...editingPlan,
                id: linkedId,
                name: product.name,
                price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
                description: product.description || editingPlan.description
            });
        }
    };

    const handleSave = async () => {
        if (!editingPlan) return;

        // Validation
        if (isNaN(editingPlan.price)) {
            toast.error("Price must be a valid number");
            return;
        }
        if (isNaN(editingPlan.limits.links) || isNaN(editingPlan.limits.contacts) || isNaN(editingPlan.limits.exports)) {
            toast.error("Limits must be valid numbers");
            return;
        }
        // Force defaults for new fields if NaN
        const cleanPlan = {
            ...editingPlan,
            limits: {
                ...editingPlan.limits,
                portfolioItems: isNaN(editingPlan.limits.portfolioItems) ? 0 : editingPlan.limits.portfolioItems,
                privateContentItems: isNaN(editingPlan.limits.privateContentItems) ? 0 : editingPlan.limits.privateContentItems
            }
        };

        try {
            await planService.savePlan(cleanPlan);
            toast.success("Plan saved successfully!");
            setIsModalOpen(false);
            // No manual loadPlans needed - subscription handles it
        } catch (error: any) {
            console.error("Save Plan Error:", error);
            toast.error(`Failed to save plan: ${error.message || "Unknown error"}`);
        }
    };

    const handleDelete = async (planId: string) => {
        if (confirm("Are you sure you want to delete this plan? This action cannot be undone.")) {
            try {
                await planService.deletePlan(planId);
                toast.success("Plan deleted");
            } catch (error) {
                console.error(error);
                toast.error("Failed to delete plan");
            }
        }
    };

    const handleSeedDefaults = async () => {
        if (confirm("This will overwrite existing plans with defaults. Continue?")) {
            setLoading(true);
            try {
                await planService.seedDefaults();
                toast.success("Default plans seeded!");
            } catch (err) {
                toast.error("Failed to seed");
            } finally {
                setLoading(false);
            }
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-display text-foreground">Plan Management</h1>
                    <p className="text-muted-foreground">Configure limits and features for your Store Products.</p>
                </div>
                <div className="flex gap-2">
                    {/* Creation now handled in CMS only */}
                    <div className="text-xs text-muted-foreground bg-white/5 px-3 py-2 rounded-lg border border-white/10 flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                        Managed via CMS Store
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {plans.map((plan) => (
                    <GlassCard key={plan.id} className="relative overflow-hidden group">
                        {/* Background Visual Hint */}
                        {plan.visuals.royalTexture && (
                            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/gold-scale.png')] pointer-events-none" />
                        )}

                        <div className="flex flex-col md:flex-row gap-6 p-2">
                            {/* Header Info */}
                            <div className="flex-1 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                                    {plan.visuals.goldRing && <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]" title="Gold Ring Visual" />}
                                    {plan.visuals.royalTexture && <div title="Royal Texture Visual"><Crown className="w-4 h-4 text-yellow-500" /></div>}
                                </div>
                                <div className="text-2xl font-bold text-primary mb-2">₹{plan.price}</div>
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                                <p className="text-xs text-muted-foreground mt-2 font-mono">ID: {plan.id}</p>
                            </div>

                            {/* Limits Table */}
                            <div className="flex-1 grid grid-cols-3 gap-4 text-center bg-muted/30 p-4 rounded-xl border border-white/5">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase">Links</div>
                                    <div className="font-bold text-lg">{plan.limits.links}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase">Contacts</div>
                                    <div className="font-bold text-lg">{plan.limits.contacts > 10000 ? "Unl." : plan.limits.contacts}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase">Exports</div>
                                    <div className="font-bold text-lg">{plan.limits.exports > 10000 ? "Unl." : plan.limits.exports}</div>
                                </div>
                            </div>

                            {/* Features List */}
                            <div className="flex-1 flex flex-col justify-center gap-2 text-sm">
                                <div className={plan.features.portfolio ? "text-green-400 flex items-center gap-2" : "text-muted-foreground flex items-center gap-2 opacity-50"}>
                                    {plan.features.portfolio ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Portfolio
                                </div>
                                <div className={plan.features.privateContent ? "text-green-400 flex items-center gap-2" : "text-muted-foreground flex items-center gap-2 opacity-50"}>
                                    {plan.features.privateContent ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Private Content
                                </div>
                                <div className={plan.features.customBranding ? "text-green-400 flex items-center gap-2" : "text-muted-foreground flex items-center gap-2 opacity-50"}>
                                    {plan.features.customBranding ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Custom Branding
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col justify-center gap-2">
                                <NeonButton size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                                    <Edit2 className="w-4 h-4" />
                                </NeonButton>
                                <button onClick={() => handleDelete(plan.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isModalOpen && editingPlan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h2 className="text-xl font-bold font-display">Edit Plan</h2>
                                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                                {/* Basic Info */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Basic Info</h3>

                                    {/* CMS Linker (Only for new or manually created plans) */}
                                    {editingPlan.id.startsWith('plan_') && (
                                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                                            <label className="text-xs text-primary font-bold block mb-2">Link to CMS Product (Auto-fill)</label>
                                            <select
                                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white"
                                                onChange={(e) => handleLinkProduct(e.target.value)}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Select a product to import...</option>
                                                {cmsProducts.map((p, i) => (
                                                    <option key={i} value={p.name}>{p.name} ({p.price})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground">ID (Unique)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm font-mono text-muted-foreground"
                                                    value={editingPlan.id}
                                                    onChange={e => setEditingPlan({ ...editingPlan, id: e.target.value })}
                                                    // Allow editing if it's a new temporary plan, otherwise locked to prevent data loss
                                                    readOnly={!editingPlan.id.startsWith('plan_')}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                Must match CMS product slug (e.g. 'gold_card') for linking.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Tier Order</label>
                                            <input
                                                type="number"
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm text-white"
                                                value={editingPlan.tierOrder}
                                                onChange={e => setEditingPlan({ ...editingPlan, tierOrder: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-muted-foreground">Plan Name</label>
                                            <input
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                                value={editingPlan.name}
                                                onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-muted-foreground">Description</label>
                                            <input
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                                value={editingPlan.description}
                                                onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Price (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                                value={editingPlan.price}
                                                onChange={e => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Limits */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Limits</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground">Max Links</label>
                                            <input
                                                type="number"
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                                value={editingPlan.limits.links}
                                                onChange={e => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, links: parseInt(e.target.value) } })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Max Contacts</label>
                                            <input
                                                type="number"
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                                value={editingPlan.limits.contacts}
                                                onChange={e => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, contacts: parseInt(e.target.value) } })}
                                            />
                                            <p className="text-[10px] text-muted-foreground mt-1">999999 = Unlimited</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Max Exports/Mo</label>
                                            <input
                                                type="number"
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                                value={editingPlan.limits.exports}
                                                onChange={e => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, exports: parseInt(e.target.value) } })}
                                            />
                                            <p className="text-[10px] text-muted-foreground mt-1">999999 = Unlimited</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Max Portfolio Items</label>
                                            <input
                                                type="number"
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                                value={editingPlan.limits.portfolioItems || 0}
                                                onChange={e => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, portfolioItems: parseInt(e.target.value) } })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Max Private Content</label>
                                            <input
                                                type="number"
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                                value={editingPlan.limits.privateContentItems || 0}
                                                onChange={e => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, privateContentItems: parseInt(e.target.value) } })}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Features & Visuals */}
                                <section className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Features</h3>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                            <span>Portfolio</span>
                                            <Switch checked={editingPlan.features.portfolio} onCheckedChange={c => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, portfolio: c } })} />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                            <span>Private Content</span>
                                            <Switch checked={editingPlan.features.privateContent} onCheckedChange={c => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, privateContent: c } })} />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                            <span>Custom Branding</span>
                                            <Switch checked={editingPlan.features.customBranding} onCheckedChange={c => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, customBranding: c } })} />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                            <span>Wallpaper</span>
                                            <Switch checked={editingPlan.features.wallpaper} onCheckedChange={c => setEditingPlan({ ...editingPlan, features: { ...editingPlan.features, wallpaper: c } })} />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Visual Effects</h3>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                            <span className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-yellow-500" /> Gold Glowing Ring
                                            </span>
                                            <Switch checked={editingPlan.visuals.goldRing} onCheckedChange={c => setEditingPlan({ ...editingPlan, visuals: { ...editingPlan.visuals, goldRing: c } })} />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                            <span className="flex items-center gap-2">
                                                <Crown className="w-4 h-4 text-yellow-500" /> Royal Texture
                                            </span>
                                            <Switch checked={editingPlan.visuals.royalTexture} onCheckedChange={c => setEditingPlan({ ...editingPlan, visuals: { ...editingPlan.visuals, royalTexture: c } })} />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/5">
                                <NeonButton variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</NeonButton>
                                <NeonButton onClick={handleSave} disabled={JSON.stringify(editingPlan) === JSON.stringify(initialEditingPlan)}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </NeonButton>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
