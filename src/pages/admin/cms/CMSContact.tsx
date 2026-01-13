import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";

const defaultContact = {
    email: "nxcbadge@gmail.com",
    phone: "+919404276942",
    address: ""
};

export const CMSContact = () => {
    const [content, setContent] = useState<any>(defaultContact);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, "site_content", "contact");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setContent(docSnap.data());
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch Contact content");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "site_content", "contact"), content, { merge: true });
            toast.success("Contact info updated!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setContent({ ...content, [field]: value });
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading Contact...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-display">Manage Contact Info</h2>
                <NeonButton onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </NeonButton>
            </div>

            <GlassCard className="p-6 max-w-2xl space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Support Email</label>
                    <input
                        value={content.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">Used in Contact page and Footer</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <input
                        value={content.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Office Address</label>
                    <textarea
                        value={content.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground min-h-[100px]"
                        placeholder="Optional"
                    />
                </div>
            </GlassCard>
        </div>
    );
};
