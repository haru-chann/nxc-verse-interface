import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Verifies a user's PIN and returns the protected content if correct.
 * Call with: { uid: string, pin: string }
 */
export const verifyPin = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // 1. Validation
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { uid, pin } = data;
    if (!uid || !pin) {
        throw new functions.https.HttpsError("invalid-argument", "Missing UID or PIN.");
    }

    // 2. Fetch the Secret Doc
    // Security: Only allow checking own PIN or public profile's PIN if the logic allows?
    // User Requirement: "Secure PIN Verification for Private Content".
    // Usually, a visitor (public) enters a PIN to view a profile's private content.
    // So the caller is the *visitor*. The target `uid` is the *profile owner*.

    // We fetch the secret doc from the target user's secure subcollection
    const secretDocRef = db.collection("users").doc(uid).collection("secrets").doc("main");
    const secretSnap = await secretDocRef.get();

    if (!secretSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Private content not found or PIN not set.");
    }

    const secretData = secretSnap.data();
    const correctPin = secretData?.pin;

    // 3. Verify
    if (pin !== correctPin) {
        // Return error, do not return content
        throw new functions.https.HttpsError("permission-denied", "Incorrect PIN.");
    }

    // 4. Return Content
    // Only return the private contents array
    return {
        privateContents: secretData?.privateContents || []
    };
});

/**
 * Aggregates stats for dashboard.
 * Scheduled to run every hour. (Or triggered)
 */
export const aggregateStats = functions.pubsub.schedule("every 1 hours").onRun(async (context: functions.EventContext) => {
    // This function would iterate over all users or active users and aggregate their logs.
    // For scalability, we might only process recent logs.
    // For this demo, we will aggregate for *all* users (be careful at scale).

    const usersSnap = await db.collection("users").get();

    const validUsers = usersSnap.docs.filter(doc => doc.exists);

    for (const userDoc of validUsers) {
        const uid = userDoc.id;
        try {
            // Count "view" and "tap" interactions
            const interactionsRef = db.collection("users").doc(uid).collection("interactions");
            const viewsQuery = interactionsRef.where("type", "==", "view");
            const tapsQuery = interactionsRef.where("type", "==", "tap");
            const contactsQuery = interactionsRef.where("type", "==", "contact_saved");

            const [viewsSnap, tapsSnap, contactsSnap] = await Promise.all([
                viewsQuery.count().get(),
                tapsQuery.count().get(),
                contactsQuery.count().get()
            ]);

            const totalViews = viewsSnap.data().count;
            const totalTaps = tapsSnap.data().count;
            const totalContacts = contactsSnap.data().count;

            // Calculate engagement (e.g., taps / views)
            const engagementRate = totalViews > 0 ? ((totalTaps + totalContacts) / totalViews) * 100 : 0;

            // Save to "stats" doc
            await db.collection("users").doc(uid).collection("stats").doc("main").set({
                totalViews,
                totalTaps,
                totalContacts,
                engagementRate: parseFloat(engagementRate.toFixed(1)),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`Aggregated stats for user ${uid}`);

        } catch (error) {
            console.error(`Error aggregating for user ${uid}`, error);
        }
    }

    return null;
});
