"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Mail, User } from "lucide-react";
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

interface NotifItem {
    id:   string;
    type: "contact" | "newsletter";
    body: string;
    time: string;
    read: boolean;
    href: string;
}

interface StoredState {
    contactCount:    number;
    newsletterCount: number;
    items:           NotifItem[];
}

const STORAGE_KEY  = "wh_notif_state";
const POLL_MS      = 30_000;

function loadState(): StoredState {
    try {
        if (typeof window === "undefined") return { contactCount: 0, newsletterCount: 0, items: [] };
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as StoredState;
    } catch { /* ignore */ }
    return { contactCount: 0, newsletterCount: 0, items: [] };
}

function saveState(s: StoredState) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function browserNotify(title: string, body: string) {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/woodenhouse-logo.jpg" });
    }
}

export default function NotificationBell() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (path: string) => qs ? `${path}?${qs}` : path;

    const [items,  setItems]  = useState<NotifItem[]>([]);
    const [open,   setOpen]   = useState(false);
    const stateRef = useRef<StoredState>({ contactCount: 0, newsletterCount: 0, items: [] });

    const unread = items.filter(i => !i.read).length;

    const poll = useCallback(async () => {
        try {
            const state = stateRef.current;
            const newItems: NotifItem[] = [];

            // ── Contacts ──────────────────────────────────────────────────────
            const cr = await api.admin.contacts.getAll({ pageSize: 5, page: 1 });
            const total = cr.data.total;
            if (total > state.contactCount && state.contactCount > 0) {
                const diff = total - state.contactCount;
                const newest = cr.data.items[0];
                browserNotify(
                    `${diff} New Contact${diff > 1 ? "s" : ""}`,
                    `New enquiry from ${newest?.name ?? "a visitor"}`
                );
                cr.data.items.slice(0, diff).forEach(c => {
                    newItems.push({
                        id:   `c-${c.id}`,
                        type: "contact",
                        body: `${c.name} — ${c.serviceType ?? "General enquiry"}`,
                        time: c.createdAt,
                        read: false,
                        href: withQs(`/dashboard/contacts/${c.id}`),
                    });
                });
            }
            state.contactCount = total;

            // ── Newsletter ────────────────────────────────────────────────────
            const nr       = await api.admin.newsletter.getAll();
            const subCount = nr.data.length;
            if (subCount > state.newsletterCount && state.newsletterCount > 0) {
                const diff   = subCount - state.newsletterCount;
                const newest = nr.data[0];
                browserNotify(
                    `${diff} New Subscriber${diff > 1 ? "s" : ""}`,
                    `${newest?.email ?? "Someone"} subscribed to the newsletter`
                );
                nr.data.slice(0, diff).forEach(s => {
                    newItems.push({
                        id:   `n-${s.id}`,
                        type: "newsletter",
                        body: s.email,
                        time: s.subscribedAt,
                        read: false,
                        href: withQs("/dashboard/newsletter"),
                    });
                });
            }
            state.newsletterCount = subCount;

            if (newItems.length > 0) {
                const merged = [...newItems, ...state.items].slice(0, 25);
                state.items = merged;
                setItems(merged);
            }

            stateRef.current = state;
            saveState(state);
        } catch { /* silent — never break the UI */ }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // Request browser notification permission once
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission().catch(() => {});
        }

        // Load previously stored state
        const saved = loadState();
        stateRef.current = saved;
        setItems(saved.items);

        // Poll immediately, then every 30s
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
                        <p className="text-xs text-gray-400 mt-1">New contacts &amp; subscribers will appear here</p>
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                        {items.slice(0, 15).map(item => (
                            <button
                                key={item.id}
                                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                                onClick={() => { setOpen(false); router.push(item.href); }}
                            >
                                <div
                                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                    style={{
                                        backgroundColor: item.type === "contact" ? "#EFF6FF" : "#F0FDF4",
                                    }}
                                >
                                    {item.type === "contact"
                                        ? <User  size={15} style={{ color: "#1D4ED8" }} />
                                        : <Mail  size={15} style={{ color: "#15803D" }} />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold"
                                        style={{ color: item.type === "contact" ? "#1D4ED8" : "#15803D" }}>
                                        {item.type === "contact" ? "New Contact" : "New Subscriber"}
                                    </p>
                                    <p className="text-sm text-gray-800 truncate">{item.body}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {format(new Date(item.time), "MMM d, HH:mm")}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                <DropdownMenuSeparator className="m-0" />
                <div className="p-2 flex gap-2">
                    <button
                        onClick={() => { setOpen(false); router.push(withQs("/dashboard/contacts")); }}
                        className="flex-1 text-xs py-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                        View all contacts
                    </button>
                    <button
                        onClick={() => { setOpen(false); router.push(withQs("/dashboard/newsletter")); }}
                        className="flex-1 text-xs py-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                        View subscribers
                    </button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
