"use client";

import { KeyRound } from "lucide-react";
import {
  AuthForm,
  type AuthFormMode,
  type AuthProvider,
  type ForgotPasswordVariant,
  type SignUpVerificationVariant,
} from "@/registry/blocks/auth-form/auth-form";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.24c0-.72-.06-1.26-.2-1.82H12v3.3h5.37a4.62 4.62 0 0 1-1.99 2.95l-.02.11 2.89 2.24.2.02c1.83-1.69 2.9-4.18 2.9-6.8Z" />
      <path fill="#34A853" d="M12 21.75c2.62 0 4.81-.86 6.42-2.71l-3.06-2.37c-.82.55-1.93.94-3.36.94a5.83 5.83 0 0 1-5.51-4.03l-.1.01-3 2.32-.04.1A9.7 9.7 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.49 13.58A5.98 5.98 0 0 1 6.17 12c0-.55.1-1.08.3-1.58v-.11L3.4 7.95l-.1.05a9.74 9.74 0 0 0 .05 8.01l3.14-2.43Z" />
      <path fill="#EA4335" d="M12 6.39c1.82 0 3.04.78 3.74 1.43l2.74-2.67C16.8 3.58 14.62 2.25 12 2.25A9.7 9.7 0 0 0 3.3 8l3.17 2.42A5.86 5.86 0 0 1 12 6.39Z" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-1.05-.02-1.9-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.49-1.11-1.49-.91-.63.07-.62.07-.62 1 .08 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.66.35-1.11.64-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.4 9.4 0 0 1 12 6.97a9.4 9.4 0 0 1 2.5.34c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

const primaryProviders: AuthProvider[] = [
  { label: "GitHub", icon: <GitHubMark /> },
  { label: "Google", icon: <GoogleMark /> },
];

const signUpProviders: AuthProvider[] = [
  ...primaryProviders,
  { label: "Passkey", icon: <KeyRound /> },
];

export function AuthFormExample({
  mode,
  forgotPasswordVariant = "default",
  signUpVerificationVariant = "default",
}: {
  mode: AuthFormMode;
  forgotPasswordVariant?: ForgotPasswordVariant;
  signUpVerificationVariant?: SignUpVerificationVariant;
}) {
  return (
    <div className="flex w-full justify-center px-1 py-5 sm:px-5 sm:py-8">
      <AuthForm
        mode={mode}
        forgotPasswordVariant={forgotPasswordVariant}
        signUpVerificationVariant={signUpVerificationVariant}
        oauthProviders={mode === "sign-up" ? signUpProviders : primaryProviders}
        forgotPasswordAction="Forgot password?"
        termsAction={<a href="#terms">Terms of Service</a>}
        privacyAction={<a href="#privacy">Privacy Policy</a>}
        alternateAction={mode === "sign-in"
          ? <a href="#sign-up">Sign up</a>
          : <a href="#sign-in">Sign in</a>}
        onSubmit={() => {}}
        onVerifyCode={() => {}}
        onForgotPassword={() => {}}
        onVerifyResetCode={() => {}}
        onResetPassword={() => {}}
        resendCountdownSeconds={10}
      />
    </div>
  );
}
