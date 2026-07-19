import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  achievementProgress,
  calculateBmiDashboard,
  calculateCurrentStreak,
  calculateLevel,
  calculateWeightProgress,
  calculateXp,
  startOfDay,
  startOfMonth,
  startOfWeek,
  sumCalories,
  type BodyProfileRow,
  type CompletedWorkoutRow,
  type WeightRow
} from "@/lib/dashboard-calculations";

const fallbackQuote = "Small precise actions become visible progress.";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json(emptyDashboard());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(emptyDashboard());

  const [
    bodyProfile,
    completedWorkouts,
    weightHistory,
    mealLogs,
    waterLogs,
    userAchievementRows,
    quoteRows
  ] = await Promise.all([
    supabase.from("body_profiles").select("height_cm,current_weight_kg,target_weight_kg,bmi,bmi_category,onboarding_completed").eq("user_id", user.id).maybeSingle(),
    supabase.from("completed_workouts").select("calories,completed_at,completion_percentage").eq("user_id", user.id).order("completed_at", { ascending: false }),
    supabase.from("weight_history").select("weight_kg,logged_at").eq("user_id", user.id).order("logged_at", { ascending: true }),
    supabase.from("meal_logs").select("id,logged_at").eq("user_id", user.id),
    supabase.from("water_logs").select("logged_at").eq("user_id", user.id),
    supabase.from("achievements").select("id").eq("user_id", user.id),
    supabase.from("motivational_quotes").select("body").eq("is_active", true)
  ]);

  const workouts = (completedWorkouts.data ?? []) as CompletedWorkoutRow[];
  const weights = (weightHistory.data ?? []) as WeightRow[];
  const body = (bodyProfile.data ?? null) as BodyProfileRow | null;
  const meals = mealLogs.data ?? [];
  const water = waterLogs.data ?? [];
  const currentStreak = calculateCurrentStreak(workouts);
  const weightProgress = calculateWeightProgress(weights, body);
  const bmi = calculateBmiDashboard(body);
  const unlockedAchievements = userAchievementRows.data?.length ?? 0;
  const xp = calculateXp({
    workouts: workouts.length,
    weightLogs: weights.length,
    mealLogs: meals.length,
    achievements: unlockedAchievements,
    waterLogs: water.length
  });
  const level = calculateLevel(xp);
  const waterDays = new Set(water.map((row) => new Date(row.logged_at).toISOString().slice(0, 10))).size;
  const achievements = achievementProgress({
    workoutCount: workouts.length,
    streak: currentStreak,
    weightLost: Math.max(0, -weightProgress.difference),
    mealCount: meals.length,
    waterDays
  });
  const quotes = quoteRows.data ?? [];
  const quote = pickDailyQuote(quotes.map((item) => item.body).filter(Boolean));

  await supabase.from("streaks").upsert({
    user_id: user.id,
    current_count: currentStreak,
    longest_count: currentStreak,
    last_completed_on: workouts[0]?.completed_at ? new Date(workouts[0].completed_at).toISOString().slice(0, 10) : null
  });

  return NextResponse.json({
    currentStreak,
    calories: {
      today: sumCalories(workouts, startOfDay()),
      week: sumCalories(workouts, startOfWeek()),
      month: sumCalories(workouts, startOfMonth()),
      total: sumCalories(workouts)
    },
    weightProgress,
    bmi,
    level,
    quote,
    achievements,
    quickActions: [
      { href: "/workouts", label: "Start Workout" },
      { href: "/recipes", label: "Recipes" },
      { href: "/progress", label: "Log Weight" },
      { href: "/tips", label: "Today's Tip" }
    ],
    empty: {
      workouts: workouts.length === 0,
      achievements: achievements.every((item) => !item.unlocked),
      weight: weights.length === 0
    }
  });
}

function pickDailyQuote(quotes: string[]) {
  if (!quotes.length) return fallbackQuote;
  const dayKey = Math.floor(Date.now() / 86_400_000);
  return quotes[dayKey % quotes.length];
}

function emptyDashboard() {
  const level = calculateLevel(0);
  return {
    currentStreak: 0,
    calories: { today: 0, week: 0, month: 0, total: 0 },
    weightProgress: { startingWeight: 0, currentWeight: 0, difference: 0, trend: "Stable", trendDirection: "stable" },
    bmi: { bmi: 0, category: "Healthy", healthyRange: "Complete onboarding", targetWeight: 0, daysUntilTarget: 0, progressPercentage: 0 },
    level,
    quote: fallbackQuote,
    achievements: [],
    quickActions: [
      { href: "/workouts", label: "Start Workout" },
      { href: "/recipes", label: "Recipes" },
      { href: "/progress", label: "Log Weight" },
      { href: "/tips", label: "Today's Tip" }
    ],
    empty: { workouts: true, achievements: true, weight: true }
  };
}
