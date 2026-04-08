// src/components/dashboard/StatsCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    description?: string;
}

export default function StatsCard({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgColor,
    trend,
    description,
}: StatsCardProps) {
    return (
        <Card className="border-2 border-gray-200 hover:border-[#8B5E3C] transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {typeof value === 'number' ? formatNumber(value) : value}
                        </p>

                        {trend && (
                            <div className="mt-2 flex items-center gap-1">
                                <span
                                    className={`text-xs font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                                </span>
                                <span className="text-xs text-gray-500">from last month</span>
                            </div>
                        )}

                        {description && (
                            <p className="mt-1 text-xs text-gray-500">{description}</p>
                        )}
                    </div>

                    <div
                        className="flex h-12 w-12 items-center justify-center rounded-lg"
                        style={{ backgroundColor: iconBgColor }}
                    >
                        <Icon size={24} style={{ color: iconColor }} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}