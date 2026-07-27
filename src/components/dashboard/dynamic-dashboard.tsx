"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowRight, CheckCircle2, Flame, Loader2, Play, Ruler, Save, Sparkles, Square, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/ui/toast";
import { ContentRating } from "@/components/workouts/content-rating";
import { ContentFavoriteButton } from "@/components/content-favorite-button";

type DashboardData = {
  currentStreak: number;
  calories: { today: number; week: number; month: number; total: number; stravaTotal: number; workoutTotal: number };
  weightProgress: { difference: number; trend: string; trendDirection: "down" | "up" | "stable"; startingWeight: number; currentWeight: number };
  bmi: { bmi: number; category: string; healthyRange: string; targetWeight: number; daysUntilTarget: number; progressPercentage: number };
  level: { level: number; xp: number; nextLevelXp: number; progressToNextLevel: number };
  quote: string;
  achievements: Array<{ code: string; title: string; progress: number; unlocked: boolean }>;
  weightHistory: Array<{ date: string; weight: number }>;
  measurementHistory: Array<{ date: string; waist: number | null; chest: number | null; hip: number | null; upperArm: number | null; upperLeg: number | null; calf: number | null }>;
  dailyChallenge: {
    id: string;
    title: string;
    description: string | null;
    coach_name: string;
    challenge_date: string;
    video_url: string;
    thumbnail_url: string | null;
    duration_minutes: number | null;
    started_at: string | null;
    completed_at: string | null;
  } | null;
  quickActions: Array<{ href: string; label: string }>;
  empty: { workouts: boolean; achievements: boolean; weight: boolean };
};

export function DynamicDashboard() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard", { credentials: "same-origin" });
      if (!response.ok) throw new Error("Dashboard could not load");
      return response.json() as Promise<DashboardData>;
    },
    refetchOnWindowFocus: true,
    refetchInterval: 15_000
  });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "completed_workouts" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_challenges" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_challenge_completions" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "strava_activities" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "weight_logs" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "measurements" }, () => query.refetch())
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
      {!query.data ? <DashboardSkeleton /> : <DashboardContent data={query.data} onRefresh={() => query.refetch()} />}
    </div>
  );
}

function DashboardContent({ data, onRefresh }: { data: DashboardData; onRefresh: () => Promise<unknown> }) {
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [targetWeightModalOpen, setTargetWeightModalOpen] = useState(false);
  const [centimeterModalOpen, setCentimeterModalOpen] = useState(false);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <DailyChallengeCard challenge={data.dailyChallenge} quote={data.quote} onRefresh={onRefresh} />

        <section className="space-y-5">
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <CardTitle className="text-xl">Gewicht grafiek</CardTitle>
              <Activity className="text-primary" />
            </div>
            <MiniWeightChart data={data.weightHistory} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoTile label="Huidig gewicht" value={`${data.weightProgress.currentWeight || 0} kg`} />
              <InfoTile label="Streefgewicht" value={data.bmi.targetWeight ? `${data.bmi.targetWeight} kg` : "Niet ingesteld"} />
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setTargetWeightModalOpen(true)}>
                Streefgewicht instellen
              </Button>
              <Button type="button" onClick={() => setWeightModalOpen(true)}>
                Gewicht ingeven
              </Button>
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center justify-between">
              <CardTitle className="text-xl">Centimeters grafiek</CardTitle>
              <Ruler className="text-primary" />
            </div>
            <CentimeterChart data={data.measurementHistory} />
            <div className="mt-4 flex justify-end">
              <Button type="button" onClick={() => setCentimeterModalOpen(true)}>
                Centimeters ingeven
              </Button>
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
            <InfoRow label="Strava" value={`${data.calories.stravaTotal} kcal`} />
            <InfoRow label="Workouts" value={`${data.calories.workoutTotal} kcal`} />
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

      </aside>
      <DashboardSignatureQuote />
      <WeightModal open={weightModalOpen} onClose={() => setWeightModalOpen(false)} onSaved={onRefresh} />
      <TargetWeightModal open={targetWeightModalOpen} currentTarget={data.bmi.targetWeight || null} onClose={() => setTargetWeightModalOpen(false)} onSaved={onRefresh} />
      <CentimeterModal open={centimeterModalOpen} onClose={() => setCentimeterModalOpen(false)} onSaved={onRefresh} />
    </div>
  );
}

function DashboardSignatureQuote() {
  return (
    <Card className="xl:col-span-2 overflow-hidden border-primary/10 bg-gradient-to-r from-white via-[#fff8f9] to-[#fde8ef] px-8 py-7 text-center shadow-soft">
      <div className="mx-auto mb-4 flex w-fit items-center gap-3 rounded-full bg-secondary/35 px-4 py-2 text-primary">
        <Sparkles size={18} />
        <span className="text-xs font-black uppercase tracking-[0.24em] text-primary/80">Fit & Glow</span>
      </div>
      <p className="mx-auto max-w-5xl whitespace-normal font-serif text-[clamp(2rem,4.2vw,4rem)] font-semibold italic leading-tight text-[#1f1f1f] lg:whitespace-nowrap">
        Kleine gewoontes,{" "}
        <span className="bg-gradient-to-r from-primary via-[#f3a0b8] to-[#d9a06f] bg-clip-text text-transparent">grote veranderingen</span>
      </p>
      <div className="mx-auto mt-5 h-px w-56 max-w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
    </Card>
  );
}

function DailyChallengeCard({ challenge, quote, onRefresh }: { challenge: DashboardData["dailyChallenge"]; quote: string; onRefresh: () => Promise<unknown> }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(Boolean(challenge?.started_at));
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setSessionStarted(Boolean(challenge?.started_at));
    setTimerRunning(false);
    setElapsedSeconds(0);
  }, [challenge?.id, challenge?.started_at]);

  useEffect(() => {
    if (!timerRunning || challenge?.completed_at) return;
    const interval = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, challenge?.completed_at]);

  async function updateProgress(action: "start" | "complete" | "stop") {
    if (!challenge) return;
    setSavingProgress(true);
    try {
      const response = await fetch(`/api/daily-challenges/${challenge.id}/progress`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (response.ok) {
        if (action === "start") setSessionStarted(true);
        if (action === "complete") setTimerRunning(false);
        if (action === "stop") {
          videoRef.current?.pause();
          if (videoRef.current) videoRef.current.currentTime = 0;
          setSessionStarted(false);
          setTimerRunning(false);
          setElapsedSeconds(0);
        }
        await onRefresh();
      }
    } finally {
      setSavingProgress(false);
    }
  }

  if (!challenge) {
    return (
      <Card className="relative grid min-h-[280px] gap-5 overflow-hidden bg-gradient-to-br from-card via-secondary/15 to-primary/10 p-0 md:grid-cols-[1fr_260px]">
        <div className="relative z-10 flex flex-col justify-center p-7 md:p-8">
          <Badge className="w-fit bg-white/80 text-primary shadow-sm">
            <Sparkles size={14} />
            Vandaag is een rustdag
          </Badge>
          <blockquote className="mt-6 max-w-xl font-serif text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            “Rust is geen stap terug. Het is waar je lichaam kracht verzamelt voor morgen.”
          </blockquote>
          <div className="mt-5 flex items-center gap-3">
            <span className="h-px w-10 bg-primary/60" />
            <p className="text-sm font-bold text-muted">Adem uit, herstel en wees trots op hoe ver je al bent.</p>
          </div>
        </div>
        <WorkoutIllustration />
      </Card>
    );
  }

  const completed = Boolean(challenge.completed_at);
  const started = sessionStarted || Boolean(challenge.started_at);
  const durationText = challenge.duration_minutes ? `${challenge.duration_minutes} min` : "Vandaag";

  return (
    <Card className="relative min-h-[272px] overflow-hidden p-0">
      {!started ? (
        <div className="group relative min-h-[430px] w-full overflow-hidden sm:min-h-[480px]">
          {challenge.thumbnail_url ? (
            <img src={challenge.thumbnail_url} alt={challenge.title} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/35 via-secondary/35 to-[#e0a579]/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#171316]/88 via-[#241b20]/58 to-[#171316]/12" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="max-w-3xl">
              <Badge className="bg-white text-[#221d20] shadow-sm">Daily challenge</Badge>
              <h2 className="mt-5 font-serif text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {challenge.title}
              </h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/90 sm:text-lg">
                {challenge.description || "Een nieuwe challenge van Joyce om vandaag sterk, energiek en met aandacht voor jezelf aan de slag te gaan."}
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="rounded-full bg-white/18 px-4 py-2.5 text-sm font-extrabold text-white backdrop-blur-md">{durationText}</span>
                <span className="rounded-full bg-white/18 px-4 py-2.5 text-sm font-extrabold text-white backdrop-blur-md">Voor elk niveau</span>
                <span className="rounded-full bg-white/18 px-4 py-2.5 text-sm font-extrabold text-white backdrop-blur-md">{challenge.coach_name}</span>
                {completed && <span className="rounded-full bg-emerald-500/85 px-4 py-2.5 text-sm font-extrabold text-white">Voltooid</span>}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" onClick={() => updateProgress("start")} disabled={savingProgress || completed} className="h-13 min-w-52 px-6 text-base">
                  {savingProgress ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                  Start challenge
                </Button>
                <Button
                  type="button"
                  onClick={() => updateProgress("complete")}
                  disabled={savingProgress || completed}
                  variant="outline"
                  className="h-13 border-white/25 bg-white/25 px-6 text-base text-white backdrop-blur-md hover:bg-white/35 hover:text-white"
                >
                  <CheckCircle2 size={18} />
                  {completed ? "Afgevinkt" : "Challenge afvinken"}
                  {!completed && <ArrowRight size={18} />}
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute right-5 top-5">
            <ContentFavoriteButton itemId={challenge.id} />
          </div>
        </div>
      ) : (
        <div className="group relative min-h-[272px] bg-[#1f1f1f]">
          <video
            ref={videoRef}
            className="max-h-[448px] min-h-[272px] w-full object-contain"
            controls
            poster={challenge.thumbnail_url ?? undefined}
            preload="metadata"
            src={challenge.video_url}
            onPlay={() => setTimerRunning(true)}
            onPause={() => setTimerRunning(false)}
            onEnded={() => setTimerRunning(false)}
          />
          <div className="pointer-events-none absolute left-5 top-5 max-w-md rounded-[24px] bg-black/42 p-4 text-white opacity-0 backdrop-blur transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-2xl bg-white/18 px-3 py-1 text-xs font-black">{durationText}</span>
              {!completed && <span className="rounded-2xl bg-white/18 px-3 py-1 text-xs font-black">{formatElapsedTime(elapsedSeconds)}</span>}
              {completed && <span className="rounded-2xl bg-emerald-500/85 px-3 py-1 text-xs font-black">Afgevinkt</span>}
            </div>
            <p className="font-serif text-2xl font-extrabold leading-tight">{challenge.title}</p>
            <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-white/82">{challenge.description || quote}</p>
          </div>
          <div className="pointer-events-none absolute bottom-5 left-5 flex flex-wrap gap-3 opacity-0 transition duration-300 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
            <Button onClick={() => updateProgress("start")} disabled={savingProgress || completed}>
              {savingProgress ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
              Verder doen
            </Button>
            <Button onClick={() => updateProgress("stop")} disabled={savingProgress || completed} variant="outline" className="bg-white/92">
              <Square size={15} />
              Stop challenge
            </Button>
            <Button onClick={() => updateProgress("complete")} disabled={savingProgress || completed} variant={completed ? "secondary" : "outline"} className="bg-white/92">
              <CheckCircle2 size={16} />
              {completed ? "Afgevinkt" : "Vink af"}
            </Button>
          </div>
        </div>
      )}
      {completed && (
        <div className="border-t border-border bg-card p-5">
          <ContentRating itemType="daily_challenge" itemId={challenge.id} interactive />
        </div>
      )}
    </Card>
  );
}

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function WeightModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { toast } = useToast();
  const [weightKg, setWeightKg] = useState("");
  const [loggedDate, setLoggedDate] = useState(todayInputValue());
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/progress/weight", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: Number(weightKg),
          loggedAt: dateInputToIso(loggedDate)
        })
      });
      const payload = await response.json().catch(() => ({ error: "Gewicht kon niet opgeslagen worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Gewicht kon niet opgeslagen worden.");
      toast({ title: "Gewicht opgeslagen", description: "De grafiek is bijgewerkt met je nieuwe meting." });
      setWeightKg("");
      setLoggedDate(todayInputValue());
      await onSaved();
      onClose();
    } catch (error) {
      toast({ title: "Opslaan mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <MetricModal title="Gewicht ingeven" description="Voeg een nieuwe gewichtsmeting toe. De datum wordt opgeslagen en getoond in de grafiek." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Gewicht in kg">
          <Input inputMode="decimal" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} min={25} max={350} required placeholder="Bijv. 78.4" />
        </Field>
        <Field label="Datum">
          <Input type="date" value={loggedDate} onChange={(event) => setLoggedDate(event.target.value)} required />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuleer</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Opslaan
          </Button>
        </div>
      </form>
    </MetricModal>
  );
}

function TargetWeightModal({ open, currentTarget, onClose, onSaved }: { open: boolean; currentTarget: number | null; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { toast } = useToast();
  const [targetWeightKg, setTargetWeightKg] = useState(currentTarget ? String(currentTarget) : "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setTargetWeightKg(currentTarget ? String(currentTarget) : "");
  }, [open, currentTarget]);

  if (!open) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/progress/target-weight", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetWeightKg: Number(targetWeightKg) })
      });
      const payload = await response.json().catch(() => ({ error: "Streefgewicht kon niet opgeslagen worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Streefgewicht kon niet opgeslagen worden.");
      toast({ title: "Streefgewicht opgeslagen", description: "Je dashboard rekent nu met je persoonlijke doelgewicht." });
      await onSaved();
      onClose();
    } catch (error) {
      toast({ title: "Opslaan mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <MetricModal title="Streefgewicht instellen" description="" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Streefgewicht in kg">
          <Input inputMode="decimal" value={targetWeightKg} onChange={(event) => setTargetWeightKg(event.target.value)} min={25} max={350} required placeholder="Bijv. 68" />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuleer</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Opslaan
          </Button>
        </div>
      </form>
    </MetricModal>
  );
}

function CentimeterModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { toast } = useToast();
  const [waistCm, setWaistCm] = useState("");
  const [chestCm, setChestCm] = useState("");
  const [hipCm, setHipCm] = useState("");
  const [upperArmCm, setUpperArmCm] = useState("");
  const [upperLegCm, setUpperLegCm] = useState("");
  const [calfCm, setCalfCm] = useState("");
  const [measuredDate, setMeasuredDate] = useState(todayInputValue());
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/progress/measurements", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waistCm: Number(waistCm),
          chestCm: Number(chestCm),
          hipCm: Number(hipCm),
          upperArmCm: Number(upperArmCm),
          upperLegCm: Number(upperLegCm),
          calfCm: Number(calfCm),
          measuredAt: dateInputToIso(measuredDate)
        })
      });
      const payload = await response.json().catch(() => ({ error: "Centimeters konden niet opgeslagen worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Centimeters konden niet opgeslagen worden.");
      toast({ title: "Centimeters opgeslagen", description: "De centimetergrafiek is bijgewerkt." });
      setWaistCm("");
      setChestCm("");
      setHipCm("");
      setUpperArmCm("");
      setUpperLegCm("");
      setCalfCm("");
      setMeasuredDate(todayInputValue());
      await onSaved();
      onClose();
    } catch (error) {
      toast({ title: "Opslaan mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <MetricModal title="Centimeters ingeven" description="" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Taille cm">
            <Input inputMode="decimal" value={waistCm} onChange={(event) => setWaistCm(event.target.value)} min={40} max={220} required placeholder="Bijv. 80" />
          </Field>
          <Field label="Borst cm">
            <Input inputMode="decimal" value={chestCm} onChange={(event) => setChestCm(event.target.value)} min={40} max={220} required placeholder="Bijv. 92" />
          </Field>
          <Field label="Heup cm">
            <Input inputMode="decimal" value={hipCm} onChange={(event) => setHipCm(event.target.value)} min={40} max={240} required placeholder="Bijv. 98" />
          </Field>
          <Field label="Bovenarm cm">
            <Input inputMode="decimal" value={upperArmCm} onChange={(event) => setUpperArmCm(event.target.value)} min={15} max={90} required placeholder="Bijv. 31" />
          </Field>
          <Field label="Bovenbeen cm">
            <Input inputMode="decimal" value={upperLegCm} onChange={(event) => setUpperLegCm(event.target.value)} min={25} max={120} required placeholder="Bijv. 58" />
          </Field>
          <Field label="Kuit cm">
            <Input inputMode="decimal" value={calfCm} onChange={(event) => setCalfCm(event.target.value)} min={15} max={90} required placeholder="Bijv. 37" />
          </Field>
        </div>
        <Field label="Datum">
          <Input type="date" value={measuredDate} onChange={(event) => setMeasuredDate(event.target.value)} required />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuleer</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Opslaan
          </Button>
        </div>
      </form>
    </MetricModal>
  );
}

function MetricModal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1f1f1f]/35 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[24px] border border-border bg-card p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            {description && <p className="mt-2 text-sm font-medium leading-6 text-muted">{description}</p>}
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Sluit popup">
            <X size={18} />
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-muted">{label}</span>
      {children}
    </label>
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
    return <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-primary/20 bg-background text-sm font-semibold text-muted">Nog geen gewichtsmetingen</div>;
  }

  const chartData = points.map((point) => ({
    date: formatChartDate(point.date),
    weight: point.weight
  }));

  return (
    <div className="h-72 w-full rounded-2xl bg-background p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 14, right: 22, left: 10, bottom: 20 }}>
          <CartesianGrid stroke="#eadde1" strokeDasharray="0" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#8a7b80", fontSize: 12, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: "#d7c7cc" }} label={{ value: "datum", position: "insideBottom", offset: -12, fill: "#8a7b80", fontWeight: 800 }} />
          <YAxis tick={{ fill: "#8a7b80", fontSize: 12, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: "#d7c7cc" }} width={48} label={{ value: "gewicht in kg", angle: -90, position: "insideLeft", fill: "#8a7b80", fontWeight: 800 }} domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #f1e7ea", boxShadow: "0 18px 45px rgba(111, 72, 84, 0.08)" }} formatter={(value) => [`${value} kg`, "Gewicht"]} />
          <Line type="monotone" dataKey="weight" stroke="#F87AA2" strokeWidth={4} dot={{ r: 6, fill: "#F87AA2", strokeWidth: 0 }} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CentimeterChart({
  data
}: {
  data: Array<{ date: string; waist: number | null; chest: number | null; hip: number | null; upperArm: number | null; upperLeg: number | null; calf: number | null }>;
}) {
  const points = data.slice(-8);
  const series = [
    { key: "waist", label: "Taille", color: "#F87AA2" },
    { key: "chest", label: "Borst", color: "#D9A06F" },
    { key: "hip", label: "Heup", color: "#8BC7B1" },
    { key: "upperArm", label: "Bovenarm", color: "#9B8AFB" },
    { key: "upperLeg", label: "Bovenbeen", color: "#F0B45C" },
    { key: "calf", label: "Kuit", color: "#62B6CB" }
  ] as const;
  const values = points.flatMap((point) => [point.waist, point.chest, point.hip, point.upperArm, point.upperLeg, point.calf]).filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (!points.length || !values.length) {
    return <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-primary/20 bg-background text-sm font-semibold text-muted">Nog geen centimetermetingen</div>;
  }

  const chartData = points.map((point) => ({
    date: formatChartDate(point.date),
    waist: point.waist,
    chest: point.chest,
    hip: point.hip,
    upperArm: point.upperArm,
    upperLeg: point.upperLeg,
    calf: point.calf
  }));

  return (
    <div className="h-80 w-full rounded-2xl bg-background p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 14, right: 22, left: 10, bottom: 20 }}>
          <CartesianGrid stroke="#eadde1" strokeDasharray="0" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#8a7b80", fontSize: 12, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: "#d7c7cc" }} label={{ value: "datum", position: "insideBottom", offset: -12, fill: "#8a7b80", fontWeight: 800 }} />
          <YAxis tick={{ fill: "#8a7b80", fontSize: 12, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: "#d7c7cc" }} width={48} label={{ value: "centimeters", angle: -90, position: "insideLeft", fill: "#8a7b80", fontWeight: 800 }} domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #f1e7ea", boxShadow: "0 18px 45px rgba(111, 72, 84, 0.08)" }} formatter={(value, name) => [`${value} cm`, series.find((item) => item.key === name)?.label ?? name]} />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 12, fontWeight: 800, color: "#8a7b80" }} />
          {series.map((item) => (
            <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={3} dot={{ r: 4, fill: item.color, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatChartDate(date: string) {
  return new Date(date).toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit" });
}

function todayInputValue() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function dateInputToIso(date: string) {
  return new Date(`${date}T12:00:00.000`).toISOString();
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
      <Card className="h-[260px] animate-pulse" />
      <Card className="h-[260px] animate-pulse" />
    </div>
  );
}
