"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Bot, Clock, CheckCircle2, XCircle, Zap, AlertTriangle,
    RefreshCw, Users, Play, Inbox, CreditCard, ExternalLink,
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
    sales:    "Sales",
    quote:    "Quote",
    followup: "Follow-up",
    accounts: "Accounts",
}

const TRIGGER_LABELS: Record<string, string> = {
    contact_form:     "New contact",
    admin_batch:      "Batch run",
    admin_manual:     "Manual",
    quote_send:       "Quote cover",
    followup_1:       "Follow-up 1",
    followup_2:       "Follow-up 2",
    quote_reminder:   "Quote reminder",
    payment_reminder: "Payment reminder",
    scheduled:        "Scheduled",
}

export default function AgentsDashboardPage() {
    const [metrics,            setMetrics]           = useState<AgentMetrics | null>(null)
    const [tasks,              setTasks]              = useState<AgentTask[]>([])
    const [unprocessedCount,   setUnprocessedCount]   = useState<number>(0)
    const [loading,            setLoading]            = useState(true)
    const [processing,         setProcessing]         = useState(false)
    const [runningFollowups,   setRunningFollowups]   = useState(false)
    const [runningAccounts,    setRunningAccounts]    = useState(false)

    const creditsLow = tasks.some(t => t.errorMessage?.startsWith("CREDITS_LOW:"))

    const load = async () => {
        setLoading(true)
        try {
            const [mRes, tRes, uRes] = await Promise.all([
                api.admin.agents.getMetrics(),
                api.admin.agents.getTasks({ pageSize: 20 }),
                api.admin.agents.getUnprocessedCount(),
            ])
            setMetrics(mRes.data)
            setTasks(tRes.data.items)
            setUnprocessedCount(uRes.data.count)
        } catch {
            toast.error("Failed to load agent data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleRunFollowups = async () => {
        setRunningFollowups(true)
        try {
            await api.admin.agents.runFollowups()
            toast.success("Follow-up agent started", { description: "Drafts will appear in the approval queue shortly." })
            setTimeout(() => load(), 4000)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to start follow-up agent")
        } finally {
            setRunningFollowups(false)
        }
    }

    const handleRunAccounts = async () => {
        setRunningAccounts(true)
        try {
            await api.admin.agents.runAccounts()
            toast.success("Accounts agent started", { description: "Payment reminders and weekly report are being prepared." })
            setTimeout(() => load(), 4000)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to start accounts agent")
        } finally {
            setRunningAccounts(false)
        }
    }

    const handleProcessNew = async () => {
        if (unprocessedCount === 0) return
        setProcessing(true)
        try {
            await api.admin.agents.processNewContacts()
            toast.success(
                `Processing ${unprocessedCount} contact${unprocessedCount !== 1 ? "s" : ""}…`,
                { description: "Drafts will appear in the approval queue shortly." }
            )
            // Reload after a short delay to show updated queue count
            setTimeout(() => load(), 3000)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to start processing")
        } finally {
            setProcessing(false)
        }
    }

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

            {/* Credits-low banner */}
            {creditsLow && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700 shrink-0 mt-0.5">
                            <CreditCard size={18} />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-red-900 text-sm">
                                Anthropic credit balance too low — AI agents are paused
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                                Your Anthropic account has run out of credits. All agent tasks are failing until you top up.
                                Follow these steps to restore agent functionality:
                            </p>
                            <ol className="text-xs text-red-700 mt-2 space-y-0.5 list-decimal list-inside">
                                <li>Go to <strong>console.anthropic.com → Plans &amp; Billing</strong></li>
                                <li>Add credits or upgrade your plan</li>
                                <li>Come back and retry any failed tasks from the <strong>Approval Queue</strong></li>
                            </ol>
                        </div>
                        <a
                            href="https://console.anthropic.com/settings/billing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                        >
                            <Button size="sm" className="text-white" style={{ backgroundColor: "#B91C1C" }}>
                                <ExternalLink size={13} className="mr-1.5" />
                                Top Up Credits
                            </Button>
                        </a>
                    </div>
                </div>
            )}

            {/* Unprocessed contacts banner */}
            {unprocessedCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                            <Inbox size={18} />
                        </div>
                        <div>
                            <p className="font-semibold text-amber-900 text-sm">
                                {unprocessedCount} contact{unprocessedCount !== 1 ? "s" : ""} waiting for a reply
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                These clients have status "new" and haven't received an agent response yet.
                                Drafts will be added to the approval queue for your review before sending.
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleProcessNew}
                        disabled={processing}
                        className="text-white shrink-0"
                        style={{ backgroundColor: "#B45309" }}
                    >
                        <Play size={13} className="mr-1.5" />
                        {processing ? "Starting…" : `Generate ${unprocessedCount} Draft${unprocessedCount !== 1 ? "s" : ""}`}
                    </Button>
                </div>
            )}

            {/* Metric Cards */}
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard label="Pending Approval" value={metrics.pending}    icon={<Clock size={20} />}         color="#92400E" bg="#FEF9C3" />
                    <MetricCard label="Auto-Sent Today"  value={metrics.totalToday} icon={<Zap size={20} />}           color="#065F46" bg="#D1FAE5" />
                    <MetricCard label="This Week"        value={metrics.totalWeek}  icon={<Bot size={20} />}           color="#1D4ED8" bg="#DBEAFE" />
                    <MetricCard label="Failed"           value={metrics.failed}     icon={<AlertTriangle size={20} />} color="#991B1B" bg="#FEE2E2" />
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
                    count={unprocessedCount > 0 ? unprocessedCount : undefined}
                    countLabel="unprocessed"
                />
            </div>

            {/* Manual Agent Triggers */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-1 text-sm">Run Agents Manually</h2>
                <p className="text-xs text-gray-400 mb-4">
                    Scheduled agents run automatically, but you can trigger them anytime.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AgentTriggerCard
                        title="Follow-up Agent"
                        description="Checks contacts 3+ days silent and queues a follow-up draft"
                        schedule="Daily at 8:00 AM EAT"
                        onRun={handleRunFollowups}
                        running={runningFollowups}
                    />
                    <AgentTriggerCard
                        title="Accounts Agent"
                        description="Queues payment reminders for accepted quotes and sends the weekly report"
                        schedule="Every Monday at 9:00 AM EAT"
                        onRun={handleRunAccounts}
                        running={runningAccounts}
                    />
                </div>
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
                            {unprocessedCount > 0
                                ? "Use the button above to generate replies for existing contacts."
                                : "Agents will appear here once a contact form is submitted."}
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

function MetricCard({ label, value, icon, color, bg }: {
    label: string; value: number; icon: React.ReactNode; color: string; bg: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium">{label}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: bg, color }}>
                    {icon}
                </div>
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
        </div>
    )
}

function QuickLink({ href, icon, title, description, count, countLabel }: {
    href: string; icon: React.ReactNode; title: string; description: string;
    count?: number; countLabel?: string;
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
                                {count}{countLabel ? ` ${countLabel}` : ""}
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </Link>
    )
}

function AgentTriggerCard({ title, description, schedule, onRun, running }: {
    title: string; description: string; schedule: string;
    onRun: () => void; running: boolean;
}) {
    return (
        <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                <p className="text-xs text-amber-700 mt-1 font-medium">{schedule}</p>
            </div>
            <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-2"
                style={{ borderColor: "#8B5E3C", color: "#8B5E3C" }}
                onClick={onRun}
                disabled={running}
            >
                {running ? <RefreshCw size={13} className="animate-spin mr-1.5" /> : <Play size={13} className="mr-1.5" />}
                {running ? "Running…" : "Run Now"}
            </Button>
        </div>
    )
}
