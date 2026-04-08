// src/components/common/SearchBar.tsx
"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchBar({
    value,
    onChange,
    placeholder = "Search...",
    className = ""
}: SearchBarProps) {
    return (
        <div className={`relative ${className}`}>
            <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
            />
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-10 pr-10 border-2 focus:border-[#8B5E3C] transition-colors"
            />
            {value && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
                >
                    <X size={16} className="text-gray-400" />
                </Button>
            )}
        </div>
    );
}