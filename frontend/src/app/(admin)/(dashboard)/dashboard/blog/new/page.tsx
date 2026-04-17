"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { api } from "@/lib/api/client"
import { toast } from "sonner"

const CATEGORIES = ["Partner Stories", "Insights", "News", "Tips & Guides"]

export default function NewBlogPostPage() {
    const router       = useRouter()
    const searchParams = useSearchParams()
    const qs           = searchParams.toString()
    const withQs       = (p: string) => qs ? `${p}?${qs}` : p

    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        title:           "",
        slug:            "",
        excerpt:         "",
        content:         "",
        coverImage:      "",
        category:        "Insights",
        author:          "Wooden Houses Kenya",
        tags:            "",
        readTimeMinutes: 5,
        featured:        false,
        status:          "draft",
    })

    const set = (key: string, value: unknown) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const handleTitle = (title: string) => {
        const slug = title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-")
        setForm(prev => ({ ...prev, title, slug }))
    }

    const handleSave = async () => {
        if (!form.title.trim())   { toast.error("Title is required");   return }
        if (!form.slug.trim())    { toast.error("Slug is required");    return }
        if (!form.excerpt.trim()) { toast.error("Excerpt is required"); return }
        if (!form.content.trim()) { toast.error("Content is required"); return }
        setSaving(true)
        try {
            const tagsJson = form.tags.trim()
                ? JSON.stringify(form.tags.split(",").map(t => t.trim()).filter(Boolean))
                : undefined
            await api.admin.blog.create({ ...form, tags: tagsJson })
            toast.success("Post created")
            router.push(withQs("/dashboard/blog"))
        } catch (err) {
            toast.error("Failed to create post", { description: err instanceof Error ? err.message : undefined })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push(withQs("/dashboard/blog"))} className="border-2">
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold" style={{ color: "#8B5E3C" }}>New Blog Post</h1>
                </div>
                <Button onClick={handleSave} disabled={saving} className="text-white" style={{ backgroundColor: "#8B5E3C" }}>
                    <Save size={16} className="mr-2" /> {saving ? "Saving..." : "Save Post"}
                </Button>
            </div>

            <div className="rounded-lg border-2 border-gray-200 bg-white p-6 space-y-6">
                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Post Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Title *</Label>
                        <Input value={form.title} onChange={e => handleTitle(e.target.value)} className="border-2" placeholder="e.g. Kutoka Msitu Hadi Mlangoni" />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug *</Label>
                        <Input value={form.slug} onChange={e => set("slug", e.target.value)} className="border-2" placeholder="kutoka-msitu-hadi-mlangoni" />
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={form.category} onValueChange={v => set("category", v)}>
                            <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Author</Label>
                        <Input value={form.author} onChange={e => set("author", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Read Time (minutes)</Label>
                        <Input type="number" min={1} max={60} value={form.readTimeMinutes} onChange={e => set("readTimeMinutes", Number(e.target.value))} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={form.status} onValueChange={v => set("status", v)}>
                            <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Tags <span className="text-gray-400 font-normal">(comma separated)</span></Label>
                        <Input value={form.tags} onChange={e => set("tags", e.target.value)} className="border-2" placeholder="Kenya, Wooden House, Naivasha" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Excerpt * <span className="text-gray-400 font-normal">(shown in list view)</span></Label>
                        <Textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} rows={3} className="border-2 resize-none" placeholder="A short summary of the article — 1 to 2 sentences." />
                    </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                    <input type="checkbox" id="featured" checked={form.featured} onChange={e => set("featured", e.target.checked)} className="w-4 h-4 accent-[#8B5E3C]" />
                    <Label htmlFor="featured" className="cursor-pointer">
                        Featured <span className="text-gray-400 font-normal">(shown prominently on the blog page)</span>
                    </Label>
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <ImageUpload value={form.coverImage} onChange={url => set("coverImage", url)} />
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label>Content * <span className="text-gray-400 font-normal">(Markdown supported)</span></Label>
                    <p className="text-xs text-gray-400">Use # for headings, **bold**, *italic*, {">"} for quotes, - for lists. Tables supported.</p>
                    <Textarea
                        value={form.content}
                        onChange={e => set("content", e.target.value)}
                        rows={24}
                        className="border-2 resize-y font-mono text-sm"
                        placeholder={"# Article Title\n\nWrite your article here...\n\n## A Section\n\nMore content..."}
                    />
                </div>
            </div>
        </div>
    )
}
