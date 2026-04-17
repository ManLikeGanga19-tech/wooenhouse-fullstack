"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api, type BlogPost } from "@/lib/api/client"
import { toast } from "sonner"
import { format } from "date-fns"

type BlogListItem = Omit<BlogPost, "content" | "excerpt">

export default function AdminBlogPage() {
    const router       = useRouter()
    const searchParams = useSearchParams()
    const qs           = searchParams.toString()
    const withQs       = (p: string) => qs ? `${p}?${qs}` : p

    const [posts,   setPosts]   = useState<BlogListItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.admin.blog.getAll()
            .then(r => setPosts(r.data as BlogListItem[]))
            .catch(() => toast.error("Failed to load blog posts"))
            .finally(() => setLoading(false))
    }, [])

    const handleDelete = (id: string, title: string) => {
        toast(`Delete "${title}"?`, {
            description: "This cannot be undone.",
            action:  { label: "Delete", onClick: () => confirmDelete(id) },
            cancel:  { label: "Cancel", onClick: () => {} },
        })
    }

    const confirmDelete = async (id: string) => {
        try {
            await api.admin.blog.delete(id)
            setPosts(prev => prev.filter(p => p.id !== id))
            toast.success("Post deleted")
        } catch {
            toast.error("Failed to delete post")
        }
    }

    const toggleStatus = async (post: BlogListItem) => {
        const newStatus = post.status === "published" ? "draft" : "published"
        try {
            await api.admin.blog.update(post.id, { ...post, status: newStatus } as Partial<BlogPost>)
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p))
            toast.success(newStatus === "published" ? "Post published" : "Post set to draft")
        } catch {
            toast.error("Failed to update status")
        }
    }

    const toggleFeatured = async (post: BlogListItem) => {
        const featured = !post.featured
        try {
            await api.admin.blog.update(post.id, { ...post, featured } as Partial<BlogPost>)
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, featured } : p))
            toast.success(featured ? "Marked as featured" : "Removed from featured")
        } catch {
            toast.error("Failed to update")
        }
    }

    const published = posts.filter(p => p.status === "published").length
    const featured  = posts.filter(p => p.featured).length

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "#8B5E3C" }}>Blog</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {posts.length} total · {published} published · {featured} featured
                    </p>
                </div>
                <Button
                    onClick={() => router.push(withQs("/dashboard/blog/new"))}
                    className="text-white"
                    style={{ backgroundColor: "#8B5E3C" }}
                >
                    <Plus size={16} className="mr-2" /> New Post
                </Button>
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
                    <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No blog posts yet</p>
                    <p className="text-gray-400 text-sm mt-1 mb-4">Write your first article</p>
                    <Button onClick={() => router.push(withQs("/dashboard/blog/new"))} style={{ backgroundColor: "#8B5E3C" }} className="text-white">
                        <Plus size={16} className="mr-2" /> New Post
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {posts.map(post => (
                        <div
                            key={post.id}
                            className="flex items-center gap-4 rounded-xl border-2 border-gray-200 bg-white p-4"
                        >
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-gray-900 truncate">{post.title}</span>
                                    <Badge variant="secondary" className="text-xs shrink-0">{post.category}</Badge>
                                    {post.featured && (
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                                            Featured
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                    <span
                                        className="font-medium"
                                        style={{ color: post.status === "published" ? "#059669" : "#6B7280" }}
                                    >
                                        {post.status}
                                    </span>
                                    {post.publishedAt && (
                                        <span>{format(new Date(post.publishedAt), "d MMM yyyy")}</span>
                                    )}
                                    <span>{post.readTimeMinutes} min read</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    size="sm" variant="outline"
                                    className="border-2 text-xs px-3"
                                    onClick={() => router.push(withQs(`/dashboard/blog/${post.id}/edit`))}
                                >
                                    <Pencil size={13} className="mr-1" /> Edit
                                </Button>
                                <Button
                                    size="sm" variant="ghost"
                                    title={post.status === "published" ? "Set to draft" : "Publish"}
                                    onClick={() => toggleStatus(post)}
                                >
                                    {post.status === "published"
                                        ? <EyeOff size={15} className="text-gray-500" />
                                        : <Eye    size={15} className="text-green-600" />
                                    }
                                </Button>
                                <Button
                                    size="sm" variant="ghost"
                                    title={post.featured ? "Remove from featured" : "Mark as featured"}
                                    onClick={() => toggleFeatured(post)}
                                >
                                    <Star size={15} className={post.featured ? "fill-amber-400 text-amber-400" : "text-gray-400"} />
                                </Button>
                                <Button
                                    size="sm" variant="ghost"
                                    title="Delete post"
                                    onClick={() => handleDelete(post.id, post.title)}
                                >
                                    <Trash2 size={15} className="text-red-400" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
