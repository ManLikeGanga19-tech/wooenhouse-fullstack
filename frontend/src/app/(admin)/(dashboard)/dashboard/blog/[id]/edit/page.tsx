"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Save, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import MarkdownEditor from "@/components/blog/MarkdownEditor"
import { api, type BlogPost } from "@/lib/api/client"
import { toast } from "sonner"

const CATEGORIES = ["Partner Stories", "Insights", "News", "Tips & Guides"]

export default function EditBlogPostPage() {
    const router       = useRouter()
    const params       = useParams()
    const searchParams = useSearchParams()
    const id           = params.id as string
    const qs           = searchParams.toString()
    const withQs       = (p: string) => qs ? `${p}?${qs}` : p

    const [loading,     setLoading]     = useState(true)
    const [saving,      setSaving]      = useState(false)
    const [uploadBusy,  setUploadBusy]  = useState(false)
    const [isDirty,     setIsDirty]     = useState(false)
    const savedRef = useRef(false)
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

    useEffect(() => {
        api.admin.blog.getById(id)
            .then(r => {
                const post = r.data as BlogPost
                const tagsFlat = (() => {
                    try { return post.tags ? (JSON.parse(post.tags) as string[]).join(", ") : "" } catch { return "" }
                })()
                setForm({
                    title:           post.title           ?? "",
                    slug:            post.slug            ?? "",
                    excerpt:         post.excerpt         ?? "",
                    content:         post.content         ?? "",
                    coverImage:      post.coverImage      ?? "",
                    category:        post.category        ?? "Insights",
                    author:          post.author          ?? "Wooden Houses Kenya",
                    tags:            tagsFlat,
                    readTimeMinutes: post.readTimeMinutes ?? 5,
                    featured:        post.featured        ?? false,
                    status:          post.status          ?? "draft",
                })
            })
            .catch(() => toast.error("Failed to load post"))
            .finally(() => setLoading(false))
    }, [id])

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

    const handleSave = async () => {
        if (!form.title.trim())   { toast.error("Title is required");   return }
        if (!form.excerpt.trim()) { toast.error("Excerpt is required"); return }
        if (!form.content.trim()) { toast.error("Content is required"); return }
        setSaving(true)
        try {
            const tagsJson = form.tags.trim()
                ? JSON.stringify(form.tags.split(",").map(t => t.trim()).filter(Boolean))
                : undefined
            await api.admin.blog.update(id, { ...form, tags: tagsJson })
            savedRef.current = true
            setIsDirty(false)
            toast.success("Post saved")
            router.push(withQs("/dashboard/blog"))
        } catch (err) {
            toast.error("Failed to save post", { description: err instanceof Error ? err.message : undefined })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-gray-100 rounded-lg w-1/2" />
                <div className="h-12 bg-gray-100 rounded-lg" />
                <div className="h-96 bg-gray-100 rounded-xl" />
            </div>
        )
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
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold truncate" style={{ color: "#8B5E3C" }}>Edit Post</h1>
                </div>
                {form.slug && form.status === "published" && (
                    <Button
                        variant="outline" size="sm"
                        className="border-2 text-xs hidden sm:flex"
                        onClick={() => window.open(`/blog/${form.slug}`, "_blank")}
                    >
                        <ExternalLink size={13} className="mr-1" /> View Live
                    </Button>
                )}
                <Button
                    onClick={handleSave} disabled={saving || uploadBusy}
                    className="text-white shrink-0"
                    style={{ backgroundColor: "#8B5E3C" }}
                >
                    <Save size={15} className="mr-1.5" />
                    {uploadBusy ? "Uploading…" : saving ? "Saving…" : "Save Changes"}
                </Button>
            </div>

            {/* Title */}
            <input
                type="text"
                value={form.title}
                onChange={e => set("title", e.target.value)}
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
                            placeholder="A short 1–2 sentence summary of the article."
                        />
                    </div>

                    <div>
                        <Label className="mb-2 block text-sm font-semibold text-gray-700">
                            Content <span className="font-normal text-gray-400">(use the toolbar to format, or switch to Preview to see how it looks)</span>
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
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox" id="featured-edit"
                            checked={form.featured}
                            onChange={e => set("featured", e.target.checked)}
                            className="w-4 h-4 accent-[#8B5E3C]"
                        />
                        <Label htmlFor="featured-edit" className="cursor-pointer text-sm">
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
