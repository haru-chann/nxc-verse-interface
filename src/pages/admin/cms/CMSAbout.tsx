import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";

const defaultAbout = {
    story: [
        "NXC Badge Verse was born in November 2024 from one fearless idea — professional identity should feel powerful, futuristic, and alive.",
        "Built by students with ambition that refuses to shrink, we created a digital visiting card platform engineered like a blockbuster: precise, immersive, and built to last.",
        "Led by Ritesh Martawar with the strength of Vishal Pandey, Ishaan Apte, and Meghant Darji, this isn’t just tech. It’s a statement. And it’s only the beginning."
    ],
    values: [
        { title: "Mission-Driven", description: "We're on a mission to revolutionize how professionals connect." },
        { title: "User-Centric", description: "Every feature we build starts with our users." },
    ],
    team: [
        { name: "Ritesh Martawar", role: "Founder & Developer", avatar: "RM" },
        { name: "Vishal Pandey", role: "Co-Founder & Developer", avatar: "VP" },
        { name: "Ishaan Apte", role: "Designer", avatar: "IA" },
        { name: "Meghant Darji", role: "Product Head", avatar: "MD" },
        { name: "Saksham Jiddewar", role: "Marketing Strategist", avatar: "SJ" }
    ]
};

export const CMSAbout = () => {
    const [content, setContent] = useState<any>(defaultAbout);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, "site_content", "about");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setContent(docSnap.data());
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch About content");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "site_content", "about"), content, { merge: true });
            toast.success("About content updated!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const updateStoryParagraph = (index: number, value: string) => {
        const newStory = [...(content.story || [])];
        newStory[index] = value;
        setContent({ ...content, story: newStory });
    };

    const addStoryParagraph = () => {
        setContent({ ...content, story: [...(content.story || []), "New paragraph"] });
    };

    const removeStoryParagraph = (index: number) => {
        const newStory = [...content.story];
        newStory.splice(index, 1);
        setContent({ ...content, story: newStory });
    };

    // Values Helpers
    const updateValue = (index: number, field: string, value: string) => {
        const newValues = [...(content.values || [])];
        newValues[index] = { ...newValues[index], [field]: value };
        setContent({ ...content, values: newValues });
    };
    const addValue = () => {
        setContent({ ...content, values: [...(content.values || []), { title: "New Value", description: "Description" }] });
    };
    const removeValue = (index: number) => {
        const newValues = [...(content.values || [])];
        newValues.splice(index, 1);
        setContent({ ...content, values: newValues });
    };

    // Team Helpers
    const updateTeam = (index: number, field: string, value: string) => {
        const newTeam = [...(content.team || [])];
        newTeam[index] = { ...newTeam[index], [field]: value };
        setContent({ ...content, team: newTeam });
    };
    const addTeamMember = () => {
        setContent({ ...content, team: [...(content.team || []), { name: "New Member", role: "Role", avatar: "NM" }] });
    };
    const removeTeamMember = (index: number) => {
        const newTeam = [...(content.team || [])];
        newTeam.splice(index, 1);
        setContent({ ...content, team: newTeam });
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading About...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-display">Manage About Page</h2>
                <NeonButton onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </NeonButton>
            </div>

            {/* Story Section */}
            <GlassCard className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground">Our Story</h3>
                <div className="space-y-4">
                    {content.story?.map((paragraph: string, index: number) => (
                        <div key={index} className="flex gap-2">
                            <textarea
                                value={paragraph}
                                onChange={(e) => updateStoryParagraph(index, e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-muted-foreground min-h-[80px]"
                            />
                            <button onClick={() => removeStoryParagraph(index)} className="text-red-500 hover:bg-red-500/10 p-2 rounded h-fit">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button onClick={addStoryParagraph} className="text-primary text-sm flex items-center gap-1 hover:underline">
                        <Plus className="w-3 h-3" /> Add Paragraph
                    </button>
                </div>
            </GlassCard>

            {/* Values Section */}
            <GlassCard className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground">Our Values</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {content.values?.map((val: any, index: number) => (
                        <div key={index} className="p-4 bg-white/5 rounded-lg space-y-2 relative group">
                            <button onClick={() => removeValue(index)} className="absolute top-2 right-2 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <input
                                value={val.title}
                                onChange={(e) => updateValue(index, 'title', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent focus:border-primary font-bold text-foreground"
                                placeholder="Value Title"
                            />
                            <textarea
                                value={val.description}
                                onChange={(e) => updateValue(index, 'description', e.target.value)}
                                className="w-full bg-transparent text-sm text-muted-foreground resize-none"
                                placeholder="Description"
                            />
                        </div>
                    ))}
                </div>
                <button onClick={addValue} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-primary text-sm flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Value
                </button>
            </GlassCard>

            {/* Team Section */}
            <GlassCard className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground">Team Members</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {content.team?.map((member: any, index: number) => (
                        <div key={index} className="p-4 bg-white/5 rounded-lg space-y-2 relative group flex items-center gap-3">
                            <button onClick={() => removeTeamMember(index)} className="absolute top-2 right-2 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">
                                <input
                                    value={member.avatar}
                                    onChange={(e) => updateTeam(index, 'avatar', e.target.value)}
                                    className="w-full h-full bg-transparent text-center focus:outline-none"
                                    maxLength={2}
                                />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <input
                                    value={member.name}
                                    onChange={(e) => updateTeam(index, 'name', e.target.value)}
                                    className="w-full bg-transparent font-medium text-foreground text-sm focus:border-b border-primary p-0"
                                    placeholder="Name"
                                />
                                <input
                                    value={member.role}
                                    onChange={(e) => updateTeam(index, 'role', e.target.value)}
                                    className="w-full bg-transparent text-xs text-muted-foreground focus:border-b border-primary p-0"
                                    placeholder="Role"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={addTeamMember} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-primary text-sm flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Team Member
                </button>
            </GlassCard>
        </div>
    );
};
