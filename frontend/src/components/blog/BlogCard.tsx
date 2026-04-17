import Image from "next/image"
import Link from "next/link"
import { Clock, Calendar } from "lucide-react"
import { type BlogPost } from "@/lib/api/client"

type BlogCardPost = Omit<BlogPost, "content">

function formatDate(dateStr?: string) {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-KE", {
        day:   "numeric",
        month: "long",
        year:  "numeric",
    })
}

export default function BlogCard({ post }: { post: BlogCardPost }) {
    const tags: string[] = (() => {
        try { return post.tags ? JSON.parse(post.tags) : [] } catch { return [] }
    })()

    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white"
        >
            {/* Cover image */}
            <div className="relative w-full h-52 bg-gray-100 overflow-hidden">
                {post.coverImage ? (
                    <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-[#F5F0EB]">
                        <span className="text-4xl">🏡</span>
                    </div>
                )}
                {/* Category pill */}
                <div className="absolute top-3 left-3">
                    <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "#8B5E3C", color: "white" }}
                    >
                        {post.category}
                    </span>
                </div>
                {post.featured && (
                    <div className="absolute top-3 right-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                            Featured
                        </span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 p-5 gap-3">
                <h2 className="text-base font-bold text-gray-900 leading-snug group-hover:text-[#8B5E3C] transition-colors line-clamp-2">
                    {post.title}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">
                    {post.excerpt}
                </p>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#F5F0EB] text-[#8B5E3C] font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-100 mt-auto">
                    {post.publishedAt && (
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(post.publishedAt)}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.readTimeMinutes} min read
                    </span>
                </div>
            </div>
        </Link>
    )
}
