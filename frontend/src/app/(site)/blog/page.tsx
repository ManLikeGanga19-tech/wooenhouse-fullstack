import type { Metadata } from "next"
import BlogCard from "@/components/blog/BlogCard"
import { type BlogPost } from "@/lib/api/client"

export const metadata: Metadata = {
    title:       "Blog — Wooden Houses Kenya",
    description: "Insights, partner stories and practical guides on wooden construction in Kenya. From cost guides to real project stories with our partners across the country.",
    alternates:  { canonical: "/blog" },
    openGraph: {
        title:       "Blog — Wooden Houses Kenya",
        description: "Real stories, cost guides and insights on wooden houses in Kenya.",
        url:         "/blog",
        images:      [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

async function getPosts(): Promise<Omit<BlogPost, "content">[]> {
    try {
        const res = await fetch(`${API_URL}/api/blog?limit=50`, {
            next: { revalidate: 60 },
        })
        if (!res.ok) return []
        const data = await res.json()
        return data.posts ?? []
    } catch {
        return []
    }
}

const CATEGORIES = ["All", "Partner Stories", "Insights"]

export default async function BlogPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string }>
}) {
    const { category } = await searchParams
    const allPosts = await getPosts()

    const filtered = category && category !== "All"
        ? allPosts.filter(p => p.category === category)
        : allPosts

    const featured  = filtered.filter(p => p.featured)
    const rest      = filtered.filter(p => !p.featured)

    return (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

            {/* Header */}
            <div className="mb-10 sm:mb-12">
                <h1
                    className="text-3xl sm:text-4xl font-bold mb-3"
                    style={{ color: "#8B5E3C" }}
                >
                    Blog
                </h1>
                <p className="text-gray-600 text-base sm:text-lg max-w-2xl leading-relaxed">
                    Hadithi za kweli, mwongozo wa gharama na mawazo kuhusu ujenzi wa mbao Kenya.
                    Real stories, cost guides and insights on wooden construction in Kenya.
                </p>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-8 sm:mb-10">
                {CATEGORIES.map(cat => {
                    const isActive = (!category && cat === "All") || category === cat
                    return (
                        <a
                            key={cat}
                            href={cat === "All" ? "/blog" : `/blog?category=${encodeURIComponent(cat)}`}
                            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                            style={{
                                background: isActive ? "#8B5E3C" : "#F5F0EB",
                                color:      isActive ? "white"    : "#8B5E3C",
                            }}
                        >
                            {cat}
                        </a>
                    )
                })}
            </div>

            {/* Featured posts */}
            {featured.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-5">
                        Featured
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {featured.map(post => (
                            <BlogCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            )}

            {/* All posts */}
            {rest.length > 0 && (
                <div>
                    {featured.length > 0 && (
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-5">
                            More Articles
                        </h2>
                    )}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rest.map(post => (
                            <BlogCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="text-center py-24 text-gray-400">
                    <p className="text-lg font-medium">No articles yet in this category.</p>
                    <a href="/blog" className="mt-4 inline-block text-sm underline" style={{ color: "#8B5E3C" }}>
                        View all articles
                    </a>
                </div>
            )}

        </section>
    )
}
