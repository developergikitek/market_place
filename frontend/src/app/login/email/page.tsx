"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AuthPageWrapper from "@/components/auth/AuthPageWrapper";
import SellerLoginForm from "../SellerLoginForm";

export default function EmailLoginPage() {
  const router = useRouter();

  return (
    <AuthPageWrapper>
      <SellerLoginForm
        initialMethod="email"
        showHeaderFooter={true}
        onSwitchMethod={() => router.push("/login/mobile")}
        onGoToRegister={() => router.push("/register-seller/mobile-verify")}
      />
    </AuthPageWrapper>
  );
}
