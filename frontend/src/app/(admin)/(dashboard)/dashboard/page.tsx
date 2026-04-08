"use client";

import { useEffect, useState } from "react";
import { Users, Mail, FileText, TrendingUp } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import { api, type Contact, type Quote, type NewsletterSubscriber } from "@/lib/api/client";

export default function DashboardPage() {
    const [contacts,    setContacts]    = useState<Contact[]>([]);
    const [quotes,      setQuotes]      = useState<Quote[]>([]);
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [loading,     setLoading]     = useState(true);

    useEffect(() => {
        Promise.all([
            api.admin.contacts.getAll({ pageSize: 500 }),
            api.admin.quotes.getAll({ pageSize: 500 }),
            api.admin.newsletter.getAll(),
        ])
            .then(([c, q, n]) => {
                setContacts(c.data.items);
                setQuotes(q.data.items);
                setSubscribers(n.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const now = new Date();
    const thisMonth = (d: string) => {
        const date = new Date(d);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    const totalContacts     = contacts.length;
    const pendingContacts   = contacts.filter(c => c.status === "new").length;
    const activeSubscribers = subscribers.filter(s => s.status === "active").length;
    const totalQuotes       = quotes.length;
    const contactsThisMonth = contacts.filter(c => thisMonth(c.createdAt)).length;
    const quotesSent        = quotes.filter(q => q.status === "sent").length;
    const conversions       = contacts.filter(c => c.status === "converted").length;
    const conversionRate    = totalContacts > 0
        ? ((conversions / totalContacts) * 100).toFixed(1)
        : "0.0";

    const recentActivities = [
        ...contacts.slice(0, 4).map(c => ({
            id: c.id, type: "contact" as const,
            title: "New contact enquiry",
            description: `${c.name} — ${c.email}`,
            timestamp: new Date(c.createdAt),
        })),
        ...quotes.slice(0, 4).map(q => ({
            id: q.id, type: "quote" as const,
            title: `Quote ${q.quoteNumber}`,
            description: `${q.customerName} — ${q.status}`,
            timestamp: new Date(q.createdAt),
        })),
    ]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 8);

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: "#8B5E3C" }}>Dashboard</h1>
                    <p className="text-gray-600 mt-1">Loading...</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 rounded-lg bg-gray-100 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold" style={{ color: "#8B5E3C" }}>Dashboard</h1>
                <p className="text-gray-600 mt-1">
                    Welcome back! Here&apos;s what&apos;s happening with your business.
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Contacts"          value={totalContacts}     icon={Users}     iconColor="#3B82F6" iconBgColor="#EFF6FF" description="All customer inquiries" />
                <StatsCard title="Pending Contacts"        value={pendingContacts}   icon={Users}     iconColor="#F59E0B" iconBgColor="#FEF3C7" description="Needs immediate attention" />
                <StatsCard title="Newsletter Subscribers"  value={activeSubscribers} icon={Mail}      iconColor="#10B981" iconBgColor="#F0FDF4" description="Active subscribers" />
                <StatsCard title="Total Quotes"            value={totalQuotes}       icon={FileText}  iconColor="#8B5CF6" iconBgColor="#F5F3FF" description="Sent and pending" />
            </div>

            <QuickActions />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RecentActivity activities={recentActivities} />
                </div>

                <div className="space-y-6">
                    <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp size={20} style={{ color: "#8B5E3C" }} />
                            <h3 className="font-semibold" style={{ color: "#8B5E3C" }}>This Month</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">New Contacts</span>
                                <span className="font-semibold text-gray-900">{contactsThisMonth}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Quotes Sent</span>
                                <span className="font-semibold text-gray-900">{quotesSent}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Conversions</span>
                                <span className="font-semibold text-gray-900">{conversions}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                <span className="text-sm font-medium text-gray-900">Conversion Rate</span>
                                <span className="font-bold" style={{ color: "#10B981" }}>{conversionRate}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
                        <h3 className="font-semibold mb-4" style={{ color: "#8B5E3C" }}>Contact Status</h3>
                        <div className="space-y-3">
                            {[
                                { label: "New",       count: contacts.filter(c => c.status === "new").length,       color: "#3B82F6" },
                                { label: "Contacted", count: contacts.filter(c => c.status === "contacted").length, color: "#F59E0B" },
                                { label: "Quoted",    count: contacts.filter(c => c.status === "quoted").length,    color: "#8B5CF6" },
                                { label: "Converted", count: contacts.filter(c => c.status === "converted").length, color: "#10B981" },
                            ].map(s => (
                                <div key={s.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                                        <span className="text-sm text-gray-600">{s.label}</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
