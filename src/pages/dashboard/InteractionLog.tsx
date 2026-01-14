import { useState, useMemo, useEffect } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import {
  Eye, MousePointer, Users, Download,
  Search, Filter, ChevronDown, Calendar,
  ArrowUpDown, ChevronLeft, ChevronRight, MessageSquare,
  User, Phone, Mail
} from "lucide-react";
import { toast } from "sonner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

type InteractionType = "view" | "tap" | "contact_saved" | "link_click" | "message";

interface Interaction {
  id: string;
  type: InteractionType;
  timestamp: Date;
  name: string;
  email: string;
  phone: string;
}

const typeLabels: Record<string, { label: string; icon: typeof Eye; color: string }> = {
  view: { label: "Profile View", icon: Eye, color: "text-primary" },
  tap: { label: "NFC Tap", icon: MousePointer, color: "text-accent" },
  contact_saved: { label: "Contact Saved", icon: Users, color: "text-success" },
  link_click: { label: "Link Click", icon: MousePointer, color: "text-warning" }, // Icon fallback
  message: { label: "Message", icon: MessageSquare, color: "text-blue-500" },
};

// ... (typeLabels remain same)

const InteractionLog = () => {
  const { currentUser } = useAuth();
  const { interactions: rawInteractions, loading } = useDashboard();
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: "" });

  // Transform context interactions to local interface
  const interactions = useMemo(() => {
    return (rawInteractions || []).map(data => ({
      id: data.id,
      type: data.type || "view",
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
      name: data.metadata?.name || data.name || "Anonymous",
      email: data.metadata?.email || data.email || "-",
      phone: data.metadata?.phone || data.phone || "-",
    })) as Interaction[];
  }, [rawInteractions]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("30");
  const [sortField, setSortField] = useState<"timestamp" | "name" | "type">("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  const filteredData = useMemo(() => {
    let data = [...interactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          item.phone.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      data = data.filter((item) => item.type === typeFilter);
    }

    // Date filter
    const daysAgo = parseInt(dateFilter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    data = data.filter((item) => item.timestamp >= cutoffDate);

    // Sorting
    data.sort((a, b) => {
      let comparison = 0;
      if (sortField === "timestamp") {
        comparison = a.timestamp.getTime() - b.timestamp.getTime();
      } else if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "type") {
        comparison = a.type.localeCompare(b.type);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return data;
  }, [searchQuery, typeFilter, dateFilter, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const stats = useMemo(() => {
    return {
      totalViews: filteredData.filter((i) => i.type === "view").length,
      totalTaps: filteredData.filter((i) => i.type === "tap").length,
      totalContacts: filteredData.filter((i) => i.type === "contact_saved").length,
      // Removed Click stats
    };
  }, [filteredData]);

  const handleSort = (field: "timestamp" | "name" | "type") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Type", "Date"];
    const rows = filteredData.map((item) => [
      item.name,
      item.email,
      item.phone,
      item.type,
      item.timestamp.toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `interaction-log-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredData.length} interactions to CSV`);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            <GradientText>Interaction</GradientText> Log
          </h1>
          <p className="text-muted-foreground mt-1">Track all profile interactions and engagement</p>
        </div>
        <NeonButton onClick={exportToCSV} className="w-full sm:w-auto text-sm" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </NeonButton>
      </div>

      {/* Stats Summary - Removed Link Clicks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Views", value: stats.totalViews, icon: Eye, color: "text-primary" },
          { label: "NFC Taps", value: stats.totalTaps, icon: MousePointer, color: "text-accent" },
          { label: "Contacts Saved", value: stats.totalContacts, icon: Users, color: "text-success" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full lg:w-48 bg-muted border-border">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="view">Profile Views</SelectItem>
              <SelectItem value="tap">NFC Taps</SelectItem>
              <SelectItem value="contact_saved">Contacts Saved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full lg:w-48 bg-muted border-border">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4">
                  <button onClick={() => handleSort("type")} className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
                    Type <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort("name")} className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
                    Name <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-left p-4"><span className="font-semibold text-foreground">Phone No.</span></th>
                <th className="text-left p-4"><span className="font-semibold text-foreground">Email</span></th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort("timestamp")} className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
                    Time <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 opacity-50" />
                      <p>No interactions found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
                  const typeInfo = typeLabels[item.type] || { label: item.type, icon: Eye, color: "text-muted-foreground" };
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-muted ${typeInfo.color}`}>
                            <typeInfo.icon className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-foreground">{typeInfo.label}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{item.phone}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{item.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="text-foreground">{formatTimeAgo(item.timestamp)}</p>
                          <p className="text-xs text-muted-foreground">{item.timestamp.toLocaleDateString()}</p>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <span className="px-4 py-2 text-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </GlassCard>
      <ErrorAlert
        isOpen={errorAlert.isOpen}
        onClose={() => setErrorAlert({ ...errorAlert, isOpen: false })}
        message={errorAlert.message}
      />
    </div >
  );
};

export default InteractionLog;
