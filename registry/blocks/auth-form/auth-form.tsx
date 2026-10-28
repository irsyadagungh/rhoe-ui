"use client";

import {
  type ComponentPropsWithoutRef,
  type FormEvent,
  type MouseEventHandler,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ArrowLeft, ArrowRight, LoaderCircle, RotateCw } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import { Button } from "../../components/button/button";
import { Checkbox } from "../../components/checkbox/checkbox";
import { Input } from "../../components/input/input";
import { motionTokens } from "../../components/lib/motion-tokens";
import { MorphingText } from "../../components/morphing-text/morphing-text";
import { VerificationCode } from "../../components/verification-code/verification-code";
import "../../components/foundation.css";

export type AuthFormMode = "sign-in" | "sign-up";
export type AuthFormStep = "credentials" | "verification" | "sign-up-link-sent" | "forgot-password" | "forgot-password-sent" | "forgot-password-verification" | "reset-password";
export type ForgotPasswordVariant = "default" | "link" | "otp";
export type SignUpVerificationVariant = "default" | "link" | "otp";
export type AuthFormActionResult = boolean | void | { error: string };

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
  /** Content for the internal trigger that morphs sign-in into password recovery. */
  forgotPasswordAction?: ReactNode;
  termsAction?: ReactNode;
  privacyAction?: ReactNode;
  alternateAction?: ReactNode;
  verificationCodeLength?: number;
  /** Default leaves continuation to onForgotPassword; link and otp enable built-in continuation screens. */
  forgotPasswordVariant?: ForgotPasswordVariant;
  signUpVerificationVariant?: SignUpVerificationVariant;
  resendCountdownSeconds?: number;
  /** Return false to keep credentials open. Default continuation is application-owned; link and OTP use built-in screens. */
  onSubmit?: (values: AuthFormValues) => AuthFormActionResult | Promise<AuthFormActionResult>;
  onVerifyCode?: (code: string, email: string) => AuthFormActionResult | Promise<AuthFormActionResult>;
  onResendVerification?: (email: string) => AuthFormActionResult | Promise<AuthFormActionResult>;
  /** Fully application-owned in the default variant: redirect, open another surface, or run any recovery flow. */
  onForgotPassword?: (email: string) => AuthFormActionResult | Promise<AuthFormActionResult>;
  onVerifyResetCode?: (code: string, email: string) => AuthFormActionResult | Promise<AuthFormActionResult>;
  onResetPassword?: (password: string, confirmPassword: string, email: string) => AuthFormActionResult | Promise<AuthFormActionResult>;
  onStepChange?: (step: AuthFormStep) => void;
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
    submit: "Sign up",
    alternate: "Already have an account?",
  },
} satisfies Record<AuthFormMode, Record<string, string>>;

function oauthGridClass(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count === 3) return "grid-cols-2 [&>*:last-child]:col-span-2";
  return "grid-cols-2";
}

function actionLabel(
  step: AuthFormStep,
  signingUp: boolean,
  pending: boolean,
  forgotPasswordVariant: ForgotPasswordVariant,
) {
  if (step === "forgot-password") {
    if (forgotPasswordVariant === "otp") return pending ? "Sending OTP" : "Send OTP";
    return pending ? "Sending reset link" : "Send reset link";
  }
  if (step === "forgot-password-sent") return pending ? "Sending reset link" : "Resend reset link";
  if (step === "verification") return pending ? "Verifying code" : "Verify code";
  if (step === "sign-up-link-sent") return pending ? "Sending verification link" : "Resend verification link";
  if (step === "forgot-password-verification") return pending ? "Verifying code" : "Verify code";
  if (step === "reset-password") return pending ? "Resetting password" : "Reset password";
  if (signingUp) return pending ? "Signing up" : "Sign up";
  return pending ? "Signing in" : "Sign in";
}

function AutoHeight({
  children,
  transition,
}: {
  children: ReactNode;
  transition: Transition;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () => setHeight(content.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      className="overflow-hidden"
      initial={false}
      animate={{ height: height ?? "auto" }}
      transition={transition}
    >
      <div ref={contentRef}>{children}</div>
    </motion.div>
  );
}

function MorphingButtonLabel({ from, to }: { from: string; to: string }) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setValue(to));
    return () => cancelAnimationFrame(frame);
  }, [to]);

  return <MorphingText value={value} />;
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
  verificationCodeLength = 6,
  forgotPasswordVariant = "default",
  signUpVerificationVariant = "default",
  resendCountdownSeconds = 60,
  onSubmit,
  onVerifyCode,
  onResendVerification,
  onForgotPassword,
  onVerifyResetCode,
  onResetPassword,
  onStepChange,
  className,
  ...props
}: AuthFormProps) {
  const content = copy[mode];
  const providers = oauthProviders.slice(0, 4);
  const signingUp = mode === "sign-up";
  const reduceMotion = useReducedMotion() ?? false;
  const emailLayoutId = `${useId()}-email`;
  const submitLayoutId = `${useId()}-submit`;
  const [step, setStep] = useState<AuthFormStep>("credentials");
  const [previousMode, setPreviousMode] = useState(mode);
  const [previousSubmitLabel, setPreviousSubmitLabel] = useState<string>();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<{ message: string; field: "code" | "form" }>();
  const stageRef = useRef<HTMLDivElement>(null);
  const initialStep = useRef(true);

  const heightTransition: Transition = reduceMotion
    ? { duration: 0 }
    : motionTokens.spring.smooth;
  const contentTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: motionTokens.duration.standard, ease: motionTokens.ease.standard };

  const changeStep = (nextStep: AuthFormStep) => {
    setActionError(undefined);
    setPreviousSubmitLabel(actionLabel(step, signingUp, pending, forgotPasswordVariant));
    if (nextStep === "verification" || nextStep === "forgot-password-verification") {
      setResendCountdown(Math.max(0, Math.floor(resendCountdownSeconds)));
    }
    setStep(nextStep);
    onStepChange?.(nextStep);
  };

  if (previousMode !== mode) {
    setPreviousMode(mode);
    setStep("credentials");
    setPreviousSubmitLabel(undefined);
    setVerificationCode("");
  }

  useEffect(() => {
    if (initialStep.current) {
      initialStep.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => {
      stageRef.current?.querySelector<HTMLElement>("input:not([disabled]), button:not([disabled])")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCountdown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setActionError(undefined);
    setPending(true);

    const failed = (result: AuthFormActionResult, field: "code" | "form" = "form") => {
      if (result !== false && !(typeof result === "object" && result !== null && "error" in result)) return false;
      setActionError({ message: typeof result === "object" && result !== null ? result.error : field === "code" ? "Invalid or expired code. Please try again." : "Something went wrong. Please try again.", field });
      return true;
    };

    try {
      if (step === "verification") {
        failed(await onVerifyCode?.(verificationCode, email), "code");
        return;
      }

      if (step === "sign-up-link-sent") {
        failed(await onResendVerification?.(email));
        return;
      }

      if (step === "forgot-password-verification") {
        const result = await onVerifyResetCode?.(verificationCode, email);
        if (!failed(result, "code")) {
          setPending(false);
          changeStep("reset-password");
        }
        return;
      }

      if (step === "reset-password") {
        const password = String(data.get("newPassword") ?? "");
        const confirmation = String(data.get("confirmNewPassword") ?? "");
        if (password !== confirmation) {
          setActionError({ message: "Passwords do not match.", field: "form" });
          return;
        }
        failed(await onResetPassword?.(
          password,
          confirmation,
          email,
        ));
        return;
      }

      if (step === "forgot-password") {
        const result = await onForgotPassword?.(email);
        if (!failed(result) && forgotPasswordVariant !== "default") {
          setPending(false);
          if (forgotPasswordVariant === "otp") {
            setVerificationCode("");
            changeStep("forgot-password-verification");
          } else {
            changeStep("forgot-password-sent");
          }
        }
        return;
      }

      if (step === "forgot-password-sent") {
        failed(await onForgotPassword?.(email));
        return;
      }

      const result = await onSubmit?.({
        fullName: signingUp ? String(data.get("fullName") ?? "") : undefined,
        email,
        password: String(data.get("password") ?? ""),
        confirmPassword: signingUp ? String(data.get("confirmPassword") ?? "") : undefined,
        remember: data.get("remember") === "on",
        termsAccepted: data.get("terms") === "on",
      });

      if (!failed(result) && signingUp && signUpVerificationVariant !== "default") {
        setPending(false);
        if (signUpVerificationVariant === "link") {
          changeStep("sign-up-link-sent");
        } else {
          setVerificationCode("");
          changeStep("verification");
        }
      }
    } catch {
      setActionError({ message: "Something went wrong. Please try again.", field: "form" });
    } finally {
      setPending(false);
    }
  };

  const resendVerification = async () => {
    if (pending || resendCountdown > 0) return;
    setPending(true);
    setActionError(undefined);
    try {
      const result = await onResendVerification?.(email);
      if (result === false || (typeof result === "object" && result !== null)) {
        setActionError({ message: typeof result === "object" && result !== null ? result.error : "Could not resend the code. Please try again.", field: "form" });
      } else setResendCountdown(Math.max(0, Math.floor(resendCountdownSeconds)));
    } catch {
      setActionError({ message: "Could not resend the code. Please try again.", field: "form" });
    } finally {
      setPending(false);
    }
  };

  const resendResetCode = async () => {
    if (pending || resendCountdown > 0) return;
    setPending(true);
    setActionError(undefined);
    try {
      const result = await onForgotPassword?.(email);
      if (result === false || (typeof result === "object" && result !== null)) {
        setActionError({ message: typeof result === "object" && result !== null ? result.error : "Could not resend the code. Please try again.", field: "form" });
      } else setResendCountdown(Math.max(0, Math.floor(resendCountdownSeconds)));
    } catch {
      setActionError({ message: "Could not resend the code. Please try again.", field: "form" });
    } finally {
      setPending(false);
    }
  };

  const activeTitle = step === "verification"
    ? "Verify your email"
    : step === "sign-up-link-sent"
      ? "Check your email"
    : step === "forgot-password-verification"
      ? "Verify your code"
      : step === "reset-password"
        ? "Create a new password"
        : step === "forgot-password-sent"
          ? "Check your email"
    : step === "forgot-password"
      ? "Reset your password"
      : title ?? content.title;
  const activeDescription = step === "verification"
    ? `Enter the ${verificationCodeLength}-digit code sent to ${email || "your email"}.`
    : step === "sign-up-link-sent"
      ? `We sent an account verification link to ${email || "your email"}.`
    : step === "forgot-password-verification"
      ? `Enter the ${verificationCodeLength}-digit reset code sent to ${email || "your email"}.`
      : step === "reset-password"
        ? "Choose a new password and confirm it to finish recovery."
        : step === "forgot-password-sent"
          ? `We sent a password reset link to ${email || "your email"}.`
    : step === "forgot-password"
      ? "Enter your email and we'll send you a reset link."
      : description ?? content.description;
  const currentActionLabel = actionLabel(step, signingUp, pending, forgotPasswordVariant);

  return (
    <form
      {...props}
      className={[
        "w-full max-w-[34rem] text-[var(--text)]",
        className,
      ].filter(Boolean).join(" ")}
      onSubmit={submit}
    >
      <AutoHeight transition={heightTransition}>
        <header aria-live="polite">
          <h2 className="text-[clamp(1.8rem,7vw,3rem)] font-[650] leading-[1.05] tracking-[-0.045em]">
            <MorphingText value={activeTitle} />
          </h2>
          <p className="mt-3 min-h-6 text-[15px] leading-6 text-[var(--text-secondary)] sm:text-base">
            <MorphingText value={activeDescription} />
          </p>
        </header>

        {actionError?.field === "form" ? (
          <p role="alert" className="mt-4 text-sm text-[var(--danger-surface-foreground)]">{actionError.message}</p>
        ) : null}

        <div className="relative grid items-center" ref={stageRef}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              className="col-start-1 row-start-1 w-full self-center"
              key={step}
              layout="position"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" }}
              transition={contentTransition}
            >
              {step === "credentials" ? (
                <>
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
                            disabled={provider.disabled || pending}
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

                    <motion.div
                      layoutId={emailLayoutId}
                      transition={heightTransition}
                    >
                      <Input
                        name="email"
                        label="Email address"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={email}
                        onValueChange={setEmail}
                        clearable={false}
                        required
                      />
                    </motion.div>

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
                      {!signingUp ? (
                        <button
                          className="absolute top-0 right-0 text-xs leading-5 text-[var(--text-secondary)] underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:text-[var(--text)] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2"
                          type="button"
                          onClick={() => changeStep("forgot-password")}
                        >
                          {forgotPasswordAction ?? "Forgot password?"}
                        </button>
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

                    <motion.div
                      className="mt-1 w-full"
                      layoutId={submitLayoutId}
                      transition={heightTransition}
                    >
                      <Button
                        className="w-full"
                        type="submit"
                        size="large"
                        icon={[<ArrowRight key="ready" />, <LoaderCircle key="pending" />]}
                        iconPosition="end"
                        state={pending ? 1 : 0}
                        loading={[false, true]}
                        disabled={pending}
                      >
                        <MorphingButtonLabel
                          from={previousSubmitLabel ?? content.submit}
                          to={currentActionLabel}
                        />
                      </Button>
                    </motion.div>
                  </div>

                  {alternateAction ? (
                    <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                      {content.alternate}{" "}
                      <span className="font-[650] text-[var(--text)] underline decoration-[var(--border)] underline-offset-4">
                        {alternateAction}
                      </span>
                    </p>
                  ) : null}
                </>
              ) : null}

              {step === "verification" ? (
                <div className="mt-8 grid gap-5">
                  <motion.div layoutId={emailLayoutId} transition={heightTransition}>
                    <VerificationCode
                      name="verificationCode"
                      length={verificationCodeLength}
                      value={verificationCode}
                      onValueChange={(value) => { setVerificationCode(value); setActionError(undefined); }}
                      error={actionError?.field === "code" ? actionError.message : undefined}
                      required
                    />
                  </motion.div>
                  <motion.div
                    className="w-full"
                    layoutId={submitLayoutId}
                    transition={heightTransition}
                  >
                    <Button
                      className="w-full"
                      type="submit"
                      size="large"
                      icon={[<ArrowRight key="ready" />, <LoaderCircle key="pending" />]}
                      iconPosition="end"
                      state={pending ? 1 : 0}
                      loading={[false, true]}
                      disabled={pending || verificationCode.length !== verificationCodeLength}
                    >
                      <MorphingButtonLabel
                        from={previousSubmitLabel ?? "Sign up"}
                        to={currentActionLabel}
                      />
                    </Button>
                  </motion.div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="text"
                      tone="secondary"
                      size="small"
                      icon={<ArrowLeft />}
                      disabled={pending}
                      onClick={() => changeStep("credentials")}
                    >
                      Back to sign up
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      tone="secondary"
                      size="small"
                      icon={<RotateCw />}
                      disabled={pending || resendCountdown > 0}
                      onClick={resendVerification}
                    >
                      {resendCountdown > 0 ? `Resend code · ${resendCountdown}s` : "Resend code"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === "sign-up-link-sent" ? (
                <div className="mt-8 grid gap-5">
                  <motion.div
                    className="w-full"
                    layoutId={submitLayoutId}
                    transition={heightTransition}
                  >
                    <Button
                      className="w-full"
                      type="submit"
                      size="large"
                      icon={[<RotateCw key="ready" />, <LoaderCircle key="pending" />]}
                      iconPosition="end"
                      state={pending ? 1 : 0}
                      loading={[false, true]}
                      disabled={pending}
                    >
                      <MorphingButtonLabel
                        from={previousSubmitLabel ?? "Sign up"}
                        to={currentActionLabel}
                      />
                    </Button>
                  </motion.div>
                  <Button
                    className="justify-self-start"
                    type="button"
                    variant="text"
                    tone="secondary"
                    size="small"
                    icon={<ArrowLeft />}
                    disabled={pending}
                    onClick={() => changeStep("credentials")}
                  >
                    Back to sign up
                  </Button>
                </div>
              ) : null}

              {step === "forgot-password" ? (
                <div className="mt-8 grid gap-5">
                  <motion.div layoutId={emailLayoutId} transition={heightTransition}>
                    <Input
                      name="recoveryEmail"
                      label="Email address"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      value={email}
                      onValueChange={setEmail}
                      clearable={false}
                      required
                    />
                  </motion.div>
                  <motion.div
                    className="w-full"
                    layoutId={submitLayoutId}
                    transition={heightTransition}
                  >
                    <Button
                      className="w-full"
                      type="submit"
                      size="large"
                      icon={[<ArrowRight key="ready" />, <LoaderCircle key="pending" />]}
                      iconPosition="end"
                      state={pending ? 1 : 0}
                      loading={[false, true]}
                      disabled={pending}
                    >
                      <MorphingButtonLabel
                        from={previousSubmitLabel ?? content.submit}
                        to={currentActionLabel}
                      />
                    </Button>
                  </motion.div>
                  <Button
                    className="justify-self-start"
                    type="button"
                    variant="text"
                    tone="secondary"
                    size="small"
                    icon={<ArrowLeft />}
                    disabled={pending}
                    onClick={() => changeStep("credentials")}
                  >
                    Back to sign in
                  </Button>
                </div>
              ) : null}

              {step === "forgot-password-sent" ? (
                <div className="mt-8 grid gap-5">
                  <motion.div
                    className="w-full"
                    layoutId={submitLayoutId}
                    transition={heightTransition}
                  >
                    <Button
                      className="w-full"
                      type="submit"
                      size="large"
                      icon={[<RotateCw key="ready" />, <LoaderCircle key="pending" />]}
                      iconPosition="end"
                      state={pending ? 1 : 0}
                      loading={[false, true]}
                      disabled={pending}
                    >
                      <MorphingButtonLabel
                        from={previousSubmitLabel ?? "Send reset link"}
                        to={currentActionLabel}
                      />
                    </Button>
                  </motion.div>
                  <Button
                    className="justify-self-start"
                    type="button"
                    variant="text"
                    tone="secondary"
                    size="small"
                    icon={<ArrowLeft />}
                    disabled={pending}
                    onClick={() => changeStep("forgot-password")}
                  >
                    Back to email
                  </Button>
                </div>
              ) : null}

              {step === "forgot-password-verification" ? (
                <div className="mt-8 grid gap-5">
                  <motion.div layoutId={emailLayoutId} transition={heightTransition}>
                    <VerificationCode
                      name="resetVerificationCode"
                      length={verificationCodeLength}
                      value={verificationCode}
                      onValueChange={(value) => { setVerificationCode(value); setActionError(undefined); }}
                      error={actionError?.field === "code" ? actionError.message : undefined}
                      required
                    />
                  </motion.div>
                  <motion.div
                    className="w-full"
                    layoutId={submitLayoutId}
                    transition={heightTransition}
                  >
                    <Button
                      className="w-full"
                      type="submit"
                      size="large"
                      icon={[<ArrowRight key="ready" />, <LoaderCircle key="pending" />]}
                      iconPosition="end"
                      state={pending ? 1 : 0}
                      loading={[false, true]}
                      disabled={pending || verificationCode.length !== verificationCodeLength}
                    >
                      <MorphingButtonLabel
                        from={previousSubmitLabel ?? "Send OTP"}
                        to={currentActionLabel}
                      />
                    </Button>
                  </motion.div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="text"
                      tone="secondary"
                      size="small"
                      icon={<ArrowLeft />}
                      disabled={pending}
                      onClick={() => changeStep("forgot-password")}
                    >
                      Back to email
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      tone="secondary"
                      size="small"
                      icon={<RotateCw />}
                      disabled={pending || resendCountdown > 0}
                      onClick={resendResetCode}
                    >
                      {resendCountdown > 0 ? `Resend code · ${resendCountdown}s` : "Resend code"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === "reset-password" ? (
                <div className="mt-8 grid gap-5">
                  <motion.div
                    className="grid gap-5"
                    layoutId={emailLayoutId}
                    transition={heightTransition}
                  >
                    <Input
                      name="newPassword"
                      label="New password (min. 8 characters)"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Enter your new password"
                      minLength={8}
                      clearable={false}
                      showPasswordToggle
                      required
                    />
                    <Input
                      name="confirmNewPassword"
                      label="Confirm new password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirm your new password"
                      minLength={8}
                      clearable={false}
                      showPasswordToggle
                      required
                    />
                  </motion.div>
                  <motion.div
                    className="w-full"
                    layoutId={submitLayoutId}
                    transition={heightTransition}
                  >
                    <Button
                      className="w-full"
                      type="submit"
                      size="large"
                      icon={[<ArrowRight key="ready" />, <LoaderCircle key="pending" />]}
                      iconPosition="end"
                      state={pending ? 1 : 0}
                      loading={[false, true]}
                      disabled={pending}
                    >
                      <MorphingButtonLabel
                        from={previousSubmitLabel ?? "Verify code"}
                        to={currentActionLabel}
                      />
                    </Button>
                  </motion.div>
                  <Button
                    className="justify-self-start"
                    type="button"
                    variant="text"
                    tone="secondary"
                    size="small"
                    icon={<ArrowLeft />}
                    disabled={pending}
                    onClick={() => changeStep("forgot-password-verification")}
                  >
                    Back to verification
                  </Button>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </AutoHeight>
    </form>
  );
}
