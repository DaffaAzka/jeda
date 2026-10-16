"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { siteCopy } from "@/lib/copy/id";
import { Turnstile } from "@/components/turnstile";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const isRegister = mode === "register";
  const copy = siteCopy.auth;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY &&
      !turnstileToken
    ) {
      setError("Silakan selesaikan verifikasi keamanan anti-bot terlebih dahulu.");
      return;
    }

    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const fetchOptions = turnstileToken
      ? { headers: { "x-captcha-response": turnstileToken } }
      : undefined;

    try {
      if (isRegister) {
        const name = String(formData.get("name") ?? "").trim();
        const confirmPassword = String(
          formData.get("confirmPassword") ?? "",
        );

        if (password !== confirmPassword) {
          setError(copy.passwordMismatch);
          return;
        }

        const result = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL: "/dashboard",
          fetchOptions,
        });

        if (result.error) {
          setError(result.error.message || copy.registerError);
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/dashboard",
          fetchOptions,
        });

        if (result.error) {
          setError(result.error.message || copy.loginError);
          return;
        }
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : copy.genericError,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="w-full max-w-md border-2 border-border bg-card p-6 shadow-[6px_6px_0_var(--border)] sm:p-8">
      <Link
        href="/"
        className="font-pixelify text-2xl font-bold tracking-wide text-foreground"
      >
        {siteCopy.brand}
      </Link>
      <h1 className="mt-8 font-pixelify text-3xl leading-tight sm:text-4xl">
        {isRegister ? copy.registerTitle : copy.loginTitle}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {isRegister ? copy.registerDescription : copy.loginDescription}
      </p>

      <form
        aria-label={copy.formLabel}
        className="mt-8 space-y-5"
        onSubmit={handleSubmit}
      >
        {isRegister && (
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-semibold">
              {copy.name}
            </label>
            <input
              autoComplete="name"
              className="min-h-12 w-full border-2 border-border bg-background px-3 text-base text-foreground"
              id="name"
              maxLength={100}
              minLength={2}
              name="name"
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold">
            {copy.email}
          </label>
          <input
            autoComplete="email"
            className="min-h-12 w-full border-2 border-border bg-background px-3 text-base text-foreground"
            id="email"
            name="email"
            required
            type="email"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold">
            {copy.password}
          </label>
          <input
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="min-h-12 w-full border-2 border-border bg-background px-3 text-base text-foreground"
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </div>
        {isRegister && (
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold"
            >
              {copy.confirmPassword}
            </label>
            <input
              autoComplete="new-password"
              className="min-h-12 w-full border-2 border-border bg-background px-3 text-base text-foreground"
              id="confirmPassword"
              minLength={8}
              name="confirmPassword"
              required
              type="password"
            />
          </div>
        )}

        <Turnstile
          onSuccess={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken("")}
        />

        {error && (
          <p
            role="alert"
            className="border-2 border-border bg-moodi-peach p-3 text-sm text-ink"
          >
            {error}
          </p>
        )}

        <button
          className="pixel-press pixel-shadow min-h-12 w-full border-2 border-border bg-moodi-sky px-5 font-semibold text-ink disabled:cursor-wait disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending
            ? copy.submitting
            : isRegister
              ? copy.registerButton
              : copy.loginButton}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        {isRegister ? copy.haveAccount : copy.noAccount}{" "}
        <Link
          className="font-semibold text-link underline underline-offset-4"
          href={isRegister ? "/login" : "/register"}
        >
          {isRegister ? copy.loginLink : copy.registerLink}
        </Link>
      </p>
    </section>
  );
}
