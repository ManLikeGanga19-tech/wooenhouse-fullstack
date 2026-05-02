"use client"

import { useEffect, useState } from "react"
import {
    Clock, CheckCircle2, XCircle, ChevronLeft,
    Bot, Edit2, Send, AlertTriangle, RefreshCw,
    Eye, Code2, RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { api, type AgentTask } from "@/lib/api/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

// ─── Agent display metadata ───────────────────────────────────────────────────
const AGENT_META: Record<string, { name: string; description: string; color: string; bg: string }> = {
    sales:    { name: "Sales Agent",    description: "Responds to new client inquiries",          color: "#8B5E3C", bg: "#FEF3C7" },
    quote:    { name: "Quote Agent",    description: "Drafts and sends formal quotations",         color: "#1D4ED8", bg: "#DBEAFE" },
    followup: { name: "Follow-up Agent",description: "Chases contacts who haven't replied",        color: "#065F46", bg: "#D1FAE5" },
    accounts: { name: "Accounts Agent", description: "Weekly pipeline and revenue digest",         color: "#7C3AED", bg: "#F5F3FF" },
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    pending_approval: { label: "Pending Review", color: "#92400E", bg: "#FEF3C7" },
    auto_sent:        { label: "Auto Sent",       color: "#065F46", bg: "#D1FAE5" },
    approved:         { label: "Approved & Sent", color: "#1D4ED8", bg: "#DBEAFE" },
    rejected:         { label: "Rejected",        color: "#991B1B", bg: "#FEE2E2" },
    failed:           { label: "Failed",          color: "#991B1B", bg: "#FEE2E2" },
}

export default function AgentQueuePage() {
    const [tasks,       setTasks]      = useState<AgentTask[]>([])
    const [failedTasks, setFailedTasks]= useState<AgentTask[]>([])
    const [loading,     setLoading]    = useState(true)
    const [selected,    setSelected]   = useState<AgentTask | null>(null)
    const [editSubject, setEditSubject]= useState("")
    const [editBody,    setEditBody]   = useState("")
    const [editing,     setEditing]    = useState(false)
    const [previewMode, setPreviewMode]= useState<"rendered" | "source">("rendered")
    const [submitting,  setSubmitting] = useState(false)
    const [rejectNote,  setRejectNote] = useState("")
    const [rejecting,   setRejecting]  = useState(false)
    const [retrying,    setRetrying]   = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const [qRes, fRes] = await Promise.all([
                api.admin.agents.getQueue(),
                api.admin.agents.getTasks({ status: "failed", pageSize: 20 }),
            ])
            setTasks(qRes.data)
            setFailedTasks(fRes.data.items)
        } catch {
            toast.error("Failed to load queue")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const openTask = (task: AgentTask) => {
        setSelected(task)
        setEditSubject(task.draftSubject)
        setEditBody(task.draftBody)
        setEditing(false)
        setPreviewMode("rendered")
        setRejectNote("")
        setRejecting(false)
    }

    const approve = async () => {
        if (!selected) return
        setSubmitting(true)
        try {
            await api.admin.agents.approve(selected.id, {
                subject: editing ? editSubject : undefined,
                body:    editing ? editBody    : undefined,
            })
            toast.success("Email approved and sent")
            setSelected(null)
            await load()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Approval failed")
        } finally {
            setSubmitting(false)
        }
    }

    const reject = async () => {
        if (!selected) return
        setSubmitting(true)
        try {
            await api.admin.agents.reject(selected.id, rejectNote || undefined)
            toast.success("Task rejected")
            setSelected(null)
            await load()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Rejection failed")
        } finally {
            setSubmitting(false)
        }
    }

    const retryContact = async (contactId: string) => {
        setRetrying(contactId)
        try {
            await api.admin.agents.generateReply(contactId)
            toast.success("Retry queued", { description: "New draft added to approval queue." })
            await load()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Retry failed")
        } finally {
            setRetrying(null)
        }
    }

    // ── Detail view ───────────────────────────────────────────────────────────
    if (selected) {
        const agent = AGENT_META[selected.agentType] ?? AGENT_META.sales
        const currentBody = editing ? editBody : selected.draftBody

        return (
            <div className="space-y-5 max-w-3xl">
                <button
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
                >
                    <ChevronLeft size={16} /> Back to queue
                </button>

                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                                style={{ backgroundColor: agent.bg, color: agent.color }}
                            >
                                <Bot size={18} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">{agent.name}</h2>
                                <p className="text-xs text-gray-400">
                                    {selected.contactName || selected.toAddress} ·{" "}
                                    {formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                            <Edit2 size={13} className="mr-1.5" />
                            {editing ? "Cancel Edit" : "Edit Draft"}
                        </Button>
                    </div>

                    {/* Trigger summary */}
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Trigger</p>
                        {selected.inputSummary}
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Subject</label>
                        {editing ? (
                            <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="font-medium" />
                        ) : (
                            <p className="text-sm font-medium text-gray-900 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                {selected.draftSubject}
                            </p>
                        )}
                    </div>

                    {/* Body — rendered preview or source toggle */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Body</label>
                            {!editing && (
                                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                                    <button
                                        onClick={() => setPreviewMode("rendered")}
                                        className="flex items-center gap-1 px-2.5 py-1 transition-colors"
                                        style={{
                                            backgroundColor: previewMode === "rendered" ? "#8B5E3C" : "white",
                                            color:           previewMode === "rendered" ? "white"    : "#6B7280",
                                        }}
                                    >
                                        <Eye size={11} /> Preview
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode("source")}
                                        className="flex items-center gap-1 px-2.5 py-1 transition-colors"
                                        style={{
                                            backgroundColor: previewMode === "source" ? "#8B5E3C" : "white",
                                            color:           previewMode === "source" ? "white"    : "#6B7280",
                                        }}
                                    >
                                        <Code2 size={11} /> Source
                                    </button>
                                </div>
                            )}
                        </div>

                        {editing ? (
                            <Textarea
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                rows={16}
                                className="font-mono text-xs"
                            />
                        ) : previewMode === "rendered" ? (
                            <iframe
                                srcDoc={currentBody}
                                className="w-full rounded-lg border border-gray-100"
                                style={{ height: "420px" }}
                                sandbox="allow-same-origin"
                                title="Email preview"
                            />
                        ) : (
                            <pre className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-xs text-gray-700 overflow-x-auto max-h-96 whitespace-pre-wrap break-all">
                                {currentBody}
                            </pre>
                        )}
                    </div>

                    {/* Reject note */}
                    {rejecting && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                Rejection Note (optional)
                            </label>
                            <Input
                                placeholder="Why are you rejecting this draft?"
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                        <Button
                            onClick={approve}
                            disabled={submitting}
                            className="text-white"
                            style={{ backgroundColor: "#8B5E3C" }}
                        >
                            <Send size={14} className="mr-1.5" />
                            {submitting ? "Sending…" : "Approve & Send"}
                        </Button>
                        {!rejecting ? (
                            <Button variant="outline" onClick={() => setRejecting(true)} className="border-red-200 text-red-600 hover:bg-red-50">
                                <XCircle size={14} className="mr-1.5" /> Reject
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={reject} disabled={submitting} className="border-red-400 text-red-600 hover:bg-red-50">
                                <XCircle size={14} className="mr-1.5" />
                                {submitting ? "Rejecting…" : "Confirm Reject"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // ── Queue list view ───────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/agents" className="text-gray-400 hover:text-gray-700">
                            <ChevronLeft size={18} />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Review AI-drafted emails before they are sent to clients
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "animate-spin mr-1.5" : "mr-1.5"} />
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
                </div>
            ) : (
                <>
                    {/* Pending approval */}
                    {tasks.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-14 text-center">
                            <CheckCircle2 size={44} className="mx-auto mb-3 text-green-400" />
                            <p className="font-semibold text-gray-700">Queue is clear</p>
                            <p className="text-sm text-gray-400 mt-1">No agent drafts pending your review</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                Pending Review ({tasks.length})
                            </h2>
                            {tasks.map((task) => {
                                const agent = AGENT_META[task.agentType] ?? AGENT_META.sales
                                return (
                                    <button
                                        key={task.id}
                                        onClick={() => openTask(task)}
                                        className="w-full bg-white rounded-xl border border-amber-200 p-5 hover:border-amber-400 hover:shadow-sm transition-all text-left"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className="flex h-9 w-9 items-center justify-center rounded-full shrink-0 mt-0.5"
                                                    style={{ backgroundColor: agent.bg, color: agent.color }}
                                                >
                                                    <Bot size={16} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900 text-sm">{agent.name}</p>
                                                        <span className="text-xs text-gray-400">·</span>
                                                        <p className="text-xs text-gray-500">{agent.description}</p>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mt-0.5">
                                                        {task.draftSubject || "(no subject)"}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        To: {task.toAddress ?? task.contactEmail ?? "—"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Clock size={12} className="text-amber-500" />
                                                <span className="text-xs text-amber-600 font-medium">
                                                    {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Failed tasks */}
                    {failedTasks.length > 0 && (
                        <div className="space-y-3 mt-6">
                            <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wide flex items-center gap-2">
                                <AlertTriangle size={14} /> Failed ({failedTasks.length})
                            </h2>
                            {failedTasks.map((task) => {
                                const agent = AGENT_META[task.agentType] ?? AGENT_META.sales
                                return (
                                    <div key={task.id} className="bg-white rounded-xl border border-red-100 p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 shrink-0 mt-0.5">
                                                    <AlertTriangle size={16} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900 text-sm">{agent.name}</p>
                                                        <span
                                                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                            style={{ backgroundColor: STATUS_META.failed.bg, color: STATUS_META.failed.color }}
                                                        >
                                                            Failed
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        To: {task.toAddress ?? task.contactEmail ?? "—"} ·{" "}
                                                        {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                                                    </p>
                                                    {task.errorMessage && (
                                                        <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded px-2 py-1 font-mono">
                                                            {task.errorMessage}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {task.contactId && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                                                    disabled={retrying === task.contactId}
                                                    onClick={() => retryContact(task.contactId!)}
                                                >
                                                    <RotateCcw size={13} className="mr-1.5" />
                                                    {retrying === task.contactId ? "Retrying…" : "Retry"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
