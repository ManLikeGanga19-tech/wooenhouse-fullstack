"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type Service } from "@/lib/api/client";
import { toast } from "sonner";

export default function EditServicePage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (p: string) => qs ? `${p}?${qs}` : p;
    const { id }       = useParams<{ id: string }>();

    const [loading,  setLoading]  = useState(true);
    const [saving,   setSaving]   = useState(false);
    const [form,     setForm]     = useState<Partial<Service>>({});
    const [features, setFeatures] = useState<string[]>([""]);

    useEffect(() => {
        api.admin.services.getAll()
            .then(r => {
                const s = r.data.find(x => x.id === id);
                if (!s) { toast.error("Service not found"); return; }
                setForm(s);
                try {
                    const parsed = JSON.parse(s.features) as string[];
                    setFeatures(parsed.length > 0 ? parsed : [""]);
                } catch {
                    setFeatures([""]);
                }
            })
            .catch(() => toast.error("Failed to load service"))
            .finally(() => setLoading(false));
    }, [id]);

    const set = (key: keyof Service, value: unknown) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const addFeature    = () => setFeatures(prev => [...prev, ""]);
    const removeFeature = (i: number) => setFeatures(prev => prev.filter((_, idx) => idx !== i));
    const setFeature    = (i: number, val: string) =>
        setFeatures(prev => prev.map((f, idx) => idx === i ? val : f));

    const handleSave = async () => {
        if (!form.title?.trim()) { toast.error("Title is required"); return; }
        setSaving(true);
        try {
            const featuresJson = JSON.stringify(features.filter(f => f.trim()));
            await api.admin.services.update(id, { ...form, features: featuresJson } as never);
            toast.success("Service updated");
            router.push(withQs("/dashboard/services"));
        } catch (err) {
            toast.error("Failed to save", { description: err instanceof Error ? err.message : undefined });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-64 rounded-lg bg-gray-100 animate-pulse" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push(withQs("/dashboard/services"))} className="border-2">
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold" style={{ color: "#8B5E3C" }}>Edit Service</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{form.title}</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="text-white" style={{ backgroundColor: "#8B5E3C" }}>
                    <Save size={16} className="mr-2" /> {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="rounded-lg border-2 border-gray-200 bg-white p-6 space-y-6">
                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={form.title ?? ""} onChange={e => set("title", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug *</Label>
                        <Input value={form.slug ?? ""} onChange={e => set("slug", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Icon name <span className="text-gray-400 font-normal">(Lucide icon)</span></Label>
                        <Input value={form.icon ?? ""} onChange={e => set("icon", e.target.value)} className="border-2" placeholder="e.g. Home, TreePine, Hammer" />
                    </div>
                    <div className="space-y-2">
                        <Label>Sort Order</Label>
                        <Input type="number" value={form.sortOrder ?? 0} onChange={e => set("sortOrder", parseInt(e.target.value) || 0)} className="border-2" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Description</Label>
                        <Textarea value={form.description ?? ""} onChange={e => set("description", e.target.value)} rows={3} className="border-2 resize-none" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Image URL <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <Input value={form.imageUrl ?? ""} onChange={e => set("imageUrl", e.target.value)} className="border-2" />
                    </div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status ?? "published"} onValueChange={v => set("status", v)}>
                        <SelectTrigger className="border-2 w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                    <Label>Features / Bullet Points</Label>
                    <p className="text-xs text-gray-400">Shown as bullet points on the services page.</p>
                    {features.map((f, i) => (
                        <div key={i} className="flex gap-2">
                            <Input
                                value={f}
                                onChange={e => setFeature(i, e.target.value)}
                                className="border-2"
                                placeholder={`Feature ${i + 1}`}
                            />
                            {features.length > 1 && (
                                <Button size="icon" variant="ghost" onClick={() => removeFeature(i)}>
                                    <X size={15} className="text-red-400" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={addFeature} className="border-2">
                        <Plus size={14} className="mr-1" /> Add Feature
                    </Button>
                </div>
            </div>
        </div>
    );
}
