import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { Link as LinkIcon, CreditCard, CheckCircle, AlertCircle, Trash2, Plus, ExternalLink, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface LinkedCard {
  id: string;
  cardUrl: string;
  linkedAt: string;
  status: "active" | "pending";
  cardType: string;
}

const CardLink = () => {
  const [cardUrl, setCardUrl] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkedCards, setLinkedCards] = useState<LinkedCard[]>([
    {
      id: "1",
      cardUrl: "nxcbadge.com/c/abc123",
      linkedAt: "Nov 28, 2024",
      status: "active",
      cardType: "Matte Black Metal",
    },
  ]);

  const handleLinkCard = async () => {
    if (!cardUrl.trim()) {
      toast.error("Please enter a card URL");
      return;
    }

    // Validate URL format
    const urlPattern = /^(nxcbadge\.com\/c\/|https?:\/\/nxcbadge\.com\/c\/)[a-zA-Z0-9]+$/;
    if (!urlPattern.test(cardUrl.trim())) {
      toast.error("Invalid card URL format. It should look like: nxcbadge.com/c/abc123");
      return;
    }

    setIsLinking(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newCard: LinkedCard = {
      id: Date.now().toString(),
      cardUrl: cardUrl.trim().replace("https://", ""),
      linkedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "active",
      cardType: "New Card",
    };

    setLinkedCards([...linkedCards, newCard]);
    setCardUrl("");
    setIsLinking(false);
    toast.success("Card linked successfully! Your NFC card now points to your profile.");
  };

  const handleUnlinkCard = (id: string) => {
    setLinkedCards(linkedCards.filter(card => card.id !== id));
    toast.success("Card unlinked successfully");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">
          <GradientText>Card Link</GradientText>
        </h1>
        <p className="text-muted-foreground mt-1">Link your NFC card URL to your profile</p>
      </div>

      {/* How It Works */}
      <GlassCard className="p-6" variant="neon">
        <h2 className="text-xl font-bold font-display text-foreground mb-4">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">1. Order Your Card</h3>
            <p className="text-sm text-muted-foreground">
              Purchase a premium NFC card from our store
            </p>
          </motion.div>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <LinkIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">2. Get Your Card URL</h3>
            <p className="text-sm text-muted-foreground">
              Each card comes with a unique URL printed on it
            </p>
          </motion.div>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">3. Link & Share</h3>
            <p className="text-sm text-muted-foreground">
              Add the URL here to connect it to your profile
            </p>
          </motion.div>
        </div>
      </GlassCard>

      {/* Link New Card */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold font-display text-foreground mb-4">Link New Card</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={cardUrl}
              onChange={(e) => setCardUrl(e.target.value)}
              placeholder="nxcbadge.com/c/abc123"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>
          <NeonButton onClick={handleLinkCard} disabled={isLinking}>
            {isLinking ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Linking...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Link Card
              </>
            )}
          </NeonButton>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Enter the card URL found on your NFC card or in your{" "}
          <Link to="/dashboard/orders" className="text-primary hover:underline">order details</Link>.
        </p>
      </GlassCard>

      {/* Linked Cards */}
      <div>
        <h2 className="text-xl font-bold font-display text-foreground mb-4">Linked Cards</h2>
        
        {linkedCards.length > 0 ? (
          <div className="space-y-4">
            {linkedCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-4" variant="hover">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{card.cardUrl}</p>
                        {card.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {card.cardType} • Linked {card.linkedAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://${card.cardUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => handleUnlinkCard(card.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <GlassCard className="p-12 text-center">
            <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Cards Linked</h3>
            <p className="text-muted-foreground mb-6">
              Link your first NFC card to start sharing your profile instantly
            </p>
            <Link to="/store">
              <NeonButton>Order Your First Card</NeonButton>
            </Link>
          </GlassCard>
        )}
      </div>

      {/* Tips */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold font-display text-foreground mb-4">Tips</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">One profile, many cards:</span> You can link multiple NFC cards to the same profile
            </p>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">Instant activation:</span> Once linked, your card will immediately redirect to your profile
            </p>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">Track everything:</span> All taps and scans from your linked cards are tracked in your analytics
            </p>
          </li>
        </ul>
      </GlassCard>
    </div>
  );
};

export default CardLink;