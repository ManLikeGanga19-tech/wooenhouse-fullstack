// src/components/common/ExportMenu.tsx
"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportMenuProps {
    onExportCSV: () => void;
    onExportExcel?: () => void;
    disabled?: boolean;
}

export default function ExportMenu({
    onExportCSV,
    onExportExcel,
    disabled = false
}: ExportMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className="border-2 hover:border-[#8B5E3C] transition-colors"
                >
                    <Download size={16} className="mr-2" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
                    <FileSpreadsheet size={16} className="mr-2" style={{ color: "#8B5E3C" }} />
                    Export as CSV
                </DropdownMenuItem>
                {onExportExcel && (
                    <DropdownMenuItem onClick={onExportExcel} className="cursor-pointer">
                        <FileSpreadsheet size={16} className="mr-2" style={{ color: "#8B5E3C" }} />
                        Export as Excel
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}