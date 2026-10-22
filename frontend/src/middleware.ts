import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const hasToken = Boolean(accessToken || refreshToken);

  // 1. Protected Portal Routes: /portal, /portal/*
  if (pathname.startsWith("/portal")) {
    if (!hasToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Auth Pages: /login, /signup -> if already logged in, redirect to portal dashboard
  if (pathname === "/login" || pathname === "/signup") {
    if (hasToken) {
      const dashboardUrl = new URL("/portal/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled by Next.js API route handlers)
     */
    "/portal/:path*",
    "/login",
    "/signup",
  ],
};
