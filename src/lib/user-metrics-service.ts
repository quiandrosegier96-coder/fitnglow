import type { SupabaseClient } from "@supabase/supabase-js";
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
  type CompletedWorkoutRow,
  type WeightRow
} from "@/lib/dashboard-calculations";

export type UserBodyProfileMetrics = {
  height_cm: number | null;
  target_weight_kg: number | null;
};

export class UserMetricsService {
  constructor(private readonly supabase: SupabaseClient) {}

  async getCurrentUserWeight(userId: string) {
    const { data } = await this.supabase
      .from("weight_logs")
      .select("weight_kg,logged_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return data ? { weightKg: Number(data.weight_kg), loggedAt: String(data.logged_at) } : null;
  }

  async getWeightHistory(userId: string) {
    const { data } = await this.supabase
      .from("weight_logs")
      .select("weight_kg,logged_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: true });

    return ((data ?? []) as WeightRow[]).map((row) => ({
      weight_kg: Number(row.weight_kg),
      logged_at: row.logged_at
    }));
  }

  async getBodyProfile(userId: string) {
    const { data } = await this.supabase
      .from("body_profiles")
      .select("height_cm,target_weight_kg,onboarding_completed")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      return {
        height_cm: data.height_cm === null ? null : Number(data.height_cm),
        target_weight_kg: data.target_weight_kg === null ? null : Number(data.target_weight_kg),
        onboarding_completed: Boolean(data.onboarding_completed)
      };
    }

    const { data: profile } = await this.supabase
      .from("profiles")
      .select("height_cm")
      .eq("id", userId)
      .maybeSingle();

    return profile?.height_cm
      ? {
          height_cm: Number(profile.height_cm),
          target_weight_kg: null,
          onboarding_completed: false
        }
      : null;
  }

  async getDashboardMetrics(userId: string) {
    const [bodyProfile, completedWorkouts, weightLogs, mealLogs, waterLogs, userAchievements, quoteRows] =
      await Promise.all([
        this.getBodyProfile(userId),
        this.supabase.from("completed_workouts").select("calories,completed_at,completion_percentage").eq("user_id", userId).order("completed_at", { ascending: false }),
        this.getWeightHistory(userId),
        this.supabase.from("meal_logs").select("id,logged_at").eq("user_id", userId),
        this.supabase.from("water_logs").select("logged_at").eq("user_id", userId),
        this.supabase.from("achievements").select("id").eq("user_id", userId),
        this.supabase.from("motivational_quotes").select("body").eq("is_active", true)
      ]);

    const workouts = ((completedWorkouts.data ?? []) as CompletedWorkoutRow[]).map((row) => ({
      calories: Number(row.calories ?? 0),
      completed_at: row.completed_at,
      completion_percentage: row.completion_percentage
    }));
    const meals = mealLogs.data ?? [];
    const water = waterLogs.data ?? [];
    const currentWeight = weightLogs.at(-1)?.weight_kg ?? 0;
    const metricsProfile = {
      height_cm: bodyProfile?.height_cm ?? null,
      target_weight_kg: bodyProfile?.target_weight_kg ?? null,
      latestWeightKg: currentWeight || null
    };
    const currentStreak = calculateCurrentStreak(workouts);
    const weightProgress = calculateWeightProgress(weightLogs, metricsProfile);
    const bmi = calculateBmiDashboard(metricsProfile);
    const unlockedAchievements = userAchievements.data?.length ?? 0;
    const xp = calculateXp({
      workouts: workouts.length,
      weightLogs: weightLogs.length,
      mealLogs: meals.length,
      achievements: unlockedAchievements,
      waterLogs: water.length
    });
    const level = calculateLevel(xp);
    const waterDays = new Set(water.map((row) => new Date(String(row.logged_at)).toISOString().slice(0, 10))).size;
    const achievements = achievementProgress({
      workoutCount: workouts.length,
      streak: currentStreak,
      weightLost: Math.max(0, -weightProgress.difference),
      mealCount: meals.length,
      waterDays
    });
    const quote = pickDailyQuote((quoteRows.data ?? []).map((item) => String(item.body)).filter(Boolean));

    await this.supabase.from("streaks").upsert({
      user_id: userId,
      current_count: currentStreak,
      longest_count: currentStreak,
      last_completed_on: workouts[0]?.completed_at ? new Date(workouts[0].completed_at).toISOString().slice(0, 10) : null
    });

    return {
      currentWeight,
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
      weightHistory: weightLogs.map((row) => ({
        date: row.logged_at,
        weight: row.weight_kg
      })),
      empty: {
        workouts: workouts.length === 0,
        achievements: achievements.every((item) => !item.unlocked),
        weight: weightLogs.length === 0
      }
    };
  }
}

export async function getCurrentUserWeight(supabase: SupabaseClient, userId: string) {
  return new UserMetricsService(supabase).getCurrentUserWeight(userId);
}

function pickDailyQuote(quotes: string[]) {
  if (!quotes.length) return "Small precise actions become visible progress.";
  const dayKey = Math.floor(Date.now() / 86_400_000);
  return quotes[dayKey % quotes.length];
}
