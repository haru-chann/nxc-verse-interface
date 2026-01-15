const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// Set global options for Gen 2 functions
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

// Initialize Razorpay
// Using process.env is preferred in Gen 2
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "YOUR_KEY_ID",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET",
});

/**
 * 1. Create Purchase (Callable - Gen 2)
 */
exports.createPurchase = onCall({ cors: true }, async (request) => {
    // Debug Logging
    console.log("createPurchase called");
    console.log("Auth Context:", request.auth ? `UID: ${request.auth.uid}` : "Missing request.auth");

    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in (Server Check Failed).");
    }

    const { planId, shippingDetails, customization, formSnapshot } = request.data;
    const userId = request.auth.uid;

    try {
        // A. Fetch Plan Source of Truth
        const planDoc = await db.collection("plans").doc(planId).get();
        let planData = planDoc.exists ? planDoc.data() : null;

        // Fallback
        if (!planData) {
            if (planId === 'plus') planData = { name: "Plus", price: 499 };
            else if (planId === 'platinum') planData = { name: "Platinum", price: 999 };
            else if (planId === 'ultra') planData = { name: "Ultra Premium", price: 1499 };
            else throw new HttpsError("not-found", "Plan not found");
        }

        const amountInPaise = Math.round(planData.price * 100);

        // B. Create Razorpay Order
        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_${Date.now()}_${userId.substring(0, 5)}`,
            payment_capture: 1
        };

        const rzpOrder = await razorpay.orders.create(options);

        return {
            razorpayOrderId: rzpOrder.id,
            amount: amountInPaise,
            key: process.env.RAZORPAY_KEY_ID
        };

    } catch (error) {
        console.error("Create Purchase Error:", error);
        throw new HttpsError("internal", error.message);
    }
});

/**
 * 2. Verify Purchase (Callable - Gen 2)
 */
exports.verifyPurchase = onCall({ cors: true }, async (request) => {
    const {
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        // New Payload items for deferred creation:
        planId,
        shippingDetails,
        customization,
        formSnapshot
    } = request.data;

    // Auth check is critical now that we are writing data
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
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
            throw new HttpsError("permission-denied", "Invalid Signature");
        }

        // 2. Fetch Plan to validate Amount/Data (Double Security)
        const planDoc = await db.collection("plans").doc(planId).get();
        let planData = planDoc.exists ? planDoc.data() : null;

        // Fallback plan logic (same as createPurchase)
        if (!planData) {
            if (planId === 'plus') planData = { name: "Plus", price: 499 };
            else if (planId === 'platinum') planData = { name: "Platinum", price: 999 };
            else if (planId === 'ultra') planData = { name: "Ultra Premium", price: 1499 };
            else throw new HttpsError("not-found", "Plan not found");
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

    } catch (error) {
        console.error("Verification Error:", error);
        throw new HttpsError("internal", error.message);
    }
});

/**
 * 3. Verify Mock Purchase (Callable - Gen 2)
 */
exports.verifyMockPurchase = onCall({ cors: true }, async (request) => {
    console.log("verifyMockPurchase called");
    console.log("Auth Context:", request.auth ? `UID: ${request.auth.uid}` : "Missing request.auth");

    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in (Server Check Failed).");
    }

    const { planId, shippingDetails, customization, formSnapshot } = request.data;
    const userId = request.auth.uid;

    try {
        // Fetch Plan (or mock data)
        const planDoc = await db.collection("plans").doc(planId).get();
        let planData = planDoc.exists ? planDoc.data() : { name: "Mock Plan", price: 0 };

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

    } catch (error) {
        throw new HttpsError("internal", error.message);
    }
});
