"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, User, Mail, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api/client";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";

type NotifType = "contact" | "newsletter" | "quote" | "email_failed"

interface NotifItem {
    id:   string;
    type: NotifType;
    body: string;
    time: string;
    read: boolean;
    href: string;
}

interface StoredState {
    contactCount:    number;
    newsletterCount: number;
    quoteCount:      number;
    failedEmailCount: number;
    items:           NotifItem[];
}

const TYPE_META: Record<NotifType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    contact:      { label: "New Contact",    icon: <User       size={14} />, color: "#1D4ED8", bg: "#EFF6FF" },
    newsletter:   { label: "New Subscriber", icon: <Mail       size={14} />, color: "#15803D", bg: "#F0FDF4" },
    quote:        { label: "New Quote",      icon: <FileText   size={14} />, color: "#92400E", bg: "#FEF3C7" },
    email_failed: { label: "Email Failed",   icon: <AlertCircle size={14} />, color: "#DC2626", bg: "#FEF2F2" },
}

const STORAGE_KEY = "wh_notif_state_v2";
const POLL_MS     = 30_000;

function loadState(): StoredState {
    try {
        if (typeof window === "undefined") return empty();
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as StoredState;
    } catch { /* ignore */ }
    return empty();
}

function empty(): StoredState {
    return { contactCount: 0, newsletterCount: 0, quoteCount: 0, failedEmailCount: 0, items: [] };
}

function saveState(s: StoredState) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function browserNotify(title: string, body: string) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    new Notification(title, { body, icon: "/woodenhouse-logo.jpg" });
}

export default function NotificationBell() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (path: string) => qs ? `${path}?${qs}` : path;

    const [items, setItems] = useState<NotifItem[]>([]);
    const [open,  setOpen]  = useState(false);
    const stateRef = useRef<StoredState>(empty());

    const unread = items.filter(i => !i.read).length;

    const poll = useCallback(async () => {
        try {
            const state    = stateRef.current;
            const newItems: NotifItem[] = [];

            // ── Contacts ──────────────────────────────────────────────────────
            const cr    = await api.admin.contacts.getAll({ pageSize: 5, page: 1 });
            const cTotal = cr.data.total;
            if (cTotal > state.contactCount && state.contactCount > 0) {
                const diff   = cTotal - state.contactCount;
                const newest = cr.data.items[0];
                browserNotify(`${diff} New Enquir${diff > 1 ? "ies" : "y"}`,
                    `From ${newest?.name ?? "a visitor"} — ${newest?.serviceType ?? "General"}`);
                cr.data.items.slice(0, diff).forEach(c => newItems.push({
                    id:   `c-${c.id}`,
                    type: "contact",
                    body: `${c.name} — ${c.serviceType ?? "General enquiry"}`,
                    time: c.createdAt,
                    read: false,
                    href: withQs(`/dashboard/contacts/${c.id}`),
                }));
            }
            state.contactCount = cTotal;

            // ── Newsletter ────────────────────────────────────────────────────
            const nr       = await api.admin.newsletter.getAll();
            const subCount = nr.data.length;
            if (subCount > state.newsletterCount && state.newsletterCount > 0) {
                const diff   = subCount - state.newsletterCount;
                const newest = nr.data[0];
                browserNotify(`${diff} New Subscriber${diff > 1 ? "s" : ""}`,
                    `${newest?.email ?? "Someone"} joined the newsletter`);
                nr.data.slice(0, diff).forEach(s => newItems.push({
                    id:   `n-${s.id}`,
                    type: "newsletter",
                    body: s.email,
                    time: s.subscribedAt,
                    read: false,
                    href: withQs("/dashboard/newsletter"),
                }));
            }
            state.newsletterCount = subCount;

            // ── Quotes ────────────────────────────────────────────────────────
            const qr      = await api.admin.quotes.getAll({ pageSize: 5, page: 1 });
            const qTotal  = qr.data.total;
            if (qTotal > state.quoteCount && state.quoteCount > 0) {
                const diff   = qTotal - state.quoteCount;
                const newest = qr.data.items[0];
                browserNotify(`${diff} New Quote${diff > 1 ? "s" : ""}`,
                    `Quote for ${newest?.customerName ?? "a customer"}`);
                qr.data.items.slice(0, diff).forEach(q => newItems.push({
                    id:   `q-${q.id}`,
                    type: "quote",
                    body: `${q.customerName} — ${q.quoteNumber}`,
                    time: q.createdAt,
                    read: false,
                    href: withQs(`/dashboard/quotes/${q.id}`),
                }));
            }
            state.quoteCount = qTotal;

            // ── Failed emails ─────────────────────────────────────────────────
            try {
                const er      = await api.admin.emailLogs.getAll({ status: "failed", pageSize: 5 });
                const fTotal  = er.data.total;
                if (fTotal > state.failedEmailCount && state.failedEmailCount > 0) {
                    const diff   = fTotal - state.failedEmailCount;
                    const newest = er.data.items[0];
                    browserNotify(`${diff} Email${diff > 1 ? "s" : ""} Failed to Send`,
                        newest ? `${newest.type} → ${newest.toAddress}` : "Check email logs");
                    er.data.items.slice(0, diff).forEach(e => newItems.push({
                        id:   `e-${e.id}`,
                        type: "email_failed",
                        body: `${e.type} → ${e.toAddress}`,
                        time: e.sentAt,
                        read: false,
                        href: withQs("/dashboard/emails"),
                    }));
                }
                state.failedEmailCount = fTotal;
            } catch { /* email logs table may not exist yet — ignore */ }

            if (newItems.length > 0) {
                const merged = [...newItems, ...state.items].slice(0, 30);
                state.items = merged;
                setItems(merged);
            }

            stateRef.current = state;
            saveState(state);
        } catch { /* silent — never break the UI */ }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission().catch(() => {});
        }
        const saved = loadState();
        stateRef.current = saved;
        setItems(saved.items);
        poll();
        const id = setInterval(poll, POLL_MS);
        return () => clearInterval(id);
    }, [poll]);

    const markAllRead = () => {
        const updated = items.map(i => ({ ...i, read: true }));
        setItems(updated);
        const state = { ...stateRef.current, items: updated };
        stateRef.current = state;
        saveState(state);
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        setItems([]);
        const state = { ...stateRef.current, items: [] };
        stateRef.current = state;
        saveState(state);
    };

    const handleOpen = (o: boolean) => {
        setOpen(o);
        if (o) markAllRead();
    };

    return (
        <DropdownMenu open={open} onOpenChange={handleOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell size={20} />
                    {unread > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center border-2 border-white text-[10px] font-bold"
                            style={{ backgroundColor: "#EF4444" }}
                        >
                            {unread > 9 ? "9+" : unread}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0">
                <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="font-semibold text-sm">Notifications</span>
                    {items.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                            Clear all
                        </button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />

                {items.length === 0 ? (
                    <div className="py-10 text-center">
                        <Bell size={28} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No notifications yet</p>
                        <p className="text-xs text-gray-400 mt-1">Contacts, quotes &amp; subscribers appear here</p>
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                        {items.slice(0, 20).map(item => {
                            const meta = TYPE_META[item.type];
                            return (
                                <button
                                    key={item.id}
                                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                                    onClick={() => { setOpen(false); router.push(item.href); }}
                                >
                                    <div
                                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                        style={{ background: meta.bg, color: meta.color }}
                                    >
                                        {meta.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold" style={{ color: meta.color }}>
                                            {meta.label}
                                        </p>
                                        <p className="text-sm text-gray-800 truncate">{item.body}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {format(new Date(item.time), "MMM d, HH:mm")}
                                        </p>
                                    </div>
                                    {!item.read && (
                                        <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                <DropdownMenuSeparator className="m-0" />
                <div className="p-2 grid grid-cols-2 gap-1">
                    {[
                        { label: "Contacts",    href: "/dashboard/contacts" },
                        { label: "Quotes",      href: "/dashboard/quotes" },
                        { label: "Subscribers", href: "/dashboard/newsletter" },
                        { label: "Email logs",  href: "/dashboard/emails" },
                    ].map(link => (
                        <button
                            key={link.href}
                            onClick={() => { setOpen(false); router.push(withQs(link.href)); }}
                            className="text-xs py-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors text-center"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
