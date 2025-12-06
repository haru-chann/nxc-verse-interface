import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Eye, MousePointer, Users, MapPin, Clock, Download, 
  Search, Filter, ChevronDown, Calendar, Globe, Smartphone,
  ArrowUpDown, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InteractionType = "view" | "tap" | "contact_saved" | "link_click";

interface Interaction {
  id: string;
  type: InteractionType;
  timestamp: Date;
  location: string;
  country: string;
  device: string;
  browser: string;
  source: string;
  duration?: number;
}

// Generate dummy data
const generateInteractions = (): Interaction[] => {
  const types: InteractionType[] = ["view", "tap", "contact_saved", "link_click"];
  const locations = [
    { city: "San Francisco", country: "USA" },
    { city: "New York", country: "USA" },
    { city: "London", country: "UK" },
    { city: "Tokyo", country: "Japan" },
    { city: "Paris", country: "France" },
    { city: "Berlin", country: "Germany" },
    { city: "Sydney", country: "Australia" },
    { city: "Toronto", country: "Canada" },
  ];
  const devices = ["iPhone 15", "Samsung Galaxy S24", "MacBook Pro", "Windows PC", "iPad Pro"];
  const browsers = ["Chrome", "Safari", "Firefox", "Edge"];
  const sources = ["QR Scan", "NFC Tap", "Direct Link", "Social Media", "Email Signature"];

  const interactions: Interaction[] = [];
  
  for (let i = 0; i < 50; i++) {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 720)); // Random time within last 30 days
    
    interactions.push({
      id: `INT-${String(i + 1).padStart(4, "0")}`,
      type: types[Math.floor(Math.random() * types.length)],
      timestamp: date,
      location: loc.city,
      country: loc.country,
      device: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      duration: Math.floor(Math.random() * 300) + 5,
    });
  }
  
  return interactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const interactions = generateInteractions();

const typeLabels: Record<InteractionType, { label: string; icon: typeof Eye; color: string }> = {
  view: { label: "Profile View", icon: Eye, color: "text-primary" },
  tap: { label: "NFC Tap", icon: MousePointer, color: "text-accent" },
  contact_saved: { label: "Contact Saved", icon: Users, color: "text-success" },
  link_click: { label: "Link Click", icon: Globe, color: "text-warning" },
};

const InteractionLog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("30");
  const [sortField, setSortField] = useState<"timestamp" | "location" | "type">("timestamp");
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
          item.location.toLowerCase().includes(query) ||
          item.country.toLowerCase().includes(query) ||
          item.device.toLowerCase().includes(query) ||
          item.source.toLowerCase().includes(query)
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
      } else if (sortField === "location") {
        comparison = a.location.localeCompare(b.location);
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
      totalClicks: filteredData.filter((i) => i.type === "link_click").length,
    };
  }, [filteredData]);

  const handleSort = (field: "timestamp" | "location" | "type") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const exportToCSV = () => {
    // Simplified CSV: Contact (source), Email (N/A for interactions), Date, Phone (N/A), Company (N/A), Location
    const headers = ["Contact", "Email", "Date", "Phone", "Company", "Location"];
    const rows = filteredData.map((item) => [
      item.source, // Contact source
      "", // Email - not available for interactions
      item.timestamp.toLocaleDateString(),
      "", // Phone - not available for interactions  
      "", // Company - not available for interactions
      `${item.location}, ${item.country}`,
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
        <NeonButton onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </NeonButton>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Views", value: stats.totalViews, icon: Eye, color: "text-primary" },
          { label: "NFC Taps", value: stats.totalTaps, icon: MousePointer, color: "text-accent" },
          { label: "Contacts Saved", value: stats.totalContacts, icon: Users, color: "text-success" },
          { label: "Link Clicks", value: stats.totalClicks, icon: Globe, color: "text-warning" },
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
              placeholder="Search by location, device, source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
            />
          </div>

          {/* Type Filter */}
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
              <SelectItem value="link_click">Link Clicks</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full lg:w-48 bg-muted border-border">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
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
                  <button
                    onClick={() => handleSort("type")}
                    className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    Type
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort("timestamp")}
                    className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    Time
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort("location")}
                    className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    Location
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-left p-4 hidden md:table-cell">
                  <span className="font-semibold text-foreground">Device</span>
                </th>
                <th className="text-left p-4 hidden lg:table-cell">
                  <span className="font-semibold text-foreground">Source</span>
                </th>
                <th className="text-left p-4 hidden lg:table-cell">
                  <span className="font-semibold text-foreground">Duration</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => {
                const typeInfo = typeLabels[item.type];
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
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <div>
                          <p className="text-foreground">{formatTimeAgo(item.timestamp)}</p>
                          <p className="text-xs">{item.timestamp.toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-foreground">{item.location}</p>
                          <p className="text-xs text-muted-foreground">{item.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-foreground">{item.device}</p>
                          <p className="text-xs text-muted-foreground">{item.browser}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm">
                        {item.source}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-muted-foreground">{item.duration}s</span>
                    </td>
                  </motion.tr>
                );
              })}
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
    </div>
  );
};

export default InteractionLog;
