export interface SellerInfo {
  id: string;
  display_name: string;
  legal_business_name: string;
  store_slug: string;
  tier?: string;
  account_status?: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  phone: string;
  email: string | null;
  first_name: string;
  last_name: string;
  role: string;
  is_phone_verified: boolean;
  is_email_verified: boolean;
  seller_info?: SellerInfo | null;
  last_login_at?: string;
  created_at?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
  tokens?: {
    access: string;
    refresh: string;
  };
}

/**
 * Login seller via Next.js BFF proxy (/api/auth/login -> Django /api/v1/auth/login/)
 * Works with either phone (e.g. 7408108617) or email (e.g. developer.gikitek@gmail.com)
 */
export async function loginWithBackend(identifier: string, password: string): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: identifier.trim(),
      password: password,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    const errorMsg = data.message || "Invalid credentials. Please verify your phone/email and password.";
    throw new Error(errorMsg);
  }

  if (typeof window !== "undefined") {
    if (data.user) {
      localStorage.setItem("seller_user", JSON.stringify(data.user));
    }
    if (data.tokens?.access) {
      localStorage.setItem("access_token", data.tokens.access);
    }
  }

  return data;
}

/**
 * Fetch current authenticated seller from BFF session
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

/**
 * Logout seller and clear session cookies
 */
export async function logoutUser(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("seller_user");
      localStorage.removeItem("access_token");
    }
  }
}

export interface SendOtpResponse {
  success: boolean;
  message?: string;
  session_id?: string;
  phone?: string;
  resend_cooldown_seconds?: number;
  expires_in_seconds?: number;
  debug_otp?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
  tokens?: {
    access: string;
    refresh: string;
  };
  remaining_attempts?: number;
}

/**
 * Send OTP via Next.js BFF proxy
 */
export async function sendOtp(phone: string, purpose: string = "SELLER_LOGIN"): Promise<SendOtpResponse> {
  const res = await fetch("/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, purpose }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    const error: any = new Error(data.message || "Failed to send OTP");
    error.resend_cooldown_seconds = data.resend_cooldown_seconds;
    error.session_id = data.session_id;
    throw error;
  }

  return data;
}

/**
 * Verify OTP and establish seller session via Next.js BFF proxy
 */
export async function verifyOtp(params: {
  session_id?: string;
  phone?: string;
  otp: string;
  purpose?: string;
}): Promise<VerifyOtpResponse> {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    const error: any = new Error(data.message || "Invalid OTP. Please check and try again.");
    error.remaining_attempts = data.remaining_attempts;
    throw error;
  }

  if (typeof window !== "undefined") {
    if (data.user) {
      localStorage.setItem("seller_user", JSON.stringify(data.user));
    }
    if (data.tokens?.access) {
      localStorage.setItem("access_token", data.tokens.access);
    }
  }

  return data;
}

