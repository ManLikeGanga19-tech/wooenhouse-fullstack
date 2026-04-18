"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Mail, Users, UserCheck, UserX, ShieldAlert, RefreshCw, Send } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import SearchBar from "@/components/common/SearchBar";
import ExportMenu from "@/components/common/ExportMenu";
import SubscribersTable from "@/components/newsletter/SubscribersTable";
import { api, type NewsletterSubscriber } from "@/lib/api/client";
import { exportNewsletterToCSV } from "@/lib/utils/exporters";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X } from "lucide-react";

const COMPOSE_EMPTY = { subject: "", content: "" };

export default function NewsletterPage() {
    const [subscribers,   setSubscribers]   = useState<NewsletterSubscriber[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [searchQuery,   setSearchQuery]   = useState("");
    const [statusFilter,  setStatusFilter]  = useState("all");
    const [sourceFilter,  setSourceFilter]  = useState("all");
    const [showSpam,      setShowSpam]      = useState(false);
    const [composeOpen,   setComposeOpen]   = useState(false);
    const [compose,       setCompose]       = useState(COMPOSE_EMPTY);
    const [sending,       setSending]       = useState(false);

    const load = useCallback((spam = showSpam) => {
        setLoading(true);
        api.admin.newsletter.getAll({ showSpam: spam })
            .then(r => setSubscribers(r.data))
            .catch(() => toast.error("Failed to load subscribers"))
            .finally(() => setLoading(false));
    }, [showSpam]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const { pullDistance, isRefreshing } = usePullToRefresh(load);

    const handleSpamToggle = (spam: boolean) => {
        setShowSpam(spam);
        setSearchQuery("");
        setStatusFilter("all");
        setSourceFilter("all");
        load(spam);
    };

    const handleMarkSpam = async (id: string, isSpam: boolean) => {
        try {
            await api.admin.newsletter.markSpam(id, isSpam);
            toast.success(isSpam ? "Marked as spam" : "Marked as not spam");
            load(showSpam);
        } catch {
            toast.error("Failed to update spam status");
        }
    };

    const filtered = useMemo(() => {
        return subscribers.filter(s => {
            const q = searchQuery.toLowerCase();
            const matchSearch  = !q || s.email.toLowerCase().includes(q) || (s.name ?? "").toLowerCase().includes(q);
            const matchStatus  = statusFilter === "all" || s.status === statusFilter;
            const matchSource  = sourceFilter === "all" || s.source === sourceFilter;
            return matchSearch && matchStatus && matchSource;
        });
    }, [subscribers, searchQuery, statusFilter, sourceFilter]);

    const hasActiveFilters = statusFilter !== "all" || sourceFilter !== "all";
    const active = filtered.filter(s => s.status === "active").length;
    const unsub  = filtered.filter(s => s.status === "unsubscribed").length;
    const activeRecipients = subscribers.filter(s => s.status === "active" && !s.isSpam).length;

    const handleSend = async () => {
        if (!compose.subject.trim() || !compose.content.trim()) {
            toast.error("Subject and content are required.");
            return;
        }
        setSending(true);
        try {
            const res = await api.admin.newsletter.send(compose);
            toast.success(res.data.message);
            setComposeOpen(false);
            setCompose(COMPOSE_EMPTY);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to send newsletter.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Pull-to-refresh indicator (mobile only) */}
            {(pullDistance > 0 || isRefreshing) && (
                <div
                    className="md:hidden flex justify-center overflow-hidden transition-all"
                    style={{ height: isRefreshing ? "36px" : `${pullDistance * 0.5}px`, opacity: isRefreshing ? 1 : pullDistance / 70 }}
                >
                    <RefreshCw
                        size={20}
                        className={`text-[#8B5E3C] ${isRefreshing ? "animate-spin" : ""}`}
                        style={{ transform: `rotate(${pullDistance * 3}deg)` }}
                    />
                </div>
            )}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: "#8B5E3C" }}>Newsletter Subscribers</h1>
                    <p className="text-gray-600 mt-1">Manage newsletter subscribers and mailing list</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        onClick={() => setComposeOpen(true)}
                        className="gap-1.5"
                        style={{ background: "#8B5E3C", color: "white" }}
                    >
                        <Send size={14} /> Compose Newsletter
                    </Button>
                    <Button
                        variant={showSpam ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleSpamToggle(!showSpam)}
                        className="border-2"
                    >
                        <ShieldAlert size={14} className="mr-1.5" />
                        {showSpam ? "Hide Spam" : "Show Spam"}
                    </Button>
                    <ExportMenu onExportCSV={() => exportNewsletterToCSV(filtered as never)} disabled={filtered.length === 0} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2"><Users size={18} style={{ color: "#8B5E3C" }} /><span className="text-sm font-medium text-gray-600">Total</span></div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{filtered.length}</p>
                </div>
                <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2"><UserCheck size={18} style={{ color: "#10B981" }} /><span className="text-sm font-medium text-gray-600">Active</span></div>
                    <p className="mt-2 text-2xl font-bold" style={{ color: "#10B981" }}>{active}</p>
                </div>
                <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2"><UserX size={18} style={{ color: "#EF4444" }} /><span className="text-sm font-medium text-gray-600">Unsubscribed</span></div>
                    <p className="mt-2 text-2xl font-bold" style={{ color: "#EF4444" }}>{unsub}</p>
                </div>
                <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2"><Mail size={18} style={{ color: "#3B82F6" }} /><span className="text-sm font-medium text-gray-600">All Sources</span></div>
                    <p className="mt-2 text-2xl font-bold" style={{ color: "#3B82F6" }}>{subscribers.length}</p>
                </div>
            </div>

            {showSpam && (
                <div className="flex items-center gap-2 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <ShieldAlert size={16} />
                    Showing spam subscribers. These were flagged automatically — review and mark as &quot;Not Spam&quot; if incorrect.
                </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by email or name..." className="sm:w-80" />
                {!showSpam && (
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40 border-2"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                            <SelectTrigger className="w-44 border-2"><SelectValue placeholder="Source" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="footer">Footer</SelectItem>
                                <SelectItem value="contact-form">Contact Form</SelectItem>
                                <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                        </Select>
                        {hasActiveFilters && (
                            <Button variant="outline" size="sm" onClick={() => { setStatusFilter("all"); setSourceFilter("all"); }} className="border-2">
                                <X size={14} className="mr-1" /> Clear
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded bg-gray-100 animate-pulse" />)}</div>
            ) : (
                <SubscribersTable subscribers={filtered as never} showSpam={showSpam} onMarkSpam={handleMarkSpam} />
            )}

            {!loading && filtered.length > 0 && (
                <p className="text-sm text-gray-500 text-center">
                    Showing {filtered.length} of {subscribers.length} {showSpam ? "spam" : ""} subscribers
                </p>
            )}

            {/* ── Compose Newsletter Sheet ─────────────────────────────────── */}
            <Sheet open={composeOpen} onOpenChange={setComposeOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
                    <SheetHeader className="px-6 py-4 border-b">
                        <SheetTitle className="text-lg font-bold" style={{ color: "#8B5E3C" }}>
                            Compose Newsletter
                        </SheetTitle>
                        <p className="text-sm text-gray-500">
                            Sending to{" "}
                            <span className="font-semibold" style={{ color: "#8B5E3C" }}>
                                {activeRecipients} active subscriber{activeRecipients !== 1 ? "s" : ""}
                            </span>
                        </p>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                        {/* Subject */}
                        <div className="space-y-1.5">
                            <Label htmlFor="nl-subject" className="text-sm font-semibold">
                                Subject <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="nl-subject"
                                placeholder="e.g. New projects available — June 2026"
                                value={compose.subject}
                                onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))}
                                className="border-2 focus:border-[#8B5E3C]"
                            />
                        </div>

                        {/* Body */}
                        <div className="space-y-1.5">
                            <Label htmlFor="nl-content" className="text-sm font-semibold">
                                Content <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-xs text-gray-400">
                                Write your message. Press Enter twice to start a new paragraph.
                            </p>
                            <Textarea
                                id="nl-content"
                                placeholder={`Dear subscriber,\n\nWe have exciting news to share with you...\n\nBest regards,\nWooden Houses Kenya`}
                                value={compose.content}
                                onChange={e => setCompose(p => ({ ...p, content: e.target.value }))}
                                rows={16}
                                className="border-2 focus:border-[#8B5E3C] resize-none font-mono text-sm leading-relaxed"
                            />
                            <p className="text-xs text-gray-400 text-right">
                                {compose.content.length} characters
                            </p>
                        </div>

                        {/* Preview notice */}
                        {compose.content && (
                            <div className="rounded-lg border-2 border-[#C49A6C]/40 bg-[#FEF3C7]/40 p-3">
                                <p className="text-xs text-amber-800 font-medium mb-1">Email preview</p>
                                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {compose.content.length > 300
                                        ? compose.content.slice(0, 300) + "…"
                                        : compose.content}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer actions */}
                    <div className="px-6 py-4 border-t flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 border-2"
                            onClick={() => { setComposeOpen(false); setCompose(COMPOSE_EMPTY); }}
                            disabled={sending}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 gap-2"
                            style={{ background: "#8B5E3C", color: "white" }}
                            onClick={handleSend}
                            disabled={sending || !compose.subject.trim() || !compose.content.trim()}
                        >
                            {sending ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : (
                                <Send size={14} />
                            )}
                            {sending ? "Sending…" : `Send to ${activeRecipients}`}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
