const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json"); // Assuming this exists or we use default creds if implicit

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

const storeData = {
    products: [
        {
            id: "free",
            name: "Free",
            price: "Free",
            description: "Essential networking tools",
            features: [
                "Digital Profile Only",
                "5 Links limit",
                "100 characters Bio limit",
                "1 QR option",
                "Save 50 contacts/month",
                "Free forever",
            ],
            cta: "Get Started",
            popular: false,
            path: "/signup",
            highlight: false,
            buttonText: "Get Started"
        },
        {
            id: "plus",
            name: "Plus",
            price: 499,
            description: "The standard for professionals",
            features: [
                "Digital Profile",
                "Matte finished NFC Card",
                "10 Links limit",
                "Bio length up to 500 chars",
                "Multiple QR Options",
                "Save 1000 contacts/month",
            ],
            cta: "Order Now",
            popular: false,
            path: "/order",
            highlight: false,
            buttonText: "Order Now"
        },
        {
            id: "platinum",
            name: "Platinum",
            price: 999,
            description: "Stand out with custom design",
            features: [
                "Everything in Plus",
                "Customized NFC Card design",
                "Priority Support",
            ],
            cta: "Order Now",
            popular: true,
            path: "/order",
            highlight: true,
            buttonText: "Order Now"
        },
        {
            id: "ultra",
            name: "Ultra Premium",
            price: 1499,
            description: "The ultimate impression",
            features: [
                "Everything in Plus",
                "Custom Metal NFC Card",
                "Unlimited contact storage",
                "Private content mode",
            ],
            cta: "Order Now",
            popular: false,
            path: "ultra",
            highlight: false,
            buttonText: "Order Now"
        },
    ]
};

const aboutData = {
    story: [
        "NXC Badge Verse was born in November 2024 from one fearless idea — professional identity should feel powerful, futuristic, and alive.",
        "Built by students with ambition that refuses to shrink, we created a digital visiting card platform engineered like a blockbuster: precise, immersive, and built to last.",
        "Led by Ritesh Martawar with the strength of Vishal Pandey, Ishaan Apte, and Meghant Darji, this isn’t just tech. It’s a statement. And it’s only the beginning."
    ],
    values: [
        {
            title: "Mission-Driven",
            description: "We're on a mission to revolutionize how professionals connect and share their identity in the digital age.",
        },
        {
            title: "User-Centric",
            description: "Every feature we build starts with our users. Their success is our success.",
        },
        {
            title: "Innovation First",
            description: "We constantly push the boundaries of what's possible with NFC and QR technology.",
        },
        {
            title: "Global Impact",
            description: "Building a global community of connected professionals, one tap at a time.",
        },
    ],
    team: [
        { name: "Ritesh Martawar", role: "Founder & Developer", avatar: "RM" },
        { name: "Vishal Pandey", role: "Co-Founder & Developer", avatar: "VP" },
        { name: "Ishaan Apte", role: "Designer", avatar: "IA" },
        { name: "Meghant Darji", role: "Product Head", avatar: "MD" },
        { name: "Saksham Jiddewar", role: "Marketing Strategist", avatar: "SJ" },
    ]
};

const faqsData = {
    categories: [
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
                    answer: "No! That's the beauty of NXC Badge. Your profile opens directly in the browser - no app required. This means anyone can view your profile regardless of what phone they have.",
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
                {
                    question: "Is there a limit to how many times my card can be tapped?",
                    answer: "No limits! Your card can be tapped unlimited times. The NFC chip is passive (no battery) and will last the lifetime of the card.",
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
                {
                    question: "Do you offer refunds on cards?",
                    answer: "No refund option available.",
                },
            ],
        },
        {
            name: "Privacy & Security",
            faqs: [
                {
                    question: "Is my data secure?",
                    answer: "Absolutely. We use enterprise-grade encryption for all data. Your profile information is stored securely on our servers. We never sell or share your personal data with third parties.",
                },
                {
                    question: "Can I make certain information private?",
                    answer: "Yes! Pro users can add PIN-protected sections to their profile. You can also set certain links or sections to be visible only to specific people or require a password to view.",
                },
                {
                    question: "Who can see my analytics?",
                    answer: "Only you can see your profile analytics. This includes view counts, tap locations, device information, and interaction history. Visitors cannot see this data.",
                },
            ],
        },
    ]
};

const contactData = {
    email: "nxcbadge@gmail.com",
    phone: "+919404276942",
    address: ""
};

async function seed() {
    console.log("Seeding CMS content...");
    try {
        await db.collection("site_content").doc("store").set(storeData);
        console.log("Store seeded.");
        await db.collection("site_content").doc("about").set(aboutData);
        console.log("About seeded.");
        await db.collection("site_content").doc("faqs").set(faqsData);
        console.log("FAQs seeded.");
        await db.collection("site_content").doc("contact").set(contactData);
        console.log("Contact seeded.");
        console.log("Seeding complete!");
    } catch (e) {
        console.error("Seeding failed:", e);
    }
}

seed();
