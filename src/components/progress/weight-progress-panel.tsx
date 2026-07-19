"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LineChart, LockKeyhole, Save } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type WeightLog = { weightKg: number; loggedAt: string };
type ApiError = Error & { status?: number };

export function WeightProgressPanel() {
  const [weightKg, setWeightKg] = useState("");
  const [saving, setSaving] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["weight-logs"],
    queryFn: async () => {
      const response = await fetch("/api/progress/weight", { credentials: "same-origin" });
      if (response.status === 401) {
        setAuthRequired(true);
        const error = new Error("Login required to load weight history.") as ApiError;
        error.status = 401;
        throw error;
      }
      if (!response.ok) throw new Error("Could not load weight logs");
      setAuthRequired(false);
      const payload = await response.json() as { logs: WeightLog[] };
      return payload.logs;
    },
    retry: (failureCount, error) => (error as ApiError).status !== 401 && failureCount < 2
  });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel("weight-progress-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "weight_logs" }, () => query.refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  async function saveWeight(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/progress/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ weightKg: Number(weightKg) })
    });
    setSaving(false);
    if (response.status === 401) {
      setAuthRequired(true);
      toast({ title: "Login needed", description: "Log in first, then your weight will sync with the dashboard." });
      router.push("/login?redirectedFrom=/progress");
      return;
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Could not save weight" }));
      const description = payload.error ?? "Check the value and try again.";
      toast({
        title: description.includes("Database setup incomplete") ? "Database table missing" : "Weight not saved",
        description
      });
      return;
    }
    setWeightKg("");
    await query.refetch();
    toast({ title: "Weight saved", description: "Dashboard, BMI, charts, and statistics are updating now." });
  }

  const chartData = (query.data ?? []).map((log) => ({
    date: new Date(log.loggedAt).toLocaleDateString("en", { month: "short", day: "numeric" }),
    weight: log.weightKg
  }));

  if (authRequired) {
    return (
      <Card className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-secondary/35 text-primary">
          <LockKeyhole />
        </div>
        <CardTitle>Login required</CardTitle>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Log in to save weight measurements and instantly update your dashboard, BMI, charts, achievements, and statistics.
        </p>
        <Button asChild className="mt-6">
          <Link href="/login?redirectedFrom=/progress">Go to login</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Weight trend</CardTitle>
          <LineChart className="text-primary" />
        </div>
        <div className="h-80">
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="weightGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F87AA2" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#FDC7D7" stopOpacity={0.06} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(248,122,162,.18)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip contentStyle={{ borderRadius: 18, border: "1px solid #FDC7D7" }} />
              <Area type="monotone" dataKey="weight" stroke="#F87AA2" strokeWidth={3} fill="url(#weightGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {!chartData.length && <p className="mt-4 rounded-2xl bg-secondary/25 p-4 text-sm font-semibold text-muted">No weight logs yet. Add your first measurement to start the chart.</p>}
      </Card>
      <Card>
        <CardTitle>Log weight</CardTitle>
        <form className="mt-5 space-y-3" onSubmit={saveWeight}>
          <Input value={weightKg} onChange={(event) => setWeightKg(event.target.value)} placeholder="Weight (kg)" inputMode="decimal" type="number" min={25} max={350} step="0.1" required />
          <Button className="w-full" disabled={saving} type="submit"><Save size={17} /> {saving ? "Saving" : "Save weight"}</Button>
        </form>
        <p className="mt-4 text-sm leading-6 text-muted">The newest `weight_logs` record is the source of truth for current weight, BMI, goal progress, charts, and dashboard cards.</p>
      </Card>
    </div>
  );
}
