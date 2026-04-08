"use client";

import { useEffect, useState, useMemo } from "react";
import { Mail, Users, UserCheck, UserX } from "lucide-react";
import SearchBar from "@/components/common/SearchBar";
import ExportMenu from "@/components/common/ExportMenu";
import SubscribersTable from "@/components/newsletter/SubscribersTable";
import { api, type NewsletterSubscriber } from "@/lib/api/client";
import { exportNewsletterToCSV } from "@/lib/utils/exporters";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function NewsletterPage() {
    const [subscribers,   setSubscribers]   = useState<NewsletterSubscriber[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [searchQuery,   setSearchQuery]   = useState("");
    const [statusFilter,  setStatusFilter]  = useState("all");
    const [sourceFilter,  setSourceFilter]  = useState("all");

    const load = () => {
        setLoading(true);
        api.admin.newsletter.getAll()
            .then(r => setSubscribers(r.data))
            .catch(() => toast.error("Failed to load subscribers"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

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
    const active      = filtered.filter(s => s.status === "active").length;
    const unsub       = filtered.filter(s => s.status === "unsubscribed").length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: "#8B5E3C" }}>Newsletter Subscribers</h1>
                    <p className="text-gray-600 mt-1">Manage newsletter subscribers and mailing list</p>
                </div>
                <ExportMenu onExportCSV={() => exportNewsletterToCSV(filtered as never)} disabled={filtered.length === 0} />
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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by email or name..." className="sm:w-80" />
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
            </div>

            {loading ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded bg-gray-100 animate-pulse" />)}</div>
            ) : (
                <SubscribersTable subscribers={filtered as never} />
            )}

            {!loading && filtered.length > 0 && (
                <p className="text-sm text-gray-500 text-center">
                    Showing {filtered.length} of {subscribers.length} subscribers
                </p>
            )}
        </div>
    );
}
