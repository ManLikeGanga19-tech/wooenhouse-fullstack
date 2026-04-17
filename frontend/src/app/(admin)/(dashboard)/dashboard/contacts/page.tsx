"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, ShieldAlert } from "lucide-react";
import SearchBar from "@/components/common/SearchBar";
import ExportMenu from "@/components/common/ExportMenu";
import ContactsTable from "@/components/contacts/ContactsTable";
import ContactFilters from "@/components/contacts/ContactFilters";
import { api, type Contact } from "@/lib/api/client";
import { exportContactsToCSV } from "@/lib/utils/exporters";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ContactsPage() {
    const [contacts,      setContacts]      = useState<Contact[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [searchQuery,   setSearchQuery]   = useState("");
    const [statusFilter,  setStatusFilter]  = useState("all");
    const [serviceFilter, setServiceFilter] = useState("all");
    const [showSpam,      setShowSpam]      = useState(false);

    const load = (spam = showSpam) => {
        setLoading(true);
        api.admin.contacts.getAll({ pageSize: 500, showSpam: spam })
            .then(r => setContacts(r.data.items))
            .catch(() => toast.error("Failed to load contacts"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSpamToggle = (spam: boolean) => {
        setShowSpam(spam);
        setSearchQuery("");
        setStatusFilter("all");
        setServiceFilter("all");
        load(spam);
    };

    const handleMarkSpam = async (id: string, isSpam: boolean) => {
        try {
            await api.admin.contacts.update(id, { isSpam });
            toast.success(isSpam ? "Marked as spam" : "Marked as not spam");
            load(showSpam);
        } catch {
            toast.error("Failed to update spam status");
        }
    };

    const filtered = useMemo(() => {
        return contacts.filter(c => {
            const q = searchQuery.toLowerCase();
            const matchSearch  = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone ?? "").includes(q);
            const matchStatus  = statusFilter  === "all" || c.status        === statusFilter;
            const matchService = serviceFilter === "all" || c.serviceType   === serviceFilter;
            return matchSearch && matchStatus && matchService;
        });
    }, [contacts, searchQuery, statusFilter, serviceFilter]);

    const hasActiveFilters = statusFilter !== "all" || serviceFilter !== "all";

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: "#8B5E3C" }}>Contacts</h1>
                    <p className="text-gray-600 mt-1">Manage customer inquiries and contact submissions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant={showSpam ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleSpamToggle(!showSpam)}
                        className="border-2"
                    >
                        <ShieldAlert size={14} className="mr-1.5" />
                        {showSpam ? "Hide Spam" : "Show Spam"}
                    </Button>
                    <ExportMenu onExportCSV={() => exportContactsToCSV(filtered as never)} disabled={filtered.length === 0} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total",     count: filtered.length,                                        color: "#8B5E3C" },
                    { label: "New",       count: filtered.filter(c => c.status === "new").length,        color: "#3B82F6" },
                    { label: "Contacted", count: filtered.filter(c => c.status === "contacted").length,  color: "#F59E0B" },
                    { label: "Converted", count: filtered.filter(c => c.status === "converted").length,  color: "#10B981" },
                ].map(s => (
                    <div key={s.label} className="rounded-lg border-2 border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2">
                            <Users size={18} style={{ color: s.color }} />
                            <span className="text-sm font-medium text-gray-600">{s.label}</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
                    </div>
                ))}
            </div>

            {showSpam && (
                <div className="flex items-center gap-2 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <ShieldAlert size={16} />
                    Showing spam submissions. These were flagged automatically — review and mark as &quot;Not Spam&quot; if incorrect.
                </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or phone..." className="sm:w-80" />
                {!showSpam && (
                    <ContactFilters
                        statusFilter={statusFilter}
                        serviceFilter={serviceFilter}
                        onStatusChange={setStatusFilter}
                        onServiceChange={setServiceFilter}
                        onClearFilters={() => { setStatusFilter("all"); setServiceFilter("all"); }}
                        hasActiveFilters={hasActiveFilters}
                    />
                )}
            </div>

            {loading ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded bg-gray-100 animate-pulse" />)}</div>
            ) : (
                <ContactsTable contacts={filtered as never} showSpam={showSpam} onMarkSpam={handleMarkSpam} />
            )}

            {!loading && filtered.length > 0 && (
                <p className="text-sm text-gray-500 text-center">
                    Showing {filtered.length} of {contacts.length} {showSpam ? "spam" : ""} contacts
                </p>
            )}
        </div>
    );
}
