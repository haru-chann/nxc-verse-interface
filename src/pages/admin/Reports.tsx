import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, query, getDocs, orderBy, doc, updateDoc, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { Loader2, Flag, CheckCircle, XCircle, AlertTriangle, Eye, ExternalLink, ShieldAlert, ShieldBan } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { NeonButton } from "@/components/ui/NeonButton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { adminService } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";

export const AdminReports = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
    const { currentUser } = useAuth();

    // View/Action State
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Warning State
    const [isWarnOpen, setIsWarnOpen] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const [isSubmittingWarn, setIsSubmittingWarn] = useState(false);

    const [searchParams] = useSearchParams(); // [NEW]

    const fetchReports = async () => {
        setLoading(true);
        try {
            const reportsRef = collection(db, "reports");
            // Simple query, filtering client side for flexibility or server side if large
            // Given admin volume usually low, client side filter of recent 100 is fine, but let's try to order by date
            const q = query(reportsRef, orderBy("createdAt", "desc"));

            const snapshot = await getDocs(q);
            const rawReports = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setReports(rawReports);

            // [NEW] Deep Linking Check
            const deepMatchId = searchParams.get("reportId");
            if (deepMatchId) {
                const matchedReport = rawReports.find(r => r.id === deepMatchId);
                if (matchedReport) {
                    setSelectedReport(matchedReport);
                    setIsDetailsOpen(true);
                }
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
            toast({
                title: "Error",
                description: "Failed to fetch reports",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const filteredReports = reports.filter(report => {
        if (statusFilter === 'all') return true;
        return report.status === statusFilter;
    });

    const handleOpenDetails = (report: any) => {
        setSelectedReport(report);
        setIsDetailsOpen(true);
    };

    const updateReportStatus = async (reportId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, "reports", reportId), {
                status: newStatus
            });

            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));

            // If currently open details match
            if (selectedReport?.id === reportId) {
                setSelectedReport(prev => ({ ...prev, status: newStatus }));
            }

            toast({
                title: "Updated",
                description: `Report marked as ${newStatus}`,
            });
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive"
            });
        }
    };

    const handleDismiss = async () => {
        if (!selectedReport) return;
        await updateReportStatus(selectedReport.id, 'dismissed');
        await adminService.logAction(
            "Report Dismissed",
            selectedReport.reportedUserName,
            `Report against ${selectedReport.reportedUserName} was dismissed`,
            currentUser?.displayName || "Admin"
        );
        setIsDetailsOpen(false);
    };

    const handleWarnUser = async () => {
        if (!selectedReport) return;
        setIsWarnOpen(true);
    };

    const submitWarning = async () => {
        if (!selectedReport || !warningMessage.trim()) return;

        setIsSubmittingWarn(true);
        try {
            // 1. Update User Doc with Warning
            await updateDoc(doc(db, "users", selectedReport.reportedUserId), {
                warning: {
                    message: warningMessage,
                    timestamp: serverTimestamp(),
                    seen: false,
                    adminId: "admin" // or current admin ID
                }
            });

            // 2. Resolve the report
            await updateReportStatus(selectedReport.id, 'resolved');

            // 3. Create Notification (Optional: if notification system exists)
            // Assuming a 'notifications' collection
            /*
            await addDoc(collection(db, "notifications"), {
                userId: selectedReport.reportedUserId,
                type: "warning",
                message: "You have received a warning from admin.",
                read: false,
                createdAt: serverTimestamp()
            });
            */

            toast({
                title: "User Warned",
                description: "Warning sent and report resolved.",
            });

            setIsWarnOpen(false);
            setWarningMessage("");
            setIsDetailsOpen(false);

            await adminService.logAction(
                "User Warned",
                selectedReport.reportedUserName,
                `Warning sent: "${warningMessage}"`,
                currentUser?.displayName || "Admin"
            );

        } catch (error) {
            console.error("Error sending warning:", error);
            toast({
                title: "Error",
                description: "Failed to send warning",
                variant: "destructive"
            });
        } finally {
            setIsSubmittingWarn(false);
        }
    };

    const handleBanUser = async () => {
        if (!selectedReport) return;
        // Re-use logic or just flag?
        // Ideally we should call a service or similar logic to Users page
        if (confirm("Are you sure you want to BAN this user? This will block their access.")) {
            try {
                await updateDoc(doc(db, "users", selectedReport.reportedUserId), {
                    isBanned: true
                });
                await updateReportStatus(selectedReport.id, 'resolved');

                await adminService.logAction(
                    "User Banned",
                    selectedReport.reportedUserName,
                    `User banned via report review`,
                    currentUser?.displayName || "Admin"
                );

                toast({ title: "User Banned", description: "User has been banned and report resolved." });
                setIsDetailsOpen(false);
            } catch (e) {
                console.error(e);
                toast({ title: "Error", description: "Failed to ban user", variant: "destructive" });
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-foreground">
                        Report <GradientText>Management</GradientText>
                    </h1>
                    <p className="text-muted-foreground mt-1">Review and manage user reports</p>
                </div>

                {/* Filters */}
                <div className="flex gap-2 bg-muted/30 p-1 rounded-lg border border-white/5">
                    {(['all', 'pending', 'resolved', 'dismissed'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === filter
                                ? 'bg-primary/20 text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop Table View */}
            <GlassCard className="hidden md:block overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Reported User</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Reasons</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Reporter</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Date</th>
                                <th className="text-right p-4 font-medium text-muted-foreground text-sm">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                    </td>
                                </tr>
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No reports found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map(report => (
                                    <tr key={report.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-foreground">
                                            {report.reportedUserName || "Unknown"}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {report.reasons?.slice(0, 2).map((r: string) => (
                                                    <Badge key={r} variant="outline" className="text-xs bg-white/5 border-white/10">{r}</Badge>
                                                ))}
                                                {report.reasons?.length > 2 && (
                                                    <Badge variant="outline" className="text-xs bg-white/5 border-white/10">+{report.reasons.length - 2}</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground text-sm">
                                            {report.reporterName || "Anonymous"}
                                        </td>
                                        <td className="p-4">
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${report.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    report.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                {report.status === 'pending' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                {report.status === 'resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                {report.status === 'dismissed' && <XCircle className="w-3 h-3 mr-1" />}
                                                {report.status?.toUpperCase()}
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground text-sm">
                                            {report.createdAt?.seconds
                                                ? format(new Date(report.createdAt.seconds * 1000), "MMM d, yyyy")
                                                : "-"}
                                        </td>
                                        <td className="p-4 text-right">
                                            <NeonButton size="sm" variant="ghost" onClick={() => handleOpenDetails(report)}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Review
                                            </NeonButton>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-white/5 rounded-xl border border-white/10">
                        No reports found for this filter.
                    </div>
                ) : (
                    filteredReports.map(report => (
                        <GlassCard key={report.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Report Against</div>
                                    <div className="font-bold text-foreground text-lg">{report.reportedUserName || "Unknown"}</div>
                                    <div className="text-xs text-muted-foreground">by {report.reporterName || "Anonymous"}</div>
                                </div>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border
                                    ${report.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                        report.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                    {report.status === 'pending' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                    {report.status === 'resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                                    {report.status === 'dismissed' && <XCircle className="w-3 h-3 mr-1" />}
                                    {report.status?.toUpperCase()}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground mb-2">Reasons:</div>
                                <div className="flex flex-wrap gap-1">
                                    {report.reasons?.map((r: string) => (
                                        <Badge key={r} variant="outline" className="text-xs bg-white/5 border-white/10">{r}</Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">
                                    {report.createdAt?.seconds
                                        ? format(new Date(report.createdAt.seconds * 1000), "MMM d, yyyy")
                                        : "-"}
                                </div>
                                <NeonButton size="sm" variant="ghost" onClick={() => handleOpenDetails(report)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Review Details
                                </NeonButton>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            {/* Detailed View */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Report Details</DialogTitle>
                        <DialogDescription>Review the full context of this report.</DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Reported User</h4>
                                    <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
                                        <span className="font-bold text-foreground">{selectedReport.reportedUserName}</span>
                                        <a href={`/profile/${selectedReport.reportedUserId}`} target="_blank" rel="noreferrer" className="text-primary text-xs flex items-center hover:underline">
                                            Visit Profile <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Reporter</h4>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <span className="font-bold text-foreground">{selectedReport.reporterName}</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Status</h4>
                                    <div className="flex gap-2">
                                        {selectedReport.status === 'pending' && (
                                            <NeonButton size="sm" variant="outline" onClick={() => updateReportStatus(selectedReport.id, 'resolved')}>
                                                Mark Resolved
                                            </NeonButton>
                                        )}
                                        {selectedReport.status !== 'dismissed' && (
                                            <NeonButton size="sm" variant="ghost" className="text-muted-foreground hover:text-white" onClick={handleDismiss}>
                                                Dismiss
                                            </NeonButton>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Reasons</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedReport.reasons?.map((r: string) => (
                                            <Badge key={r} variant="secondary">{r}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                                    <div className="p-4 bg-muted/30 border border-white/5 rounded-lg text-sm text-foreground/90 min-h-[100px]">
                                        {selectedReport.description || "No description provided."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex justify-between sm:justify-between items-center bg-destructive/10 -mx-6 -mb-6 p-6 mt-6 border-t border-destructive/20 rounded-b-lg">
                        <div className="text-xs text-destructive font-medium uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Admin Actions
                        </div>
                        <div className="flex gap-3">
                            <NeonButton
                                variant="outline"
                                className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
                                onClick={handleWarnUser}
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Warn User
                            </NeonButton>
                            <NeonButton
                                variant="outline"
                                className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                onClick={handleBanUser}
                            >
                                <ShieldBan className="w-4 h-4 mr-2" />
                                Ban User
                            </NeonButton>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Warning Dialog */}
            <Dialog open={isWarnOpen} onOpenChange={setIsWarnOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Warning</DialogTitle>
                        <DialogDescription>
                            Send a formal warning to this user. This will appear as a pop-up when they log in.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Enter warning message (e.g., 'Your profile content violates our community guidelines...')"
                            value={warningMessage}
                            onChange={(e) => setWarningMessage(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <NeonButton variant="outline" onClick={() => setIsWarnOpen(false)}>Cancel</NeonButton>
                        <NeonButton onClick={submitWarning} disabled={isSubmittingWarn || !warningMessage}>
                            {isSubmittingWarn ? "Sending..." : "Send Warning"}
                        </NeonButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
