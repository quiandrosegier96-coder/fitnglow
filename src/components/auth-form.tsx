"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Apple, Chrome, Mail } from "lucide-react";
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
  type Values = { email: string; password?: string; fullName?: string };
  const { register, handleSubmit, formState } = useForm<Record<string, string>>({
    resolver: zodResolver(schema) as unknown as Resolver<Record<string, string>>
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>();
  const [remember, setRemember] = useState(true);

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
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: values.fullName ?? "" }
        }
      });
      setMessage(error ? error.message : "Check your email to verify your account.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`
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
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: provider === "google" ? { access_type: "offline", prompt: remember ? "consent" : "select_account" } : undefined
      }
    });
  }

  return (
    <Card className="fade-in">
      <CardTitle>{mode === "login" ? "Welcome back" : mode === "register" ? "Create your glow plan" : "Reset password"}</CardTitle>
      <p className="mt-2 text-sm leading-6 text-muted">
        {mode === "forgot"
          ? "Enter your email and Supabase will send a secure reset link."
          : "Premium coaching, workouts, nutrition, and progress in one elegant space."}
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => onSubmit(values as unknown as Values))}>
        {mode === "register" && <Input placeholder="Full name" {...register("fullName")} />}
        <Input placeholder="Email" type="email" {...register("email")} />
        {mode !== "forgot" && <Input placeholder="Password" type="password" {...register("password")} />}
        {mode === "login" && (
          <label className="flex items-center gap-2 text-sm font-semibold text-muted">
            <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" className="h-4 w-4 accent-primary" />
            Remember me
          </label>
        )}
        {Object.values(formState.errors).map((error, index) => (
          <p className="text-sm font-semibold text-primary" key={index}>
            {error?.message?.toString()}
          </p>
        ))}
        {message && <p className="rounded-2xl bg-secondary/35 p-3 text-sm font-semibold text-muted">{message}</p>}
        <Button className="w-full" type="submit">
          <Mail size={17} />
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
