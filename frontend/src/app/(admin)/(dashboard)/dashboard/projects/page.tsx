"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, type Project } from "@/lib/api/client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminProjectsPage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const withQs       = (p: string) => qs ? `${p}?${qs}` : p;

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        api.admin.projects.getAll()
            .then(r => setProjects(r.data))
            .catch(() => toast.error("Failed to load projects"))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try {
            await api.admin.projects.delete(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            toast.success("Project deleted");
        } catch {
            toast.error("Failed to delete project");
        }
    };

    const toggleStatus = async (project: Project) => {
        const newStatus = project.status === "published" ? "draft" : "published";
        try {
            await api.admin.projects.update(project.id, { ...project, status: newStatus });
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: newStatus } : p));
            toast.success(`Project ${newStatus === "published" ? "published" : "set to draft"}`);
        } catch {
            toast.error("Failed to update status");
        }
    };

    const toggleFeatured = async (project: Project) => {
        const featured = !project.featured;
        try {
            await api.admin.projects.update(project.id, { ...project, featured });
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, featured } : p));
            toast.success(featured ? "Marked as featured" : "Removed from featured");
        } catch {
            toast.error("Failed to update");
        }
    };

    const published = projects.filter(p => p.status === "published").length;
    const featured  = projects.filter(p => p.featured).length;

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "#8B5E3C" }}>Projects</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {projects.length} total · {published} published · {featured} featured
                    </p>
                </div>
                <Button
                    onClick={() => router.push(withQs("/dashboard/projects/new"))}
                    className="text-white"
                    style={{ backgroundColor: "#8B5E3C" }}
                >
                    <Plus size={16} className="mr-2" /> New Project
                </Button>
            </div>

            {/* Projects grid */}
            {projects.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
                    <ImageOff size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No projects yet</p>
                    <p className="text-gray-400 text-sm mt-1 mb-4">Add your first project to showcase on the website</p>
                    <Button onClick={() => router.push(withQs("/dashboard/projects/new"))} style={{ backgroundColor: "#8B5E3C" }} className="text-white">
                        <Plus size={16} className="mr-2" /> Add Project
                    </Button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {projects.map(project => {
                        const images = (() => {
                            try { return JSON.parse(project.images) as string[]; } catch { return []; }
                        })();
                        const cover = project.coverImage || images[0] || null;

                        return (
                            <div key={project.id} className="rounded-xl border-2 border-gray-200 bg-white overflow-hidden flex flex-col">
                                {/* Thumbnail */}
                                <div className="relative h-44 bg-gray-100">
                                    {cover ? (
                                        <Image src={cover} alt={project.title} fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <ImageOff size={32} className="text-gray-300" />
                                        </div>
                                    )}
                                    {/* Status badges overlay */}
                                    <div className="absolute top-2 left-2 flex gap-1.5">
                                        <span
                                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                            style={{
                                                background: project.status === "published" ? "#D1FAE5" : "#F3F4F6",
                                                color:      project.status === "published" ? "#065F46" : "#6B7280",
                                            }}
                                        >
                                            {project.status}
                                        </span>
                                        {project.featured && (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                    {/* Image count */}
                                    {images.length > 1 && (
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                                            {images.length} photos
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4 flex-1 flex flex-col gap-2">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 truncate">{project.title}</h3>
                                            {project.category && (
                                                <Badge variant="secondary" className="mt-1 text-xs">{project.category}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    {project.location && (
                                        <p className="text-xs text-gray-500 truncate">{project.location}</p>
                                    )}
                                    {project.completedAt && (
                                        <p className="text-xs text-gray-400">
                                            Completed {format(new Date(project.completedAt), "MMM yyyy")}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-gray-100">
                                        <Button
                                            size="sm" variant="outline"
                                            className="flex-1 border-2 text-xs"
                                            onClick={() => router.push(withQs(`/dashboard/projects/${project.id}/edit`))}
                                        >
                                            <Pencil size={13} className="mr-1" /> Edit
                                        </Button>
                                        <Button
                                            size="sm" variant="ghost"
                                            title={project.status === "published" ? "Set to draft" : "Publish"}
                                            onClick={() => toggleStatus(project)}
                                        >
                                            {project.status === "published"
                                                ? <EyeOff size={15} className="text-gray-500" />
                                                : <Eye    size={15} className="text-green-600" />
                                            }
                                        </Button>
                                        <Button
                                            size="sm" variant="ghost"
                                            title={project.featured ? "Remove from featured" : "Mark as featured"}
                                            onClick={() => toggleFeatured(project)}
                                        >
                                            <Star size={15} className={project.featured ? "fill-amber-400 text-amber-400" : "text-gray-400"} />
                                        </Button>
                                        <Button
                                            size="sm" variant="ghost"
                                            title="Delete project"
                                            onClick={() => handleDelete(project.id, project.title)}
                                        >
                                            <Trash2 size={15} className="text-red-400" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
