// src/components/contacts/ContactsTable.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/common/StatusBadge";
import { Contact } from "@/types";
import { formatDate, formatPhoneNumber } from "@/lib/utils/formatters";
import { SERVICE_TYPE_LABELS, BUDGET_LABELS, TIMELINE_LABELS } from "@/types";
import {
    Eye, FileText, MoreVertical, ShieldAlert, ShieldCheck,
    Phone, Mail, MapPin, ChevronRight, Calendar,
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface ContactsTableProps {
    contacts:    Contact[];
    showSpam?:   boolean;
    onMarkSpam?: (id: string, isSpam: boolean) => void;
}

// ─── Mobile bottom-sheet detail ───────────────────────────────────────────────

function ContactSheet({
    contact,
    showSpam,
    onMarkSpam,
    onClose,
    onViewFull,
    onCreateQuote,
}: {
    contact:       Contact;
    showSpam:      boolean;
    onMarkSpam?:   (id: string, isSpam: boolean) => void;
    onClose:       () => void;
    onViewFull:    () => void;
    onCreateQuote: () => void;
}) {
    return (
        <>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-3 pb-4">
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{contact.name}</h2>
                    <p className="text-sm text-gray-500">
                        {SERVICE_TYPE_LABELS[contact.serviceType] ?? contact.serviceType}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3 mt-0.5">
                    {contact.priority && contact.priority !== "normal" && (
                        <StatusBadge status={contact.priority} type="priority" />
                    )}
                    <StatusBadge status={contact.status} type="contact" />
                </div>
            </div>

            <Separator />

            {/* Info rows */}
            <div className="px-5 py-4 space-y-3">
                {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-3 py-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 shrink-0">
                            <Phone size={16} className="text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm font-semibold text-gray-900">{formatPhoneNumber(contact.phone)}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                    </a>
                )}

                <a href={`mailto:${contact.email}`} className="flex items-center gap-3 py-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 shrink-0">
                        <Mail size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{contact.email}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                </a>

                {contact.location && (
                    <div className="flex items-center gap-3 py-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 shrink-0">
                            <MapPin size={16} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm font-semibold text-gray-900">{contact.location}</p>
                        </div>
                    </div>
                )}

                {(contact.budget || contact.timeline) && (
                    <div className="flex gap-3">
                        {contact.budget && (
                            <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2">
                                <p className="text-xs text-gray-500 mb-1">Budget</p>
                                <p className="text-xs font-semibold text-gray-800">
                                    {BUDGET_LABELS[contact.budget as keyof typeof BUDGET_LABELS] ?? contact.budget}
                                </p>
                            </div>
                        )}
                        {contact.timeline && (
                            <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2">
                                <p className="text-xs text-gray-500 mb-1">Timeline</p>
                                <p className="text-xs font-semibold text-gray-800">
                                    {TIMELINE_LABELS[contact.timeline as keyof typeof TIMELINE_LABELS] ?? contact.timeline}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3 py-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 shrink-0">
                        <Calendar size={16} className="text-purple-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Submitted</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(contact.createdAt)}</p>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Action buttons */}
            {!showSpam && (
                <div className="px-5 pt-4 pb-3 space-y-2.5">
                    <Button
                        className="w-full h-12 text-sm font-semibold text-white"
                        style={{ backgroundColor: "#8B5E3C" }}
                        onClick={onViewFull}
                    >
                        <Eye size={16} className="mr-2" /> View Full Details
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full h-12 text-sm border-2"
                        onClick={onCreateQuote}
                    >
                        <FileText size={16} className="mr-2" /> Create Quote
                    </Button>
                </div>
            )}

            {/* Spam actions */}
            {onMarkSpam && (
                <div className="px-5 pb-3">
                    {showSpam ? (
                        <Button
                            variant="outline"
                            className="w-full h-12 text-sm border-2 text-green-700 border-green-300"
                            onClick={() => { onMarkSpam(contact.id, false); onClose(); }}
                        >
                            <ShieldCheck size={16} className="mr-2" /> Not Spam
                        </Button>
                    ) : (
                        <button
                            onClick={() => { onMarkSpam(contact.id, true); onClose(); }}
                            className="w-full py-3 text-sm text-red-600 font-medium"
                        >
                            <ShieldAlert size={14} className="inline mr-1.5 mb-0.5" />
                            Mark as Spam
                        </button>
                    )}
                </div>
            )}

            {/* Safe area spacer */}
            <div style={{ height: "max(env(safe-area-inset-bottom), 12px)" }} />
        </>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ContactsTable({ contacts, showSpam = false, onMarkSpam }: ContactsTableProps) {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (path: string) => (qs ? `${path}?${qs}` : path);

    const [sheetContact, setSheetContact] = useState<Contact | null>(null);

    const handleViewDetails = (id: string) => {
        router.push(withQs(`/dashboard/contacts/${id}`));
    };

    const handleCreateQuote = (contact: Contact) => {
        const base = `/dashboard/quotes/new?contactId=${contact.id}`;
        router.push(qs ? `${base}&${qs}` : base);
    };

    if (contacts.length === 0) {
        return (
            <div className="rounded-lg border-2 border-gray-200 bg-white p-12 text-center">
                <p className="text-gray-500">{showSpam ? "No spam contacts found" : "No contacts found"}</p>
                <p className="text-sm text-gray-400 mt-1">
                    {showSpam
                        ? "All submissions look legitimate"
                        : "Contacts will appear here when customers submit the contact form"}
                </p>
            </div>
        );
    }

    return (
        <>
            {/* ── Mobile card list (hidden on md+) ────────────────────────────── */}
            <div className="md:hidden space-y-2">
                {contacts.map((contact) => (
                    <button
                        key={contact.id}
                        onClick={() => setSheetContact(contact)}
                        className={`w-full text-left rounded-xl border-2 bg-white px-4 py-3.5 transition-colors active:bg-gray-50 ${
                            showSpam ? "border-red-200 bg-red-50/20" : "border-gray-200"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-gray-900 text-sm">{contact.name}</span>
                                    {contact.priority && contact.priority !== "normal" && (
                                        <StatusBadge status={contact.priority} type="priority" />
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    {SERVICE_TYPE_LABELS[contact.serviceType] ?? contact.serviceType}
                                    {contact.location ? ` · ${contact.location}` : ""}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{formatDate(contact.createdAt)}</p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                                {showSpam ? (
                                    <Badge variant="outline" className="border-red-300 text-red-600 text-xs capitalize">
                                        <ShieldAlert size={10} className="mr-1" />
                                        {(contact as never as { spamReason?: string }).spamReason ?? "spam"}
                                    </Badge>
                                ) : (
                                    <StatusBadge status={contact.status} type="contact" />
                                )}
                                <ChevronRight size={14} className="text-gray-300" />
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* ── Desktop table (hidden on mobile) ───────────────────────────── */}
            <div className="hidden md:block rounded-lg border-2 border-gray-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Email</TableHead>
                                <TableHead className="font-semibold">Phone</TableHead>
                                <TableHead className="font-semibold">Service</TableHead>
                                {showSpam
                                    ? <TableHead className="font-semibold">Reason</TableHead>
                                    : <TableHead className="font-semibold">Status</TableHead>
                                }
                                <TableHead className="font-semibold">Date</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.map((contact) => (
                                <TableRow
                                    key={contact.id}
                                    className={`hover:bg-gray-50 cursor-pointer ${showSpam ? "bg-red-50/30" : ""}`}
                                    onClick={() => !showSpam && handleViewDetails(contact.id)}
                                >
                                    <TableCell className="font-medium">
                                        <div>
                                            <p className="font-semibold text-gray-900">{contact.name}</p>
                                            {!showSpam && contact.priority && contact.priority !== "normal" && (
                                                <Badge
                                                    variant="outline"
                                                    className="mt-1 text-xs"
                                                    style={{
                                                        borderColor: contact.priority === "urgent" ? "#EF4444" :
                                                            contact.priority === "high" ? "#F59E0B" : "#6B7280",
                                                        color: contact.priority === "urgent" ? "#EF4444" :
                                                            contact.priority === "high" ? "#F59E0B" : "#6B7280",
                                                    }}
                                                >
                                                    {contact.priority}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">{contact.email}</TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {formatPhoneNumber(contact.phone)}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-700">
                                        {SERVICE_TYPE_LABELS[contact.serviceType]}
                                    </TableCell>
                                    <TableCell>
                                        {showSpam ? (
                                            <Badge variant="outline" className="border-red-300 text-red-600 text-xs capitalize">
                                                <ShieldAlert size={11} className="mr-1" />
                                                {(contact as never as { spamReason?: string }).spamReason ?? "spam"}
                                            </Badge>
                                        ) : (
                                            <StatusBadge status={contact.status} type="contact" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {formatDate(contact.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            {!showSpam && (
                                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(contact.id)}>
                                                    <Eye size={14} className="mr-1" /> View
                                                </Button>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {!showSpam && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleViewDetails(contact.id)}>
                                                                <Eye size={14} className="mr-2" /> View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleCreateQuote(contact)}>
                                                                <FileText size={14} className="mr-2" /> Create Quote
                                                            </DropdownMenuItem>
                                                            {onMarkSpam && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 focus:text-red-600"
                                                                        onClick={() => onMarkSpam(contact.id, true)}
                                                                    >
                                                                        <ShieldAlert size={14} className="mr-2" /> Mark as Spam
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    {showSpam && onMarkSpam && (
                                                        <DropdownMenuItem
                                                            className="text-green-700 focus:text-green-700"
                                                            onClick={() => onMarkSpam(contact.id, false)}
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

            {/* ── Contact detail bottom sheet (mobile) ───────────────────────── */}
            <Sheet open={!!sheetContact} onOpenChange={(open) => !open && setSheetContact(null)}>
                <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0 max-h-[92vh] overflow-y-auto">
                    <VisuallyHidden>
                        <SheetTitle>Contact Details</SheetTitle>
                    </VisuallyHidden>
                    {sheetContact && (
                        <ContactSheet
                            contact={sheetContact}
                            showSpam={showSpam}
                            onMarkSpam={onMarkSpam}
                            onClose={() => setSheetContact(null)}
                            onViewFull={() => {
                                setSheetContact(null);
                                handleViewDetails(sheetContact.id);
                            }}
                            onCreateQuote={() => {
                                setSheetContact(null);
                                handleCreateQuote(sheetContact);
                            }}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
