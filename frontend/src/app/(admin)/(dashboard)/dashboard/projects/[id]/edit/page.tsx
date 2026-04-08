"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { api, type Project } from "@/lib/api/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus } from "lucide-react";

const CATEGORIES = [
    "Wooden Houses",
    "Commercial Buildings",
    "Furniture & Carpentry",
    "Outdoor Structures",
];

export default function EditProjectPage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (p: string) => qs ? `${p}?${qs}` : p;
    const { id }       = useParams<{ id: string }>();

    const [loading,     setLoading]     = useState(true);
    const [saving,      setSaving]      = useState(false);
    const [form,        setForm]        = useState<Partial<Project>>({});
    const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

    useEffect(() => {
        api.admin.projects.getAll()
            .then(r => {
                const p = r.data.find(x => x.id === id);
                if (!p) { toast.error("Project not found"); return; }
                setForm(p);
                try {
                    const imgs = JSON.parse(p.images) as string[];
                    setGalleryUrls(imgs.filter(Boolean));
                } catch {
                    setGalleryUrls([]);
                }
            })
            .catch(() => toast.error("Failed to load project"))
            .finally(() => setLoading(false));
    }, [id]);

    const set = (key: keyof Project, value: unknown) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const addGallerySlot    = () => setGalleryUrls(prev => [...prev, ""]);
    const removeGallerySlot = (i: number) => setGalleryUrls(prev => prev.filter((_, idx) => idx !== i));
    const setGalleryUrl     = (i: number, url: string) =>
        setGalleryUrls(prev => prev.map((u, idx) => idx === i ? url : u));

    const handleSave = async () => {
        if (!form.title?.trim()) { toast.error("Title is required"); return; }
        setSaving(true);
        try {
            const images = JSON.stringify(galleryUrls.filter(u => u.trim()));
            await api.admin.projects.update(id, { ...form, images } as never);
            toast.success("Project updated");
            router.push(withQs("/dashboard/projects"));
        } catch (err) {
            toast.error("Failed to save", { description: err instanceof Error ? err.message : undefined });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-96 rounded-lg bg-gray-100 animate-pulse" />;

    const completedAtValue = form.completedAt
        ? format(new Date(form.completedAt), "yyyy-MM-dd")
        : "";

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push(withQs("/dashboard/projects"))} className="border-2">
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold" style={{ color: "#8B5E3C" }}>Edit Project</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{form.title}</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="text-white" style={{ backgroundColor: "#8B5E3C" }}>
                    <Save size={16} className="mr-2" /> {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="rounded-lg border-2 border-gray-200 bg-white p-6 space-y-6">
                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Basic Info</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={form.title ?? ""} onChange={e => set("title", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input value={form.slug ?? ""} onChange={e => set("slug", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={form.category ?? ""} onValueChange={v => set("category", v)}>
                            <SelectTrigger className="border-2"><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={form.location ?? ""} onChange={e => set("location", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Completion Date</Label>
                        <Input
                            type="date"
                            value={completedAtValue}
                            onChange={e => set("completedAt", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                            className="border-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={form.status ?? "published"} onValueChange={v => set("status", v)}>
                            <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Description</Label>
                        <Textarea value={form.description ?? ""} onChange={e => set("description", e.target.value)} rows={4} className="border-2 resize-none" />
                    </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="featured"
                        checked={form.featured ?? false}
                        onChange={e => set("featured", e.target.checked)}
                        className="w-4 h-4 accent-[#8B5E3C]"
                    />
                    <Label htmlFor="featured" className="cursor-pointer">
                        Featured project <span className="text-gray-400 font-normal">(shown prominently on the website)</span>
                    </Label>
                </div>

                <Separator />

                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Images</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Cover Image</Label>
                        <p className="text-xs text-gray-400">Main image shown on the projects listing.</p>
                        <ImageUpload
                            value={form.coverImage ?? ""}
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
