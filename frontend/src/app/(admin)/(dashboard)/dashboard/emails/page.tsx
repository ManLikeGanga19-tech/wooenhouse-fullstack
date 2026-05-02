"use client"

import { useEffect, useState } from "react"
import {
    Mail, AlertCircle, CheckCircle2, TrendingUp,
    User, Reply, FileText, Newspaper, RefreshCw, Bot,
    RotateCcw, Eye, X, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { api, type EmailLog, type EmailLogDetail, type EmailLogStats } from "@/lib/api/client"
import { toast } from "sonner"
import { format } from "date-fns"

const TYPE_META: Record<EmailLog["type"], { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    contact_alert: { label: "Contact Alert",  icon: <User       size={14} />, color: "#1D4ED8", bg: "#EFF6FF" },
    auto_reply:    { label: "Auto Reply",      icon: <Reply      size={14} />, color: "#059669", bg: "#ECFDF5" },
    quote:         { label: "Quote",           icon: <FileText   size={14} />, color: "#92400E", bg: "#FEF3C7" },
    newsletter:    { label: "Newsletter",      icon: <Newspaper  size={14} />, color: "#7C3AED", bg: "#F5F3FF" },
    agent:         { label: "AI Agent",        icon: <Bot        size={14} />, color: "#B45309", bg: "#FEF3C7" },
    resend:        { label: "Resent",          icon: <RotateCcw  size={14} />, color: "#0369A1", bg: "#E0F2FE" },
}

const FILTERS = [
    { key: "",       label: "All" },
    { key: "sent",   label: "Sent" },
    { key: "failed", label: "Failed" },
]

export default function EmailsPage() {
    const [logs,       setLogs]       = useState<EmailLog[]>([])
    const [stats,      setStats]      = useState<EmailLogStats | null>(null)
    const [loading,    setLoading]    = useState(true)
    const [filter,     setFilter]     = useState<string>("")
    const [total,      setTotal]      = useState(0)
    const [page,       setPage]       = useState(1)
    const [resending,  setResending]  = useState<string | null>(null)
    const [preview,    setPreview]    = useState<EmailLogDetail | null>(null)
    const [previewLoading, setPreviewLoading] = useState(false)
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

    const handleResend = async (id: string) => {
        setResending(id)
        try {
            const res = await api.admin.emailLogs.resend(id)
            toast.success(res.data.message)
            load(filter, page)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Resend failed")
        } finally {
            setResending(null)
        }
    }

    const handlePreview = async (id: string) => {
        setPreviewLoading(true)
        try {
            const res = await api.admin.emailLogs.getById(id)
            setPreview(res.data)
        } catch {
            toast.error("Could not load email body")
        } finally {
            setPreviewLoading(false)
        }
    }

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
                            const isFailed = log.status === "failed"
                            const isResending = resending === log.id
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
                                                    background: isFailed ? "#FEF2F2" : "#ECFDF5",
                                                    color:      isFailed ? "#DC2626" : "#059669",
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
                                    <div className="shrink-0 flex items-center gap-2">
                                        {log.hasBody && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs text-gray-500"
                                                onClick={() => handlePreview(log.id)}
                                                disabled={previewLoading}
                                            >
                                                <Eye size={13} className="mr-1" />
                                                Preview
                                            </Button>
                                        )}
                                        {isFailed && log.hasBody && (
                                            <Button
                                                size="sm"
                                                className="h-7 px-2 text-xs text-white"
                                                style={{ backgroundColor: "#0369A1" }}
                                                onClick={() => handleResend(log.id)}
                                                disabled={isResending}
                                            >
                                                {isResending
                                                    ? <Loader2 size={12} className="animate-spin mr-1" />
                                                    : <RotateCcw size={12} className="mr-1" />}
                                                Resend
                                            </Button>
                                        )}
                                        <div className="text-right min-w-[40px]">
                                            <p className="text-xs text-gray-400">{format(new Date(log.sentAt), "d MMM")}</p>
                                            <p className="text-xs text-gray-400">{format(new Date(log.sentAt), "HH:mm")}</p>
                                        </div>
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

            {/* Email Preview Modal */}
            {preview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">{preview.subject}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {preview.fromAddress} → {preview.toAddress} · {format(new Date(preview.sentAt), "d MMM yyyy HH:mm")}
                                </p>
                            </div>
                            <button
                                onClick={() => setPreview(null)}
                                className="text-gray-400 hover:text-gray-600 ml-4"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-1">
                            {preview.htmlBody ? (
                                <iframe
                                    srcDoc={preview.htmlBody}
                                    sandbox="allow-same-origin"
                                    className="w-full h-[60vh] rounded-lg border border-gray-100"
                                    title="Email preview"
                                />
                            ) : (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No HTML body stored for this email.
                                </div>
                            )}
                        </div>
                        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                            {preview.status === "failed" && preview.hasBody && (
                                <Button
                                    size="sm"
                                    className="text-white"
                                    style={{ backgroundColor: "#0369A1" }}
                                    onClick={() => { handleResend(preview.id); setPreview(null) }}
                                    disabled={resending === preview.id}
                                >
                                    <RotateCcw size={13} className="mr-1.5" />
                                    Resend
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
