"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AuthPageWrapper from "@/components/auth/AuthPageWrapper";
import DocumentUploadForm from "./DocumentUploadForm";

export default function DocumentsPage() {
  const router = useRouter();

  return (
    <AuthPageWrapper>
      <DocumentUploadForm
        showHeaderFooter={true}
        onSuccess={() => {
          router.push("/register-seller/terms");
        }}
      />
    </AuthPageWrapper>
  );
}
