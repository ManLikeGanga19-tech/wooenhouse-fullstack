"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, X, ChevronLeft, ChevronRight, Maximize2, ImageOff } from "lucide-react"
import Link from "next/link"
import { api, type Project } from "@/lib/api/client"

const CATEGORIES = [
    "All Projects",
    "Wooden Houses",
    "Commercial Buildings",
    "Furniture & Carpentry",
    "Outdoor Structures",
]

export default function ProjectsPage() {
    const [projects,        setProjects]        = useState<Project[]>([])
    const [loading,         setLoading]         = useState(true)
    const [activeCategory,  setActiveCategory]  = useState("All Projects")
    const [selected,        setSelected]        = useState<Project | null>(null)
    const [imageIndex,      setImageIndex]      = useState(0)

    useEffect(() => {
        api.projects.getAll()
            .then(r => setProjects(r.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const getImages = (p: Project): string[] => {
        const gallery: string[] = (() => {
            try { return JSON.parse(p.images) as string[]; } catch { return []; }
        })()
        if (p.coverImage && !gallery.includes(p.coverImage)) return [p.coverImage, ...gallery]
        return gallery.length ? gallery : (p.coverImage ? [p.coverImage] : [])
    }

    const filtered = activeCategory === "All Projects"
        ? projects
        : projects.filter(p => p.category === activeCategory)

    const nextImage = () => {
        if (!selected) return
        const imgs = getImages(selected)
        setImageIndex(i => (i + 1) % imgs.length)
    }
    const prevImage = () => {
        if (!selected) return
        const imgs = getImages(selected)
        setImageIndex(i => (i === 0 ? imgs.length - 1 : i - 1))
    }

    return (
        <div className="min-h-screen bg-white w-full max-w-full overflow-hidden">

            {/* PAGE HEADER */}
            <div className="relative w-full py-8 sm:py-12 border-b border-gray-200 overflow-hidden">
                <Image src="/projects/projects-header.jpg" alt="Projects" fill className="object-cover object-center" priority />
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3" style={{ color: "#C49A6C" }} data-aos="fade-down">
                        Our Projects &amp; Gallery
                    </h1>
                    <Breadcrumb>
                        <BreadcrumbList className="text-white/90 text-sm">
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/" className="hover:text-[#C49A6C] transition">Home</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="text-white/90" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/projects" className="text-[#C49A6C] font-medium">Projects</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">

                {/* INTRO */}
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16" data-aos="fade-up">
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                        Explore our portfolio of completed projects across Kenya. From residential wooden houses
                        to commercial buildings and custom carpentry, each project showcases our commitment to
                        quality, sustainability, and innovative design.
                    </p>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 sm:mb-20" data-aos="fade-up">
                    {[
                        { number: "37+",  label: "Completed Projects" },
                        { number: "56+",  label: "Happy Clients"      },
                        { number: "8+",   label: "Years Experience"   },
                        { number: "100%", label: "Satisfaction Rate"  },
                    ].map((stat, i) => (
                        <div key={i} className="text-center p-6 bg-gray-50 rounded-xl shadow-md border border-gray-100"
                            data-aos="zoom-in" data-aos-delay={300 + i * 100}>
                            <h3 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "#8B5E3C" }}>{stat.number}</h3>
                            <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* FILTER BUTTONS */}
                <div className="flex flex-wrap items-center gap-3 mb-12 justify-center" data-aos="fade-up">
                    {CATEGORIES.map((cat, i) => (
                        <Button key={cat} onClick={() => setActiveCategory(cat)} variant="outline"
                            className="px-4 sm:px-6 py-2 text-sm font-semibold border-2 transition-all hover:scale-105"
                            style={{
                                background:   activeCategory === cat ? "#8B5E3C" : "white",
                                color:        activeCategory === cat ? "white"   : "#8B5E3C",
                                borderColor:  "#8B5E3C",
                            }}
                            data-aos="zoom-in" data-aos-delay={i * 50}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                {/* PROJECTS GRID */}
                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="rounded-xl bg-gray-100 animate-pulse h-72" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <ImageOff size={40} className="mx-auto mb-3" />
                        <p>No projects in this category yet.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20">
                        {filtered.map((project, i) => {
                            const images = getImages(project)
                            const cover  = images[0]
                            return (
                                <div key={project.id}
                                    className="group bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
                                    data-aos="fade-up" data-aos-delay={i * 80}
                                    onClick={() => { setSelected(project); setImageIndex(0); }}
                                >
                                    <div className="relative w-full h-[220px] sm:h-60 overflow-hidden bg-gray-100">
                                        {cover ? (
                                            <Image src={cover} alt={project.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <ImageOff size={32} className="text-gray-300" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                            <Maximize2 size={40} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                        {project.featured && (
                                            <span className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">Featured</span>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        {project.category && (
                                            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#FFF5E6", color: "#8B5E3C" }}>
                                                {project.category}
                                            </span>
                                        )}
                                        <h3 className="text-lg font-bold text-gray-800 mt-2 mb-2 group-hover:text-[#8B5E3C] transition-colors">
                                            {project.title}
                                        </h3>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            {project.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} style={{ color: "#8B5E3C" }} />
                                                    <span>{project.location}</span>
                                                </div>
                                            )}
                                            {project.completedAt && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} style={{ color: "#8B5E3C" }} />
                                                    <span>{new Date(project.completedAt).getFullYear()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* CTA */}
                <div data-aos="fade-up" className="text-center py-16 sm:py-20">
                    <h3 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: "#8B5E3C" }}>Have a Project in Mind?</h3>
                    <p className="text-gray-600 text-base max-w-2xl mx-auto mb-8">
                        Let&apos;s discuss your vision and create something extraordinary together.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="px-8 py-6 text-base font-semibold shadow-lg hover:scale-105 transition-all" style={{ background: "#8B5E3C", color: "white" }}>
                            <Link href="/contact">Start Your Project</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="px-8 py-6 text-base font-semibold border-2 hover:scale-105 transition-all" style={{ borderColor: "#8B5E3C", color: "#8B5E3C" }}>
                            <Link href="/services">View Services</Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* LIGHTBOX */}
            {selected && (() => {
                const imgs = getImages(selected)
                return (
                    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                        <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all">
                                <X size={24} style={{ color: "#8B5E3C" }} />
                            </button>

                            <div className="relative h-[300px] sm:h-[420px] bg-gray-100">
                                {imgs[imageIndex] ? (
                                    <Image src={imgs[imageIndex]} alt={selected.title} fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="flex h-full items-center justify-center"><ImageOff size={48} className="text-gray-300" /></div>
                                )}
                                {imgs.length > 1 && (
                                    <>
                                        <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white">
                                            <ChevronLeft size={24} style={{ color: "#8B5E3C" }} />
                                        </button>
                                        <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white">
                                            <ChevronRight size={24} style={{ color: "#8B5E3C" }} />
                                        </button>
                                        <div className="absolute bottom-4 right-4 px-4 py-1 bg-black/70 text-white rounded-full text-sm">
                                            {imageIndex + 1} / {imgs.length}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-6 sm:p-8">
                                {selected.category && (
                                    <span className="text-sm font-semibold px-4 py-1.5 rounded-full" style={{ background: "#FFF5E6", color: "#8B5E3C" }}>
                                        {selected.category}
                                    </span>
                                )}
                                <h2 className="text-2xl sm:text-3xl font-bold mt-3 mb-4" style={{ color: "#8B5E3C" }}>{selected.title}</h2>
                                {selected.description && (
                                    <p className="text-gray-700 leading-relaxed mb-6">{selected.description}</p>
                                )}
                                <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-6">
                                    {selected.location && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={16} style={{ color: "#8B5E3C" }} />
                                            {selected.location}
                                        </div>
                                    )}
                                    {selected.completedAt && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={16} style={{ color: "#8B5E3C" }} />
                                            {new Date(selected.completedAt).getFullYear()}
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail strip */}
                                {imgs.length > 1 && (
                                    <div className="mb-6">
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {imgs.map((img, i) => (
                                                <button key={i} onClick={() => setImageIndex(i)}
                                                    className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${i === imageIndex ? "border-[#8B5E3C] scale-105" : "border-gray-200 hover:border-[#8B5E3C]"}`}
                                                >
                                                    <Image src={img} alt="" fill className="object-cover" unoptimized />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                                    <Button asChild className="flex-1 py-5 text-base font-semibold" style={{ background: "#8B5E3C", color: "white" }}>
                                        <Link href="/contact">Request Similar Project</Link>
                                    </Button>
                                    <Button asChild variant="outline" className="flex-1 py-5 text-base font-semibold border-2" style={{ borderColor: "#8B5E3C", color: "#8B5E3C" }}>
                                        <Link href="/services">View Services</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}
