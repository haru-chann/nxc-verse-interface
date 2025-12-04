import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { Link } from "react-router-dom";
import { ArrowLeft, CreditCard, Truck, Shield, Check, Minus, Plus, X } from "lucide-react";

const cartItems = [
  { id: 1, name: "Matte Black Metal", price: 39, quantity: 1, image: "MB" },
  { id: 4, name: "Carbon Fiber Pro", price: 59, quantity: 1, image: "CF" },
];

const Checkout = () => {
  const [items, setItems] = useState(cartItems);
  const [step, setStep] = useState(1);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  const updateQuantity = (id: number, delta: number) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          to="/store"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Steps */}
            <div className="flex items-center gap-4">
              {["Cart", "Shipping", "Payment"].map((label, index) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step > index + 1
                        ? "bg-success text-success-foreground"
                        : step === index + 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={`text-sm ${step >= index + 1 ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                  {index < 2 && (
                    <div className={`w-12 h-0.5 ${step > index + 1 ? "bg-success" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Cart */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <GlassCard className="p-6">
                  <h2 className="text-xl font-bold font-display text-foreground mb-6">Your Cart</h2>
                  
                  {items.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">Your cart is empty</p>
                      <Link to="/store">
                        <NeonButton>Browse Products</NeonButton>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-muted/50"
                        >
                          <div className="w-16 h-10 rounded-lg bg-card flex items-center justify-center">
                            <span className="font-bold text-primary/50">{item.image}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">${item.price}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Minus className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <span className="w-8 text-center text-foreground">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Plus className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {/* Step 2: Shipping */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <GlassCard className="p-6">
                  <h2 className="text-xl font-bold font-display text-foreground mb-6">Shipping Information</h2>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        placeholder="Doe"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">City</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        placeholder="San Francisco"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">ZIP Code</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        placeholder="94102"
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <GlassCard className="p-6">
                  <h2 className="text-xl font-bold font-display text-foreground mb-6">Payment Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-4 py-3 pl-12 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                          placeholder="4242 4242 4242 4242"
                        />
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Expiry Date</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">CVC</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-success" />
                    Your payment is secure and encrypted
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <GlassCard className="p-6 sticky top-24">
              <h2 className="text-xl font-bold font-display text-foreground mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">${subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-success">Free</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-bold text-xl text-foreground">${total}</span>
                </div>
              </div>

              <div className="space-y-3">
                {step < 3 ? (
                  <NeonButton
                    className="w-full"
                    onClick={() => setStep(step + 1)}
                    disabled={items.length === 0}
                  >
                    Continue
                  </NeonButton>
                ) : (
                  <NeonButton className="w-full">
                    Place Order
                  </NeonButton>
                )}
                {step > 1 && (
                  <NeonButton
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStep(step - 1)}
                    glow={false}
                  >
                    Back
                  </NeonButton>
                )}
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Truck className="w-4 h-4 text-primary" />
                  Free worldwide shipping
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary" />
                  Lifetime warranty included
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
