import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { Eye, Users, MousePointer, TrendingUp, ArrowUpRight, QrCode, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const stats = [
  { title: "Profile Views", value: "12,847", change: "+23% from last month", changeType: "positive" as const, icon: Eye },
  { title: "Total Taps", value: "3,291", change: "+18% from last month", changeType: "positive" as const, icon: MousePointer },
  { title: "Contacts Saved", value: "847", change: "+12% from last month", changeType: "positive" as const, icon: Users },
  { title: "Engagement Rate", value: "68%", change: "+5% from last month", changeType: "positive" as const, icon: TrendingUp },
];

const viewsData = [
  { name: "Mon", views: 120, taps: 45 },
  { name: "Tue", views: 180, taps: 62 },
  { name: "Wed", views: 240, taps: 89 },
  { name: "Thu", views: 200, taps: 71 },
  { name: "Fri", views: 320, taps: 112 },
  { name: "Sat", views: 280, taps: 95 },
  { name: "Sun", views: 190, taps: 68 },
];

const locationData = [
  { city: "San Francisco", visits: 320 },
  { city: "New York", visits: 280 },
  { city: "London", visits: 220 },
  { city: "Tokyo", visits: 180 },
  { city: "Paris", visits: 120 },
];

const recentActivity = [
  { type: "view", message: "Someone viewed your profile", time: "2 min ago", location: "San Francisco, CA" },
  { type: "tap", message: "Card tapped at networking event", time: "1 hour ago", location: "New York, NY" },
  { type: "contact", message: "New contact saved your info", time: "3 hours ago", location: "London, UK" },
  { type: "view", message: "Profile viewed via QR scan", time: "5 hours ago", location: "Tokyo, Japan" },
];

const DashboardHome = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Welcome back, <GradientText>John</GradientText>
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your profile</p>
        </div>
        <Link
          to="/u/johndoe"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-colors"
        >
          View Profile
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid */}
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

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Views & Taps Chart */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold font-display text-foreground mb-6">Views & Taps (This Week)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTaps" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorViews)" strokeWidth={2} />
                <Area type="monotone" dataKey="taps" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorTaps)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Views</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-sm text-muted-foreground">Taps</span>
            </div>
          </div>
        </GlassCard>

        {/* Top Locations Chart */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold font-display text-foreground mb-6">Top Locations</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="city" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))"
                  }} 
                />
                <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <GlassCard className="lg:col-span-2 p-6">
          <h2 className="text-xl font-bold font-display text-foreground mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {activity.type === "view" && <Eye className="w-5 h-5 text-primary" />}
                  {activity.type === "tap" && <MousePointer className="w-5 h-5 text-primary" />}
                  {activity.type === "contact" && <Users className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-medium">{activity.message}</p>
                  <p className="text-sm text-muted-foreground">{activity.location}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold font-display text-foreground mb-6">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: "Edit Profile", path: "/dashboard/profile", icon: Users },
              { label: "Download QR", path: "/dashboard/qr-builder", icon: QrCode },
              { label: "Interaction Log", path: "/dashboard/interactions", icon: Activity },
              { label: "Manage Contacts", path: "/dashboard/contacts", icon: TrendingUp },
            ].map((action) => (
              <Link
                key={action.path + action.label}
                to={action.path}
                className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
              >
                <action.icon className="w-5 h-5 text-primary" />
                <span className="text-foreground font-medium">{action.label}</span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default DashboardHome;
