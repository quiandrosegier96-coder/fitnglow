"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowDown, ArrowRight, ArrowUp, CalendarDays, Flame, HeartPulse, Minus, Quote, Scale, Sparkles, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PageHeader } from "@/components/page-header";

type DashboardData = {
  currentStreak: number;
  calories: { today: number; week: number; month: number; total: number };
  weightProgress: { difference: number; trend: string; trendDirection: "down" | "up" | "stable"; startingWeight: number; currentWeight: number };
  bmi: { bmi: number; category: string; healthyRange: string; daysUntilTarget: number; progressPercentage: number };
  level: { level: number; xp: number; nextLevelXp: number; progressToNextLevel: number };
  quote: string;
  achievements: Array<{ code: string; title: string; progress: number; unlocked: boolean }>;
  weightHistory: Array<{ date: string; weight: number }>;
  quickActions: Array<{ href: string; label: string }>;
  empty: { workouts: boolean; achievements: boolean; weight: boolean };
};

const bmiTone: Record<string, string> = {
  Underweight: "border-sky-300 bg-sky-50 text-sky-950 dark:bg-sky-950/35 dark:text-sky-100",
  Healthy: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/35 dark:text-emerald-100",
  Overweight: "border-orange-300 bg-orange-50 text-orange-950 dark:bg-orange-950/35 dark:text-orange-100",
  Obese: "border-red-300 bg-red-50 text-red-950 dark:bg-red-950/35 dark:text-red-100"
};

export function DynamicDashboard() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Dashboard could not load");
      return response.json() as Promise<DashboardData>;
    },
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "completed_workouts" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "weight_logs" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "meal_logs" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "water_logs" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "achievements" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "body_profiles" }, () => query.refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  const data = query.data;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Good evening" title="Your glow dashboard" description="Live progress from your workouts, body profile, logs, achievements, and daily motivation." />
      {!data ? <DashboardSkeleton /> : <DashboardContent data={data} />}
    </div>
  );
}

function DashboardContent({ data }: { data: DashboardData }) {
  const TrendIcon = data.weightProgress.trendDirection === "down" ? ArrowDown : data.weightProgress.trendDirection === "up" ? ArrowUp : Minus;
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LiveMetric title="Current Streak" value={`${data.currentStreak}`} suffix="days" icon={<Flame />} hint={data.empty.workouts ? "Complete your first workout to start a streak." : "Consecutive workout days"} />
        <LiveMetric title="Calories Burned" value={`${data.calories.total}`} suffix="kcal" icon={<HeartPulse />} hint={`Today ${data.calories.today} · Week ${data.calories.week} · Month ${data.calories.month}`} />
        <LiveMetric title="Weight Progress" value={`${data.weightProgress.difference > 0 ? "+" : ""}${data.weightProgress.difference}`} suffix="kg" icon={<TrendIcon />} hint={data.empty.weight ? "Log weight to start tracking." : data.weightProgress.trend} />
        <LiveMetric title="Level" value={`${data.level.level}`} suffix={`XP ${data.level.xp}`} icon={<Trophy />} hint={`${data.level.progressToNextLevel}% to level ${data.level.level + 1}`} progress={data.level.progressToNextLevel} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="rose-gold text-white">
          <Quote className="mb-4" />
          <h2 className="font-serif text-4xl font-bold">Today’s motivation</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-white/90">{data.quote}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-4">
            {data.quickActions.map((action) => (
              <Button key={action.href} asChild variant="secondary" className="bg-white/88">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </Card>

        <Card className={bmiTone[data.bmi.category] ?? "bg-card"}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] opacity-75">BMI</p>
              <CardTitle className="mt-3 text-5xl">{data.bmi.bmi || "--"}</CardTitle>
            </div>
            <Activity />
          </div>
          <div className="mt-5 grid gap-3">
            <Badge className="w-fit bg-white/70 text-foreground">{data.bmi.category}</Badge>
            <p className="text-sm font-bold">Healthy range: {data.bmi.healthyRange}</p>
            <p className="text-sm font-bold">Days until target: {data.bmi.daysUntilTarget}</p>
            <ProgressBar value={data.bmi.progressPercentage} />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Achievements</CardTitle>
            <Badge>Real progress</Badge>
          </div>
          {data.achievements.length === 0 || data.empty.achievements ? (
            <p className="rounded-2xl bg-secondary/25 p-4 text-sm font-semibold text-muted">No achievements yet. Complete a workout, log meals, or build a streak to unlock your first badge.</p>
          ) : (
            <div className="space-y-4">
              {data.achievements.map((item) => (
                <div key={item.code}>
                  <div className="mb-2 flex items-center justify-between text-sm font-bold">
                    <span className="inline-flex items-center gap-2"><Sparkles size={17} className="text-primary" />{item.title}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <ProgressBar value={item.progress} />
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Progress details</CardTitle>
            <Button variant="ghost" asChild><Link href="/progress">Open <ArrowRight size={16} /></Link></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Starting weight" value={`${data.weightProgress.startingWeight || 0} kg`} icon={<Scale />} />
            <Detail label="Current weight" value={`${data.weightProgress.currentWeight || 0} kg`} icon={<Scale />} />
            <Detail label="Workout frequency" value={`${data.currentStreak} streak`} icon={<CalendarDays />} />
            <Detail label="Total calories" value={`${data.calories.total} kcal`} icon={<Flame />} />
          </div>
          <div className="mt-5 rounded-2xl bg-secondary/20 p-4">
            <p className="text-sm font-bold text-muted">Chart source</p>
            <p className="mt-1 font-semibold">{data.weightHistory.length} weight log entries synced from Supabase.</p>
          </div>
        </Card>
      </section>
    </>
  );
}

function LiveMetric({ title, value, suffix, icon, hint, progress }: { title: string; value: string; suffix: string; icon: React.ReactNode; hint: string; progress?: number }) {
  return (
    <Card className="hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-muted">{title}</p>
          <p className="mt-2 text-3xl font-black">{value} <span className="text-sm text-muted">{suffix}</span></p>
        </div>
        <div className="rounded-2xl bg-secondary/45 p-3 text-primary">{icon}</div>
      </div>
      <p className="mt-4 text-sm font-semibold text-muted">{hint}</p>
      {typeof progress === "number" && <ProgressBar value={progress} className="mt-3" />}
    </Card>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-secondary/25 p-4">
      <div className="text-primary">{icon}</div>
      <p className="mt-3 text-sm font-bold text-muted">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => <Card key={index} className="h-36 animate-pulse" />)}
    </div>
  );
}
