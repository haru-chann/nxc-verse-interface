import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { Package, Truck, CheckCircle, Clock, MapPin, ExternalLink, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const orders = [
  {
    id: "ORD-2024-001",
    product: "Matte Black Metal",
    status: "shipped",
    cardUrl: "nxcbadge.com/c/abc123",
    orderDate: "Nov 28, 2024",
    estimatedDelivery: "Dec 5, 2024",
    trackingNumber: "1Z999AA10123456784",
    steps: [
      { label: "Order Placed", completed: true, date: "Nov 28" },
      { label: "Processing", completed: true, date: "Nov 29" },
      { label: "Shipped", completed: true, date: "Nov 30" },
      { label: "Delivered", completed: false, date: "Est. Dec 5" },
    ],
  },
  {
    id: "ORD-2024-002",
    product: "Carbon Fiber Pro",
    status: "processing",
    cardUrl: "nxcbadge.com/c/def456",
    orderDate: "Dec 2, 2024",
    estimatedDelivery: "Dec 10, 2024",
    trackingNumber: null,
    steps: [
      { label: "Order Placed", completed: true, date: "Dec 2" },
      { label: "Processing", completed: true, date: "Dec 3" },
      { label: "Shipped", completed: false, date: "Pending" },
      { label: "Delivered", completed: false, date: "Est. Dec 10" },
    ],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered":
      return "bg-success text-success-foreground";
    case "shipped":
      return "bg-primary text-primary-foreground";
    case "processing":
      return "bg-warning text-warning-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "delivered":
      return CheckCircle;
    case "shipped":
      return Truck;
    case "processing":
      return Clock;
    default:
      return Package;
  }
};

const OrderTracking = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            <GradientText>Order Tracking</GradientText>
          </h1>
          <p className="text-muted-foreground mt-1">Track your NFC card orders and get your card URLs</p>
        </div>
        <Link to="/store">
          <NeonButton>
            <Package className="w-4 h-4 mr-2" />
            Order New Card
          </NeonButton>
        </Link>
      </div>

      {/* Info Card */}
      <GlassCard className="p-6" variant="neon">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-1">How Card Linking Works</h3>
            <p className="text-muted-foreground text-sm">
              Each NFC card comes with a unique URL (e.g., <code className="text-primary">nxcbadge.com/c/abc123</code>). 
              Once you receive your card, copy this URL and add it to your profile in the{" "}
              <Link to="/dashboard/card-link" className="text-primary hover:underline">Card Link</Link> section to enable it.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order, index) => {
          const StatusIcon = getStatusIcon(order.status);
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-10 rounded-lg bg-card flex items-center justify-center">
                      <span className="font-bold text-primary/50">
                        {order.product.split(" ").map(w => w[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{order.product}</h3>
                      <p className="text-sm text-muted-foreground">{order.id}</p>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    <StatusIcon className="w-4 h-4" />
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    {order.steps.map((step, stepIndex) => (
                      <div key={step.label} className="flex-1 flex flex-col items-center relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                            step.completed
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {step.completed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-medium">{stepIndex + 1}</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-foreground mt-2 text-center">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.date}</p>
                        {stepIndex < order.steps.length - 1 && (
                          <div
                            className={`absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 ${
                              step.completed && order.steps[stepIndex + 1]?.completed
                                ? "bg-primary"
                                : step.completed
                                ? "bg-gradient-to-r from-primary to-muted"
                                : "bg-muted"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                    <p className="font-medium text-foreground">{order.orderDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
                    <p className="font-medium text-foreground">{order.estimatedDelivery}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Card URL</p>
                    <p className="font-medium text-primary">{order.cardUrl}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                    {order.trackingNumber ? (
                      <a
                        href={`https://www.ups.com/track?tracknum=${order.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {order.trackingNumber}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-muted-foreground">Not yet available</p>
                    )}
                  </div>
                </div>

                {/* Action */}
                {order.status === "shipped" || order.status === "delivered" ? (
                  <div className="mt-4 flex justify-end">
                    <Link to="/dashboard/card-link">
                      <NeonButton size="sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        Link This Card
                      </NeonButton>
                    </Link>
                  </div>
                ) : null}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <GlassCard className="p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Orders Yet</h3>
          <p className="text-muted-foreground mb-6">
            You haven't ordered any NFC cards yet. Get your premium card today!
          </p>
          <Link to="/store">
            <NeonButton>Browse Cards</NeonButton>
          </Link>
        </GlassCard>
      )}
    </div>
  );
};

export default OrderTracking;