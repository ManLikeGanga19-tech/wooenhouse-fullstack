// src/components/dashboard/QuickActions.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Mail, Plus } from "lucide-react";

export default function QuickActions() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (path: string) => qs ? `${path}?${qs}` : path;

    const actions = [
        {
            title: "New Quote",
            description: "Create a quote for a customer",
            icon: FileText,
            href: "/dashboard/quotes/new",
            color: "#8B5E3C",
            bgColor: "#F5F0EB",
        },
        {
            title: "View Contacts",
            description: "Check pending inquiries",
            icon: Users,
            href: "/dashboard/contacts",
            color: "#3B82F6",
            bgColor: "#EFF6FF",
        },
        {
            title: "Newsletter",
            description: "Manage subscribers",
            icon: Mail,
            href: "/dashboard/newsletter",
            color: "#10B981",
            bgColor: "#F0FDF4",
        },
    ];

    return (
        <Card className="border-2 border-gray-200">
            <CardHeader>
                <CardTitle className="text-xl" style={{ color: "#8B5E3C" }}>
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Button
                                key={action.title}
                                variant="outline"
                                className="h-auto p-4 flex-col items-start gap-2 hover:shadow-md transition-all border-2"
                                onClick={() => router.push(withQs(action.href))}
                            >
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: action.bgColor }}
                                >
                                    <Icon size={20} style={{ color: action.color }} />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900">{action.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                                </div>
                            </Button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}