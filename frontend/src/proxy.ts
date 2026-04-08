import { NextRequest, NextResponse } from "next/server";

const ADMIN_DOMAIN = "admin.woodenhouseskenya.com";
const SITE_DOMAIN = "woodenhouseskenya.com";

// Paths that belong exclusively to the admin panel
const ADMIN_PATHS = ["/login", "/dashboard"];
// Paths that belong exclusively to the public site
const SITE_PATHS = ["/", "/about", "/services", "/projects", "/contact"];

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Detect which domain is being used.
  // In local dev: use ?_admin=1 OR the wh_is_admin cookie (set on login).
  // The cookie approach means ?_admin=1 is only needed once (on the login URL).
  // After logging in, all admin navigation works without the query param.
  const isAdminDomain =
    hostname === ADMIN_DOMAIN ||
    hostname.startsWith("admin.") ||
    request.nextUrl.searchParams.get("_admin") === "1" ||
    request.cookies.get("wh_is_admin")?.value === "1";

  const isSiteDomain =
    hostname === SITE_DOMAIN ||
    hostname === `www.${SITE_DOMAIN}` ||
    (!isAdminDomain && !hostname.startsWith("admin."));

  // Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // static files (images, icons, etc.)
  ) {
    return NextResponse.next();
  }

  // --- Admin domain rules ---
  if (isAdminDomain) {
    // Admin domain root → redirect to login
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Block site-only paths on admin domain
    if (SITE_PATHS.filter((p) => p !== "/").some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // --- Site domain rules ---
  if (isSiteDomain) {
    // Block admin paths on the public site domain
    if (ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
