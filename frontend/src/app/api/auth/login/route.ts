import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DJANGO_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, phone, email, username, password } = body;

    // Django accepts phone, email, username, or identifier along with password
    const loginIdentifier = (identifier || phone || email || username || "").toString().trim();

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { success: false, message: "Please provide your mobile, email, or username and password." },
        { status: 400 }
      );
    }

    const res = await fetch(`${DJANGO_API_URL}/api/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phone || loginIdentifier,
        email: email || undefined,
        username: username || undefined,
        identifier: loginIdentifier,
        password: password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg =
        data.non_field_errors?.[0] ||
        data.detail ||
        data.phone?.[0] ||
        data.password?.[0] ||
        data.message ||
        "Invalid mobile number or password.";

      return NextResponse.json(
        { success: false, message: errorMsg, errors: data },
        { status: res.status }
      );
    }

    // Success response: data = { message, user, tokens: { refresh, access } }
    const cookieStore = await cookies();

    // Store JWT access token in httpOnly cookie
    if (data.tokens?.access) {
      cookieStore.set("access_token", data.tokens.access, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });
    }

    if (data.tokens?.refresh) {
      cookieStore.set("refresh_token", data.tokens.refresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Also store a non-sensitive session cookie for client UI
    cookieStore.set("makaano_seller_logged_in", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({
      success: true,
      message: data.message || "Login successful",
      user: data.user,
      tokens: data.tokens,
    });
  } catch (error: any) {
    console.error("[BFF Auth Login Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to authentication server. Please ensure backend is running.",
      },
      { status: 500 }
    );
  }
}
