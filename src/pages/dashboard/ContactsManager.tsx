import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Users, Search, Download, Mail, Phone, MapPin, Calendar,
  MoreVertical, Eye, Trash2, X, Building, Globe
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  source: string;
  savedAt: Date;
  notes?: string;
}

// Generate dummy contacts
const generateContacts = (): Contact[] => {
  const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Cameron", "Drew"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Anderson"];
  const companies = ["TechCorp", "InnovateLabs", "DigitalFirst", "FutureTech", "CloudBase", "DataDriven", "StartupX", "ScaleUp Inc"];
  const locations = ["San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Los Angeles, CA", "Chicago, IL", "Miami, FL", "Denver, CO"];
  const sources = ["Networking Event", "Conference", "LinkedIn", "Referral", "Cold Outreach", "QR Scan", "NFC Tap"];

  const contacts: Contact[] = [];
  
  for (let i = 0; i < 25; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    
    contacts.push({
      id: `CON-${String(i + 1).padStart(4, "0")}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companies[Math.floor(Math.random() * companies.length)].toLowerCase().replace(/\s/g, "")}.com`,
      phone: `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      company: companies[Math.floor(Math.random() * companies.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      savedAt: date,
      notes: Math.random() > 0.5 ? "Interested in partnership opportunities" : undefined,
    });
  }
  
  return contacts.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
};

const initialContacts = generateContacts();

const ContactsManager = () => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.company.toLowerCase().includes(query) ||
        contact.location.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const deleteSelected = () => {
    setContacts(contacts.filter((c) => !selectedIds.has(c.id)));
    toast.success(`Deleted ${selectedIds.size} contacts`);
    setSelectedIds(new Set());
  };

  const exportToCSV = (contactsToExport: Contact[]) => {
    const headers = ["Name", "Email", "Phone", "Company", "Location", "Source", "Date Saved", "Notes"];
    const rows = contactsToExport.map((contact) => [
      contact.name,
      contact.email,
      contact.phone,
      contact.company,
      contact.location,
      contact.source,
      contact.savedAt.toLocaleDateString(),
      contact.notes || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${contactsToExport.length} leads to CSV`);
  };

  const exportSelected = () => {
    const selectedContacts = contacts.filter((c) => selectedIds.has(c.id));
    exportToCSV(selectedContacts);
  };

  const exportAll = () => {
    exportToCSV(filteredContacts);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            <GradientText>Contacts</GradientText> Manager
          </h1>
          <p className="text-muted-foreground mt-1">Manage leads and contacts saved from your profile</p>
        </div>
        <div className="flex gap-3">
          {selectedIds.size > 0 && (
            <>
              <NeonButton variant="outline" onClick={exportSelected}>
                <Download className="w-4 h-4 mr-2" />
                Export Selected ({selectedIds.size})
              </NeonButton>
              <NeonButton variant="outline" onClick={deleteSelected} className="text-destructive border-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </NeonButton>
            </>
          )}
          <NeonButton onClick={exportAll}>
            <Download className="w-4 h-4 mr-2" />
            Export All CSV
          </NeonButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{contacts.length}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-success/10 text-success">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {contacts.filter((c) => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return c.savedAt >= weekAgo;
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Set(contacts.map((c) => c.company)).size}
              </p>
              <p className="text-sm text-muted-foreground">Companies</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-warning/10 text-warning">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Set(contacts.map((c) => c.location.split(",")[1]?.trim())).size}
              </p>
              <p className="text-sm text-muted-foreground">Locations</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Search & Filter */}
      <GlassCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts by name, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
          />
        </div>
      </GlassCard>

      {/* Contacts Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredContacts.length && filteredContacts.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-border bg-muted accent-primary"
                  />
                </th>
                <th className="text-left p-4 font-semibold text-foreground">Contact</th>
                <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Company</th>
                <th className="text-left p-4 font-semibold text-foreground hidden lg:table-cell">Location</th>
                <th className="text-left p-4 font-semibold text-foreground hidden lg:table-cell">Source</th>
                <th className="text-left p-4 font-semibold text-foreground">Date</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact, index) => (
                <motion.tr
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="w-4 h-4 rounded border-border bg-muted accent-primary"
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-foreground">{contact.company}</span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{contact.location}</span>
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {contact.source}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-muted-foreground text-sm">
                      {contact.savedAt.toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedContact(contact)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToCSV([contact])}>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setContacts(contacts.filter((c) => c.id !== contact.id));
                            toast.success("Contact deleted");
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContacts.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No contacts found</p>
          </div>
        )}
      </GlassCard>

      {/* Contact Detail Modal */}
      <AnimatePresence>
        {selectedContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedContact(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <GlassCard className="p-6" variant="neon">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold font-display text-foreground">{selectedContact.name}</h2>
                    <p className="text-muted-foreground">{selectedContact.company}</p>
                  </div>
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-foreground">{selectedContact.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-foreground">{selectedContact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-foreground">{selectedContact.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Saved via {selectedContact.source}</p>
                      <p className="text-foreground">{selectedContact.savedAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                  {selectedContact.notes && (
                    <div className="p-3 rounded-xl bg-muted">
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-foreground">{selectedContact.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <NeonButton className="flex-1" onClick={() => exportToCSV([selectedContact])}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </NeonButton>
                  <NeonButton
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      window.location.href = `mailto:${selectedContact.email}`;
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </NeonButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContactsManager;
