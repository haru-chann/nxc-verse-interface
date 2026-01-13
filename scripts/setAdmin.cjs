const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const args = process.argv.slice(2);
const email = args[0];
const role = args[1]; // 'admin' or 'super_admin'

if (!email || !role) {
    console.error('Usage: node setAdmin.js <email> <role>');
    console.error('Roles: admin, super_admin');
    process.exit(1);
}

const setCustomClaims = async (email, role) => {
    try {
        const user = await admin.auth().getUserByEmail(email);

        // Define claims
        const claims = {};
        if (role === 'super_admin') {
            claims.admin = true;
            claims.super_admin = true;
        } else if (role === 'admin') {
            claims.admin = true;
            claims.super_admin = false;
        } else { // remove
            claims.admin = false;
            claims.super_admin = false;
        }

        await admin.auth().setCustomUserClaims(user.uid, claims);

        console.log(`Success! ${email} is now ${role}.`);
        console.log('User must sign out and sign in again for changes to take effect.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting custom claims:', error);
        process.exit(1);
    }
};

setCustomClaims(email, role);
