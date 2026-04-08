// src/components/common/StatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG, QUOTE_STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/utils/constants";

interface StatusBadgeProps {
    status: string;
    type?: "contact" | "quote" | "priority" | "newsletter";
}

export default function StatusBadge({ status, type = "contact" }: StatusBadgeProps) {
    const getConfig = () => {
        const lowerStatus = status.toLowerCase();

        if (type === "quote") {
            return QUOTE_STATUS_CONFIG[lowerStatus as keyof typeof QUOTE_STATUS_CONFIG] || {
                label: status,
                bgColor: "bg-gray-100",
                textColor: "text-gray-800",
            };
        }

        if (type === "priority") {
            return PRIORITY_CONFIG[lowerStatus as keyof typeof PRIORITY_CONFIG] || {
                label: status,
                bgColor: "bg-gray-100",
                textColor: "text-gray-700",
            };
        }

        if (type === "newsletter") {
            if (lowerStatus === "active") {
                return {
                    label: "Active",
                    bgColor: "bg-green-100",
                    textColor: "text-green-800",
                };
            }
            return {
                label: "Unsubscribed",
                bgColor: "bg-gray-100",
                textColor: "text-gray-800",
            };
        }

        // Default to contact status
        return STATUS_CONFIG[lowerStatus as keyof typeof STATUS_CONFIG] || {
            label: status,
            bgColor: "bg-gray-100",
            textColor: "text-gray-800",
        };
    };

    const config = getConfig();

    return (
        <Badge
            className={`${config.bgColor} ${config.textColor} hover:${config.bgColor} border-0 font-medium`}
        >
            {config.label}
        </Badge>
    );
}