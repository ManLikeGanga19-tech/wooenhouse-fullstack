// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Mail,
    FileText,
    Settings,
    FolderOpen,
    Wrench,
    BookOpen,
    LogOut,
    Inbox,
    MailOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/uiStore";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

const navigation = [
    { name: "Dashboard", href: "/dashboard",            icon: LayoutDashboard },
    { name: "Contacts",  href: "/dashboard/contacts",   icon: Users           },
    { name: "Newsletter",href: "/dashboard/newsletter", icon: Mail            },
    { name: "Quotes",    href: "/dashboard/quotes",     icon: FileText        },
    { name: "Projects",  href: "/dashboard/projects",   icon: FolderOpen      },
    { name: "Services",  href: "/dashboard/services",   icon: Wrench          },
    { name: "Blog",      href: "/dashboard/blog",       icon: BookOpen        },
    { name: "Mailbox",    href: "/dashboard/emails",      icon: Inbox           },
    { name: "Email Logs", href: "/dashboard/email-logs", icon: MailOpen        },
    { name: "Settings",   href: "/dashboard/settings",   icon: Settings        },
];

// Sidebar Content Component (shared between desktop and mobile)
function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
    const pathname     = usePathname();
    const searchParams = useSearchParams();
    const router       = useRouter();
    const logout       = useAuthStore((state) => state.logout);
    const user         = useAuthStore((state) => state.user);

    const qs = searchParams.toString();
    const withQs = (path: string) => qs ? `${path}?${qs}` : path;

    const handleLogout = () => {
        logout();
        router.push(withQs("/login"));
        if (onLinkClick) onLinkClick();
    };

    return (
        <div className="flex h-full w-full flex-col bg-white">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "#8B5E3C" }}
                >
                    <Image
                        src="/woodenhouse-logo.jpg"
                        alt="WoodenHouses Logo"
                        width={56}
                        height={56}
                        className="object-contain"
                        priority
                    />                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-bold" style={{ color: "#8B5E3C" }}>
                        WoodenHouses
                    </span>
                    <span className="text-xs text-gray-500">Admin Panel</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={withQs(item.href)}
                            onClick={onLinkClick}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                isActive
                                    ? "text-white shadow-md"
                                    : "text-gray-700 hover:bg-gray-100"
                            )}
                            style={isActive ? { backgroundColor: "#8B5E3C" } : {}}
                        >
                            <Icon size={20} />
                            <span className="flex-1">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <Separator />

            {/* User Info & Logout */}
            <div className="p-4 space-y-3">
                {/* User Info */}
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-semibold shrink-0"
                        style={{ backgroundColor: "#C49A6C" }}
                    >
                        {user?.name?.charAt(0) || "AD"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.name || "Admin User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {user?.email || "admin@woodenhouses.co.ke"}
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full justify-start border-2 hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut size={16} className="mr-2" />
                    Logout
                </Button>
            </div>
        </div>
    );
}

// Desktop Sidebar (always visible on large screens)
function DesktopSidebar() {
    return (
        <aside className="hidden md:flex h-full w-64 flex-col border-r border-gray-200 bg-white">
            <SidebarContent />
        </aside>
    );
}

// Mobile Sidebar (Sheet/Drawer)
function MobileSidebar() {
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);
    const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

    return (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-64 p-0">
                <VisuallyHidden>
                    <SheetTitle>Navigation Menu</SheetTitle>
                </VisuallyHidden>
                <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}

// Main Sidebar Component
export default function Sidebar() {
    return (
        <>
            {/* Desktop: Always visible */}
            <DesktopSidebar />

            {/* Mobile: Sheet that opens on demand */}
            <MobileSidebar />
        </>
    );
}