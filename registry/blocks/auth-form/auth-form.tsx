"use client";

import {
  type ComponentPropsWithoutRef,
  type FormEvent,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "../../components/button/button";
import { Checkbox } from "../../components/checkbox/checkbox";
import { Input } from "../../components/input/input";
import "../../components/foundation.css";

export type AuthFormMode = "sign-in" | "sign-up";

export interface AuthProvider {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export interface AuthFormValues {
  fullName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  remember: boolean;
  termsAccepted: boolean;
}

export interface AuthFormProps extends Omit<
  ComponentPropsWithoutRef<"form">,
  "children" | "onSubmit"
> {
  mode?: AuthFormMode;
  title?: string;
  description?: string;
  /** Up to four OAuth providers. Layout: 1 full, 2 side-by-side, 3 as 2 + 1 full, and 4 as 2 x 2. */
  oauthProviders?: readonly AuthProvider[];
  forgotPasswordAction?: ReactNode;
  termsAction?: ReactNode;
  privacyAction?: ReactNode;
  alternateAction?: ReactNode;
  /** Receives normalized form values after native validation. */
  onSubmit?: (values: AuthFormValues) => void | Promise<void>;
}

const copy = {
  "sign-in": {
    title: "Sign in to your account",
    description: "Welcome back. Enter your details to continue.",
    divider: "or continue with email",
    submit: "Sign in",
    alternate: "Don't have an account?",
  },
  "sign-up": {
    title: "Create your account",
    description: "Enter your details to get started.",
    divider: "or register with email",
    submit: "Create account",
    alternate: "Already have an account?",
  },
} satisfies Record<AuthFormMode, Record<string, string>>;

function oauthGridClass(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count === 3) return "grid-cols-2 [&>*:last-child]:col-span-2";
  return "grid-cols-2";
}

export function AuthForm({
  mode = "sign-in",
  title,
  description,
  oauthProviders = [],
  forgotPasswordAction,
  termsAction,
  privacyAction,
  alternateAction,
  onSubmit,
  className,
  ...props
}: AuthFormProps) {
  const content = copy[mode];
  const providers = oauthProviders.slice(0, 4);
  const signingUp = mode === "sign-up";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit?.({
      fullName: signingUp ? String(data.get("fullName") ?? "") : undefined,
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      confirmPassword: signingUp ? String(data.get("confirmPassword") ?? "") : undefined,
      remember: data.get("remember") === "on",
      termsAccepted: data.get("terms") === "on",
    });
  };

  return (
    <form
      {...props}
      className={[
        "w-full max-w-[34rem] text-[var(--text)]",
        className,
      ].filter(Boolean).join(" ")}
      onSubmit={submit}
    >
      <header>
        <h2 className="text-[clamp(2rem,7vw,3rem)] font-[650] leading-[1.05] tracking-[-0.045em]">
          {title ?? content.title}
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-[var(--text-secondary)] sm:text-base">
          {description ?? content.description}
        </p>
      </header>

      {providers.length ? (
        <>
          <div className={["mt-7 grid gap-3", oauthGridClass(providers.length)].join(" ")}>
            {providers.map((provider) => (
              <Button
                key={provider.label}
                className="w-full"
                type="button"
                variant="bordered"
                tone="secondary"
                size="large"
                icon={provider.icon}
                disabled={provider.disabled}
                onClick={provider.onClick}
              >
                {provider.label}
              </Button>
            ))}
          </div>
          <div className="my-7 flex items-center gap-4 text-xs font-[560] text-[var(--text-secondary)] before:h-px before:flex-1 before:bg-[var(--border)] after:h-px after:flex-1 after:bg-[var(--border)]">
            <span className="max-w-32 text-center leading-5">{content.divider}</span>
          </div>
        </>
      ) : null}

      <div className="grid gap-5">
        {signingUp ? (
          <Input
            name="fullName"
            label="Full name (optional)"
            autoComplete="name"
            placeholder="Enter your name"
            clearable={false}
          />
        ) : null}

        <Input
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          clearable={false}
          required
        />

        <div className="relative">
          <Input
            name="password"
            label={signingUp ? "Password (min. 8 characters)" : "Password"}
            type="password"
            autoComplete={signingUp ? "new-password" : "current-password"}
            placeholder="Enter your password"
            minLength={signingUp ? 8 : undefined}
            clearable={false}
            showPasswordToggle
            required
          />
          {!signingUp && forgotPasswordAction ? (
            <span className="absolute top-0 right-0 text-xs leading-5 text-[var(--text-secondary)] [&_a]:text-inherit [&_a]:underline-offset-4 hover:[&_a]:text-[var(--text)]">
              {forgotPasswordAction}
            </span>
          ) : null}
        </div>

        {signingUp ? (
          <Input
            name="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm your password"
            minLength={8}
            clearable={false}
            showPasswordToggle
            required
          />
        ) : null}

        {signingUp ? (
          <Checkbox
            name="terms"
            required
            label={(
              <span className="font-normal text-[var(--text-secondary)]">
                I agree to the <span className="text-[var(--text)]">{termsAction ?? "Terms of Service"}</span>
                {" and "}
                <span className="text-[var(--text)]">{privacyAction ?? "Privacy Policy"}</span>.
              </span>
            )}
          />
        ) : (
          <Checkbox name="remember" label="Remember this device" />
        )}

        <Button
          className="mt-1 w-full"
          type="submit"
          size="large"
          icon={<ArrowRight />}
          iconPosition="end"
        >
          {content.submit}
        </Button>
      </div>

      {alternateAction ? (
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          {content.alternate}{" "}
          <span className="font-[650] text-[var(--text)] underline decoration-[var(--border)] underline-offset-4">
            {alternateAction}
          </span>
        </p>
      ) : null}
    </form>
  );
}
