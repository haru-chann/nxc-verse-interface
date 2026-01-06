import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { Link } from "react-router-dom";
import { ChevronDown, Search, MessageCircle } from "lucide-react";

const faqCategories = [
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
];

const FAQItem = ({ faq }: { faq: { question: string; answer: string } }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-medium text-foreground pr-4">{faq.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-muted-foreground">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General");

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-mesh" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-primary font-medium mb-4">SUPPORT</p>
            <h1 className="font-display text-5xl sm:text-6xl font-bold mb-6">
              Frequently Asked{" "}
              <GradientText animate>Questions</GradientText>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Find answers to common questions about NXC Badge
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Categories */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-2">
                {faqCategories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedCategory === category.name
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="lg:col-span-3">
              {faqCategories
                .filter((cat) => cat.name === selectedCategory)
                .map((category) => (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <GlassCard className="p-6">
                      <h2 className="text-2xl font-bold font-display text-foreground mb-6">
                        {category.name}
                      </h2>
                      {category.faqs.map((faq, index) => (
                        <FAQItem key={index} faq={faq} />
                      ))}
                    </GlassCard>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-32 relative bg-background-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <MessageCircle className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="font-display text-4xl font-bold mb-4">
              Still Have <GradientText>Questions?</GradientText>
            </h2>
            <p className="text-muted-foreground mb-8">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Link to="/contact">
              <NeonButton size="lg">Contact Support</NeonButton>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQs;
