import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Clock, Calendar, ArrowLeft, Tag } from "lucide-react"
import BlogPostContent from "./BlogPostContent"
import { type BlogPost } from "@/lib/api/client"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

async function getPost(slug: string): Promise<BlogPost | null> {
    try {
        const res = await fetch(`${API_URL}/api/blog/${slug}`, {
            next: { revalidate: 60 },
        })
        if (!res.ok) return null
        return res.json()
    } catch {
        return null
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const post = await getPost(slug)
    if (!post) return { title: "Article not found" }

    return {
        title:       `${post.title} — Wooden Houses Kenya`,
        description: post.excerpt,
        alternates:  { canonical: `/blog/${post.slug}` },
        openGraph: {
            title:       post.title,
            description: post.excerpt,
            url:         `/blog/${post.slug}`,
            type:        "article",
            publishedTime: post.publishedAt ?? undefined,
            authors:     [post.author],
            images:      post.coverImage ? [{ url: post.coverImage }] : [{ url: "/og-image.jpg" }],
        },
    }
}

function formatDate(dateStr?: string) {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-KE", {
        day:   "numeric",
        month: "long",
        year:  "numeric",
    })
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const post = await getPost(slug)
    if (!post) notFound()

    const tags: string[] = (() => {
        try { return post.tags ? JSON.parse(post.tags) : [] } catch { return [] }
    })()

    const articleJsonLd = {
        "@context":       "https://schema.org",
        "@type":          "Article",
        headline:         post.title,
        description:      post.excerpt,
        image:            post.coverImage ?? "https://woodenhouseskenya.com/og-image.jpg",
        datePublished:    post.publishedAt,
        dateModified:     post.updatedAt,
        author: {
            "@type": "Organization",
            name:    post.author,
            url:     "https://woodenhouseskenya.com",
        },
        publisher: {
            "@type": "Organization",
            "@id":   "https://woodenhouseskenya.com/#organization",
            name:    "Wooden Houses Kenya",
            logo: {
                "@type": "ImageObject",
                url:     "https://woodenhouseskenya.com/woodenhouse-logo.jpg",
            },
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id":   `https://woodenhouseskenya.com/blog/${post.slug}`,
        },
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
            />

            <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

                {/* Back link */}
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 hover:underline"
                    style={{ color: "#8B5E3C" }}
                >
                    <ArrowLeft size={15} />
                    Back to Blog
                </Link>

                {/* Category & meta */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: "#8B5E3C", color: "white" }}
                    >
                        {post.category}
                    </span>
                    {post.publishedAt && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar size={12} />
                            {formatDate(post.publishedAt)}
                        </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        {post.readTimeMinutes} min read
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-5">
                    {post.title}
                </h1>

                {/* Excerpt */}
                <p className="text-lg text-gray-600 leading-relaxed mb-8 italic border-l-4 pl-4" style={{ borderColor: "#C49A6C" }}>
                    {post.excerpt}
                </p>

                {/* Cover image */}
                {post.coverImage && (
                    <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden mb-10 shadow-md">
                        <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 768px"
                        />
                    </div>
                )}

                {/* Markdown content — client component for react-markdown */}
                <BlogPostContent content={post.content ?? ""} />

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-gray-100">
                        <Tag size={14} className="text-gray-400 mt-0.5" />
                        {tags.map(tag => (
                            <span
                                key={tag}
                                className="text-xs px-2.5 py-1 rounded-full font-medium"
                                style={{ background: "#F5F0EB", color: "#8B5E3C" }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <div
                    className="mt-12 rounded-2xl p-6 sm:p-8 text-white"
                    style={{ background: "#8B5E3C" }}
                >
                    <h3 className="text-xl font-bold mb-2">Una mradi akilini?</h3>
                    <p className="text-white/85 mb-5 text-sm sm:text-base">
                        Tuna uzoefu wa miaka mingi kujenga kote Kenya. Piga simu au tuandike leo na tutakujibu haraka.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-block px-5 py-2.5 rounded-lg font-semibold text-sm bg-white hover:bg-gray-100 transition-colors"
                        style={{ color: "#8B5E3C" }}
                    >
                        Get a Free Quote
                    </Link>
                </div>

            </article>
        </>
    )
}
