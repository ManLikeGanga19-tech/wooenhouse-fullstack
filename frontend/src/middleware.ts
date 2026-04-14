import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const host = request.headers.get("host") ?? "";
    const pathname = request.nextUrl.pathname;

    // Route admin.woodenhouseskenya.com → /dashboard/*
    if (host.startsWith("admin.")) {
        // Already on a /dashboard path — let it through
        if (pathname.startsWith("/dashboard") || pathname.startsWith("/login")) {
            return NextResponse.next();
        }
        // Root of admin subdomain → redirect to dashboard
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
