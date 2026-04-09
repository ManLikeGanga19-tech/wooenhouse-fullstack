import { Suspense } from "react";
import DashboardLayoutClient from "./DashboardLayoutClient";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <LoadingSpinner size="lg" text="Loading..." />
                </div>
            }
        >
            <DashboardLayoutClient>{children}</DashboardLayoutClient>
        </Suspense>
    );
}
