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
 * Works with either phone (e.g. 7408108617) or email (e.g. seller@gikitek.com)
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
