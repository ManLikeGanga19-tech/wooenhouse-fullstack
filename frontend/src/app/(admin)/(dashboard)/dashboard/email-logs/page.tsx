"use client"

import { useEffect, useState } from "react"
import {
    Mail, AlertCircle, CheckCircle2, TrendingUp,
    User, Reply, FileText, Newspaper, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { api, type EmailLog, type EmailLogStats } from "@/lib/api/client"
import { toast } from "sonner"
import { format } from "date-fns"

const TYPE_META: Record<EmailLog["type"], { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    contact_alert: { label: "Contact Alert",  icon: <User       size={14} />, color: "#1D4ED8", bg: "#EFF6FF" },
    auto_reply:    { label: "Auto Reply",      icon: <Reply      size={14} />, color: "#059669", bg: "#ECFDF5" },
    quote:         { label: "Quote",           icon: <FileText   size={14} />, color: "#92400E", bg: "#FEF3C7" },
    newsletter:    { label: "Newsletter",      icon: <Newspaper  size={14} />, color: "#7C3AED", bg: "#F5F3FF" },
}

const FILTERS = [
    { key: "",       label: "All" },
    { key: "sent",   label: "Sent" },
    { key: "failed", label: "Failed" },
]

export default function EmailLogsPage() {
    const [logs,     setLogs]     = useState<EmailLog[]>([])
    const [stats,    setStats]    = useState<EmailLogStats | null>(null)
    const [loading,  setLoading]  = useState(true)
    const [filter,   setFilter]   = useState<string>("")
    const [total,    setTotal]    = useState(0)
    const [page,     setPage]     = useState(1)
    const PAGE_SIZE = 50

    const load = async (statusFilter: string, p: number) => {
        setLoading(true)
        try {
            const [logsRes, statsRes] = await Promise.all([
                api.admin.emailLogs.getAll({
                    status:   statusFilter || undefined,
                    page:     p,
                    pageSize: PAGE_SIZE,
                }),
                api.admin.emailLogs.getStats(),
            ])
            setLogs(logsRes.data.items)
            setTotal(logsRes.data.total)
            setStats(statsRes.data)
        } catch {
            toast.error("Failed to load email logs")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load(filter, page) }, [filter, page]) // eslint-disable-line

    const handleFilter = (f: string) => { setFilter(f); setPage(1) }

    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "#8B5E3C" }}>Email Logs</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Every transactional email the system has sent or attempted</p>
                </div>
                <Button
                    variant="outline" size="sm" className="border-2 gap-1.5"
                    onClick={() => load(filter, page)}
                >
                    <RefreshCw size={14} /> Refresh
                </Button>
            </div>

            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Total Sent",    value: stats.sent,   icon: <CheckCircle2 size={18} />, color: "#059669", bg: "#ECFDF5" },
                        { label: "Failed",        value: stats.failed, icon: <AlertCircle  size={18} />, color: "#DC2626", bg: "#FEF2F2" },
                        { label: "Sent Today",    value: stats.today,  icon: <TrendingUp   size={18} />, color: "#8B5E3C", bg: "#FEF3C7" },
                        { label: "Total Logged",  value: stats.total,  icon: <Mail         size={18} />, color: "#6B7280", bg: "#F9FAFB" },
                    ].map(s => (
                        <div key={s.label} className="rounded-xl border-2 border-gray-100 bg-white p-4 flex items-center gap-3">
                            <div className="rounded-full p-2" style={{ background: s.bg, color: s.color }}>
                                {s.icon}
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                <p className="text-xs text-gray-500">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-2">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => handleFilter(f.key)}
                        className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                        style={{
                            background: filter === f.key ? "#8B5E3C" : "#F5F0EB",
                            color:      filter === f.key ? "white"    : "#8B5E3C",
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
                    <Mail size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No emails logged yet</p>
                    <p className="text-xs text-gray-400 mt-1">Emails appear here after the contact form is submitted or a quote is sent</p>
                </div>
            ) : (
                <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {logs.map(log => {
                            const meta = TYPE_META[log.type] ?? TYPE_META.contact_alert
                            return (
                                <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <div
                                        className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full"
                                        style={{ background: meta.bg, color: meta.color }}
                                    >
                                        {meta.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-semibold" style={{ color: meta.color }}>
                                                {meta.label}
                                            </span>
                                            <span
                                                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                style={{
                                                    background: log.status === "sent" ? "#ECFDF5" : "#FEF2F2",
                                                    color:      log.status === "sent" ? "#059669" : "#DC2626",
                                                }}
                                            >
                                                {log.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-800 truncate font-medium">{log.subject}</p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {log.fromAddress} → {log.toAddress}
                                        </p>
                                        {log.errorMessage && (
                                            <p className="text-xs text-red-500 truncate mt-0.5">{log.errorMessage}</p>
                                        )}
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-xs text-gray-400">{format(new Date(log.sentAt), "d MMM")}</p>
                                        <p className="text-xs text-gray-400">{format(new Date(log.sentAt), "HH:mm")}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {total > PAGE_SIZE && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>
                            Next
                        </Button>
                    </div>
                </div>
            )}

        </div>
    )
}
