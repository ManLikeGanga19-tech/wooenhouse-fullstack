"use client"

import { useEffect, useRef, useState } from "react"
import {
    ChevronLeft, Save, RefreshCw, Bot, Info,
    Clock, Upload, FileText, Trash2, Loader2,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { api, type AgentContext } from "@/lib/api/client"
import { toast } from "sonner"
import { format } from "date-fns"

const isUpload = (key: string) => key.startsWith("upload_")

export default function AgentContextPage() {
    const [rows,       setRows]       = useState<AgentContext[]>([])
    const [loading,    setLoading]    = useState(true)
    const [edits,      setEdits]      = useState<Record<string, string>>({})
    const [saving,     setSaving]     = useState<Record<string, boolean>>({})
    const [deleting,   setDeleting]   = useState<Record<string, boolean>>({})
    const [uploading,  setUploading]  = useState(false)
    const [dragging,   setDragging]   = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const contextRows = rows.filter(r => !isUpload(r.key))
    const uploadRows  = rows.filter(r => isUpload(r.key))

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

    const deleteEntry = async (key: string, label: string) => {
        if (!confirm(`Remove "${label}" from the agent knowledge base?`)) return
        setDeleting((s) => ({ ...s, [key]: true }))
        try {
            await api.admin.agents.deleteContext(key)
            setRows((prev) => prev.filter((r) => r.key !== key))
            toast.success(`"${label}" removed`)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Delete failed")
        } finally {
            setDeleting((s) => ({ ...s, [key]: false }))
        }
    }

    const handleUpload = async (file: File) => {
        const ext = file.name.split(".").pop()?.toLowerCase()
        if (!["txt", "md", "pdf"].includes(ext ?? "")) {
            toast.error("Only .txt, .md, and .pdf files are supported")
            return
        }
        setUploading(true)
        try {
            const res = await api.admin.agents.uploadContextFile(file)
            setRows((prev) => [...prev, res.data])
            toast.success(`"${file.name}" added to agent knowledge base`, {
                description: `${(res.data.value.length / 1000).toFixed(1)}k characters extracted`,
            })
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Upload failed")
        } finally {
            setUploading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
        e.target.value = ""
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleUpload(file)
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
                        Everything here is injected into every AI agent prompt. Keep it accurate.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "animate-spin mr-1.5" : "mr-1.5"} />
                    Refresh
                </Button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700">
                    Changes take effect immediately on the next agent run. The more accurate and detailed
                    this context is, the better your agents will respond to clients.
                </p>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                    Loading…
                </div>
            ) : (
                <>
                    {/* ── Text context fields ── */}
                    {contextRows.length > 0 && (
                        <div className="space-y-4">
                            {contextRows.map((row) => (
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

                    {/* ── Uploaded documents ── */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">Uploaded Documents</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Upload company brochures, price lists, portfolios or any documents you want
                                agents to reference. Supported: .txt, .md, .pdf (max 10 MB)
                            </p>
                        </div>

                        {/* Drop zone */}
                        <div
                            className="p-5 border-b border-gray-100"
                            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                        >
                            <div
                                className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
                                style={{
                                    borderColor: dragging ? "#8B5E3C" : "#E5E7EB",
                                    background:  dragging ? "#FEF9F5" : "#FAFAFA",
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.md,.pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 size={28} className="animate-spin text-amber-700" />
                                        <p className="text-sm text-gray-500">Extracting text…</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload size={28} className="text-gray-300" />
                                        <p className="text-sm font-medium text-gray-600">
                                            Drop a file here or{" "}
                                            <span className="underline" style={{ color: "#8B5E3C" }}>browse</span>
                                        </p>
                                        <p className="text-xs text-gray-400">.txt · .md · .pdf — max 10 MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Uploaded files list */}
                        {uploadRows.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bot size={32} className="mx-auto mb-2 text-gray-200" />
                                <p className="text-sm text-gray-400">No documents uploaded yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {uploadRows.map((row) => (
                                    <div key={row.key} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 shrink-0">
                                            <FileText size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{row.label}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {row.hint} · Added {format(new Date(row.updatedAt), "d MMM yyyy")}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => deleteEntry(row.key, row.label)}
                                            disabled={deleting[row.key]}
                                        >
                                            {deleting[row.key]
                                                ? <Loader2 size={14} className="animate-spin" />
                                                : <Trash2 size={14} />}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
