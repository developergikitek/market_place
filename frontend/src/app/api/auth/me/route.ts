import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DJANGO_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const res = await fetch(`${DJANGO_API_URL}/api/auth/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ authenticated: false, user: null }, { status: res.status });
    }

    const userData = await res.json();
    return NextResponse.json({ authenticated: true, user: userData });
  } catch (error) {
    console.error("[BFF Auth Me Error]:", error);
    return NextResponse.json({ authenticated: false, error: "Internal server error" }, { status: 500 });
  }
}
