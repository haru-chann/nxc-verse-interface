
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, MousePointer, Users, TrendingUp } from 'lucide-react';

interface DashboardContextType {
    interactions: any[];
    statsData: any[];
    graphData: any[];
    recentActivity: any[];
    contacts: any[]; // Added contacts
    loading: boolean;
}

const DashboardContext = createContext<DashboardContextType>({
    interactions: [],
    statsData: [],
    graphData: [],
    recentActivity: [],
    contacts: [], // Added contacts
    loading: true
});

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
    const { currentUser } = useAuth();
    const [interactions, setInteractions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Stats State
    const [statsData, setStatsData] = useState([
        { title: "Profile Views", value: "0", change: "Total views", changeType: "neutral" as const, icon: Eye },
        { title: "Total Taps", value: "0", change: "Total taps", changeType: "neutral" as const, icon: MousePointer },
        { title: "Contacts Saved", value: "0", change: "Total leads", changeType: "neutral" as const, icon: Users },
    ]);
    const [graphData, setGraphData] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);

    // Contacts Listener
    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "users", currentUser.uid, "contacts"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedContacts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setContacts(loadedContacts);
        }, (error) => {
            console.error("Error listening to contacts:", error);
        });
        return () => unsubscribe();
    }, [currentUser?.uid]);

    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);
        // ... existing interaction listener ...

        const q = query(
            collection(db, "users", currentUser.uid, "interactions")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedInteractions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as any
            }));

            // Sort by timestamp desc
            loadedInteractions.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeB - timeA;
            });

            setInteractions(loadedInteractions);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to interactions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser?.uid]);

    // Calculate Stats when data changes
    useEffect(() => {
        const views = interactions.filter((i) => i.type === 'view').length;
        const taps = interactions.filter((i) => i.type === 'tap').length;
        const totalContacts = contacts.length;

        setStatsData([
            { title: "Profile Views", value: views.toString(), change: "Total views", changeType: "neutral" as const, icon: Eye },
            { title: "Total Taps", value: taps.toString(), change: "Total taps", changeType: "neutral" as const, icon: MousePointer },
            { title: "Leads Collected", value: totalContacts.toString(), change: "Total leads", changeType: "neutral" as const, icon: Users },
        ]);

        // Calculate Graph Data (Last 7 Days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                date: d.toISOString().split('T')[0],
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                views: 0,
                taps: 0
            };
        });

        interactions.forEach(interaction => {
            if (!interaction.timestamp?.toDate) return;
            const dateKey = interaction.timestamp.toDate().toISOString().split('T')[0];
            const dayStat = last7Days.find(d => d.date === dateKey);
            if (dayStat) {
                if (interaction.type === 'view') dayStat.views++;
                else if (interaction.type === 'tap') dayStat.taps++;
            }
        });
        setGraphData(last7Days);

        // Recent Activity
        const recent = interactions.slice(0, 5).map((doc) => {
            let timeStr = "Just now";
            if (doc.timestamp?.toDate) {
                const date = doc.timestamp.toDate();
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffMins = Math.round(diffMs / 60000);
                const diffHours = Math.round(diffMs / 3600000);
                const diffDays = Math.round(diffMs / 86400000);

                if (diffMins < 60) timeStr = `${diffMins}m ago`;
                else if (diffHours < 24) timeStr = `${diffHours}h ago`;
                else if (diffDays === 1) timeStr = "Yesterday";
                else if (diffDays < 7) timeStr = `${diffDays}d ago`;
                else timeStr = date.toLocaleDateString();
            }

            let description = "Interacted with your profile";
            if (doc.type === "view") description = "Viewed your profile";
            else if (doc.type === "tap") description = "Tapped your NFC card";
            else if (doc.type === "contact_saved" || doc.type === "contact") description = "Saved your contact info";
            else if (doc.type === "message") description = "Sent you a message";

            return {
                id: doc.id,
                type: doc.type,
                icon: doc.type === "tap" ? MousePointer : doc.type === "contact_saved" ? Users : Eye,
                title: doc.name || (doc.type === "tap" ? "Anonymous User" : "Visitor"),
                description,
                time: timeStr,
            };
        });
        setRecentActivity(recent);

    }, [interactions, contacts]);

    return (
        <DashboardContext.Provider value={{
            interactions,
            statsData,
            graphData,
            recentActivity,
            contacts, // Added contacts
            loading
        }}>
            {children}
        </DashboardContext.Provider>
    );
};
