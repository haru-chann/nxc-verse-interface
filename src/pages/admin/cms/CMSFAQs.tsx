import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { FloatingSaveBar } from "@/components/ui/FloatingSaveBar";

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQCategory {
    name: string;
    faqs: FAQItem[];
}

const defaultFAQs: FAQCategory[] = [
    {
        name: "General",
        faqs: [
            {
                question: "What is NXC Badge Verse?",
                answer: "NXC Badge Verse is a digital identity platform that combines premium NFC-enabled metal cards with customizable digital profiles. When someone taps your card or scans your QR code, they instantly see your professional profile with all your links, portfolio, and contact information.",
            },
            {
                question: "How does the NFC card work?",
                answer: "Our metal NFC cards contain a small chip that communicates with smartphones when tapped. Simply hold your card near someone's phone (no app needed), and your profile opens in their browser instantly. Works with all modern iPhones and Android devices.",
            },
            {
                question: "Do people need to download an app to view my profile?",
                answer: "No! That's the beauty of NXC Badge Verse. Your profile opens directly in the browser - no app required. This means anyone can view your profile regardless of what phone they have.",
            },
        ],
    },
    {
        name: "Cards & Products",
        faqs: [
            {
                question: "What materials are the cards made of?",
                answer: "We offer cards in various premium materials: Stainless Steel (matte black, brushed silver), Carbon Fiber, and Gold-plated options. All cards are water-resistant and built to last with a lifetime warranty.",
            },
            {
                question: "Can I customize the card design?",
                answer: "Yes! All cards can be laser-engraved with your name, logo, or custom design. For businesses, we offer fully custom card designs. Contact our sales team for bulk custom orders.",
            },
            {
                question: "How long does shipping take?",
                answer: "Standard shipping is 5-7 business days. Express shipping (2-3 days) is available at checkout. We ship worldwide with free standard shipping on all orders.",
            },
        ],
    },
    {
        name: "Profile & Features",
        faqs: [
            {
                question: "Can I change my profile after getting a card?",
                answer: "Absolutely! Your NFC card links to your digital profile, which you can update anytime. Change your links, photos, bio, themes - everything updates instantly without needing a new card.",
            },
            {
                question: "What can I include on my profile?",
                answer: "You can add: bio, profile photo, custom wallpaper, unlimited social links, website links, portfolio items, contact form, downloadable files, video embeds, and much more. Pro users get access to advanced customization.",
            },
        ],
    },
    {
        name: "Pricing & Billing",
        faqs: [
            {
                question: "Is there a free plan?",
                answer: "Yes! Our free plan includes 1 digital profile, basic QR code, 5 links, and basic analytics. It's perfect for getting started. Upgrade anytime for more features.",
            },
            {
                question: "Can I cancel my subscription anytime?",
                answer: "There's no subscription involved, it's a one time payment.",
            },
        ],
    },
];

export const CMSFAQs = () => {
    const [categories, setCategories] = useState<FAQCategory[]>([]);
    const [initialCategories, setInitialCategories] = useState<FAQCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<number | null>(0);

    const isDirty = JSON.stringify(categories) !== JSON.stringify(initialCategories);

    useEffect(() => {
        fetchFAQs();
    }, []);

    const fetchFAQs = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, "site_content", "faqs");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().categories) {
                setCategories(docSnap.data().categories);
                setInitialCategories(docSnap.data().categories);
            } else {
                setCategories(defaultFAQs);
                setInitialCategories(defaultFAQs);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch FAQs");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "site_content", "faqs"), { categories }, { merge: true });
            toast.success("FAQs updated!");
            setInitialCategories(categories);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const addCategory = () => {
        setCategories([...categories, { name: "New Category", faqs: [] }]);
    };

    const removeCategory = (index: number) => {
        if (confirm("Delete this category?")) {
            const newCats = [...categories];
            newCats.splice(index, 1);
            setCategories(newCats);
        }
    };

    const updateCategoryName = (index: number, name: string) => {
        const newCats = [...categories];
        newCats[index].name = name;
        setCategories(newCats);
    };

    const addFAQ = (catIndex: number) => {
        const newCats = [...categories];
        newCats[catIndex].faqs.push({ question: "New Question", answer: "New Answer" });
        setCategories(newCats);
    };

    const removeFAQ = (catIndex: number, faqIndex: number) => {
        const newCats = [...categories];
        newCats[catIndex].faqs.splice(faqIndex, 1);
        setCategories(newCats);
    };

    const updateFAQ = (catIndex: number, faqIndex: number, field: keyof FAQItem, value: string) => {
        const newCats = [...categories];
        newCats[catIndex].faqs[faqIndex] = {
            ...newCats[catIndex].faqs[faqIndex],
            [field]: value
        };
        setCategories(newCats);
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading FAQs...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-display">Manage FAQs</h2>
            </div>

            <div className="space-y-4">
                {categories.map((category, catIndex) => (
                    <GlassCard key={catIndex} className="p-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4 flex-1">
                                <button
                                    onClick={() => setExpandedCategory(expandedCategory === catIndex ? null : catIndex)}
                                    className="p-1 hover:bg-white/10 rounded"
                                >
                                    {expandedCategory === catIndex ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                <input
                                    value={category.name}
                                    onChange={(e) => updateCategoryName(catIndex, e.target.value)}
                                    className="bg-transparent text-lg font-bold text-primary border-b border-transparent hover:border-white/20 focus:border-primary focus:outline-none"
                                    placeholder="Category Name"
                                />
                            </div>
                            <button
                                onClick={() => removeCategory(catIndex)}
                                className="text-red-500 hover:text-red-400 p-2"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        {expandedCategory === catIndex && (
                            <div className="pl-10 space-y-4 border-l-2 border-white/5 ml-3">
                                {category.faqs.map((faq, faqIndex) => (
                                    <div key={faqIndex} className="p-4 rounded-lg bg-white/5 space-y-3 relative group">
                                        <button
                                            onClick={() => removeFAQ(catIndex, faqIndex)}
                                            className="absolute top-2 right-2 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <input
                                            value={faq.question}
                                            onChange={(e) => updateFAQ(catIndex, faqIndex, 'question', e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-foreground font-medium"
                                            placeholder="Question"
                                        />
                                        <textarea
                                            value={faq.answer}
                                            onChange={(e) => updateFAQ(catIndex, faqIndex, 'answer', e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-muted-foreground text-sm min-h-[80px]"
                                            placeholder="Answer"
                                        />
                                    </div>
                                ))}
                                <button
                                    onClick={() => addFAQ(catIndex)}
                                    className="w-full py-2 border border-dashed border-white/20 rounded-lg text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Question
                                </button>
                            </div>
                        )}
                    </GlassCard>
                ))}

                <button
                    onClick={addCategory}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl text-foreground font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" /> Add New Category
                </button>
            </div>

            <FloatingSaveBar
                isOpen={isDirty}
                onSave={handleSave}
                loading={saving}
            />
        </div>
    );
};
