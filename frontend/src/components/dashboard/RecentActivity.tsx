// src/components/dashboard/RecentActivity.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityItem } from "@/types";
import { formatRelativeTime } from "@/lib/utils/formatters";
import {
    User,
    Mail,
    FileText,
    CheckCircle,
    Circle
} from "lucide-react";

interface RecentActivityProps {
    activities: ActivityItem[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
    const getIcon = (type: ActivityItem['type']) => {
        const iconClass = "h-4 w-4";
        switch (type) {
            case 'contact':
                return <User className={iconClass} style={{ color: "#3B82F6" }} />;
            case 'newsletter':
                return <Mail className={iconClass} style={{ color: "#10B981" }} />;
            case 'quote':
                return <FileText className={iconClass} style={{ color: "#8B5CF6" }} />;
            case 'status_change':
                return <CheckCircle className={iconClass} style={{ color: "#F59E0B" }} />;
            default:
                return <Circle className={iconClass} style={{ color: "#6B7280" }} />;
        }
    };

    const getBadgeColor = (type: ActivityItem['type']) => {
        switch (type) {
            case 'contact':
                return 'bg-blue-100 text-blue-700';
            case 'newsletter':
                return 'bg-green-100 text-green-700';
            case 'quote':
                return 'bg-purple-100 text-purple-700';
            case 'status_change':
                return 'bg-amber-100 text-amber-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Card className="border-2 border-gray-200">
            <CardHeader>
                <CardTitle className="text-xl" style={{ color: "#8B5E3C" }}>
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                            No recent activity
                        </p>
                    ) : (
                        activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                            >
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 shrink-0"
                                >
                                    {getIcon(activity.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium text-gray-900">
                                            {activity.title}
                                        </p>
                                        <Badge variant="secondary" className={getBadgeColor(activity.type)}>
                                            {activity.type}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {activity.description}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatRelativeTime(activity.timestamp)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}