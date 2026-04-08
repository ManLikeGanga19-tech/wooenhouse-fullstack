// src/components/quotes/QuotesTable.tsx
"use client";

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
import StatusBadge from "@/components/common/StatusBadge";
import { Quote } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils/formatters";
import { Eye, Edit, Send, MoreVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuotesTableProps {
    quotes: Quote[];
}

export default function QuotesTable({ quotes }: QuotesTableProps) {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (path: string) => qs ? `${path}?${qs}` : path;

    const handleViewQuote = (id: string) => {
        router.push(withQs(`/dashboard/quotes/${id}`));
    };

    const handleEditQuote = (id: string) => {
        router.push(withQs(`/dashboard/quotes/${id}/edit`));
    };

    const handleSendQuote = async (quote: Quote) => {
        try {
            const { api } = await import("@/lib/api/client");
            await api.admin.quotes.send(quote.id);
            const { toast } = await import("sonner");
            toast.success(`Quote ${quote.quoteNumber} sent to ${quote.customerEmail}`);
        } catch (err) {
            const { toast } = await import("sonner");
            toast.error("Failed to send quote");
        }
    };

    if (quotes.length === 0) {
        return (
            <div className="rounded-lg border-2 border-gray-200 bg-white p-12 text-center">
                <p className="text-gray-500">No quotes found</p>
                <p className="text-sm text-gray-400 mt-1">
                    Create your first quote to get started
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
                            <TableHead className="font-semibold">Quote #</TableHead>
                            <TableHead className="font-semibold">Customer</TableHead>
                            <TableHead className="font-semibold">House Type</TableHead>
                            <TableHead className="font-semibold">Location</TableHead>
                            <TableHead className="font-semibold">Amount</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quotes.map((quote) => (
                            <TableRow
                                key={quote.id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleViewQuote(quote.id)}
                            >
                                <TableCell className="font-medium">
                                    <span className="font-mono text-sm" style={{ color: "#8B5E3C" }}>
                                        {quote.quoteNumber}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-semibold text-gray-900">{quote.customerName}</p>
                                        <p className="text-xs text-gray-500">{quote.customerEmail}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                    <span className="capitalize text-gray-700">
                                        {quote.houseType.replace("-", " ")}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                    {quote.location}
                                </TableCell>
                                <TableCell className="font-semibold" style={{ color: "#8B5E3C" }}>
                                    {formatCurrency(quote.finalPrice)}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={quote.status} type="quote" />
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                    {formatDate(quote.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewQuote(quote.id)}
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
                                                <DropdownMenuItem onClick={() => handleViewQuote(quote.id)}>
                                                    <Eye size={14} className="mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditQuote(quote.id)}>
                                                    <Edit size={14} className="mr-2" />
                                                    Edit Quote
                                                </DropdownMenuItem>
                                                {quote.status === "draft" && (
                                                    <DropdownMenuItem onClick={() => handleSendQuote(quote)}>
                                                        <Send size={14} className="mr-2" />
                                                        Send Quote
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
    );
}