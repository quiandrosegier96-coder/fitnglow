"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Apple, Chrome, Eye, EyeOff, Loader2, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema, registerSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot" }) {
  const schema = mode === "register" ? registerSchema : authSchema.pick({ email: true }).extend(mode === "login" ? { password: authSchema.shape.password } : {});
  type Values = { email: string; password?: string; fullName?: string; confirmPassword?: string; acceptTerms?: boolean };
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema) as unknown as Resolver<Values>,
    defaultValues: { acceptTerms: false }
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>();
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");

  async function onSubmit(values: Values) {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Add Supabase environment variables to enable authentication.");
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password ?? ""
      });
      if (error) setMessage(error.message);
      else router.push(searchParams.get("redirectedFrom") ?? "/dashboard");
      return;
    }

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password ?? "",
        options: {
          emailRedirectTo: `${appUrl}/onboarding`,
          data: { full_name: values.fullName ?? "" }
        }
      });
      setMessage(error ? error.message : "Check your email to verify your account.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${appUrl}/reset-password`
    });
    setMessage(error ? error.message : "Password reset email sent.");
  }

  async function signInWithProvider(provider: "google" | "apple") {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Add Supabase environment variables to enable OAuth.");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${appUrl}/dashboard`,
        queryParams: provider === "google" ? { access_type: "offline", prompt: remember ? "consent" : "select_account" } : undefined
      }
    });
  }

  return (
    <Card className="fade-in border-primary/10 p-6 sm:p-7">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary/40 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
        <Sparkles size={14} /> Fit & Glow Club
      </div>
      <CardTitle>{mode === "login" ? "Welcome back" : mode === "register" ? "Create your glow plan" : "Reset password"}</CardTitle>
      <p className="mt-2 text-sm leading-6 text-muted">
        {mode === "forgot"
          ? "Enter your email and Supabase will send a secure reset link."
          : "Premium coaching, workouts, nutrition, and progress in one elegant space."}
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => onSubmit(values))}>
        {mode === "register" && (
          <Field label="Full name" icon={<UserRound size={17} />}>
            <Input autoComplete="name" placeholder="Joyce Glow" {...register("fullName")} />
          </Field>
        )}
        <Field label="Email" icon={<Mail size={17} />}>
          <Input autoComplete="email" placeholder="you@example.com" type="email" {...register("email")} />
        </Field>
        {mode !== "forgot" && (
          <Field label="Password" icon={<LockKeyhole size={17} />}>
            <PasswordInput
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="Minimum 8 characters"
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              {...register("password")}
            />
          </Field>
        )}
        {mode === "register" && (
          <Field label="Confirm password" icon={<LockKeyhole size={17} />}>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Repeat your password"
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((value) => !value)}
              {...register("confirmPassword")}
            />
          </Field>
        )}
        {mode === "login" && (
          <label className="flex items-center gap-2 text-sm font-semibold text-muted">
            <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" className="h-4 w-4 accent-primary" />
            Remember me
          </label>
        )}
        {mode === "register" && (
          <label className="flex items-start gap-3 rounded-2xl bg-secondary/25 p-3 text-sm font-semibold text-muted">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" {...register("acceptTerms")} />
            <span>I agree to the Fit & Glow Club privacy and membership terms.</span>
          </label>
        )}
        {Object.values(formState.errors).map((error, index) => (
          <p className="rounded-2xl bg-primary/10 p-3 text-sm font-semibold text-primary" key={index}>
            {error?.message?.toString()}
          </p>
        ))}
        {message && <p className="rounded-2xl bg-secondary/35 p-3 text-sm font-semibold text-muted">{message}</p>}
        <Button className="w-full" type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
          {mode === "login" ? "Login" : mode === "register" ? "Register" : "Send reset link"}
        </Button>
      </form>
      {mode !== "forgot" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={() => signInWithProvider("google")}>
            <Chrome size={17} /> Google
          </Button>
          <Button type="button" variant="outline" onClick={() => signInWithProvider("apple")}>
            <Apple size={17} /> Apple
          </Button>
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm font-semibold text-muted">
        {mode !== "login" && <Link href="/login">Login</Link>}
        {mode !== "register" && <Link href="/register">Register</Link>}
        {mode !== "forgot" && <Link href="/forgot-password">Forgot password</Link>}
      </div>
    </Card>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-black text-muted">
        {icon} {label}
      </span>
      {children}
    </label>
  );
}

function PasswordInput({
  visible,
  onToggle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input className="pr-12" type={visible ? "text" : "password"} {...props} />
      <button
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-secondary/45 hover:text-foreground"
        onClick={onToggle}
        type="button"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
