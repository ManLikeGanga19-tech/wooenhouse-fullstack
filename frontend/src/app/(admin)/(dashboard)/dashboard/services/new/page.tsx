"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function NewServicePage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (p: string) => qs ? `${p}?${qs}` : p;

    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title:       "",
        slug:        "",
        description: "",
        icon:        "",
        imageUrl:    "",
        sortOrder:   0,
        status:      "published",
    });
    const [features, setFeatures] = useState<string[]>([""]);

    const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

    const handleTitle = (title: string) => {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        setForm(prev => ({ ...prev, title, slug }));
    };

    const addFeature    = () => setFeatures(prev => [...prev, ""]);
    const removeFeature = (i: number) => setFeatures(prev => prev.filter((_, idx) => idx !== i));
    const setFeature    = (i: number, val: string) =>
        setFeatures(prev => prev.map((f, idx) => idx === i ? val : f));

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error("Title is required"); return; }
        if (!form.slug.trim())  { toast.error("Slug is required");  return; }
        setSaving(true);
        try {
            const featuresJson = JSON.stringify(features.filter(f => f.trim()));
            await api.admin.services.create({ ...form, features: featuresJson });
            toast.success("Service created");
            router.push(withQs("/dashboard/services"));
        } catch (err) {
            toast.error("Failed to create service", { description: err instanceof Error ? err.message : undefined });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push(withQs("/dashboard/services"))} className="border-2">
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold" style={{ color: "#8B5E3C" }}>New Service</h1>
                </div>
                <Button onClick={handleSave} disabled={saving} className="text-white" style={{ backgroundColor: "#8B5E3C" }}>
                    <Save size={16} className="mr-2" /> {saving ? "Saving..." : "Save Service"}
                </Button>
            </div>

            <div className="rounded-lg border-2 border-gray-200 bg-white p-6 space-y-6">
                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={form.title} onChange={e => handleTitle(e.target.value)} className="border-2" placeholder="e.g. Custom Wooden Houses" />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug *</Label>
                        <Input value={form.slug} onChange={e => set("slug", e.target.value)} className="border-2" placeholder="custom-wooden-houses" />
                    </div>
                    <div className="space-y-2">
                        <Label>Icon name <span className="text-gray-400 font-normal">(Lucide icon)</span></Label>
                        <Input value={form.icon} onChange={e => set("icon", e.target.value)} className="border-2" placeholder="e.g. Home, TreePine, Hammer" />
                    </div>
                    <div className="space-y-2">
                        <Label>Sort Order</Label>
                        <Input type="number" value={form.sortOrder} onChange={e => set("sortOrder", parseInt(e.target.value) || 0)} className="border-2" placeholder="1" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Description</Label>
                        <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} className="border-2 resize-none" placeholder="Describe this service..." />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Image URL <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <Input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} className="border-2" placeholder="/images/services/houses.jpg" />
                    </div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => set("status", v)}>
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
