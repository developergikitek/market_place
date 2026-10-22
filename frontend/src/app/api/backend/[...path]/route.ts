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
    const token = cookieStore.get("access_token")?.value;

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

    const backendRes = await fetch(targetUrl, init);

    const dataBlob = await backendRes.blob();
    const responseHeaders = new Headers();
    const resContentType = backendRes.headers.get("content-type");
    if (resContentType) {
      responseHeaders.set("content-type", resContentType);
    }

    return new NextResponse(dataBlob, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("[BFF Universal Proxy Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to proxy request to backend service. Please ensure backend is running.",
        error: error?.message,
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
