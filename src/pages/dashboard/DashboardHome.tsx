import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { Eye, Users, MousePointer, TrendingUp, ArrowUpRight, QrCode } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { title: "Profile Views", value: "12,847", change: "+23% from last month", changeType: "positive" as const, icon: Eye },
  { title: "Total Taps", value: "3,291", change: "+18% from last month", changeType: "positive" as const, icon: MousePointer },
  { title: "Contacts Saved", value: "847", change: "+12% from last month", changeType: "positive" as const, icon: Users },
  { title: "Engagement Rate", value: "68%", change: "+5% from last month", changeType: "positive" as const, icon: TrendingUp },
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
              { label: "View Analytics", path: "/dashboard/interactions", icon: TrendingUp },
            ].map((action) => (
              <Link
                key={action.path}
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
