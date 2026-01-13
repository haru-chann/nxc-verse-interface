import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2, Edit2, LayoutList, MessageSquare, Phone, Store } from 'lucide-react';
import { NeonButton } from '@/components/ui/NeonButton';
import { GlassCard } from '@/components/ui/GlassCard';

import { CMSStore } from './cms/CMSStore';
import { CMSFAQs } from './cms/CMSFAQs';
import { CMSAbout } from './cms/CMSAbout';
import { CMSContact } from './cms/CMSContact';

type Tab = 'store' | 'about' | 'contact' | 'faqs';

const AdminCMS = () => {
    const [activeTab, setActiveTab] = useState<Tab>('store');
    const [loading, setLoading] = useState(false);

    // Placeholder content states - will be replaced by specific components or detailed logic later
    const [storeContent, setStoreContent] = useState<any>(null);
    const [aboutContent, setAboutContent] = useState<any>(null);
    const [contactContent, setContactContent] = useState<any>(null);
    const [faqsContent, setFaqsContent] = useState<any>(null);

    // Initial fetch function
    const fetchContent = async (section: string) => {
        setLoading(true);
        try {
            const docRef = doc(db, "site_content", section);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error(error);
            toast.error(`Failed to fetch ${section} content`);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER HELPERS ---
    const renderTabButton = (id: Tab, label: string, icon: any) => {
        const Icon = icon;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === id
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-white/5'
                    }`}
            >
                <Icon className="w-4 h-4" />
                {label}
            </button>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold font-display text-foreground mb-2">Content Management</h1>
                <p className="text-muted-foreground">Manage your website content including Store, FAQs, and Contact info.</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
                {renderTabButton('store', 'Card Store', Store)}
                {renderTabButton('about', 'About Us', LayoutList)}
                {renderTabButton('contact', 'Contact Info', Phone)}
                {renderTabButton('faqs', 'FAQs', MessageSquare)}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {loading && (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}

                {!loading && (
                    <>
                        {activeTab === 'store' && <CMSStore />}
                        {activeTab === 'about' && <CMSAbout />}
                        {activeTab === 'contact' && <CMSContact />}
                        {activeTab === 'faqs' && <CMSFAQs />}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminCMS;
