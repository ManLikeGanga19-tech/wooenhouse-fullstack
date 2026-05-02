"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import {
    ChevronLeft, Activity, Cpu, MemoryStick, Clock, Zap, Bot,
    AlertTriangle, CheckCircle2, XCircle, RefreshCw, ExternalLink,
    TrendingUp, DollarSign, Users, FileText,
} from "lucide-react"
import { api, type AgentHealth, type AgentHealthAgent } from "@/lib/api/client"
import { formatDistanceToNow } from "date-fns"

const REFRESH_INTERVAL = 15 // seconds

const AGENT_ICONS: Record<string, React.ReactNode> = {
    sales:    <Users    size={18} />,
    quote:    <FileText size={18} />,
    followup: <RefreshCw size={18} />,
    accounts: <DollarSign size={18} />,
}

const AGENT_COLORS: Record<string, string> = {
    sales:    "#22D3EE",
    quote:    "#A78BFA",
    followup: "#34D399",
    accounts: "#FBBF24",
}

function fmt(n: number, decimals = 0) {
    return n.toLocaleString("en-US", { maximumFractionDigits: decimals })
}

function fmtTokens(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
    return String(n)
}

function fmtUptime(sec: number) {
    const d = Math.floor(sec / 86400)
    const h = Math.floor((sec % 86400) / 3600)
    const m = Math.floor((sec % 3600) / 60)
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-2xl border p-5 ${className}`}
            style={{ background: "#13141A", borderColor: "#1E2028" }}
        >
            {children}
        </div>
    )
}

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div className="flex flex-col items-center gap-0.5 min-w-0">
            <span className="text-xs font-mono" style={{ color }}>{value}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
        </div>
    )
}

function BarGauge({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-gray-400">{label}</span>
                <span className="font-mono" style={{ color }}>{pct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "#1E2028" }}>
                <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
                />
            </div>
        </div>
    )
}

function AgentCard({ agent }: { agent: AgentHealthAgent }) {
    const color   = AGENT_COLORS[agent.type] ?? "#94A3B8"
    const icon    = AGENT_ICONS[agent.type]
    const s       = agent.stats
    const healthy = s.failed === 0
    const hasWork = s.total > 0

    return (
        <GlowCard>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                        style={{ background: `${color}18`, color, boxShadow: `0 0 12px ${color}30` }}
                    >
                        {icon}
                    </div>
                    <div>
                        <p className="font-semibold text-white text-sm">{agent.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{agent.schedule}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span
                        className="inline-block h-2 w-2 rounded-full animate-pulse"
                        style={{
                            background: !hasWork ? "#4B5563" : healthy ? "#10B981" : "#EF4444",
                            boxShadow:  !hasWork ? "none"     : healthy ? "0 0 6px #10B981" : "0 0 6px #EF4444",
                        }}
                    />
                    <span className="text-xs" style={{ color: !hasWork ? "#4B5563" : healthy ? "#10B981" : "#EF4444" }}>
                        {!hasWork ? "idle" : healthy ? "healthy" : "has errors"}
                    </span>
                </div>
            </div>

            {/* Task stats */}
            <div className="grid grid-cols-5 gap-1 mb-4 py-3 rounded-xl" style={{ background: "#0A0B0E" }}>
                <StatPill label="total"   value={fmt(s.total)}    color="#94A3B8" />
                <StatPill label="pending" value={fmt(s.pending)}  color="#FBBF24" />
                <StatPill label="sent"    value={fmt(s.autoSent + s.approved)} color="#34D399" />
                <StatPill label="failed"  value={fmt(s.failed)}   color={s.failed > 0 ? "#EF4444" : "#4B5563"} />
                <StatPill label="today"   value={fmt(s.todayCount)} color={color} />
            </div>

            {/* Token burn */}
            <div className="space-y-2 mb-3">
                <BarGauge
                    value={s.inputTokens}
                    max={Math.max(s.inputTokens, s.outputTokens, 1)}
                    color={color}
                    label="Input tokens"
                />
                <BarGauge
                    value={s.outputTokens}
                    max={Math.max(s.inputTokens, s.outputTokens, 1)}
                    color={`${color}99`}
                    label="Output tokens"
                />
            </div>

            {/* Token numbers */}
            <div className="flex items-center justify-between text-xs mt-2 pt-3" style={{ borderTop: "1px solid #1E2028" }}>
                <span className="text-gray-500 font-mono">
                    {fmtTokens(s.inputTokens + s.outputTokens)} tokens
                </span>
                <span className="font-mono" style={{ color }}>
                    ${s.estCost.toFixed(4)} est.
                </span>
            </div>

            {/* Last run */}
            {s.lastRunAt && (
                <p className="text-[10px] text-gray-600 mt-1.5">
                    Last run {formatDistanceToNow(new Date(s.lastRunAt), { addSuffix: true })}
                </p>
            )}
        </GlowCard>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AgentHealthPage() {
    const [health,    setHealth]    = useState<AgentHealth | null>(null)
    const [loading,   setLoading]   = useState(true)
    const [error,     setError]     = useState<string | null>(null)
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const load = useCallback(async () => {
        try {
            const res = await api.admin.agents.getHealth()
            setHealth(res.data)
            setError(null)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load health data")
        } finally {
            setLoading(false)
            setCountdown(REFRESH_INTERVAL)
        }
    }, [])

    useEffect(() => {
        load()
        timerRef.current = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) { load(); return REFRESH_INTERVAL }
                return c - 1
            })
        }, 1000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [load])

    const h = health

    return (
        <div className="min-h-screen" style={{ background: "#0A0B0E", color: "#E2E8F0" }}>
            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/agents" className="text-gray-600 hover:text-gray-400 transition-colors">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <Activity size={18} className="text-cyan-400" />
                                <h1 className="text-xl font-bold text-white">Agent Health</h1>
                                <span
                                    className="inline-block h-2 w-2 rounded-full animate-pulse ml-1"
                                    style={{ background: "#22D3EE", boxShadow: "0 0 8px #22D3EE" }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Live system telemetry · refreshes every {REFRESH_INTERVAL}s
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Countdown ring */}
                        <div className="relative flex items-center justify-center h-9 w-9">
                            <svg className="absolute inset-0" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="#1E2028" strokeWidth="3" />
                                <circle
                                    cx="18" cy="18" r="15" fill="none"
                                    stroke="#22D3EE" strokeWidth="3"
                                    strokeDasharray={`${(countdown / REFRESH_INTERVAL) * 94.25} 94.25`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 18 18)"
                                    style={{ transition: "stroke-dasharray 1s linear" }}
                                />
                            </svg>
                            <span className="text-[10px] font-mono text-cyan-400">{countdown}</span>
                        </div>

                        <button
                            onClick={() => { setLoading(true); load() }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            style={{ background: "#1E2028", color: "#94A3B8", border: "1px solid #2D3748" }}
                        >
                            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                            Refresh
                        </button>

                        <a
                            href="https://console.anthropic.com/settings/billing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            style={{ background: "#1E2028", color: "#FBBF24", border: "1px solid #2D3748" }}
                        >
                            <ExternalLink size={12} />
                            Check Balance
                        </a>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-900 bg-red-950 p-4 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* System metrics row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        {
                            icon: <Cpu size={16} />,
                            label: "CPU",
                            value: h ? `${h.system.cpuPercent}%` : "—",
                            sub: `${h?.system.processors ?? "—"} logical cores`,
                            color: "#22D3EE",
                            warn: (h?.system.cpuPercent ?? 0) > 80,
                        },
                        {
                            icon: <MemoryStick size={16} />,
                            label: "Memory",
                            value: h ? `${h.system.memoryMb} MB` : "—",
                            sub: "working set",
                            color: "#A78BFA",
                            warn: (h?.system.memoryMb ?? 0) > 400,
                        },
                        {
                            icon: <Clock size={16} />,
                            label: "Uptime",
                            value: h ? fmtUptime(h.system.uptimeSeconds) : "—",
                            sub: "since last deploy",
                            color: "#34D399",
                            warn: false,
                        },
                        {
                            icon: <Zap size={16} />,
                            label: "Agents",
                            value: h ? `${h.agents.filter(a => a.stats.total > 0).length} / ${h.agents.length}` : "—",
                            sub: "active / total",
                            color: "#FBBF24",
                            warn: false,
                        },
                    ].map(card => (
                        <GlowCard key={card.label}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.label}</span>
                                <span style={{ color: card.warn ? "#EF4444" : card.color }}>{card.icon}</span>
                            </div>
                            <p
                                className="text-2xl font-bold font-mono"
                                style={{ color: card.warn ? "#EF4444" : card.color }}
                            >
                                {loading && !h ? <span className="opacity-30">—</span> : card.value}
                            </p>
                            <p className="text-[11px] text-gray-600 mt-1">{card.sub}</p>
                        </GlowCard>
                    ))}
                </div>

                {/* Token usage */}
                <GlowCard>
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={15} className="text-cyan-400" />
                        <h2 className="text-sm font-semibold text-white">Token Usage</h2>
                        <span className="text-[10px] text-gray-600 ml-1">claude-sonnet-4-6 · $3/M in · $15/M out</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {([
                            { label: "Today",    bucket: h?.tokens.today    },
                            { label: "This Week", bucket: h?.tokens.week    },
                            { label: "All Time",  bucket: h?.tokens.allTime },
                        ] as const).map(({ label, bucket }) => (
                            <div key={label} className="rounded-xl p-4 space-y-3" style={{ background: "#0A0B0E" }}>
                                <p className="text-xs text-gray-500 font-medium">{label}</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Input</span>
                                        <span className="font-mono text-cyan-400">{fmtTokens(bucket?.input ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Output</span>
                                        <span className="font-mono text-purple-400">{fmtTokens(bucket?.output ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs pt-1" style={{ borderTop: "1px solid #1E2028" }}>
                                        <span className="text-gray-500">Total</span>
                                        <span className="font-mono text-white font-semibold">{fmtTokens(bucket?.total ?? 0)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-600">Est. cost</span>
                                    <span className="text-sm font-bold font-mono text-yellow-400">
                                        ${(bucket?.estCostUsd ?? 0).toFixed(4)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-700 mt-3 text-center">
                        Credit balance is not available via API —
                        <a
                            href="https://console.anthropic.com/settings/billing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-yellow-600 hover:text-yellow-400 ml-1"
                        >
                            check on Anthropic console ↗
                        </a>
                    </p>
                </GlowCard>

                {/* Agent cards */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Bot size={15} className="text-cyan-400" />
                        <h2 className="text-sm font-semibold text-white">Agent Registry</h2>
                        <span className="text-[10px] text-gray-600">— {h?.agents.length ?? 4} agents</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(h?.agents ?? Array(4).fill(null)).map((agent, i) =>
                            agent ? (
                                <AgentCard key={agent.type} agent={agent} />
                            ) : (
                                <GlowCard key={i}>
                                    <div className="h-40 flex items-center justify-center">
                                        <RefreshCw size={20} className="animate-spin text-gray-700" />
                                    </div>
                                </GlowCard>
                            )
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-700 pb-4">
                    {[
                        { color: "#10B981", label: "Healthy (no failures)" },
                        { color: "#EF4444", label: "Has failed tasks" },
                        { color: "#4B5563", label: "Idle (no tasks yet)" },
                    ].map(l => (
                        <div key={l.label} className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                            {l.label}
                        </div>
                    ))}
                    <span className="ml-auto">
                        {h ? `Last updated ${formatDistanceToNow(new Date(h.generatedAt), { addSuffix: true })}` : ""}
                    </span>
                </div>

            </div>
        </div>
    )
}
