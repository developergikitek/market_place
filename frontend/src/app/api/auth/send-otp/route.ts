import { NextResponse } from "next/server";

const DJANGO_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, purpose = "SELLER_LOGIN", channel = "SMS" } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const res = await fetch(`${DJANGO_API_URL}/api/auth/send-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, purpose, channel }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg =
        data.error ||
        data.detail ||
        data.phone?.[0] ||
        data.message ||
        "Failed to send OTP. Please try again.";

      return NextResponse.json(
        {
          success: false,
          message: errorMsg,
          resend_cooldown_seconds: data.resend_cooldown_seconds,
          session_id: data.session_id,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || "OTP sent successfully.",
      session_id: data.session_id,
      phone: data.phone,
      resend_cooldown_seconds: data.resend_cooldown_seconds,
      expires_in_seconds: data.expires_in_seconds,
      debug_otp: data.debug_otp,
    });
  } catch (error: any) {
    console.error("[BFF Auth Send-OTP Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to send verification code. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
