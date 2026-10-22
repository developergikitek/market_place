import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DJANGO_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "No refresh token available." },
        { status: 401 }
      );
    }

    const res = await fetch(`${DJANGO_API_URL}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await res.json();

    if (!res.ok || !data.access) {
      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
      cookieStore.delete("makaano_seller_logged_in");
      return NextResponse.json(
        { success: false, message: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    cookieStore.set("access_token", data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    if (data.refresh) {
      cookieStore.set("refresh_token", data.refresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return NextResponse.json({
      success: true,
      message: "Token refreshed successfully.",
      access: data.access,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Refresh failed." },
      { status: 500 }
    );
  }
}
