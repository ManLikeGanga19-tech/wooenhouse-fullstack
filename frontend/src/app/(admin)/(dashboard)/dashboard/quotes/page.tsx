"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Banknote, CheckCircle, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/common/SearchBar";
import ExportMenu from "@/components/common/ExportMenu";
import QuotesTable from "@/components/quotes/QuotesTable";
import { api, type Quote } from "@/lib/api/client";
import { exportQuotesToCSV } from "@/lib/utils/exporters";
import { formatCurrency } from "@/lib/utils/formatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button as Btn } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

export default function QuotesPage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();

    const [quotes,       setQuotes]       = useState<Quote[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [searchQuery,  setSearchQuery]  = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        api.admin.quotes.getAll({ pageSize: 500 })
            .then(r => setQuotes(r.data.items))
            .catch(() => toast.error("Failed to load quotes"))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        return quotes.filter(q => {
            const s = searchQuery.toLowerCase();
            const matchSearch = !s ||
                q.quoteNumber.toLowerCase().includes(s) ||
                q.customerName.toLowerCase().includes(s) ||
                q.customerEmail.toLowerCase().includes(s);
            const matchStatus = statusFilter === "all" || q.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [quotes, searchQuery, statusFilter]);

    const accepted   = filtered.filter(q => q.status === "accepted");
    const totalValue = accepted.reduce((sum, q) => sum + q.finalPrice, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: "#8B5E3C" }}>Quotes</h1>
                    <p className="text-gray-600 mt-1">Create and manage customer quotes</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportMenu onExportCSV={() => exportQuotesToCSV(filtered as never)} disabled={filtered.length === 0} />
                    <Button onClick={() => router.push(qs ? `/dashboard/quotes/new?${qs}` : "/dashboard/quotes/new")} className="text-white font-semibold" style={{ backgroundColor: "#8B5E3C" }}>
                        <Plus size={16} className="mr-2" /> New Quote
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total",    count: filtered.length,                                     color: "#8B5E3C", icon: FileText   },
                    { label: "Draft",    count: filtered.filter(q => q.status === "draft").length,   color: "#6B7280", icon: Clock      },
                    { label: "Sent",     count: filtered.filter(q => q.status === "sent").length,    color: "#3B82F6", icon: FileText   },
                    { label: "Accepted", count: filtered.filter(q => q.status === "accepted").length,color: "#10B981", icon: CheckCircle},
                ].map(s => (
                    <div key={s.label} className="rounded-lg border-2 border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2">
                            <s.icon size={18} style={{ color: s.color }} />
                            <span className="text-sm font-medium text-gray-600">{s.label}</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-lg border-2 border-[#8B5E3C] bg-gradient-to-br from-[#8B5E3C] to-[#5D3A1A] p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-white/80">Total Accepted Value</p>
                        <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by quote #, customer name, or email..." className="sm:w-96" />
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-44 border-2"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                        <SelectContent>
                            {["all","draft","sent","viewed","accepted","rejected","expired"].map(v => (
                                <SelectItem key={v} value={v}>{v === "all" ? "All Status" : v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {statusFilter !== "all" && (
                        <Btn variant="outline" size="sm" onClick={() => setStatusFilter("all")} className="border-2">
                            <X size={14} className="mr-1" /> Clear
                        </Btn>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded bg-gray-100 animate-pulse" />)}</div>
            ) : (
                <QuotesTable quotes={filtered as never} />
            )}

            {!loading && filtered.length > 0 && (
                <p className="text-sm text-gray-500 text-center">
                    Showing {filtered.length} of {quotes.length} quotes
                </p>
            )}
        </div>
    );
}
