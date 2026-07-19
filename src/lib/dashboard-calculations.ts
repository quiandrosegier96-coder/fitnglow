import { calculateBmi, estimateDaysUntilTarget, getBmiCategory, getGoalProgress, getHealthyWeightRange } from "@/lib/body-profile";

export type CompletedWorkoutRow = {
  calories: number | null;
  completed_at: string;
  completion_percentage?: number | null;
};

export type WeightRow = {
  weight_kg: number;
  logged_at: string;
};

export type BodyProfileRow = {
  height_cm: number | null;
  latestWeightKg: number | null;
  target_weight_kg: number | null;
};

export function startOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function startOfWeek(date = new Date()) {
  const copy = startOfDay(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  return copy;
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function sumCalories(rows: CompletedWorkoutRow[], since?: Date) {
  return rows
    .filter((row) => !since || new Date(row.completed_at) >= since)
    .reduce((sum, row) => sum + Number(row.calories ?? 0), 0);
}

export function calculateCurrentStreak(rows: CompletedWorkoutRow[], today = new Date()) {
  const completedDays = new Set(rows.map((row) => startOfDay(new Date(row.completed_at)).toISOString().slice(0, 10)));
  if (completedDays.size === 0) return 0;

  const cursor = startOfDay(today);
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!completedDays.has(todayKey)) return 0;

  let streak = 0;
  while (completedDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function calculateWeightProgress(weights: WeightRow[], bodyProfile: BodyProfileRow | null) {
  const sorted = [...weights].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
  const startingWeight = sorted[0]?.weight_kg ?? bodyProfile?.latestWeightKg ?? 0;
  const currentWeight = sorted[sorted.length - 1]?.weight_kg ?? bodyProfile?.latestWeightKg ?? startingWeight;
  const difference = Number((currentWeight - startingWeight).toFixed(1));
  const trend = difference < -0.2 ? "Losing weight" : difference > 0.2 ? "Gaining weight" : "Stable";
  const trendDirection = difference < -0.2 ? "down" : difference > 0.2 ? "up" : "stable";

  return { startingWeight, currentWeight, difference, trend, trendDirection };
}

export function calculateLevel(xp: number) {
  const level = Math.max(1, Math.floor(xp / 1000) + 1);
  const currentLevelBase = (level - 1) * 1000;
  const nextLevelBase = level * 1000;
  const progress = Math.round(((xp - currentLevelBase) / (nextLevelBase - currentLevelBase)) * 100);
  return { level, xp, nextLevelXp: nextLevelBase, progressToNextLevel: Math.max(0, Math.min(100, progress)) };
}

export function calculateXp({
  workouts,
  weightLogs,
  mealLogs,
  achievements,
  waterLogs
}: {
  workouts: number;
  weightLogs: number;
  mealLogs: number;
  achievements: number;
  waterLogs: number;
}) {
  return workouts * 100 + weightLogs * 25 + mealLogs * 10 + achievements * 150 + waterLogs * 5;
}

export function calculateBmiDashboard(bodyProfile: BodyProfileRow | null) {
  const height = Number(bodyProfile?.height_cm ?? 0);
  const weight = Number(bodyProfile?.latestWeightKg ?? 0);
  const target = Number(bodyProfile?.target_weight_kg ?? 0);
  const bmi = calculateBmi(weight, height);
  const healthy = getHealthyWeightRange(height);

  return {
    bmi,
    category: bmi ? getBmiCategory(bmi) : "Healthy",
    healthyRange: healthy.min && healthy.max ? `${healthy.min} - ${healthy.max} kg` : "Complete onboarding",
    targetWeight: target,
    daysUntilTarget: estimateDaysUntilTarget(weight, target),
    progressPercentage: getGoalProgress(weight, target, weight)
  };
}

export function achievementProgress({
  workoutCount,
  streak,
  weightLost,
  mealCount,
  waterDays
}: {
  workoutCount: number;
  streak: number;
  weightLost: number;
  mealCount: number;
  waterDays: number;
}) {
  return [
    { code: "first_workout", title: "First Workout", progress: Math.min(100, workoutCount >= 1 ? 100 : 0), unlocked: workoutCount >= 1 },
    { code: "streak_7", title: "7-Day Streak", progress: Math.min(100, Math.round((streak / 7) * 100)), unlocked: streak >= 7 },
    { code: "streak_30", title: "30-Day Streak", progress: Math.min(100, Math.round((streak / 30) * 100)), unlocked: streak >= 30 },
    { code: "lost_5kg", title: "Lost 5 kg", progress: Math.min(100, Math.round((weightLost / 5) * 100)), unlocked: weightLost >= 5 },
    { code: "lost_10kg", title: "Lost 10 kg", progress: Math.min(100, Math.round((weightLost / 10) * 100)), unlocked: weightLost >= 10 },
    { code: "logged_100_meals", title: "Logged 100 Meals", progress: Math.min(100, Math.round((mealCount / 100) * 100)), unlocked: mealCount >= 100 },
    { code: "completed_50_workouts", title: "Completed 50 Workouts", progress: Math.min(100, Math.round((workoutCount / 50) * 100)), unlocked: workoutCount >= 50 },
    { code: "water_30_days", title: "Drink Water 30 Days", progress: Math.min(100, Math.round((waterDays / 30) * 100)), unlocked: waterDays >= 30 }
  ];
}
