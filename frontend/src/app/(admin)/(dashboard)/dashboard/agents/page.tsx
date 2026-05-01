"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Bot, Clock, CheckCircle2, XCircle, Zap, AlertTriangle,
    RefreshCw, Users, FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api, type AgentTask, type AgentMetrics } from "@/lib/api/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending_approval: { label: "Pending",   color: "#92400E", bg: "#FEF3C7", icon: <Clock size={12} /> },
    auto_sent:        { label: "Auto Sent", color: "#065F46", bg: "#D1FAE5", icon: <Zap   size={12} /> },
    approved:         { label: "Approved",  color: "#1D4ED8", bg: "#DBEAFE", icon: <CheckCircle2 size={12} /> },
    rejected:         { label: "Rejected",  color: "#991B1B", bg: "#FEE2E2", icon: <XCircle size={12} /> },
    failed:           { label: "Failed",    color: "#991B1B", bg: "#FEE2E2", icon: <AlertTriangle size={12} /> },
}

const AGENT_LABELS: Record<string, string> = {
    sales:     "Sales",
    quote:     "Quote",
    followup:  "Follow-up",
    accounts:  "Accounts",
}

export default function AgentsDashboardPage() {
    const [metrics, setMetrics] = useState<AgentMetrics | null>(null)
    const [tasks,   setTasks]   = useState<AgentTask[]>([])
    const [loading, setLoading] = useState(true)

    const load = async () => {
        setLoading(true)
        try {
            const [mRes, tRes] = await Promise.all([
                api.admin.agents.getMetrics(),
                api.admin.agents.getTasks({ pageSize: 20 }),
            ])
            setMetrics(mRes.data)
            setTasks(tRes.data.items)
        } catch {
            toast.error("Failed to load agent data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Claude agents handling sales, quotes, and client communication
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw size={14} className={loading ? "animate-spin mr-1.5" : "mr-1.5"} />
                        Refresh
                    </Button>
                    <Link href="/dashboard/agents/queue">
                        <Button size="sm" style={{ backgroundColor: "#8B5E3C" }} className="text-white hover:opacity-90">
                            <Clock size={14} className="mr-1.5" />
                            Approval Queue
                            {metrics && metrics.pending > 0 && (
                                <span className="ml-2 bg-white text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                    {metrics.pending}
                                </span>
                            )}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metric Cards */}
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        label="Pending Approval"
                        value={metrics.pending}
                        icon={<Clock size={20} />}
                        color="#92400E"
                        bg="#FEF9C3"
                    />
                    <MetricCard
                        label="Auto-Sent Today"
                        value={metrics.totalToday}
                        icon={<Zap size={20} />}
                        color="#065F46"
                        bg="#D1FAE5"
                    />
                    <MetricCard
                        label="This Week"
                        value={metrics.totalWeek}
                        icon={<Bot size={20} />}
                        color="#1D4ED8"
                        bg="#DBEAFE"
                    />
                    <MetricCard
                        label="Failed"
                        value={metrics.failed}
                        icon={<AlertTriangle size={20} />}
                        color="#991B1B"
                        bg="#FEE2E2"
                    />
                </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickLink
                    href="/dashboard/agents/queue"
                    icon={<Clock size={20} />}
                    title="Approval Queue"
                    description="Review and approve agent-drafted emails before sending"
                    count={metrics?.pending}
                />
                <QuickLink
                    href="/dashboard/agents/context"
                    icon={<Bot size={20} />}
                    title="Agent Context"
                    description="Edit the business knowledge that feeds every agent prompt"
                />
                <QuickLink
                    href="/dashboard/contacts"
                    icon={<Users size={20} />}
                    title="Contacts"
                    description="View all client inquiries the sales agent has responded to"
                />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                    <span className="text-xs text-gray-400">{tasks.length} tasks loaded</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
                ) : tasks.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bot size={40} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 font-medium">No agent activity yet</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Agents will appear here once a contact form is submitted.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {tasks.map((task) => {
                            const meta = STATUS_META[task.status] ?? STATUS_META.failed
                            return (
                                <div key={task.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50">
                                    <div
                                        className="flex h-9 w-9 items-center justify-center rounded-full shrink-0 mt-0.5"
                                        style={{ backgroundColor: meta.bg, color: meta.color }}
                                    >
                                        <Bot size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm text-gray-900">
                                                {AGENT_LABELS[task.agentType] ?? task.agentType} agent
                                            </span>
                                            <Badge
                                                style={{ backgroundColor: meta.bg, color: meta.color, border: "none" }}
                                                className="text-xs font-medium flex items-center gap-1"
                                            >
                                                {meta.icon}
                                                {meta.label}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-0.5 truncate">
                                            {task.draftSubject || task.inputSummary}
                                        </p>
                                        {task.toAddress && (
                                            <p className="text-xs text-gray-400 mt-0.5">→ {task.toAddress}</p>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                                        {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

function MetricCard({
    label, value, icon, color, bg,
}: {
    label: string; value: number; icon: React.ReactNode; color: string; bg: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium">{label}</span>
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: bg, color }}
                >
                    {icon}
                </div>
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
        </div>
    )
}

function QuickLink({
    href, icon, title, description, count,
}: {
    href: string; icon: React.ReactNode; title: string; description: string; count?: number;
}) {
    return (
        <Link href={href}>
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer h-full">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        {icon}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{title}</span>
                        {count != null && count > 0 && (
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {count}
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </Link>
    )
}
