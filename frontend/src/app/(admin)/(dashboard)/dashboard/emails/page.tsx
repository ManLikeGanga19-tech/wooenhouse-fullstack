"use client"

import { useEffect, useState, useCallback } from "react"
import {
    Mail, Inbox, Send, FileText, Trash2, AlertOctagon, Star, Paperclip,
    RefreshCw, Pen, Reply, ArrowLeft, ChevronRight, Search, X,
    CheckCircle2, AlertCircle, TrendingUp, User, RotateCcw, Eye,
    Loader2, Bot, Newspaper,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    api,
    type MailboxAccount, type MailboxEmailSummary, type MailboxEmailDetail,
    type MailboxFolderCount, type EmailLog, type EmailLogDetail, type EmailLogStats,
} from "@/lib/api/client"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = "mailbox" | "logs"
type Folder = "inbox" | "sent" | "drafts" | "junk" | "trash"

const FOLDERS: { key: Folder; label: string; icon: React.ElementType }[] = [
    { key: "inbox",  label: "Inbox",  icon: Inbox },
    { key: "sent",   label: "Sent",   icon: Send },
    { key: "drafts", label: "Drafts", icon: FileText },
    { key: "junk",   label: "Junk",   icon: AlertOctagon },
    { key: "trash",  label: "Trash",  icon: Trash2 },
]

// ─── Compose Modal ────────────────────────────────────────────────────────────

function ComposeModal({
    accounts,
    defaultFrom,
    replyTo,
    onClose,
    onSent,
}: {
    accounts:    MailboxAccount[]
    defaultFrom: string
    replyTo?:    MailboxEmailDetail
    onClose:     () => void
    onSent:      () => void
}) {
    const [from,    setFrom]    = useState(defaultFrom)
    const [to,      setTo]      = useState(replyTo ? replyTo.fromAddress : "")
    const [cc,      setCc]      = useState("")
    const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : "")
    const [body,    setBody]    = useState("")
    const [sending, setSending] = useState(false)

    const handleSend = async () => {
        if (!to.trim() || !subject.trim()) {
            toast.error("To and Subject are required")
            return
        }
        setSending(true)
        try {
            await api.admin.mailbox.compose({
                from,
                to:      to.trim(),
                subject: subject.trim(),
                cc:      cc.trim() || undefined,
                body:    body.trim() || undefined,
                inReplyTo: replyTo?.messageId,
            })
            toast.success("Email sent")
            onSent()
            onClose()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to send")
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-4 pb-[calc(1rem+env(safe-area-inset-bottom)+56px)] sm:pb-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">
                        {replyTo ? "Reply" : "New Email"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    {/* From */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 shrink-0">From</span>
                        <select
                            value={from}
                            onChange={e => setFrom(e.target.value)}
                            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                            style={{ "--tw-ring-color": "#8B5E3C" } as React.CSSProperties}
                        >
                            {accounts.map(a => (
                                <option key={a.email} value={a.email}>
                                    {a.displayName} &lt;{a.email}&gt;
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* To */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 shrink-0">To</span>
                        <Input
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            placeholder="recipient@example.com"
                            className="flex-1 text-sm"
                        />
                    </div>

                    {/* CC */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 shrink-0">CC</span>
                        <Input
                            value={cc}
                            onChange={e => setCc(e.target.value)}
                            placeholder="Optional"
                            className="flex-1 text-sm"
                        />
                    </div>

                    {/* Subject */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 shrink-0">Subject</span>
                        <Input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Subject"
                            className="flex-1 text-sm"
                        />
                    </div>

                    {/* Quote */}
                    {replyTo && (
                        <div className="border-l-4 pl-3 py-2 bg-gray-50 rounded text-xs text-gray-400 line-clamp-3">
                            {replyTo.textBody?.slice(0, 200)}...
                        </div>
                    )}

                    {/* Body */}
                    <Textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder="Write your message here..."
                        rows={8}
                        className="text-sm resize-none"
                    />
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                    <Button
                        size="sm"
                        className="text-white gap-2"
                        style={{ backgroundColor: "#8B5E3C" }}
                        onClick={handleSend}
                        disabled={sending}
                    >
                        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Send
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Email detail view ────────────────────────────────────────────────────────

function EmailDetail({
    emailId,
    onBack,
    onReply,
    onDelete,
}: {
    emailId:  string
    onBack:   () => void
    onReply:  (email: MailboxEmailDetail) => void
    onDelete: (id: string) => void
}) {
    const [email,   setEmail]   = useState<MailboxEmailDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        api.admin.mailbox.getEmail(emailId)
            .then(r => setEmail(r.data))
            .catch(() => toast.error("Could not load email"))
            .finally(() => setLoading(false))
    }, [emailId])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                <Loader2 size={24} className="animate-spin" />
            </div>
        )
    }
    if (!email) return null

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
                <button onClick={onBack} className="md:hidden text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={18} />
                </button>
                <button
                    onClick={() => onReply(email)}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
                >
                    <Reply size={14} /> Reply
                </button>
                <button
                    onClick={() => onDelete(email.id)}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 ml-auto"
                >
                    <Trash2 size={14} /> Delete
                </button>
            </div>

            {/* Subject & meta */}
            <div className="px-6 py-4 border-b border-gray-100 shrink-0">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{email.subject}</h2>
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                        {(email.fromName || email.fromAddress).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">
                                {email.fromName || email.fromAddress}
                            </span>
                            {email.fromName && (
                                <span className="text-gray-400 text-xs">&lt;{email.fromAddress}&gt;</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                            To: {email.toAddresses.split(";").join(", ")}
                            {email.ccAddresses && ` · CC: ${email.ccAddresses.split(";").join(", ")}`}
                        </p>
                        <p className="text-xs text-gray-400">
                            {format(new Date(email.receivedAt), "EEEE d MMMM yyyy, HH:mm")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto">
                {email.htmlBody ? (
                    <iframe
                        srcDoc={email.htmlBody}
                        sandbox="allow-same-origin"
                        className="w-full h-full border-0"
                        title="Email body"
                    />
                ) : (
                    <div className="px-6 py-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {email.textBody || "(no body)"}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Email list row ───────────────────────────────────────────────────────────

function EmailRow({
    email,
    selected,
    onClick,
}: {
    email:    MailboxEmailSummary
    selected: boolean
    onClick:  () => void
}) {
    const when = (() => {
        const d = new Date(email.receivedAt)
        const now = new Date()
        if (d.toDateString() === now.toDateString()) return format(d, "HH:mm")
        return format(d, "d MMM")
    })()

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors",
                selected && "bg-amber-50 border-l-2 border-l-amber-700",
                !email.isRead && "bg-white",
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "w-2 h-2 rounded-full mt-2 shrink-0",
                    !email.isRead ? "bg-amber-600" : "bg-transparent"
                )} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                            "text-sm truncate",
                            !email.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                        )}>
                            {email.fromName || email.fromAddress}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                            {email.hasAttachment && <Paperclip size={12} className="text-gray-400" />}
                            {email.isStarred && <Star size={12} className="text-amber-400 fill-amber-400" />}
                            <span className="text-xs text-gray-400">{when}</span>
                        </div>
                    </div>
                    <p className={cn(
                        "text-xs truncate mt-0.5",
                        !email.isRead ? "text-gray-800" : "text-gray-500"
                    )}>
                        {email.subject}
                    </p>
                    {email.preview && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{email.preview}</p>
                    )}
                </div>
            </div>
        </button>
    )
}

// ─── Mailbox tab ──────────────────────────────────────────────────────────────

function MailboxTab() {
    const [accounts,     setAccounts]     = useState<MailboxAccount[]>([])
    const [activeAcct,   setActiveAcct]   = useState<string>("")
    const [activeFolder, setActiveFolder] = useState<Folder>("inbox")
    const [emails,       setEmails]       = useState<MailboxEmailSummary[]>([])
    const [total,        setTotal]        = useState(0)
    const [page,         setPage]         = useState(1)
    const [counts,       setCounts]       = useState<MailboxFolderCount[]>([])
    const [selectedId,   setSelectedId]   = useState<string | null>(null)
    const [showDetail,   setShowDetail]   = useState(false)
    const [search,       setSearch]       = useState("")
    const [syncing,      setSyncing]      = useState(false)
    const [loading,      setLoading]      = useState(false)
    const [compose,      setCompose]      = useState<"new" | null>(null)
    const [replyTarget,  setReplyTarget]  = useState<MailboxEmailDetail | null>(null)

    const PAGE_SIZE = 30

    // Load accounts
    useEffect(() => {
        api.admin.mailbox.getAccounts()
            .then(r => {
                setAccounts(r.data)
                if (r.data.length > 0) setActiveAcct(r.data[0].email)
            })
            .catch(() => toast.error("Could not load mailbox accounts"))
    }, [])

    const loadEmails = useCallback(async (acct: string, folder: Folder, p: number, q: string) => {
        if (!acct) return
        setLoading(true)
        try {
            const r = await api.admin.mailbox.getEmails({ account: acct, folder, page: p, q: q || undefined })
            setEmails(r.data.items)
            setTotal(r.data.total)
        } catch {
            toast.error("Could not load emails")
        } finally {
            setLoading(false)
        }
    }, [])

    const loadCounts = useCallback((acct: string) => {
        if (!acct) return
        api.admin.mailbox.getCounts(acct)
            .then(r => setCounts(r.data))
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (activeAcct) {
            loadEmails(activeAcct, activeFolder, page, search)
            loadCounts(activeAcct)
        }
    }, [activeAcct, activeFolder, page, activeAcct, loadEmails, loadCounts]) // eslint-disable-line

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        loadEmails(activeAcct, activeFolder, 1, search)
    }

    const handleSync = async () => {
        setSyncing(true)
        try {
            await api.admin.mailbox.sync(activeAcct)
            toast.success("Sync started — emails will appear shortly")
            setTimeout(() => {
                loadEmails(activeAcct, activeFolder, page, search)
                loadCounts(activeAcct)
            }, 5000)
        } catch {
            toast.error("Sync failed")
        } finally {
            setSyncing(false)
        }
    }

    const handleSelectEmail = async (id: string) => {
        setSelectedId(id)
        setShowDetail(true)
        // Mark as read locally
        setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e))
    }

    const handleDelete = async (id: string) => {
        try {
            await api.admin.mailbox.deleteEmail(id)
            setEmails(prev => prev.filter(e => e.id !== id))
            setSelectedId(null)
            setShowDetail(false)
            loadCounts(activeAcct)
            toast.success("Deleted")
        } catch {
            toast.error("Delete failed")
        }
    }

    const getFolderCount = (folder: Folder) =>
        counts.find(c => c.folder === folder)

    const activeAccount = accounts.find(a => a.email === activeAcct)

    return (
        <div className="flex flex-col h-[calc(100dvh-280px)] md:h-[calc(100dvh-190px)]">
            {/* Account tabs */}
            <div className="flex items-center gap-1 px-1 pb-3 overflow-x-auto scrollbar-hide shrink-0">
                {accounts.map(acct => (
                    <button
                        key={acct.email}
                        onClick={() => { setActiveAcct(acct.email); setActiveFolder("inbox"); setPage(1); setSelectedId(null); setShowDetail(false) }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0",
                            activeAcct === acct.email
                                ? "text-white shadow-sm"
                                : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                        )}
                        style={activeAcct === acct.email ? { backgroundColor: acct.color } : {}}
                    >
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: activeAcct === acct.email ? "rgba(255,255,255,0.3)" : acct.color }}
                        >
                            {acct.displayName.charAt(0)}
                        </div>
                        <span>{acct.displayName}</span>
                        {(() => {
                            const cnt = counts.find(c => c.folder === "inbox")
                            return cnt && cnt.unread > 0 && activeAcct === acct.email
                                ? <span className="bg-white/30 text-xs px-1.5 py-0.5 rounded-full">{cnt.unread}</span>
                                : null
                        })()}
                    </button>
                ))}
            </div>

            {/* Main 3-column layout */}
            <div className="flex flex-1 min-h-0 border border-gray-200 rounded-xl overflow-hidden bg-white">
                {/* Folder sidebar */}
                <div className="hidden sm:flex flex-col w-44 border-r border-gray-100 bg-gray-50 shrink-0 py-2">
                    <div className="px-3 pb-2">
                        <Button
                            size="sm"
                            className="w-full gap-2 text-white"
                            style={{ backgroundColor: activeAccount?.color ?? "#8B5E3C" }}
                            onClick={() => setCompose("new")}
                        >
                            <Pen size={13} /> Compose
                        </Button>
                    </div>
                    <nav className="space-y-0.5 px-2">
                        {FOLDERS.map(f => {
                            const cnt   = getFolderCount(f.key)
                            const Icon  = f.icon
                            const isAct = activeFolder === f.key
                            return (
                                <button
                                    key={f.key}
                                    onClick={() => { setActiveFolder(f.key); setPage(1); setSelectedId(null); setShowDetail(false) }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                        isAct ? "text-white" : "text-gray-600 hover:bg-gray-200"
                                    )}
                                    style={isAct ? { backgroundColor: activeAccount?.color ?? "#8B5E3C" } : {}}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon size={15} />
                                        <span>{f.label}</span>
                                    </div>
                                    {cnt && cnt.unread > 0 && (
                                        <span className={cn(
                                            "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                                            isAct ? "bg-white/30 text-white" : "bg-amber-100 text-amber-700"
                                        )}>
                                            {cnt.unread}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </nav>
                    <div className="mt-auto px-3 pb-2">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 py-2"
                        >
                            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
                            {syncing ? "Syncing..." : "Sync now"}
                        </button>
                    </div>
                </div>

                {/* Email list */}
                <div className={cn(
                    "flex flex-col border-r border-gray-100 shrink-0",
                    "w-full sm:w-72 md:w-80",
                    showDetail && selectedId ? "hidden sm:flex" : "flex",
                )}>
                    {/* Toolbar */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0">
                        {/* Mobile folder selector */}
                        <select
                            className="sm:hidden text-sm border border-gray-200 rounded-lg px-2 py-1.5 flex-1"
                            value={activeFolder}
                            onChange={e => { setActiveFolder(e.target.value as Folder); setPage(1) }}
                        >
                            {FOLDERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                        </select>
                        <span className="hidden sm:block text-sm font-semibold text-gray-700 flex-1 capitalize">
                            {activeFolder}
                        </span>
                        <button
                            onClick={() => setCompose("new")}
                            className="sm:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                        >
                            <Pen size={16} />
                        </button>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="px-3 py-2 border-b border-gray-100 shrink-0">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1"
                                style={{ "--tw-ring-color": "#8B5E3C" } as React.CSSProperties}
                            />
                        </div>
                    </form>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            [...Array(8)].map((_, i) => (
                                <div key={i} className="h-16 mx-3 my-1 rounded-lg bg-gray-100 animate-pulse" />
                            ))
                        ) : emails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                                <Inbox size={32} className="mb-2 opacity-30" />
                                <p className="text-sm">No emails</p>
                            </div>
                        ) : (
                            emails.map(email => (
                                <EmailRow
                                    key={email.id}
                                    email={email}
                                    selected={selectedId === email.id}
                                    onClick={() => handleSelectEmail(email.id)}
                                />
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {total > PAGE_SIZE && (
                        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 text-xs text-gray-500 shrink-0">
                            <span>{total} emails</span>
                            <div className="flex gap-1">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40"
                                >←</button>
                                <button
                                    disabled={page * PAGE_SIZE >= total}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40"
                                >→</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Email detail */}
                <div className={cn(
                    "flex-1 min-w-0",
                    !showDetail || !selectedId ? "hidden sm:flex sm:flex-col" : "flex flex-col",
                )}>
                    {selectedId && showDetail ? (
                        <EmailDetail
                            emailId={selectedId}
                            onBack={() => setShowDetail(false)}
                            onReply={(email) => { setReplyTarget(email); setCompose("new") }}
                            onDelete={handleDelete}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
                            <Mail size={48} className="mb-3 opacity-20" />
                            <p className="text-sm font-medium">Select an email to read it</p>
                            <p className="text-xs mt-1">
                                {activeAccount
                                    ? `Viewing ${activeAccount.displayName} — ${activeFolder}`
                                    : "No account selected"}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Compose modal */}
            {compose && activeAccount && (
                <ComposeModal
                    accounts={accounts}
                    defaultFrom={activeAcct}
                    replyTo={replyTarget ?? undefined}
                    onClose={() => { setCompose(null); setReplyTarget(null) }}
                    onSent={() => {
                        setActiveFolder("sent")
                        setPage(1)
                        setSearch("")
                        setSelectedId(null)
                        setShowDetail(false)
                        loadEmails(activeAcct, "sent", 1, "")
                        loadCounts(activeAcct)
                    }}
                />
            )}
        </div>
    )
}

// ─── Email logs tab (existing feature) ───────────────────────────────────────

const LOG_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    contact_alert: { label: "Contact Alert", icon: <User      size={14} />, color: "#1D4ED8", bg: "#EFF6FF" },
    auto_reply:    { label: "Auto Reply",    icon: <Reply     size={14} />, color: "#059669", bg: "#ECFDF5" },
    quote:         { label: "Quote",         icon: <FileText  size={14} />, color: "#92400E", bg: "#FEF3C7" },
    newsletter:    { label: "Newsletter",    icon: <Newspaper size={14} />, color: "#7C3AED", bg: "#F5F3FF" },
    agent:         { label: "AI Agent",      icon: <Bot       size={14} />, color: "#B45309", bg: "#FEF3C7" },
    resend:        { label: "Resent",        icon: <RotateCcw size={14} />, color: "#0369A1", bg: "#E0F2FE" },
}

function EmailLogsTab() {
    const [logs,         setLogs]         = useState<EmailLog[]>([])
    const [stats,        setStats]        = useState<EmailLogStats | null>(null)
    const [loading,      setLoading]      = useState(true)
    const [filter,       setFilter]       = useState("")
    const [total,        setTotal]        = useState(0)
    const [page,         setPage]         = useState(1)
    const [resending,    setResending]    = useState<string | null>(null)
    const [preview,      setPreview]      = useState<EmailLogDetail | null>(null)
    const [previewLoad,  setPreviewLoad]  = useState(false)
    const PAGE_SIZE = 50

    const load = async (f: string, p: number) => {
        setLoading(true)
        try {
            const [logsRes, statsRes] = await Promise.all([
                api.admin.emailLogs.getAll({ status: f || undefined, page: p, pageSize: PAGE_SIZE }),
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

    const handleResend = async (id: string) => {
        setResending(id)
        try {
            const r = await api.admin.emailLogs.resend(id)
            toast.success(r.data.message)
            load(filter, page)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Resend failed")
        } finally {
            setResending(null)
        }
    }

    const handlePreview = async (id: string) => {
        setPreviewLoad(true)
        try {
            const r = await api.admin.emailLogs.getById(id)
            setPreview(r.data)
        } catch {
            toast.error("Could not load email body")
        } finally {
            setPreviewLoad(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-500">Every transactional email sent by the system</p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => load(filter, page)}>
                    <RefreshCw size={13} /> Refresh
                </Button>
            </div>

            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Total Sent",   value: stats.sent,   icon: <CheckCircle2 size={18} />, color: "#059669", bg: "#ECFDF5" },
                        { label: "Failed",       value: stats.failed, icon: <AlertCircle  size={18} />, color: "#DC2626", bg: "#FEF2F2" },
                        { label: "Sent Today",   value: stats.today,  icon: <TrendingUp   size={18} />, color: "#8B5E3C", bg: "#FEF3C7" },
                        { label: "Total Logged", value: stats.total,  icon: <Mail         size={18} />, color: "#6B7280", bg: "#F9FAFB" },
                    ].map(s => (
                        <div key={s.label} className="rounded-xl border-2 border-gray-100 bg-white p-4 flex items-center gap-3">
                            <div className="rounded-full p-2" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                <p className="text-xs text-gray-500">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-2">
                {[{ key: "", label: "All" }, { key: "sent", label: "Sent" }, { key: "failed", label: "Failed" }].map(f => (
                    <button
                        key={f.key}
                        onClick={() => { setFilter(f.key); setPage(1) }}
                        className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                        style={{ background: filter === f.key ? "#8B5E3C" : "#F5F0EB", color: filter === f.key ? "white" : "#8B5E3C" }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}</div>
            ) : logs.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
                    <Mail size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No emails logged yet</p>
                </div>
            ) : (
                <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {logs.map(log => {
                            const meta = LOG_TYPE_META[log.type] ?? LOG_TYPE_META.contact_alert
                            const isFailed = log.status === "failed"
                            return (
                                <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                                    <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full"
                                        style={{ background: meta.bg, color: meta.color }}>
                                        {meta.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                style={{ background: isFailed ? "#FEF2F2" : "#ECFDF5", color: isFailed ? "#DC2626" : "#059669" }}>
                                                {log.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-800 truncate font-medium">{log.subject}</p>
                                        <p className="text-xs text-gray-400 truncate">{log.fromAddress} → {log.toAddress}</p>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-2">
                                        {log.hasBody && (
                                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500"
                                                onClick={() => handlePreview(log.id)} disabled={previewLoad}>
                                                <Eye size={13} className="mr-1" /> Preview
                                            </Button>
                                        )}
                                        {isFailed && log.hasBody && (
                                            <Button size="sm" className="h-7 px-2 text-xs text-white"
                                                style={{ backgroundColor: "#0369A1" }}
                                                onClick={() => handleResend(log.id)} disabled={resending === log.id}>
                                                {resending === log.id ? <Loader2 size={12} className="animate-spin mr-1" /> : <RotateCcw size={12} className="mr-1" />}
                                                Resend
                                            </Button>
                                        )}
                                        <div className="text-right">
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
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                        <Button variant="outline" size="sm" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                </div>
            )}

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
                            <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 ml-4">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-1">
                            {preview.htmlBody ? (
                                <iframe srcDoc={preview.htmlBody} sandbox="allow-same-origin"
                                    className="w-full h-[60vh] rounded-lg border border-gray-100" title="Email preview" />
                            ) : (
                                <div className="p-8 text-center text-gray-400 text-sm">No HTML body stored.</div>
                            )}
                        </div>
                        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                            {preview.status === "failed" && preview.hasBody && (
                                <Button size="sm" className="text-white" style={{ backgroundColor: "#0369A1" }}
                                    onClick={() => { handleResend(preview.id); setPreview(null) }}
                                    disabled={resending === preview.id}>
                                    <RotateCcw size={13} className="mr-1.5" /> Resend
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setPreview(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EmailsPage() {
    const [tab, setTab] = useState<MainTab>("mailbox")

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "#8B5E3C" }}>Emails</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage all company mailboxes and transactional email logs</p>
                </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                {([
                    { key: "mailbox" as MainTab, label: "Mailbox", icon: Inbox },
                    { key: "logs"    as MainTab, label: "Logs",    icon: Mail  },
                ] as const).map(t => {
                    const Icon = t.icon
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                tab === t.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Icon size={15} /> {t.label}
                        </button>
                    )
                })}
            </div>

            {tab === "mailbox" ? <MailboxTab /> : <EmailLogsTab />}
        </div>
    )
}
