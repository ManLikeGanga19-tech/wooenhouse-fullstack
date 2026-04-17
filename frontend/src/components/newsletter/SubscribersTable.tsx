// src/components/newsletter/SubscribersTable.tsx
"use client";

import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/common/StatusBadge";
import { NewsletterSubscriber } from "@/types";
import { formatDate } from "@/lib/utils/formatters";
import { UserX, Mail, ShieldAlert, ShieldCheck, MoreVertical } from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

interface SubscribersTableProps {
    subscribers: NewsletterSubscriber[];
    showSpam?:   boolean;
    onMarkSpam?: (id: string, isSpam: boolean) => void;
}

export default function SubscribersTable({ subscribers, showSpam = false, onMarkSpam }: SubscribersTableProps) {
    const handleUnsubscribe = async (subscriber: NewsletterSubscriber) => {
        try {
            await api.newsletter.unsubscribe({ email: subscriber.email });
            toast.success(`${subscriber.email} has been unsubscribed.`);
        } catch {
            toast.error("Failed to unsubscribe.");
        }
    };

    if (subscribers.length === 0) {
        return (
            <div className="rounded-lg border-2 border-gray-200 bg-white p-12 text-center">
                <p className="text-gray-500">{showSpam ? "No spam subscribers found" : "No subscribers found"}</p>
                <p className="text-sm text-gray-400 mt-1">
                    {showSpam
                        ? "All subscriptions look legitimate"
                        : "Subscribers will appear here when they sign up for the newsletter"}
                </p>
            </div>
        );
    }

    return (
        <>
            {/* ── Mobile card list ─────────────────────────────────────────── */}
            <div className="md:hidden space-y-2">
                {subscribers.map((subscriber) => (
                    <div
                        key={subscriber.id}
                        className={`rounded-xl border-2 bg-white px-4 py-3.5 ${
                            showSpam ? "border-red-200 bg-red-50/20" : "border-gray-200"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{subscriber.email}</p>
                                {subscriber.name && (
                                    <p className="text-xs text-gray-500 mt-0.5">{subscriber.name}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="text-xs text-gray-400 capitalize">
                                        {(subscriber.source ?? "").replace("-", " ")}
                                    </span>
                                    <span className="text-gray-300">·</span>
                                    <span className="text-xs text-gray-400">{formatDate(subscriber.subscribedAt)}</span>
                                </div>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-2">
                                {showSpam ? (
                                    <Badge variant="outline" className="border-red-300 text-red-600 text-xs capitalize">
                                        <ShieldAlert size={10} className="mr-1" />
                                        {(subscriber as never as { spamReason?: string }).spamReason ?? "spam"}
                                    </Badge>
                                ) : (
                                    <StatusBadge status={subscriber.status} type="newsletter" />
                                )}
                            </div>
                        </div>

                        {/* Mobile actions */}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                            {!showSpam && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-10 text-xs border-2"
                                        onClick={() => (window.location.href = `mailto:${subscriber.email}`)}
                                        disabled={subscriber.status === "unsubscribed"}
                                    >
                                        <Mail size={13} className="mr-1" /> Email
                                    </Button>

                                    {subscriber.status === "active" && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 h-10 text-xs border-2 text-red-600 border-red-200"
                                                >
                                                    <UserX size={13} className="mr-1" /> Unsub
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Unsubscribe?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Remove <strong>{subscriber.email}</strong> from the newsletter?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleUnsubscribe(subscriber)}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        Unsubscribe
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </>
                            )}

                            {onMarkSpam && (
                                showSpam ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-10 text-xs border-2 text-green-700 border-green-200"
                                        onClick={() => onMarkSpam(subscriber.id, false)}
                                    >
                                        <ShieldCheck size={13} className="mr-1" /> Not Spam
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-10 text-xs text-red-500 px-2"
                                        onClick={() => onMarkSpam(subscriber.id, true)}
                                    >
                                        <ShieldAlert size={13} className="mr-1" /> Spam
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Desktop table ────────────────────────────────────────────── */}
            <div className="hidden md:block rounded-lg border-2 border-gray-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold">Email</TableHead>
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Source</TableHead>
                                {showSpam
                                    ? <TableHead className="font-semibold">Reason</TableHead>
                                    : <TableHead className="font-semibold">Status</TableHead>
                                }
                                <TableHead className="font-semibold">Date</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subscribers.map((subscriber) => (
                                <TableRow
                                    key={subscriber.id}
                                    className={`hover:bg-gray-50 ${showSpam ? "bg-red-50/30" : ""}`}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Mail size={16} className="text-gray-400" />
                                            <span className="text-gray-900">{subscriber.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {subscriber.name || "—"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <span className="capitalize text-gray-700">
                                            {(subscriber.source ?? "").replace("-", " ")}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {showSpam ? (
                                            <Badge variant="outline" className="border-red-300 text-red-600 text-xs capitalize">
                                                <ShieldAlert size={11} className="mr-1" />
                                                {(subscriber as never as { spamReason?: string }).spamReason ?? "spam"}
                                            </Badge>
                                        ) : (
                                            <StatusBadge status={subscriber.status} type="newsletter" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {formatDate(subscriber.subscribedAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {!showSpam && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => (window.location.href = `mailto:${subscriber.email}`)}
                                                        disabled={subscriber.status === "unsubscribed"}
                                                    >
                                                        <Mail size={14} className="mr-1" /> Email
                                                    </Button>

                                                    {subscriber.status === "active" && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                                    <UserX size={14} className="mr-1" /> Unsubscribe
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Unsubscribe Subscriber?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to unsubscribe <strong>{subscriber.email}</strong>?
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleUnsubscribe(subscriber)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        Unsubscribe
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </>
                                            )}

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {!showSpam && onMarkSpam && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                onClick={() => onMarkSpam(subscriber.id, true)}
                                                            >
                                                                <ShieldAlert size={14} className="mr-2" /> Mark as Spam
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {showSpam && onMarkSpam && (
                                                        <DropdownMenuItem
                                                            className="text-green-700 focus:text-green-700"
                                                            onClick={() => onMarkSpam(subscriber.id, false)}
                                                        >
                                                            <ShieldCheck size={14} className="mr-2" /> Not Spam
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}
