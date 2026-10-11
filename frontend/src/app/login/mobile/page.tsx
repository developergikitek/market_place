"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AuthPageWrapper from "@/components/auth/AuthPageWrapper";
import SellerLoginForm from "../SellerLoginForm";

export default function MobileLoginPage() {
  const router = useRouter();

  return (
    <AuthPageWrapper>
      <SellerLoginForm
        initialMethod="phone"
        showHeaderFooter={true}
        onSwitchMethod={() => router.push("/login")}
        onGoToRegister={() => router.push("/register-seller/mobile-verify")}
      />
    </AuthPageWrapper>
  );
}
