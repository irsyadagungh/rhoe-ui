"use client";

import { useState } from "react";
import { VerificationCode } from "@/registry/components/verification-code/verification-code";

export function VerificationCodeExample() {
  const [code, setCode] = useState("");

  return (
    <div className="mx-auto w-full max-w-[25rem] px-3 py-8">
      <VerificationCode
        value={code}
        onValueChange={setCode}
        hint="Enter the six-digit code sent to your email."
      />
    </div>
  );
}
