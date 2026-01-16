"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateStats = exports.verifyPin = exports.syncUserRoles = exports.verifyMockPurchase = exports.verifyPurchase = exports.createPurchase = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const Razorpay = require("razorpay");
(0, v2_1.setGlobalOptions)({ region: "us-central1", maxInstances: 10 });
admin.initializeApp();
const db = admin.firestore();
// Initialize Razorpay Lazy
const getRazorpay = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || "YOUR_KEY_ID",
        key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET",
    });
};
/**
 * 1. Create Purchase (Callable - Gen 2)
 */
exports.createPurchase = (0, https_1.onCall)({ cors: true }, async (request) => {
    // Debug Logging
    logger.info("createPurchase called");
    logger.info("Auth Context:", request.auth ? `UID: ${request.auth.uid}` : "Missing request.auth");
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in (Server Check Failed).");
    }
    const { planId } = request.data;
    const userId = request.auth.uid;
    try {
        // A. Fetch Plan Source of Truth
        const planDoc = await db.collection("plans").doc(planId).get();
        let planData = planDoc.exists ? planDoc.data() : null;
        // Fallback
        if (!planData) {
            if (planId === 'plus')
                planData = { name: "Plus", price: 499 };
            else if (planId === 'platinum')
                planData = { name: "Platinum", price: 999 };
            else if (planId === 'ultra')
                planData = { name: "Ultra Premium", price: 1499 };
            else
                throw new https_1.HttpsError("not-found", "Plan not found");
        }
        const amountInPaise = Math.round(planData.price * 100);
        // B. Create Razorpay Order
        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_${Date.now()}_${userId.substring(0, 5)}`,
            payment_capture: 1
        };
        const razorpay = getRazorpay();
        const rzpOrder = await razorpay.orders.create(options);
        return {
            razorpayOrderId: rzpOrder.id,
            amount: amountInPaise,
            key: process.env.RAZORPAY_KEY_ID
        };
    }
    catch (error) {
        logger.error("Create Purchase Error:", error);
        throw new https_1.HttpsError("internal", error.message);
    }
});
/**
 * 2. Verify Purchase (Callable - Gen 2)
 */
exports.verifyPurchase = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, planId, shippingDetails, customization, formSnapshot } = request.data;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in.");
    }
    const userId = request.auth.uid;
    try {
        const secret = process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET";
        // 1. Signature Verification
        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(razorpayOrderId + "|" + razorpayPaymentId)
            .digest("hex");
        if (generated_signature !== razorpaySignature) {
            throw new https_1.HttpsError("permission-denied", "Invalid Signature");
        }
        // 2. Fetch Plan to validate Amount/Data (Double Security)
        const planDoc = await db.collection("plans").doc(planId).get();
        let planData = planDoc.exists ? planDoc.data() : null;
        // Fallback plan logic (same as createPurchase)
        if (!planData) {
            if (planId === 'plus')
                planData = { name: "Plus", price: 499 };
            else if (planId === 'platinum')
                planData = { name: "Platinum", price: 999 };
            else if (planId === 'ultra')
                planData = { name: "Ultra Premium", price: 1499 };
            else
                throw new https_1.HttpsError("not-found", "Plan not found");
        }
        // 3. Create the Order Document (Deferring Write complete)
        const orderData = {
            userId,
            planId,
            item: {
                id: planId,
                name: planData.name,
                price: planData.price,
                currency: "INR"
            },
            amount: planData.price,
            currency: "INR",
            status: "order_received", // Directly to Paid status
            razorpayOrderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            shippingDetails,
            customization: customization || {},
            formSnapshot: formSnapshot || [],
            timeline: [
                { status: "Order Initiated", date: new Date().toISOString(), completed: true },
                { status: "Payment Received", date: new Date().toISOString(), completed: true }
            ]
        };
        const orderRef = await db.collection("orders").add(orderData);
        return { success: true, orderId: orderRef.id };
    }
    catch (error) {
        logger.error("Verification Error:", error);
        throw new https_1.HttpsError("internal", error.message);
    }
});
/**
 * 3. Verify Mock Purchase (Callable - Gen 2)
 */
exports.verifyMockPurchase = (0, https_1.onCall)({ cors: true }, async (request) => {
    logger.info("verifyMockPurchase called");
    logger.info("Auth Context:", request.auth ? `UID: ${request.auth.uid}` : "Missing request.auth");
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in (Server Check Failed).");
    }
    const { planId, shippingDetails, customization, formSnapshot } = request.data;
    const userId = request.auth.uid;
    try {
        // Fetch Plan (or mock data)
        const planDoc = await db.collection("plans").doc(planId).get();
        const planData = planDoc.exists ? planDoc.data() : { name: "Mock Plan", price: 0 };
        const orderData = {
            userId,
            planId,
            item: {
                id: planId,
                name: planData === null || planData === void 0 ? void 0 : planData.name,
                price: planData === null || planData === void 0 ? void 0 : planData.price,
                currency: "INR"
            },
            amount: planData === null || planData === void 0 ? void 0 : planData.price,
            currency: "INR",
            status: "order_received",
            paymentId: `mock_${Date.now()}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            shippingDetails,
            customization: customization || {},
            formSnapshot: formSnapshot || [],
            timeline: [
                { status: "Order Initiated", date: new Date().toISOString(), completed: true },
                { status: "Payment Received", date: new Date().toISOString(), completed: true }
            ],
            note: "Mock Payment via Secure Backend"
        };
        const orderRef = await db.collection("orders").add(orderData);
        return { success: true, orderId: orderRef.id };
    }
    catch (error) {
        throw new https_1.HttpsError("internal", error.message);
    }
});
/**
 * 4. Sync User Roles (Firestore Trigger)
 * Listens for changes to 'users/{userId}' and updates Auth Custom Claims.
 * This fixes the issue where promote/demote doesn't reflect in Auth state.
 */
exports.syncUserRoles = (0, firestore_1.onDocumentWritten)("users/{userId}", async (event) => {
    var _a;
    // 1. Check if document exists (it might be deleted)
    if (!((_a = event.data) === null || _a === void 0 ? void 0 : _a.after.exists)) {
        return;
    }
    const userId = event.params.userId;
    const newData = event.data.after.data();
    const previousData = event.data.before.exists ? event.data.before.data() : {};
    if (!newData)
        return; // Should not happen if exists is true
    // 2. Check if relevant fields changed (role, admin, isBanned)
    // We update claims if ANY of these change, or if it's a new document
    const roleChanged = newData.role !== (previousData === null || previousData === void 0 ? void 0 : previousData.role);
    const adminFlagChanged = newData.admin !== (previousData === null || previousData === void 0 ? void 0 : previousData.admin);
    const banChanged = newData.isBanned !== (previousData === null || previousData === void 0 ? void 0 : previousData.isBanned);
    if (!roleChanged && !adminFlagChanged && !banChanged && event.data.before.exists) {
        return; // No relevant changes
    }
    try {
        // 3. Determine Claims
        // Logic: 
        // - 'super_admin' role -> { super_admin: true, admin: true }
        // - 'admin' role OR admin:true flag -> { admin: true, super_admin: false }
        // - otherwise -> { admin: false, super_admin: false }
        const claims = {
            admin: false,
            super_admin: false,
            banned: newData.isBanned === true
        };
        if (newData.role === 'super_admin') {
            claims.super_admin = true;
            claims.admin = true;
        }
        else if (newData.role === 'admin' || newData.admin === true) {
            claims.admin = true;
        }
        // 4. Set Custom Claims
        await admin.auth().setCustomUserClaims(userId, claims);
        logger.info(`[SyncUserRoles] Updated claims for ${userId}:`, claims);
        // Optional: If banned, we can revoke refresh tokens to force logout immediately
        if (claims.banned && !(previousData === null || previousData === void 0 ? void 0 : previousData.isBanned)) {
            await admin.auth().revokeRefreshTokens(userId);
            logger.info(`[SyncUserRoles] Revoked tokens for banned user ${userId}`);
        }
    }
    catch (error) {
        logger.error(`[SyncUserRoles] Error updating claims for ${userId}:`, error);
    }
});
/**
 * Verifies a user's PIN and returns the protected content if correct.
 * Call with: { uid: string, pin: string }
 */
exports.verifyPin = (0, https_1.onCall)(async (request) => {
    // 1. Validation
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in.");
    }
    const { uid, pin } = request.data;
    if (!uid || !pin) {
        throw new https_1.HttpsError("invalid-argument", "Missing UID or PIN.");
    }
    // 2. Fetch the Secret Doc
    const secretDocRef = db.collection("users").doc(uid).collection("secrets").doc("main");
    const secretSnap = await secretDocRef.get();
    if (!secretSnap.exists) {
        throw new https_1.HttpsError("not-found", "Private content not found or PIN not set.");
    }
    const secretData = secretSnap.data();
    const correctPin = secretData === null || secretData === void 0 ? void 0 : secretData.pin;
    // 3. Verify
    if (pin !== correctPin) {
        throw new https_1.HttpsError("permission-denied", "Incorrect PIN.");
    }
    // 4. Return Content
    return {
        privateContents: (secretData === null || secretData === void 0 ? void 0 : secretData.privateContents) || []
    };
});
/**
 * Aggregates stats for dashboard.
 * Scheduled to run every hour.
 */
exports.aggregateStats = (0, scheduler_1.onSchedule)("every 1 hours", async (event) => {
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
            logger.info(`Aggregated stats for user ${uid}`);
        }
        catch (error) {
            logger.error(`Error aggregating for user ${uid}`, error);
        }
    }
});
//# sourceMappingURL=index.js.map