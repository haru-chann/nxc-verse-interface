import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, Star, Nfc, QrCode, Shield, Truck } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Matte Black Metal",
    price: 39,
    originalPrice: 49,
    image: "MB",
    color: "Matte Black",
    material: "Stainless Steel",
    rating: 4.9,
    reviews: 328,
    features: ["NFC Enabled", "Laser Engraved", "Water Resistant"],
    popular: true,
  },
  {
    id: 2,
    name: "Brushed Silver",
    price: 39,
    originalPrice: 49,
    image: "BS",
    color: "Silver",
    material: "Stainless Steel",
    rating: 4.8,
    reviews: 256,
    features: ["NFC Enabled", "Laser Engraved", "Water Resistant"],
    popular: false,
  },
  {
    id: 3,
    name: "Rose Gold Elite",
    price: 49,
    originalPrice: 59,
    image: "RG",
    color: "Rose Gold",
    material: "Premium Metal",
    rating: 4.9,
    reviews: 189,
    features: ["NFC Enabled", "Laser Engraved", "Premium Finish"],
    popular: false,
  },
  {
    id: 4,
    name: "Carbon Fiber Pro",
    price: 59,
    originalPrice: 79,
    image: "CF",
    color: "Carbon Black",
    material: "Carbon Fiber",
    rating: 5.0,
    reviews: 142,
    features: ["NFC Enabled", "Ultra Light", "Premium Finish"],
    popular: true,
  },
  {
    id: 5,
    name: "Gold Prestige",
    price: 79,
    originalPrice: 99,
    image: "GP",
    color: "24K Gold",
    material: "Gold Plated",
    rating: 4.9,
    reviews: 98,
    features: ["NFC Enabled", "24K Gold Plating", "Luxury Finish"],
    popular: false,
  },
  {
    id: 6,
    name: "Classic White",
    price: 29,
    originalPrice: 39,
    image: "CW",
    color: "Pure White",
    material: "Premium PVC",
    rating: 4.7,
    reviews: 412,
    features: ["NFC Enabled", "UV Printed", "Affordable"],
    popular: false,
  },
];

const filters = ["All", "Metal", "Carbon", "Budget"];

const Store = () => {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [cart, setCart] = useState<number[]>([]);

  const addToCart = (id: number) => {
    setCart([...cart, id]);
  };

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
            <p className="text-primary font-medium mb-4">CARD STORE</p>
            <h1 className="font-display text-5xl sm:text-6xl font-bold mb-6">
              Premium <GradientText animate>NFC Cards</GradientText>
            </h1>
            <p className="text-xl text-muted-foreground">
              Handcrafted metal cards that make a lasting impression. Tap to share your digital identity.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Nfc, label: "NFC Enabled" },
              { icon: Shield, label: "Lifetime Warranty" },
              { icon: Truck, label: "Free Shipping" },
              { icon: QrCode, label: "QR Included" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                className="flex items-center justify-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <item.icon className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-12">
            <div className="flex gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            {cart.length > 0 && (
              <Link to="/checkout">
                <NeonButton size="sm">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart ({cart.length})
                </NeonButton>
              </Link>
            )}
          </div>

          {/* Product Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard variant="hover" className="p-6 relative overflow-hidden group">
                  {product.popular && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        Popular
                      </span>
                    </div>
                  )}

                  {/* Card Preview */}
                  <motion.div
                    className="aspect-[1.6/1] rounded-xl mb-6 relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="metal-card w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold font-display text-primary/50">
                        {product.image}
                      </span>
                    </div>
                  </motion.div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? "text-warning fill-warning"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews})
                    </span>
                  </div>

                  {/* Info */}
                  <h3 className="text-xl font-bold font-display text-foreground mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {product.material} • {product.color}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.features.slice(0, 2).map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 rounded-lg bg-muted text-xs text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-display text-foreground">
                        ${product.price}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        ${product.originalPrice}
                      </span>
                    </div>
                    <NeonButton
                      size="sm"
                      onClick={() => addToCart(product.id)}
                      disabled={cart.includes(product.id)}
                    >
                      {cart.includes(product.id) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                    </NeonButton>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Card CTA */}
      <section className="py-32 relative bg-background-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Need a <GradientText>Custom Design?</GradientText>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              We offer custom card designs for businesses and teams. Contact us for bulk orders.
            </p>
            <Link to="/contact">
              <NeonButton size="lg">Get Custom Quote</NeonButton>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Store;
