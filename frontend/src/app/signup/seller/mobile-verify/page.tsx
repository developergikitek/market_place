"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AuthPageWrapper from "@/components/auth/AuthPageWrapper";
import Step1_MobileVerification from "./Step1_MobileVerification";
import Step2_OtpVerification from "./Step2_OtpVerification";

export default function MobileVerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");

  return (
    <AuthPageWrapper>
      {step === 1 ? (
        <Step1_MobileVerification
          onSuccess={(p, code) => {
            setPhone(p);
            setCountryCode(code);
            setStep(2);
          }}
        />
      ) : (
        <Step2_OtpVerification
          phone={phone}
          countryCode={countryCode}
          onEditPhone={() => setStep(1)}
          onSuccess={() => {
            router.push("/signup/seller/details");
          }}
        />
      )}
    </AuthPageWrapper>
  );
}
