// src/components/layout/Header.tsx
"use client";

import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useUIStore } from "@/lib/store/uiStore";
import NotificationBell from "@/components/layout/NotificationBell";
import InstallPWA from "@/components/admin/InstallPWA";
import Image from "next/image";

interface HeaderProps {
    title?: string;
}

export default function Header({ title }: HeaderProps) {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const logout       = useAuthStore((state) => state.logout);
    const user         = useAuthStore((state) => state.user);
    const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

    const qs = searchParams.toString();

    const handleLogout = () => {
        logout();
        router.push(qs ? `/login?${qs}` : "/login");
    };

    return (
        <header
            className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 md:px-6"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
            {/* Mobile logo — visible only when sidebar is hidden */}
            <div className="flex md:hidden items-center gap-2">
                <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 overflow-hidden"
                    style={{ backgroundColor: "#8B5E3C" }}
                >
                    <Image
                        src="/woodenhouse-logo.jpg"
                        alt="WoodenHouses"
                        width={36}
                        height={36}
                        className="object-contain"
                        priority
                    />
                </div>
                <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold" style={{ color: "#8B5E3C" }}>WoodenHouses</span>
                    <span className="text-[10px] text-gray-400 leading-none">Admin Panel</span>
                </div>
            </div>

            {/* Page title - desktop only */}
            {title && (
                <h1 className="text-lg md:text-xl font-semibold text-gray-900 hidden md:block">
                    {title}
                </h1>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* PWA install prompt */}
            <InstallPWA />

            {/* Notifications */}
            <NotificationBell />

            {/* User menu - Hidden on mobile, logout moved to sidebar */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="hidden md:flex items-center gap-2">
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-semibold"
                            style={{ backgroundColor: "#C49A6C" }}
                        >
                            {user?.name?.charAt(0) || "A"}
                        </div>
                        <span className="hidden lg:inline-block text-sm font-medium">
                            {user?.name || "Admin"}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium">{user?.name || "Admin User"}</p>
                            <p className="text-xs text-gray-500">{user?.email || "admin@woodenhouses.co.ke"}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                        <User size={16} className="mr-2" />
                        Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                        <LogOut size={16} className="mr-2" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}