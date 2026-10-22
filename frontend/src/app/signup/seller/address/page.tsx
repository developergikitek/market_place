"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AuthPageWrapper from "@/components/auth/AuthPageWrapper";
import BusinessAddressForm from "./BusinessAddressForm";

export default function AddressPage() {
  const router = useRouter();

  return (
    <AuthPageWrapper>
      <BusinessAddressForm
        showHeaderFooter={true}
        onSuccess={() => {
          router.push("/signup/seller/documents");
        }}
      />
    </AuthPageWrapper>
  );
}
