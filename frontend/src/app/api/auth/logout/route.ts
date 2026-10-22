import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("makaano_seller_logged_in");

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("[BFF Auth Logout Error]:", error);
    return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 });
  }
}
