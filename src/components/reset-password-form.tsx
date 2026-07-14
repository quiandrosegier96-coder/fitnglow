"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>();

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setMessage("Add Supabase environment variables to enable password reset.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage(error.message);
    else router.push("/dashboard");
  }

  return (
    <Card className="fade-in">
      <CardTitle>Choose a new password</CardTitle>
      <p className="mt-2 text-sm leading-6 text-muted">Your reset link has opened a secure Supabase session.</p>
      <form onSubmit={updatePassword} className="mt-6 space-y-4">
        <Input value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} placeholder="New password" type="password" required />
        {message && <p className="rounded-2xl bg-secondary/35 p-3 text-sm font-semibold text-muted">{message}</p>}
        <Button className="w-full" type="submit">Update password</Button>
      </form>
    </Card>
  );
}
