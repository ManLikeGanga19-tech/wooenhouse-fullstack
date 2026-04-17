"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
    LayoutDashboard, Users, Mail, FileText,
    MoreHorizontal, FolderOpen, Wrench, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuthStore } from "@/lib/store/authStore";
import { Separator } from "@/components/ui/separator";

const PRIMARY_TABS = [
    { name: "Home",       href: "/dashboard",            icon: LayoutDashboard },
    { name: "Contacts",   href: "/dashboard/contacts",   icon: Users           },
    { name: "Newsletter", href: "/dashboard/newsletter", icon: Mail            },
    { name: "Quotes",     href: "/dashboard/quotes",     icon: FileText        },
];

const MORE_ITEMS = [
    { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
    { name: "Services", href: "/dashboard/services", icon: Wrench     },
    { name: "Settings", href: "/dashboard/settings", icon: Settings   },
];

export default function BottomTabBar() {
    const pathname     = usePathname();
    const searchParams = useSearchParams();
    const router       = useRouter();
    const logout       = useAuthStore((s) => s.logout);
    const user         = useAuthStore((s) => s.user);
    const [moreOpen, setMoreOpen] = useState(false);

    const qs     = searchParams.toString();
    const withQs = (path: string) => (qs ? `${path}?${qs}` : path);

    const isMoreActive = MORE_ITEMS.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );

    const handleLogout = () => {
        logout();
        router.push(withQs("/login"));
        setMoreOpen(false);
    };

    return (
        <>
            {/* ── Bottom nav bar (mobile only) ───────────────────────────────── */}
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 flex items-stretch"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                {PRIMARY_TABS.map((tab) => {
                    const isActive =
                        pathname === tab.href ||
                        (tab.href !== "/dashboard" && pathname.startsWith(tab.href + "/"));
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.name}
                            href={withQs(tab.href)}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-[3px] py-2 text-[10px] font-medium min-h-[56px] transition-colors select-none",
                                isActive ? "text-[#8B5E3C]" : "text-gray-400"
                            )}
                        >
                            <Icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 1.75}
                                className={cn("transition-transform", isActive && "scale-110")}
                            />
                            {tab.name}
                        </Link>
                    );
                })}

                {/* More button */}
                <button
                    onClick={() => setMoreOpen(true)}
                    className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-[3px] py-2 text-[10px] font-medium min-h-[56px] transition-colors select-none",
                        isMoreActive ? "text-[#8B5E3C]" : "text-gray-400"
                    )}
                >
                    <MoreHorizontal size={22} strokeWidth={isMoreActive ? 2.5 : 1.75} />
                    More
                </button>
            </nav>

            {/* ── "More" bottom sheet ─────────────────────────────────────────── */}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0 max-h-[85vh]">
                    <VisuallyHidden>
                        <SheetTitle>More Options</SheetTitle>
                    </VisuallyHidden>

                    {/* Drag handle */}
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="h-1 w-10 rounded-full bg-gray-300" />
                    </div>

                    {/* User info */}
                    <div className="flex items-center gap-3 px-5 py-3">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-semibold shrink-0"
                            style={{ backgroundColor: "#C49A6C" }}
                        >
                            {user?.name?.charAt(0) ?? "A"}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{user?.name ?? "Admin User"}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email ?? ""}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* More nav items */}
                    <div className="py-1">
                        {MORE_ITEMS.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                pathname.startsWith(item.href + "/");
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={withQs(item.href)}
                                    onClick={() => setMoreOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-5 py-4 text-base font-medium transition-colors active:bg-gray-50",
                                        isActive
                                            ? "text-[#8B5E3C] bg-[#F5F0EB]"
                                            : "text-gray-800"
                                    )}
                                >
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>

                    <Separator />

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-4 px-5 py-4 text-base font-medium text-red-600 active:bg-red-50"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>

                    {/* Safe area spacer */}
                    <div style={{ height: "env(safe-area-inset-bottom)" }} />
                </SheetContent>
            </Sheet>
        </>
    );
}
