"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AuthPageWrapper from "@/components/auth/AuthPageWrapper";
import BusinessDetailsForm from "./BusinessDetailsForm";

export default function DetailsPage() {
  const router = useRouter();

  return (
    <AuthPageWrapper>
      <BusinessDetailsForm
        showHeaderFooter={true}
        onSuccess={() => {
          router.push("/register-seller/contact-person");
        }}
      />
    </AuthPageWrapper>
  );
}
