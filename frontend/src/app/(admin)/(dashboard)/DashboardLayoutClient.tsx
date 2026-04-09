"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const router                                        = useRouter();
    const searchParams                                  = useSearchParams();
    const { isAuthenticated, isLoading, checkSession } = useAuthStore();

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            const qs = searchParams.toString();
            router.replace(`/login${qs ? `?${qs}` : ""}`);
        }
    }, [isLoading, isAuthenticated, router, searchParams]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner size="lg" text="Verifying session..." />
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
