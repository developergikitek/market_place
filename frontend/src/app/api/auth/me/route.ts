import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DJANGO_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let res: Response | null = null;

    if (accessToken) {
      res = await fetch(`${DJANGO_API_URL}/api/auth/me/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    // If access token was missing or expired (401), attempt silent refresh
    if (!res || res.status === 401) {
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

              // Retry fetch with new access token
              res = await fetch(`${DJANGO_API_URL}/api/auth/me/`, {
                headers: {
                  Authorization: `Bearer ${newAccessToken}`,
                },
              });
            }
          } else {
            // Both tokens invalid - clear stale cookies
            cookieStore.delete("access_token");
            cookieStore.delete("refresh_token");
            cookieStore.delete("makaano_seller_logged_in");
            return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
          }
        } catch (refreshErr) {
          console.warn("[BFF /api/auth/me Silent Refresh Failed]:", refreshErr);
          return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
        }
      } else {
        return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
      }
    }

    if (!res || !res.ok) {
      return NextResponse.json({ authenticated: false, user: null }, { status: res?.status || 401 });
    }

    const userData = await res.json();
    return NextResponse.json({ authenticated: true, user: userData });
  } catch (error) {
    console.error("[BFF Auth Me Error]:", error);
    return NextResponse.json({ authenticated: false, error: "Internal server error" }, { status: 500 });
  }
}
