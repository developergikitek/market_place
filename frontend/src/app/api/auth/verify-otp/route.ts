import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DJANGO_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, phone, otp, purpose = "SELLER_LOGIN" } = body;

    if (!otp) {
      return NextResponse.json(
        { success: false, message: "Please enter the OTP." },
        { status: 400 }
      );
    }

    if (!session_id && !phone) {
      return NextResponse.json(
        { success: false, message: "Missing session or phone number." },
        { status: 400 }
      );
    }

    const res = await fetch(`${DJANGO_API_URL}/api/auth/verify-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id, phone, otp, purpose }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg =
        data.error ||
        data.detail ||
        data.otp?.[0] ||
        data.message ||
        "Invalid OTP. Please check and try again.";

      return NextResponse.json(
        {
          success: false,
          message: errorMsg,
          remaining_attempts: data.remaining_attempts,
        },
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

    // Client session cookie
    cookieStore.set("makaano_seller_logged_in", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({
      success: true,
      message: data.message || "Login successful.",
      user: data.user,
      tokens: data.tokens,
    });
  } catch (error: any) {
    console.error("[BFF Auth Verify-OTP Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify code right now. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
