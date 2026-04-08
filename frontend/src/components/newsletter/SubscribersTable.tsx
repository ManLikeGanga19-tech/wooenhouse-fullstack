// src/components/newsletter/SubscribersTable.tsx
"use client";

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
import { NewsletterSubscriber } from "@/types";
import { formatDate } from "@/lib/utils/formatters";
import { UserX, Mail } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubscribersTableProps {
    subscribers: NewsletterSubscriber[];
}

export default function SubscribersTable({ subscribers }: SubscribersTableProps) {
    const handleUnsubscribe = (subscriber: NewsletterSubscriber) => {
        console.log("Unsubscribing:", subscriber.email);
        alert(`Unsubscribed ${subscriber.email}! (Will save to backend when ready)`);
    };

    const handleSendEmail = (subscriber: NewsletterSubscriber) => {
        window.location.href = `mailto:${subscriber.email}`;
    };

    if (subscribers.length === 0) {
        return (
            <div className="rounded-lg border-2 border-gray-200 bg-white p-12 text-center">
                <p className="text-gray-500">No subscribers found</p>
                <p className="text-sm text-gray-400 mt-1">
                    Subscribers will appear here when they sign up for the newsletter
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
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Source</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Subscribed Date</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscribers.map((subscriber) => (
                            <TableRow key={subscriber.id} className="hover:bg-gray-50">
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
                                        {subscriber.source.replace("-", " ")}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={subscriber.status} type="newsletter" />
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                    {formatDate(subscriber.subscribedAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSendEmail(subscriber)}
                                            disabled={subscriber.status === "unsubscribed"}
                                        >
                                            <Mail size={14} className="mr-1" />
                                            Email
                                        </Button>

                                        {subscriber.status === "active" && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                        <UserX size={14} className="mr-1" />
                                                        Unsubscribe
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Unsubscribe Subscriber?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to unsubscribe <strong>{subscriber.email}</strong> from the newsletter?
                                                            This action can be reversed.
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