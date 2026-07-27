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

  async getMeasurementHistory(userId: string) {
    const { data } = await this.supabase
      .from("measurements")
      .select("waist_cm,chest_cm,hip_cm,upper_arm_cm,upper_leg_cm,calf_cm,measured_at")
      .eq("user_id", userId)
      .order("measured_at", { ascending: true });

    return ((data ?? []) as Array<{ waist_cm: number | null; chest_cm: number | null; hip_cm: number | null; upper_arm_cm: number | null; upper_leg_cm: number | null; calf_cm: number | null; measured_at: string }>).map((row) => ({
      date: row.measured_at,
      waist: row.waist_cm === null ? null : Number(row.waist_cm),
      chest: row.chest_cm === null ? null : Number(row.chest_cm),
      hip: row.hip_cm === null ? null : Number(row.hip_cm),
      upperArm: row.upper_arm_cm === null ? null : Number(row.upper_arm_cm),
      upperLeg: row.upper_leg_cm === null ? null : Number(row.upper_leg_cm),
      calf: row.calf_cm === null ? null : Number(row.calf_cm)
    }));
  }

  async getDashboardMetrics(userId: string) {
    const today = getBelgiumDateKey();
    const [bodyProfile, completedWorkouts, stravaActivities, dailyChallenge, challengeCompletion, weightLogs, measurementLogs, mealLogs, waterLogs, userAchievements, quoteRows] =
      await Promise.all([
        this.getBodyProfile(userId),
        this.supabase.from("completed_workouts").select("calories,completed_at,completion_percentage").eq("user_id", userId).order("completed_at", { ascending: false }),
        this.supabase
          .from("strava_activities")
          .select("id,name,type,sport_type,distance_meters,moving_time_seconds,elapsed_time_seconds,total_elevation_gain,calories,average_speed,average_heartrate,image_url,map_polyline,start_date")
          .eq("user_id", userId)
          .order("start_date", { ascending: false }),
        this.supabase
          .from("daily_challenges")
          .select("id,title,description,coach_name,challenge_date,video_url,thumbnail_url,duration_minutes")
          .eq("challenge_date", today)
          .eq("is_published", true)
          .maybeSingle(),
        this.supabase
          .from("daily_challenge_completions")
          .select("challenge_id,started_at,completed_at")
          .eq("user_id", userId),
        this.getWeightHistory(userId),
        this.getMeasurementHistory(userId),
        this.supabase.from("meal_logs").select("id,logged_at").eq("user_id", userId),
        this.supabase.from("water_logs").select("logged_at").eq("user_id", userId),
        this.supabase.from("achievements").select("id").eq("user_id", userId),
        this.supabase.from("motivational_quotes").select("body").eq("is_active", true)
      ]);

    const workouts = ((completedWorkouts.data ?? []) as CompletedWorkoutRow[]).map((row) => ({
      calories: normalizeCalories(row.calories),
      completed_at: row.completed_at,
      completion_percentage: row.completion_percentage
    }));
    const stravaWorkouts = stravaActivities.error
      ? []
      : ((stravaActivities.data ?? []) as Array<{ calories: number | null; start_date: string }>).map((row) => ({
          calories: normalizeCalories(row.calories),
          completed_at: row.start_date,
          completion_percentage: 100
        }));
    const stravaFeed = stravaActivities.error
      ? []
      : ((stravaActivities.data ?? []) as Array<{
          id: string;
          name: string;
          type: string | null;
          sport_type: string | null;
          distance_meters: number | null;
          moving_time_seconds: number | null;
          elapsed_time_seconds: number | null;
          total_elevation_gain: number | null;
          calories: number | null;
          average_speed: number | null;
          average_heartrate: number | null;
          image_url: string | null;
          map_polyline: string | null;
          start_date: string;
        }>)
          .slice(0, 8)
          .map((row) => ({
            id: row.id,
            name: row.name,
            type: row.sport_type ?? row.type ?? "Activity",
            distanceMeters: Number(row.distance_meters ?? 0),
            movingTimeSeconds: Number(row.moving_time_seconds ?? row.elapsed_time_seconds ?? 0),
            elevationMeters: Number(row.total_elevation_gain ?? 0),
            calories: normalizeCalories(row.calories),
            averageSpeed: Number(row.average_speed ?? 0),
            averageHeartrate: row.average_heartrate === null ? null : Number(row.average_heartrate ?? 0),
            imageUrl: row.image_url,
            mapPolyline: row.map_polyline,
            startDate: row.start_date
          }));
    const challengeWorkouts = (challengeCompletion.data ?? [])
      .filter((item) => item.completed_at)
      .map((item) => ({
        calories: 0,
        completed_at: String(item.completed_at),
        completion_percentage: 100
      }));
    const allActivityRows = [...workouts, ...stravaWorkouts, ...challengeWorkouts];
    const meals = mealLogs.data ?? [];
    const water = waterLogs.data ?? [];
    const currentWeight = weightLogs.at(-1)?.weight_kg ?? 0;
    const metricsProfile = {
      height_cm: bodyProfile?.height_cm ?? null,
      target_weight_kg: bodyProfile?.target_weight_kg ?? null,
      startingWeightKg: (weightLogs[0]?.weight_kg ?? currentWeight) || null,
      latestWeightKg: currentWeight || null
    };
    const currentStreak = calculateCurrentStreak(allActivityRows);
    const weightProgress = calculateWeightProgress(weightLogs, metricsProfile);
    const bmi = calculateBmiDashboard(metricsProfile);
    const unlockedAchievements = userAchievements.data?.length ?? 0;
    const xp = calculateXp({
      workouts: allActivityRows.length,
      weightLogs: weightLogs.length,
      mealLogs: meals.length,
      achievements: unlockedAchievements,
      waterLogs: water.length
    });
    const level = calculateLevel(xp);
    const waterDays = new Set(water.map((row) => new Date(String(row.logged_at)).toISOString().slice(0, 10))).size;
    const achievements = achievementProgress({
      workoutCount: allActivityRows.length,
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
      last_completed_on: allActivityRows[0]?.completed_at ? new Date(allActivityRows[0].completed_at).toISOString().slice(0, 10) : null
    });

    return {
      currentWeight,
      currentStreak,
      calories: {
        today: sumCalories(allActivityRows, startOfDay()),
        week: sumCalories(allActivityRows, startOfWeek()),
        month: sumCalories(allActivityRows, startOfMonth()),
        total: sumCalories(allActivityRows),
        stravaTotal: sumCalories(stravaWorkouts),
        workoutTotal: sumCalories(workouts)
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
      measurementHistory: measurementLogs,
      stravaFeed,
      dailyChallenge: dailyChallenge.error || !dailyChallenge.data ? null : {
        ...dailyChallenge.data,
        started_at: (challengeCompletion.data ?? []).find((item) => item.challenge_id === dailyChallenge.data?.id)?.started_at ?? null,
        completed_at: (challengeCompletion.data ?? []).find((item) => item.challenge_id === dailyChallenge.data?.id)?.completed_at ?? null
      },
      empty: {
        workouts: allActivityRows.length === 0,
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

function normalizeCalories(value: number | string | null | undefined) {
  const calories = Number(value ?? 0);
  return Number.isFinite(calories) && calories > 0 ? Math.round(calories) : 0;
}

function getBelgiumDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
