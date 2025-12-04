import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, Package, DollarSign, TrendingUp, Activity } from "lucide-react";

const stats = [
  { title: "Total Users", value: "52,847", change: "+12% this month", changeType: "positive" as const, icon: Users },
  { title: "Active Orders", value: "1,284", change: "+8% this week", changeType: "positive" as const, icon: Package },
  { title: "Revenue", value: "$128,420", change: "+23% this month", changeType: "positive" as const, icon: DollarSign },
  { title: "Conversion", value: "3.2%", change: "+0.4% this week", changeType: "positive" as const, icon: TrendingUp },
];

const recentOrders = [
  { id: "ORD-001", user: "John Doe", product: "Matte Black Metal", status: "Shipped", amount: "$39" },
  { id: "ORD-002", user: "Jane Smith", product: "Carbon Fiber Pro", status: "Processing", amount: "$59" },
  { id: "ORD-003", user: "Mike Johnson", product: "Rose Gold Elite", status: "Delivered", amount: "$49" },
];

const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold font-display text-foreground mb-6">Recent Orders</h2>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">{order.user}</p>
                  <p className="text-sm text-muted-foreground">{order.product}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{order.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === "Delivered" ? "bg-success/20 text-success" :
                    order.status === "Shipped" ? "bg-primary/20 text-primary" :
                    "bg-warning/20 text-warning"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Activity Chart Placeholder */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold font-display text-foreground mb-6">Platform Activity</h2>
          <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Activity className="w-16 h-16 text-primary/30" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdminDashboard;
