"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import MarkdownEditor from "@/components/blog/MarkdownEditor"
import { api } from "@/lib/api/client"
import { toast } from "sonner"

const CATEGORIES = ["Partner Stories", "Insights", "News", "Tips & Guides"]

export default function NewBlogPostPage() {
    const router       = useRouter()
    const searchParams = useSearchParams()
    const qs           = searchParams.toString()
    const withQs       = (p: string) => qs ? `${p}?${qs}` : p

    const [saving,     setSaving]     = useState(false)
    const [uploadBusy, setUploadBusy] = useState(false)
    const [isDirty,    setIsDirty]    = useState(false)
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

    // Warn about unsaved changes on accidental page refresh / tab close
    useEffect(() => {
        if (!isDirty) return
        const guard = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
        window.addEventListener('beforeunload', guard)
        return () => window.removeEventListener('beforeunload', guard)
    }, [isDirty])

    const set = (key: string, value: unknown) => {
        setIsDirty(true)
        setForm(prev => ({ ...prev, [key]: value }))
    }

    const handleTitle = (title: string) => {
        const slug = title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-")
        setIsDirty(true)
        setForm(prev => ({ ...prev, title, slug }))
    }

    const handleSave = async () => {
        if (!form.title.trim())   { toast.error("Title is required");   return }
        if (!form.excerpt.trim()) { toast.error("Excerpt is required"); return }
        if (!form.content.trim()) { toast.error("Content is required"); return }
        setSaving(true)
        try {
            const tagsJson = form.tags.trim()
                ? JSON.stringify(form.tags.split(",").map(t => t.trim()).filter(Boolean))
                : undefined
            await api.admin.blog.create({ ...form, tags: tagsJson })
            setIsDirty(false)
            toast.success("Post created")
            router.push(withQs("/dashboard/blog"))
        } catch (err) {
            toast.error("Failed to create post", { description: err instanceof Error ? err.message : undefined })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="outline" size="icon"
                    onClick={() => router.push(withQs("/dashboard/blog"))}
                    className="border-2 shrink-0"
                >
                    <ArrowLeft size={18} />
                </Button>
                <h1 className="flex-1 text-xl font-bold" style={{ color: "#8B5E3C" }}>New Post</h1>
                <Button
                    onClick={handleSave} disabled={saving || uploadBusy}
                    className="text-white shrink-0"
                    style={{ backgroundColor: "#8B5E3C" }}
                >
                    <Save size={15} className="mr-1.5" />
                    {uploadBusy ? "Uploading…" : saving ? "Saving…" : "Save Post"}
                </Button>
            </div>

            {/* Title */}
            <input
                type="text"
                value={form.title}
                onChange={e => handleTitle(e.target.value)}
                placeholder="Article title…"
                className="w-full text-2xl sm:text-3xl font-bold text-gray-900 placeholder:text-gray-300 border-0 border-b-2 border-gray-200 focus:border-[#8B5E3C] focus:outline-none pb-3 bg-transparent transition-colors"
            />

            {/* Two-column layout */}
            <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

                {/* LEFT — Content editor */}
                <div className="space-y-4">
                    <div>
                        <Label className="mb-2 block text-sm font-semibold text-gray-700">
                            Excerpt <span className="font-normal text-gray-400">(shown in article cards)</span>
                        </Label>
                        <Textarea
                            value={form.excerpt}
                            onChange={e => set("excerpt", e.target.value)}
                            rows={3}
                            className="border-2 resize-none text-sm"
                            placeholder="A short 1–2 sentence summary of the article that will appear on the blog listing page."
                        />
                    </div>

                    <div>
                        <Label className="mb-2 block text-sm font-semibold text-gray-700">
                            Content <span className="font-normal text-gray-400">(Markdown — use the toolbar or type directly)</span>
                        </Label>
                        <MarkdownEditor
                            value={form.content}
                            onChange={v => set("content", v)}
                        />
                    </div>
                </div>

                {/* RIGHT — Settings */}
                <div className="rounded-xl border-2 border-gray-200 bg-white p-5 space-y-5 lg:sticky lg:top-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500">Post Settings</h3>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600">Status</Label>
                        <Select value={form.status} onValueChange={v => set("status", v)}>
                            <SelectTrigger className="border-2 h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600">Category</Label>
                        <Select value={form.category} onValueChange={v => set("category", v)}>
                            <SelectTrigger className="border-2 h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600">Tags <span className="font-normal text-gray-400">(comma separated)</span></Label>
                        <Input
                            value={form.tags}
                            onChange={e => set("tags", e.target.value)}
                            className="border-2 h-9 text-sm"
                            placeholder="Kenya, Wooden House, Naivasha"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600">Author</Label>
                        <Input value={form.author} onChange={e => set("author", e.target.value)} className="border-2 h-9 text-sm" />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600">Read Time (min)</Label>
                        <Input
                            type="number" min={1} max={60}
                            value={form.readTimeMinutes}
                            onChange={e => set("readTimeMinutes", Number(e.target.value))}
                            className="border-2 h-9 text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600">Slug</Label>
                        <Input
                            value={form.slug}
                            onChange={e => set("slug", e.target.value)}
                            className="border-2 h-9 text-sm font-mono"
                            placeholder="auto-generated-from-title"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox" id="featured-new"
                            checked={form.featured}
                            onChange={e => set("featured", e.target.checked)}
                            className="w-4 h-4 accent-[#8B5E3C]"
                        />
                        <Label htmlFor="featured-new" className="cursor-pointer text-sm">
                            Featured post
                        </Label>
                    </div>

                    <div className="space-y-1.5 pt-1">
                        <Label className="text-xs font-semibold text-gray-600">Cover Image</Label>
                        <ImageUpload
                            value={form.coverImage}
                            onChange={url => set("coverImage", url)}
                            onBusyChange={setUploadBusy}
                            folder="wooden-houses-kenya/blog"
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}
