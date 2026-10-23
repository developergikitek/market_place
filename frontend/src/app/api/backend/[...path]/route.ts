import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const DJANGO_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const pathSegments = path || [];
    const pathStr = pathSegments.join("/");

    // Ensure trailing slash for Django REST Framework routing
    const normalizedPath = pathStr.endsWith("/") ? pathStr : `${pathStr}/`;

    const requestUrl = new URL(request.url);
    const searchParams = requestUrl.search;

    const targetUrl = `${DJANGO_API_URL}/api/${normalizedPath}${searchParams}`;

    // Read access token from cookie
    const cookieStore = await cookies();
    let token = cookieStore.get("access_token")?.value;

    const headers = new Headers();

    // Forward Content-Type if present
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers.set("content-type", contentType);
    }

    // Forward Accept header
    const accept = request.headers.get("accept");
    if (accept) {
      headers.set("accept", accept);
    }

    // Attach Authorization header automatically from cookie or fallback to incoming header
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      const incomingAuth = request.headers.get("authorization");
      if (incomingAuth) {
        headers.set("Authorization", incomingAuth);
      }
    }

    const init: RequestInit = {
      method: request.method,
      headers: headers,
    };

    // Forward request body for mutation methods
    if (request.method !== "GET" && request.method !== "HEAD") {
      const bodyBlob = await request.blob();
      if (bodyBlob.size > 0) {
        init.body = bodyBlob;
      }
    }

    let backendRes = await fetch(targetUrl, init);

    // =========================================================================
    // 🔄 SILENT RETRY: If 401 Unauthorized, attempt background token refresh
    // =========================================================================
    if (backendRes.status === 401) {
      const refreshToken = cookieStore.get("refresh_token")?.value;
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${DJANGO_API_URL}/api/auth/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.access;
            const newRefreshToken = refreshData.refresh;

            if (newAccessToken) {
              // 1. Update access_token in cookie store
              cookieStore.set("access_token", newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24, // 1 day
              });

              if (newRefreshToken) {
                cookieStore.set("refresh_token", newRefreshToken, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  path: "/",
                  maxAge: 60 * 60 * 24 * 30, // 30 days
                });
              }

              // 2. Silently retry the original request with the new access token
              headers.set("Authorization", `Bearer ${newAccessToken}`);
              init.headers = headers;
              backendRes = await fetch(targetUrl, init);
            }
          } else {
            // Refresh token has also expired/invalidated - clean up stale session cookies
            cookieStore.delete("access_token");
            cookieStore.delete("refresh_token");
            cookieStore.delete("makaano_seller_logged_in");
          }
        } catch (refreshErr) {
          console.warn("[BFF Silent Refresh Failed]:", refreshErr);
        }
      }
    }

    const dataBlob = await backendRes.blob();
    const finalResponse = new NextResponse(dataBlob, {
      status: backendRes.status,
      statusText: backendRes.statusText,
    });

    const resContentType = backendRes.headers.get("content-type");
    if (resContentType) {
      finalResponse.headers.set("content-type", resContentType);
    }

    return finalResponse;
  } catch (error: any) {
    console.error("[BFF Universal Proxy Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to service. Please try again shortly.",
      },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
