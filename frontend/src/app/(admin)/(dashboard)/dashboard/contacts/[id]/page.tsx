"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/common/StatusBadge";
import { api, type Contact } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/formatters";
import { SERVICE_TYPE_LABELS, BUDGET_LABELS, TIMELINE_LABELS } from "@/types";
import { toast } from "sonner";

export default function ContactDetailsPage() {
    const params       = useParams();
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const back         = qs ? `/dashboard/contacts?${qs}` : "/dashboard/contacts";
    const id           = params.id as string;

    const [contact,  setContact]  = useState<Contact | null>(null);
    const [loading,  setLoading]  = useState(true);
    const [status,   setStatus]   = useState("");
    const [notes,    setNotes]    = useState("");
    const [saving,   setSaving]   = useState(false);

    useEffect(() => {
        api.admin.contacts.getById(id)
            .then(r => {
                setContact(r.data);
                setStatus(r.data.status);
                setNotes(r.data.notes ?? "");
            })
            .catch(() => toast.error("Contact not found"))
            .finally(() => setLoading(false));
    }, [id]);

    const handleUpdateStatus = async (newStatus: string) => {
        setStatus(newStatus);
        try {
            await api.admin.contacts.update(id, { status: newStatus });
            toast.success("Status updated");
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleSaveNotes = async () => {
        setSaving(true);
        try {
            await api.admin.contacts.update(id, { notes });
            toast.success("Notes saved");
        } catch {
            toast.error("Failed to save notes");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 rounded-lg bg-gray-100 animate-pulse" />)}</div>;
    }

    if (!contact) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-xl font-semibold text-gray-900 mb-2">Contact not found</p>
                <Button onClick={() => router.push(back)}><ArrowLeft size={16} className="mr-2" />Back to Contacts</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push(back)} className="border-2">
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold" style={{ color: "#8B5E3C" }}>Contact Details</h1>
                    <p className="text-gray-600 mt-1">View and manage contact information</p>
                </div>
                <Button
                    onClick={() => router.push(qs ? `/dashboard/quotes/new?contactId=${contact.id}&${qs}` : `/dashboard/quotes/new?contactId=${contact.id}`)}
                    className="text-white font-semibold"
                    style={{ backgroundColor: "#8B5E3C" }}
                >
                    <FileText size={16} className="mr-2" /> Create Quote
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-2 border-gray-200">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl" style={{ color: "#8B5E3C" }}>Contact Information</CardTitle>
                                <StatusBadge status={status} type="contact" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { icon: User,    bg: "#F5F0EB", color: "#8B5E3C", label: "Full Name",     value: contact.name },
                                { icon: Mail,    bg: "#EFF6FF", color: "#3B82F6", label: "Email Address", value: contact.email, href: `mailto:${contact.email}` },
                                { icon: Phone,   bg: "#F0FDF4", color: "#10B981", label: "Phone Number",  value: contact.phone ?? "—", href: contact.phone ? `tel:${contact.phone}` : undefined },
                                { icon: MapPin,  bg: "#FEF3C7", color: "#F59E0B", label: "Location",      value: contact.location ?? "—" },
                                { icon: Calendar,bg: "#F5F3FF", color: "#8B5CF6", label: "Submitted On",  value: formatDate(contact.createdAt, "MMMM dd, yyyy") },
                            ].map(({ icon: Icon, bg, color, label, value, href }) => (
                                <div key={label} className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: bg }}>
                                        <Icon size={20} style={{ color }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600">{label}</p>
                                        {href
                                            ? <a href={href} className="font-semibold text-gray-900 hover:text-[#8B5E3C] transition-colors">{value}</a>
                                            : <p className="font-semibold text-gray-900">{value}</p>
                                        }
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {(contact.serviceType || contact.budget || contact.timeline) && (
                        <Card className="border-2 border-gray-200">
                            <CardHeader><CardTitle className="text-xl" style={{ color: "#8B5E3C" }}>Project Details</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {contact.serviceType && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Service Type</p>
                                            <Badge variant="outline">{SERVICE_TYPE_LABELS[contact.serviceType as keyof typeof SERVICE_TYPE_LABELS] ?? contact.serviceType}</Badge>
                                        </div>
                                    )}
                                    {contact.budget && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Budget Range</p>
                                            <Badge variant="outline">KES {BUDGET_LABELS[contact.budget as keyof typeof BUDGET_LABELS] ?? contact.budget}</Badge>
                                        </div>
                                    )}
                                    {contact.timeline && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Timeline</p>
                                            <Badge variant="outline">{TIMELINE_LABELS[contact.timeline as keyof typeof TIMELINE_LABELS] ?? contact.timeline}</Badge>
                                        </div>
                                    )}
                                    {contact.priority && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Priority</p>
                                            <StatusBadge status={contact.priority} type="priority" />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {contact.message && (
                        <Card className="border-2 border-gray-200">
                            <CardHeader><CardTitle className="text-xl" style={{ color: "#8B5E3C" }}>Customer Message</CardTitle></CardHeader>
                            <CardContent>
                                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-100">
                                    <p className="text-gray-900 whitespace-pre-wrap">{contact.message}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="border-2 border-gray-200">
                        <CardHeader><CardTitle className="text-lg" style={{ color: "#8B5E3C" }}>Status Management</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Update Status</Label>
                                <Select value={status} onValueChange={handleUpdateStatus}>
                                    <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="contacted">Contacted</SelectItem>
                                        <SelectItem value="quoted">Quoted</SelectItem>
                                        <SelectItem value="converted">Converted</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-gray-200">
                        <CardHeader><CardTitle className="text-lg" style={{ color: "#8B5E3C" }}>Internal Notes</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Add internal notes about this contact..."
                                rows={6}
                                className="border-2 focus:border-[#8B5E3C] resize-none"
                            />
                            <Button onClick={handleSaveNotes} disabled={saving} className="w-full" style={{ backgroundColor: "#8B5E3C" }}>
                                {saving ? "Saving..." : "Save Notes"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-gray-200">
                        <CardHeader><CardTitle className="text-lg" style={{ color: "#8B5E3C" }}>Quick Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start border-2" onClick={() => window.location.href = `mailto:${contact.email}`}>
                                <Mail size={16} className="mr-2" /> Send Email
                            </Button>
                            {contact.phone && (
                                <Button variant="outline" className="w-full justify-start border-2" onClick={() => window.location.href = `tel:${contact.phone}`}>
                                    <Phone size={16} className="mr-2" /> Call Customer
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="w-full justify-start border-2"
                                onClick={() => router.push(qs ? `/dashboard/quotes/new?contactId=${contact.id}&${qs}` : `/dashboard/quotes/new?contactId=${contact.id}`)}
                            >
                                <FileText size={16} className="mr-2" /> Create Quote
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
