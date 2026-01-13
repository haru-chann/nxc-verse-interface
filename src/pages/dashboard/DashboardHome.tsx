import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { Eye, Users, MousePointer, TrendingUp, QrCode, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useDashboard } from "@/contexts/DashboardContext";

const viewsData = [
  { name: "Mon", views: 0, taps: 0 },
  { name: "Tue", views: 0, taps: 0 },
  { name: "Wed", views: 0, taps: 0 },
  { name: "Thu", views: 0, taps: 0 },
  { name: "Fri", views: 0, taps: 0 },
  { name: "Sat", views: 0, taps: 0 },
  { name: "Sun", views: 0, taps: 0 },
];


const DashboardHome = () => {
  const { currentUser } = useAuth();
  const { statsData, graphData, recentActivity, loading } = useDashboard();
  const [firstName, setFirstName] = useState("User");

  useEffect(() => {
    if (!currentUser) return;
    userService.getUserProfile(currentUser.uid).then((profile) => {
      if (profile?.firstName) {
        setFirstName(profile.firstName);
      }
    });
  }, [currentUser]);

  if (loading || !currentUser) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Welcome back, <GradientText>{firstName}</GradientText>
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your profile</p>
        </div>
        <Link
          to={currentUser ? `/u/${currentUser.uid}` : "#"}
          target="_blank"
          className="inline-flex"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            View Profile
          </motion.div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
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
      <div className="w-full">
        {/* Views & Taps Chart */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold font-display text-foreground mb-6">Views & Taps (This Week)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTaps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
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
                <Area type="monotone" dataKey="views" name="Views" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorViews)" strokeWidth={2} />
                <Area type="monotone" dataKey="taps" name="Taps" stroke="#F59E0B" fillOpacity={1} fill="url(#colorTaps)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Views</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" style={{ backgroundColor: '#F59E0B' }} />
              <span className="text-sm text-muted-foreground">Taps</span>
            </div>
          </div>
        </GlassCard>


      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <GlassCard className="lg:col-span-2 p-6">
          <h2 className="text-xl font-bold font-display text-foreground mb-6">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <motion.div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {activity.type === "view" && <Eye className="w-5 h-5 text-primary" />}
                    {activity.type === "tap" && <MousePointer className="w-5 h-5 text-primary" />}
                    {activity.type === "contact_saved" && <Users className="w-5 h-5 text-primary" />}
                    {activity.type === "message" && <Activity className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium">
                      {activity.type === "view" ? "Profile View" :
                        activity.type === "tap" ? "NFC Card Tap" :
                          activity.type === "message" ? "New Message" :
                            "Interaction"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.title} • {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
            </div>
          )}
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
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>

    </div>
  );
};

export default DashboardHome;
