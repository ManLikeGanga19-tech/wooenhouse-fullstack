"use client";

import { useEffect, useState, useMemo } from "react";
import { Users } from "lucide-react";
import SearchBar from "@/components/common/SearchBar";
import ExportMenu from "@/components/common/ExportMenu";
import ContactsTable from "@/components/contacts/ContactsTable";
import ContactFilters from "@/components/contacts/ContactFilters";
import { api, type Contact } from "@/lib/api/client";
import { exportContactsToCSV } from "@/lib/utils/exporters";
import { toast } from "sonner";

export default function ContactsPage() {
    const [contacts,      setContacts]      = useState<Contact[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [searchQuery,   setSearchQuery]   = useState("");
    const [statusFilter,  setStatusFilter]  = useState("all");
    const [serviceFilter, setServiceFilter] = useState("all");

    useEffect(() => {
        api.admin.contacts.getAll({ pageSize: 500 })
            .then(r => setContacts(r.data.items))
            .catch(() => toast.error("Failed to load contacts"))
            .finally(() => setLoading(false));
    }, []);

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
                <ExportMenu onExportCSV={() => exportContactsToCSV(filtered as never)} disabled={filtered.length === 0} />
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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or phone..." className="sm:w-80" />
                <ContactFilters
                    statusFilter={statusFilter}
                    serviceFilter={serviceFilter}
                    onStatusChange={setStatusFilter}
                    onServiceChange={setServiceFilter}
                    onClearFilters={() => { setStatusFilter("all"); setServiceFilter("all"); }}
                    hasActiveFilters={hasActiveFilters}
                />
            </div>

            {loading ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded bg-gray-100 animate-pulse" />)}</div>
            ) : (
                <ContactsTable contacts={filtered as never} />
            )}

            {!loading && filtered.length > 0 && (
                <p className="text-sm text-gray-500 text-center">
                    Showing {filtered.length} of {contacts.length} contacts
                </p>
            )}
        </div>
    );
}
