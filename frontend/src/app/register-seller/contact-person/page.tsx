"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AuthPageWrapper from "@/components/auth/AuthPageWrapper";
import ContactPersonForm from "./ContactPersonForm";

export default function ContactPersonPage() {
  const router = useRouter();

  return (
    <AuthPageWrapper>
      <ContactPersonForm
        showHeaderFooter={true}
        onSuccess={() => {
          router.push("/register-seller/address");
        }}
      />
    </AuthPageWrapper>
  );
}
