import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DJANGO_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("makaano_session_id")?.value;
    const accessToken = cookieStore.get("access_token")?.value;

    // Notify Django backend to revoke this specific session in DB
    if (sessionId || accessToken) {
      try {
        await fetch(`${DJANGO_API_URL}/api/auth/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch (backendErr) {
        console.warn("[BFF Logout]: Could not reach backend logout endpoint:", backendErr);
      }
    }

    // Clear all cookies
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("makaano_seller_logged_in");
    cookieStore.delete("makaano_session_id");

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("[BFF Auth Logout Error]:", error);
    return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 });
  }
}
