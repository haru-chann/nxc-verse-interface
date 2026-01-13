import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useContent = (section: string, defaultContent?: any) => {
    const [content, setContent] = useState<any>(defaultContent || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(doc(db, "site_content", section),
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    setContent(docSnapshot.data());
                } else {
                    // If no document exists, stick to defaultContent if provided
                    if (defaultContent) setContent(defaultContent);
                }
                setLoading(false);
            },
            (err) => {
                console.error(`Error fetching content for ${section}:`, err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [section]);

    return { content, loading, error };
};
