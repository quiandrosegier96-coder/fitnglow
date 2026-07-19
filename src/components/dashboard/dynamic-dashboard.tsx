"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowDown, ArrowRight, ArrowUp, CalendarDays, ChevronRight, Flame, HeartPulse, Minus, Sparkles, Trophy } from "lucide-react";
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
  Underweight: "bg-sky-50 text-sky-800",
  Healthy: "bg-emerald-50 text-emerald-800",
  Overweight: "bg-orange-50 text-orange-800",
  Obese: "bg-red-50 text-red-800"
};

export function DynamicDashboard() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard", { credentials: "same-origin" });
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

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="1. Dashboard - Overview" title="Dashboard" description="Jouw voortgang, workouts en dagelijkse motivatie in een helder overzicht." />
      {!query.data ? <DashboardSkeleton /> : <DashboardContent data={query.data} />}
    </div>
  );
}

function DashboardContent({ data }: { data: DashboardData }) {
  const TrendIcon = data.weightProgress.trendDirection === "down" ? ArrowDown : data.weightProgress.trendDirection === "up" ? ArrowUp : Minus;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <Card className="grid min-h-[260px] gap-5 overflow-hidden p-0 md:grid-cols-[1fr_260px]">
          <div className="p-6">
            <Badge className="bg-secondary/35 text-primary">Challenge van vandaag</Badge>
            <h2 className="mt-5 max-w-md font-serif text-3xl font-extrabold leading-tight">Wall sit tijdens het tanden poetsen</h2>
            <p className="mt-3 max-w-md text-sm font-medium leading-6 text-muted">{data.quote}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/workouts">Start challenge</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/progress">Log gewicht</Link>
              </Button>
            </div>
          </div>
          <WorkoutIllustration />
        </Card>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold">Jouw vooruitgang</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/progress">Bekijk alles <ChevronRight size={15} /></Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SmallMetric title="Workouts" value={`${data.currentStreak}`} suffix="streak" icon={<CalendarDays size={18} />} />
            <SmallMetric title="Voeding" value={`${data.calories.total}`} suffix="kcal" icon={<HeartPulse size={18} />} />
            <SmallMetric title="Gewicht" value={`${data.weightProgress.difference > 0 ? "+" : ""}${data.weightProgress.difference}`} suffix="kg" icon={<TrendIcon size={18} />} />
            <SmallMetric title="Level" value={`${data.level.level}`} suffix={`${data.level.xp} XP`} icon={<Trophy size={18} />} progress={data.level.progressToNextLevel} />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[.95fr_1.05fr]">
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <CardTitle className="text-xl">BMI</CardTitle>
              <Badge className={bmiTone[data.bmi.category] ?? "bg-secondary/30"}>{data.bmi.bmi ? data.bmi.category : "Vul lengte in"}</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
              <div className="grid h-32 w-32 place-items-center rounded-full border-[10px] border-secondary/45 bg-background">
                <div className="text-center">
                  <p className="text-3xl font-black">{data.bmi.bmi || "--"}</p>
                  <p className="text-xs font-bold text-muted">BMI</p>
                </div>
              </div>
              <div className="grid content-center gap-3">
                <InfoRow label="Huidig gewicht" value={`${data.weightProgress.currentWeight || 0} kg`} />
                <InfoRow label="Gezonde range" value={data.bmi.healthyRange} />
                <InfoRow label="Doel bereikt over" value={`${data.bmi.daysUntilTarget} dagen`} />
                <ProgressBar value={data.bmi.progressPercentage} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center justify-between">
              <CardTitle className="text-xl">Gewicht trend</CardTitle>
              <Activity className="text-primary" />
            </div>
            <MiniWeightChart data={data.weightHistory} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoTile label="Start" value={`${data.weightProgress.startingWeight || 0} kg`} />
              <InfoTile label="Nu" value={`${data.weightProgress.currentWeight || 0} kg`} />
            </div>
          </Card>
        </section>
      </div>

      <aside className="space-y-5">
        <Card className="p-5">
          <p className="text-sm font-extrabold">Jouw streak</p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-4xl font-black">{data.currentStreak}</p>
              <p className="text-xs font-bold text-muted">dagen op rij</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/35 text-primary">
              <Flame />
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-extrabold">Calories</p>
          <div className="mt-4 space-y-3">
            <InfoRow label="Vandaag" value={`${data.calories.today} kcal`} />
            <InfoRow label="Week" value={`${data.calories.week} kcal`} />
            <InfoRow label="Maand" value={`${data.calories.month} kcal`} />
            <InfoRow label="Totaal" value={`${data.calories.total} kcal`} />
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-extrabold">Achievements</p>
            <Sparkles size={17} className="text-primary" />
          </div>
          {data.empty.achievements ? (
            <p className="rounded-2xl bg-secondary/20 p-3 text-sm font-semibold text-muted">Start met workouts en logs om badges te ontgrendelen.</p>
          ) : (
            <div className="space-y-4">
              {data.achievements.slice(0, 4).map((item) => (
                <div key={item.code}>
                  <div className="mb-2 flex justify-between text-xs font-bold">
                    <span>{item.title}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <ProgressBar value={item.progress} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="bg-secondary/20">
          <p className="text-sm font-extrabold">Quick actions</p>
          <div className="mt-4 grid gap-2">
            {data.quickActions.map((action) => (
              <Button key={action.href} asChild variant="secondary" className="justify-between bg-card">
                <Link href={action.href}>{action.label}<ArrowRight size={15} /></Link>
              </Button>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}

function WorkoutIllustration() {
  return (
    <div className="relative min-h-[230px] bg-gradient-to-br from-[#fff2f5] to-[#f9d9e2]">
      <div className="absolute bottom-8 left-1/2 h-2 w-36 -translate-x-1/2 rounded-full bg-primary/12" />
      <div className="absolute bottom-11 left-1/2 h-24 w-20 -translate-x-1/2 rounded-[28px] bg-[#6f897d]" />
      <div className="absolute bottom-32 left-1/2 h-16 w-12 -translate-x-1/2 rounded-full bg-[#f0b58e]" />
      <div className="absolute bottom-10 left-[42%] h-24 w-4 rotate-12 rounded-full bg-[#2f2f2f]" />
      <div className="absolute bottom-10 left-[56%] h-24 w-4 -rotate-12 rounded-full bg-[#2f2f2f]" />
      <div className="absolute bottom-20 left-[36%] h-4 w-24 rounded-full bg-[#6f897d]" />
      <div className="absolute bottom-20 right-[21%] h-4 w-20 rounded-full bg-[#6f897d]" />
      <div className="absolute bottom-7 right-10 h-20 w-24 rounded-[20px] border border-primary/12 bg-white/70" />
    </div>
  );
}

function SmallMetric({ title, value, suffix, icon, progress }: { title: string; value: string; suffix: string; icon: React.ReactNode; progress?: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary/25 text-primary">{icon}</div>
        {typeof progress === "number" && <span className="text-xs font-bold text-muted">{progress}%</span>}
      </div>
      <p className="mt-4 text-xs font-bold text-muted">{title}</p>
      <p className="mt-1 text-2xl font-black">{value} <span className="text-xs font-bold text-muted">{suffix}</span></p>
      {typeof progress === "number" && <ProgressBar className="mt-3" value={progress} />}
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-muted">{label}</span>
      <span className="font-extrabold">{value}</span>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background p-3">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function MiniWeightChart({ data }: { data: Array<{ date: string; weight: number }> }) {
  const points = data.slice(-8);
  if (!points.length) {
    return <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-primary/20 bg-background text-sm font-semibold text-muted">Nog geen metingen</div>;
  }

  const weights = points.map((point) => point.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = Math.max(1, max - min);
  const polyline = points
    .map((point, index) => {
      const x = points.length === 1 ? 10 : 10 + (index / (points.length - 1)) * 80;
      const y = 85 - ((point.weight - min) / range) * 65;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-40 w-full overflow-visible rounded-2xl bg-background">
      <polyline points={polyline} fill="none" stroke="#F87AA2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => {
        const x = points.length === 1 ? 10 : 10 + (index / (points.length - 1)) * 80;
        const y = 85 - ((point.weight - min) / range) * 65;
        return <circle key={`${point.date}-${index}`} cx={x} cy={y} r="2.5" fill="#F87AA2" />;
      })}
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
      <Card className="h-[260px] animate-pulse" />
      <Card className="h-[260px] animate-pulse" />
    </div>
  );
}
