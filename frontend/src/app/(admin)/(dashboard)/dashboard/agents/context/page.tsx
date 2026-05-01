"use client"

import { useEffect, useState } from "react"
import {
    ChevronLeft, Save, RefreshCw, Bot, Info,
    Clock,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { api, type AgentContext } from "@/lib/api/client"
import { toast } from "sonner"
import { format } from "date-fns"

export default function AgentContextPage() {
    const [rows,    setRows]    = useState<AgentContext[]>([])
    const [loading, setLoading] = useState(true)
    const [edits,   setEdits]   = useState<Record<string, string>>({})
    const [saving,  setSaving]  = useState<Record<string, boolean>>({})

    const load = async () => {
        setLoading(true)
        try {
            const res = await api.admin.agents.getContext()
            setRows(res.data)
            const initial: Record<string, string> = {}
            res.data.forEach((r) => { initial[r.key] = r.value })
            setEdits(initial)
        } catch {
            toast.error("Failed to load agent context")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const save = async (key: string) => {
        setSaving((s) => ({ ...s, [key]: true }))
        try {
            await api.admin.agents.updateContext(key, edits[key] ?? "")
            toast.success("Context saved")
            setRows((prev) =>
                prev.map((r) => r.key === key ? { ...r, value: edits[key], updatedAt: new Date().toISOString() } : r)
            )
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Save failed")
        } finally {
            setSaving((s) => ({ ...s, [key]: false }))
        }
    }

    const isDirty = (key: string) => {
        const row = rows.find((r) => r.key === key)
        return row ? edits[key] !== row.value : false
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/agents" className="text-gray-400 hover:text-gray-700">
                            <ChevronLeft size={18} />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Agent Context</h1>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        This information is injected into every AI agent prompt. Keep it accurate.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "animate-spin mr-1.5" : "mr-1.5"} />
                    Refresh
                </Button>
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700">
                    Changes take effect immediately on the next agent run. Be specific and accurate —
                    the agents use this text verbatim when crafting emails.
                </p>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                    Loading…
                </div>
            ) : rows.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Bot size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No context entries found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rows.map((row) => (
                        <div key={row.key} className="bg-white rounded-xl border border-gray-200 p-5">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{row.label}</h3>
                                    {row.hint && (
                                        <p className="text-xs text-gray-400 mt-0.5">{row.hint}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                                    <Clock size={11} />
                                    {format(new Date(row.updatedAt), "d MMM yyyy")}
                                </div>
                            </div>

                            <Textarea
                                value={edits[row.key] ?? ""}
                                onChange={(e) => setEdits((prev) => ({ ...prev, [row.key]: e.target.value }))}
                                rows={4}
                                className="text-sm resize-y"
                                placeholder={row.hint ?? "Enter context…"}
                            />

                            <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-400 font-mono">{row.key}</span>
                                <Button
                                    size="sm"
                                    onClick={() => save(row.key)}
                                    disabled={saving[row.key] || !isDirty(row.key)}
                                    className="text-white"
                                    style={{ backgroundColor: isDirty(row.key) ? "#8B5E3C" : undefined }}
                                    variant={isDirty(row.key) ? "default" : "outline"}
                                >
                                    <Save size={13} className="mr-1.5" />
                                    {saving[row.key] ? "Saving…" : isDirty(row.key) ? "Save Changes" : "Saved"}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
