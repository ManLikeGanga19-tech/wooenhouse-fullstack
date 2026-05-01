"use client"

import { useEffect, useState } from "react"
import {
    Clock, CheckCircle2, XCircle, ChevronLeft,
    Bot, Edit2, Send, AlertTriangle, RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { api, type AgentTask } from "@/lib/api/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export default function AgentQueuePage() {
    const [tasks,   setTasks]   = useState<AgentTask[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<AgentTask | null>(null)
    const [editSubject, setEditSubject] = useState("")
    const [editBody,    setEditBody]    = useState("")
    const [editing,   setEditing]   = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [rejectNote, setRejectNote] = useState("")
    const [rejecting, setRejecting] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const res = await api.admin.agents.getQueue()
            setTasks(res.data)
        } catch {
            toast.error("Failed to load approval queue")
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

    if (selected) {
        return (
            <div className="space-y-6 max-w-3xl">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSelected(null)}
                        className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm"
                    >
                        <ChevronLeft size={16} /> Back to queue
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="font-semibold text-lg text-gray-900">
                                Review Agent Draft
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {selected.contactName || selected.toAddress} ·{" "}
                                {formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(!editing)}
                        >
                            <Edit2 size={13} className="mr-1.5" />
                            {editing ? "Cancel Edit" : "Edit Draft"}
                        </Button>
                    </div>

                    {/* Input summary */}
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                        <p className="font-medium text-gray-700 mb-1 text-xs uppercase tracking-wide">
                            Trigger
                        </p>
                        {selected.inputSummary}
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                            Subject
                        </label>
                        {editing ? (
                            <Input
                                value={editSubject}
                                onChange={(e) => setEditSubject(e.target.value)}
                                className="font-medium"
                            />
                        ) : (
                            <p className="text-sm font-medium text-gray-900 border border-gray-100 rounded-lg px-3 py-2 bg-gray-50">
                                {selected.draftSubject}
                            </p>
                        )}
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                            Email Body
                        </label>
                        {editing ? (
                            <Textarea
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                rows={14}
                                className="font-mono text-xs"
                            />
                        ) : (
                            <div
                                className="border border-gray-100 rounded-lg p-4 text-sm bg-gray-50 max-h-96 overflow-y-auto"
                                dangerouslySetInnerHTML={{ __html: selected.draftBody }}
                            />
                        )}
                    </div>

                    {/* Reject note */}
                    {rejecting && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
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
                            <Button
                                variant="outline"
                                onClick={() => setRejecting(true)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                                <XCircle size={14} className="mr-1.5" />
                                Reject
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={reject}
                                disabled={submitting}
                                className="border-red-400 text-red-600 hover:bg-red-50"
                            >
                                <XCircle size={14} className="mr-1.5" />
                                {submitting ? "Rejecting…" : "Confirm Reject"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

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
                        Agent-drafted emails waiting for your review before sending
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "animate-spin mr-1.5" : "mr-1.5"} />
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                    Loading…
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                    <CheckCircle2 size={44} className="mx-auto mb-3 text-green-400" />
                    <p className="font-semibold text-gray-700">Queue is clear</p>
                    <p className="text-sm text-gray-400 mt-1">No agent tasks pending approval</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tasks.map((task) => (
                        <button
                            key={task.id}
                            onClick={() => openTask(task)}
                            className="w-full bg-white rounded-xl border border-amber-200 p-5 hover:border-amber-400 hover:shadow-sm transition-all text-left"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-700 shrink-0 mt-0.5">
                                        <Bot size={16} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">
                                            {task.draftSubject || "(no subject)"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            To: {task.toAddress ?? task.contactEmail ?? "—"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                            {task.inputSummary}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Clock size={12} className="text-amber-500" />
                                    <span className="text-xs text-amber-600 font-medium">
                                        {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
