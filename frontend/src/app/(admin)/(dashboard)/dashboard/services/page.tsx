"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type Service } from "@/lib/api/client";
import { toast } from "sonner";

export default function ServicesPage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (p: string) => qs ? `${p}?${qs}` : p;

    const [services, setServices] = useState<Service[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = () => {
        api.admin.services.getAll()
            .then(r => setServices(r.data))
            .catch(() => toast.error("Failed to load services"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleToggleStatus = async (s: Service) => {
        const next = s.status === "published" ? "draft" : "published";
        try {
            await api.admin.services.update(s.id, { ...s, status: next });
            setServices(prev => prev.map(x => x.id === s.id ? { ...x, status: next } : x));
            toast.success(`Service ${next === "published" ? "published" : "unpublished"}`);
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this service? This cannot be undone.")) return;
        setDeleting(id);
        try {
            await api.admin.services.delete(id);
            setServices(prev => prev.filter(s => s.id !== id));
            toast.success("Service deleted");
        } catch {
            toast.error("Failed to delete service");
        } finally {
            setDeleting(null);
        }
    };

    if (loading) return <div className="h-64 rounded-lg bg-gray-100 animate-pulse" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "#8B5E3C" }}>Services</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage the services shown on the public website</p>
                </div>
                <Button onClick={() => router.push(withQs("/dashboard/services/new"))} className="text-white" style={{ backgroundColor: "#8B5E3C" }}>
                    <Plus size={16} className="mr-2" /> New Service
                </Button>
            </div>

            {services.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
                    <p className="font-medium mb-2">No services yet</p>
                    <p className="text-sm">Add your first service to display it on the website.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {services.map(s => (
                        <div key={s.id} className="flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-4 hover:border-[#8B5E3C]/30 transition-colors">
                            <GripVertical size={18} className="text-gray-300 shrink-0" />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-gray-900">{s.title}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        s.status === "published"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                    }`}>
                                        {s.status}
                                    </span>
                                    {s.sortOrder > 0 && (
                                        <span className="text-xs text-gray-400">#{s.sortOrder}</span>
                                    )}
                                </div>
                                {s.description && (
                                    <p className="text-sm text-gray-500 mt-0.5 truncate">{s.description}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-0.5">/{s.slug}</p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title={s.status === "published" ? "Unpublish" : "Publish"}
                                    onClick={() => handleToggleStatus(s)}
                                >
                                    {s.status === "published"
                                        ? <Eye size={16} className="text-green-600" />
                                        : <EyeOff size={16} className="text-gray-400" />
                                    }
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => router.push(withQs(`/dashboard/services/${s.id}/edit`))}
                                >
                                    <Edit size={16} className="text-gray-500" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={deleting === s.id}
                                    onClick={() => handleDelete(s.id)}
                                >
                                    <Trash2 size={16} className="text-red-400" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-gray-400">
                {services.length} service{services.length !== 1 ? "s" : ""} · Only &quot;published&quot; services appear on the public website.
            </p>
        </div>
    );
}
