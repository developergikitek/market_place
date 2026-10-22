"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AuthPageWrapper from "@/components/auth/AuthPageWrapper";
import TermsConditionsForm from "./TermsConditionsForm";

export default function TermsPage() {
  const router = useRouter();

  return (
    <AuthPageWrapper>
      <TermsConditionsForm
        showHeaderFooter={true}
        onSuccess={() => {
          router.push("/signup/seller/success");
        }}
      />
    </AuthPageWrapper>
  );
}
