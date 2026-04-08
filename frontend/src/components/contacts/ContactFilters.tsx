// src/components/contacts/ContactFilters.tsx
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ContactFiltersProps {
    statusFilter: string;
    serviceFilter: string;
    onStatusChange: (value: string) => void;
    onServiceChange: (value: string) => void;
    onClearFilters: () => void;
    hasActiveFilters: boolean;
}

export default function ContactFilters({
    statusFilter,
    serviceFilter,
    onStatusChange,
    onServiceChange,
    onClearFilters,
    hasActiveFilters,
}: ContactFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[180px] border-2">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
            </Select>

            {/* Service Type Filter */}
            <Select value={serviceFilter} onValueChange={onServiceChange}>
                <SelectTrigger className="w-[200px] border-2">
                    <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="wooden-house">Wooden House Construction</SelectItem>
                    <SelectItem value="carpentry">General Carpentry</SelectItem>
                    <SelectItem value="consultation">Design Consultation</SelectItem>
                    <SelectItem value="other">Other Services</SelectItem>
                </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearFilters}
                    className="border-2"
                >
                    <X size={14} className="mr-1" />
                    Clear Filters
                </Button>
            )}
        </div>
    );
}