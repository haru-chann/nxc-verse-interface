import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, Package, DollarSign, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const stats = [
  { title: "Total Users", value: "52,847", change: "+12% this month", changeType: "positive" as const, icon: Users },
  { title: "Active Orders", value: "1,284", change: "+8% this week", changeType: "positive" as const, icon: Package },
  { title: "Revenue", value: "$128,420", change: "+23% this month", changeType: "positive" as const, icon: DollarSign },
  { title: "Conversion", value: "3.2%", change: "+0.4% this week", changeType: "positive" as const, icon: TrendingUp },
];

const activityData = [
  { name: "Mon", users: 4200, revenue: 12400 },
  { name: "Tue", users: 4800, revenue: 14800 },
  { name: "Wed", users: 5100, revenue: 16200 },
  { name: "Thu", users: 4600, revenue: 13900 },
  { name: "Fri", users: 5800, revenue: 19200 },
  { name: "Sat", users: 6200, revenue: 21500 },
  { name: "Sun", users: 5400, revenue: 17800 },
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

      {/* Platform Activity Chart */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold font-display text-foreground mb-6">Platform Activity</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  color: "hsl(var(--foreground))"
                }} 
              />
              <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} name="New Users" />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Revenue ($)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">New Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">Revenue</span>
          </div>
        </div>
      </GlassCard>

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
    </div>
  );
};

export default AdminDashboard;
