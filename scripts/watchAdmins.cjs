const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

console.log("------------------------------------------------");
console.log("   Admin Role Watcher Started");
console.log("   Listening for role updates in Firestore...");
console.log("------------------------------------------------");

// Query users who are marked as admin or super_admin
const query = db.collection('users').where('role', 'in', ['admin', 'super_admin']);

const unsubscribe = query.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
        const userData = change.doc.data();
        const uid = change.doc.id;
        const email = userData.email || 'Unknown Email';

        if (change.type === 'added' || change.type === 'modified') {
            console.log(`[DETECTED] Role change for: ${email} -> ${userData.role}`);

            try {
                const isSuperAdmin = userData.role === 'super_admin';
                const claims = {
                    admin: true,
                    super_admin: isSuperAdmin
                };

                await auth.setCustomUserClaims(uid, claims);
                console.log(`   └─ [SUCCESS] Claims updated: admin=true${isSuperAdmin ? ', super_admin=true' : ''}`);
            } catch (error) {
                console.error(`   └─ [ERROR] Failed to update claims for ${email}:`, error);
            }
        }

        if (change.type === 'removed') {
            // This happens when a user's role is changed to something NOT in ['admin', 'super_admin']
            console.log(`[DETECTED] Admin privileges revoked for: ${email}`);

            try {
                // Remove admin claims
                await auth.setCustomUserClaims(uid, {
                    admin: false,
                    super_admin: false
                });
                console.log(`   └─ [SUCCESS] Claims removed.`);
            } catch (error) {
                console.error(`   └─ [ERROR] Failed to remove claims for ${email}:`, error);
            }
        }
    });
}, (error) => {
    console.error("Firestore Listen Error:", error);
});

// Create a keep-alive
setInterval(() => { }, 1000 * 60 * 60);
