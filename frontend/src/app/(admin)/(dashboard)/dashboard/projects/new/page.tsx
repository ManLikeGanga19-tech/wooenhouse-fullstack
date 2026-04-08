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
import { ImageUpload } from "@/components/ui/image-upload";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

const CATEGORIES = [
    "Wooden Houses",
    "Commercial Buildings",
    "Furniture & Carpentry",
    "Outdoor Structures",
];

export default function NewProjectPage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (p: string) => qs ? `${p}?${qs}` : p;

    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title:        "",
        slug:         "",
        description:  "",
        location:     "",
        category:     "",
        coverImage:   "",
        status:       "published",
        featured:     false,
        completedAt:  "",
    });
    const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

    const set = (key: string, value: unknown) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleTitle = (title: string) => {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        setForm(prev => ({ ...prev, title, slug }));
    };

    const addGallerySlot    = () => setGalleryUrls(prev => [...prev, ""]);
    const removeGallerySlot = (i: number) => setGalleryUrls(prev => prev.filter((_, idx) => idx !== i));
    const setGalleryUrl     = (i: number, url: string) =>
        setGalleryUrls(prev => prev.map((u, idx) => idx === i ? url : u));

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error("Title is required"); return; }
        if (!form.slug.trim())  { toast.error("Slug is required");  return; }
        setSaving(true);
        try {
            const images = JSON.stringify(galleryUrls.filter(u => u.trim()));
            await api.admin.projects.create({
                ...form,
                images,
                completedAt: form.completedAt ? new Date(form.completedAt).toISOString() : undefined,
            } as never);
            toast.success("Project created");
            router.push(withQs("/dashboard/projects"));
        } catch (err) {
            toast.error("Failed to create project", { description: err instanceof Error ? err.message : undefined });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push(withQs("/dashboard/projects"))} className="border-2">
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold" style={{ color: "#8B5E3C" }}>New Project</h1>
                </div>
                <Button onClick={handleSave} disabled={saving} className="text-white" style={{ backgroundColor: "#8B5E3C" }}>
                    <Save size={16} className="mr-2" /> {saving ? "Saving..." : "Save Project"}
                </Button>
            </div>

            <div className="rounded-lg border-2 border-gray-200 bg-white p-6 space-y-6">
                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Basic Info</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={form.title} onChange={e => handleTitle(e.target.value)} className="border-2" placeholder="e.g. Off-Grid Cottage in Nanyuki" />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug *</Label>
                        <Input value={form.slug} onChange={e => set("slug", e.target.value)} className="border-2" placeholder="off-grid-cottage-nanyuki" />
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={form.category} onValueChange={v => set("category", v)}>
                            <SelectTrigger className="border-2"><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={form.location} onChange={e => set("location", e.target.value)} className="border-2" placeholder="e.g. Naivasha, Kenya" />
                    </div>
                    <div className="space-y-2">
                        <Label>Completion Date</Label>
                        <Input type="date" value={form.completedAt} onChange={e => set("completedAt", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={form.status} onValueChange={v => set("status", v)}>
                            <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Description</Label>
                        <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} className="border-2 resize-none" placeholder="Describe the project..." />
                    </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="featured"
                        checked={form.featured}
                        onChange={e => set("featured", e.target.checked)}
                        className="w-4 h-4 accent-[#8B5E3C]"
                    />
                    <Label htmlFor="featured" className="cursor-pointer">
                        Mark as Featured <span className="text-gray-400 font-normal">(shown prominently on the projects page)</span>
                    </Label>
                </div>

                <Separator />

                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Images</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Cover Image</Label>
                        <p className="text-xs text-gray-400">This is the main image shown on the projects listing.</p>
                        <ImageUpload
                            value={form.coverImage}
                            onChange={url => set("coverImage", url)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Gallery Images</Label>
                        <p className="text-xs text-gray-400">Additional images shown in the project lightbox.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {galleryUrls.map((url, i) => (
                                <div key={i} className="relative">
                                    <ImageUpload
                                        value={url}
                                        onChange={newUrl => {
                                            if (!newUrl) removeGallerySlot(i);
                                            else setGalleryUrl(i, newUrl);
                                        }}
                                    />
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addGallerySlot}
                                className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6 text-gray-400 hover:border-[#8B5E3C] hover:text-[#8B5E3C] transition-colors cursor-pointer"
                                style={{ minHeight: 120 }}
                            >
                                <Plus size={22} className="mb-1" />
                                <span className="text-xs font-medium">Add Image</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
