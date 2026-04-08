// src/components/contacts/ContactsTable.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/common/StatusBadge";
import { Contact } from "@/types";
import { formatDate, formatPhoneNumber } from "@/lib/utils/formatters";
import { SERVICE_TYPE_LABELS } from "@/types";
import { Eye, FileText, MoreVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContactsTableProps {
    contacts: Contact[];
}

export default function ContactsTable({ contacts }: ContactsTableProps) {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (path: string) => qs ? `${path}?${qs}` : path;

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
                <p className="text-gray-500">No contacts found</p>
                <p className="text-sm text-gray-400 mt-1">
                    Contacts will appear here when customers submit the contact form
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border-2 border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Phone</TableHead>
                            <TableHead className="font-semibold">Service</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.map((contact) => (
                            <TableRow
                                key={contact.id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleViewDetails(contact.id)}
                            >
                                <TableCell className="font-medium">
                                    <div>
                                        <p className="font-semibold text-gray-900">{contact.name}</p>
                                        {contact.priority && contact.priority !== 'normal' && (
                                            <Badge
                                                variant="outline"
                                                className="mt-1 text-xs"
                                                style={{
                                                    borderColor: contact.priority === 'urgent' ? '#EF4444' :
                                                        contact.priority === 'high' ? '#F59E0B' : '#6B7280',
                                                    color: contact.priority === 'urgent' ? '#EF4444' :
                                                        contact.priority === 'high' ? '#F59E0B' : '#6B7280'
                                                }}
                                            >
                                                {contact.priority}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                    {contact.email}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                    {formatPhoneNumber(contact.phone)}
                                </TableCell>
                                <TableCell className="text-sm">
                                    <span className="text-gray-700">
                                        {SERVICE_TYPE_LABELS[contact.serviceType]}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={contact.status} type="contact" />
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                    {formatDate(contact.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewDetails(contact.id)}
                                        >
                                            <Eye size={14} className="mr-1" />
                                            View
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleViewDetails(contact.id)}>
                                                    <Eye size={14} className="mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleCreateQuote(contact)}>
                                                    <FileText size={14} className="mr-2" />
                                                    Create Quote
                                                </DropdownMenuItem>
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
    );
}