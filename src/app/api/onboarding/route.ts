import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCsrf, rateLimit } from "@/lib/security";
import { onboardingSchema } from "@/lib/schemas";
import { calculateAge, calculateBmi, estimateDaysUntilTarget, getBmiCategory, getGoalProgress, getHealthyWeightRange } from "@/lib/body-profile";
import { createClient } from "@/lib/supabase/server";
import { UserMetricsService } from "@/lib/user-metrics-service";

const partialOnboardingSchema = onboardingSchema.partial().extend({
  onboardingStep: z.coerce.number().min(1).max(7).optional(),
  onboardingCompleted: z.boolean().optional()
});

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ profile: null });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    body,
    fitness,
    nutrition,
    lifestyle,
    goal
  ] = await Promise.all([
    supabase.from("body_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("fitness_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("nutrition_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("lifestyle_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("goal_profiles").select("*").eq("user_id", user.id).maybeSingle()
  ]);

  if (body.error && body.error.code !== "PGRST116") return NextResponse.json({ profile: null });
  const latestWeight = await new UserMetricsService(supabase).getCurrentUserWeight(user.id);
  const profile = body.data ? fromDatabase({
    body: body.data,
    fitness: fitness.data,
    nutrition: nutrition.data,
    lifestyle: lifestyle.data,
    goal: goal.data,
    latestWeightKg: latestWeight?.weightKg
  }) : null;

  return NextResponse.json({ profile, dashboard: profile ? dashboardFromProfile(profile) : null });
}

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, 40, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ saved: false, reason: "Supabase is not configured" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = partialOnboardingSchema.parse(await request.json());
  const normalized = normalizePayload(payload);
  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: `${normalized.firstName} ${normalized.lastName}`.trim() || user.email || "Fit & Glow Member"
  });

  const writes = [
    supabase.from("body_profiles").upsert({
      user_id: user.id,
      first_name: normalized.firstName,
      last_name: normalized.lastName,
      gender: normalized.gender,
      date_of_birth: normalized.dateOfBirth || null,
      age: normalized.dateOfBirth ? calculateAge(normalized.dateOfBirth) : null,
      country: normalized.country,
      preferred_language: normalized.preferredLanguage,
      height_cm: normalized.heightCm,
      target_weight_kg: normalized.targetWeightKg,
      waist_cm: normalized.waistCm,
      chest_cm: normalized.chestCm,
      hip_cm: normalized.hipCm,
      body_fat_percentage: normalized.bodyFatPercentage,
      healthy_weight_min_kg: getHealthyWeightRange(normalized.heightCm).min,
      healthy_weight_max_kg: getHealthyWeightRange(normalized.heightCm).max,
      onboarding_step: normalized.onboardingStep,
      onboarding_completed: normalized.onboardingCompleted
    }),
    supabase.from("fitness_profiles").upsert({
      user_id: user.id,
      exercise_days_per_week: normalized.exerciseDaysPerWeek,
      average_workout_duration: normalized.averageWorkoutDuration,
      fitness_level: normalized.fitnessLevel
    }),
    supabase.from("goal_profiles").upsert({
      user_id: user.id,
      main_goal: normalized.mainGoal,
      secondary_goals: normalized.secondaryGoals
    }),
    supabase.from("nutrition_profiles").upsert({
      user_id: user.id,
      healthy_meals_per_day: normalized.healthyMealsPerDay,
      water_daily: normalized.waterDaily,
      snacks_per_day: normalized.snacksPerDay,
      eats_breakfast: normalized.eatsBreakfast,
      drinks_soft_drinks: normalized.drinksSoftDrinks,
      drinks_alcohol: normalized.drinksAlcohol,
      uses_supplements: normalized.usesSupplements,
      supplements: normalized.supplements
    }),
    supabase.from("lifestyle_profiles").upsert({
      user_id: user.id,
      average_sleep: normalized.averageSleep,
      stress_level: normalized.stressLevel,
      occupation: normalized.occupation,
      daily_activity_level: normalized.dailyActivityLevel,
      smokes: normalized.smokes,
      vapes: normalized.vapes,
      injuries: normalized.injuries,
      medical_limitations: normalized.medicalLimitations,
      food_allergies: normalized.foodAllergies,
      diet_preference: normalized.dietPreference,
      motivation_reason: normalized.motivationReason,
      motivation_score: normalized.motivationScore
    })
  ];

  const results = await Promise.all(writes);
  const error = results.find((result) => result.error)?.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (normalized.onboardingCompleted) {
    await Promise.all([
      supabase.from("measurements").insert({
        user_id: user.id,
        weight_kg: normalized.currentWeightKg,
        waist_cm: normalized.waistCm,
        chest_cm: normalized.chestCm,
        hip_cm: normalized.hipCm,
        body_fat_percentage: normalized.bodyFatPercentage,
        bmi: calculateBmi(normalized.currentWeightKg, normalized.heightCm)
      }),
      supabase.from("weight_logs").insert({
        user_id: user.id,
        weight_kg: normalized.currentWeightKg
      })
    ]);
  }

  return NextResponse.json({ saved: true, dashboard: dashboardFromProfile(normalized) });
}

function normalizePayload(payload: Partial<z.infer<typeof onboardingSchema>>) {
  return {
    firstName: payload.firstName ?? "",
    lastName: payload.lastName ?? "",
    gender: payload.gender ?? "female",
    dateOfBirth: payload.dateOfBirth ?? "",
    country: payload.country ?? "",
    preferredLanguage: payload.preferredLanguage ?? "Dutch",
    heightCm: Number(payload.heightCm ?? 170),
    currentWeightKg: Number(payload.currentWeightKg ?? 70),
    targetWeightKg: Number(payload.targetWeightKg ?? 65),
    waistCm: Number(payload.waistCm ?? 78),
    chestCm: Number(payload.chestCm ?? 92),
    hipCm: Number(payload.hipCm ?? 98),
    bodyFatPercentage: payload.bodyFatPercentage,
    exerciseDaysPerWeek: payload.exerciseDaysPerWeek ?? "3 days",
    averageWorkoutDuration: payload.averageWorkoutDuration ?? "45 min",
    fitnessLevel: payload.fitnessLevel ?? "Beginner",
    mainGoal: payload.mainGoal ?? "Lose weight",
    secondaryGoals: payload.secondaryGoals ?? [],
    healthyMealsPerDay: payload.healthyMealsPerDay ?? "3",
    waterDaily: payload.waterDaily ?? "1.5 - 2 L",
    snacksPerDay: payload.snacksPerDay ?? "1",
    eatsBreakfast: payload.eatsBreakfast ?? true,
    drinksSoftDrinks: payload.drinksSoftDrinks ?? false,
    drinksAlcohol: payload.drinksAlcohol ?? false,
    usesSupplements: payload.usesSupplements ?? false,
    supplements: payload.supplements ?? [],
    averageSleep: payload.averageSleep ?? "7 - 8 hours",
    stressLevel: payload.stressLevel ?? "Moderate",
    occupation: payload.occupation ?? "",
    dailyActivityLevel: payload.dailyActivityLevel ?? "Lightly active",
    smokes: payload.smokes ?? false,
    vapes: payload.vapes ?? false,
    injuries: payload.injuries ?? "",
    medicalLimitations: payload.medicalLimitations ?? "",
    foodAllergies: payload.foodAllergies ?? "",
    dietPreference: payload.dietPreference ?? "None",
    motivationReason: payload.motivationReason ?? "",
    motivationScore: Number(payload.motivationScore ?? 8),
    onboardingStep: Number(payload.onboardingStep ?? 1),
    onboardingCompleted: payload.onboardingCompleted ?? false
  };
}

type DatabaseProfileRow = Record<string, string | number | boolean | string[] | null | undefined>;

function fromDatabase({
  body,
  fitness,
  nutrition,
  lifestyle,
  goal,
  latestWeightKg
}: {
  body: DatabaseProfileRow;
  fitness: DatabaseProfileRow | null;
  nutrition: DatabaseProfileRow | null;
  lifestyle: DatabaseProfileRow | null;
  goal: DatabaseProfileRow | null;
  latestWeightKg?: number;
}) {
  const payload = {
    firstName: stringValue(body.first_name),
    lastName: stringValue(body.last_name),
    gender: stringValue(body.gender),
    dateOfBirth: stringValue(body.date_of_birth),
    country: stringValue(body.country),
    preferredLanguage: stringValue(body.preferred_language),
    heightCm: numberValue(body.height_cm),
    currentWeightKg: latestWeightKg,
    targetWeightKg: numberValue(body.target_weight_kg),
    waistCm: numberValue(body.waist_cm),
    chestCm: numberValue(body.chest_cm),
    hipCm: numberValue(body.hip_cm),
    bodyFatPercentage: optionalNumberValue(body.body_fat_percentage),
    onboardingStep: numberValue(body.onboarding_step),
    onboardingCompleted: booleanValue(body.onboarding_completed),
    exerciseDaysPerWeek: stringValue(fitness?.exercise_days_per_week),
    averageWorkoutDuration: stringValue(fitness?.average_workout_duration),
    fitnessLevel: stringValue(fitness?.fitness_level),
    healthyMealsPerDay: stringValue(nutrition?.healthy_meals_per_day),
    waterDaily: stringValue(nutrition?.water_daily),
    snacksPerDay: stringValue(nutrition?.snacks_per_day),
    eatsBreakfast: booleanValue(nutrition?.eats_breakfast),
    drinksSoftDrinks: booleanValue(nutrition?.drinks_soft_drinks),
    drinksAlcohol: booleanValue(nutrition?.drinks_alcohol),
    usesSupplements: booleanValue(nutrition?.uses_supplements),
    supplements: arrayValue(nutrition?.supplements),
    averageSleep: stringValue(lifestyle?.average_sleep),
    stressLevel: stringValue(lifestyle?.stress_level),
    occupation: stringValue(lifestyle?.occupation),
    dailyActivityLevel: stringValue(lifestyle?.daily_activity_level),
    smokes: booleanValue(lifestyle?.smokes),
    vapes: booleanValue(lifestyle?.vapes),
    injuries: stringValue(lifestyle?.injuries),
    medicalLimitations: stringValue(lifestyle?.medical_limitations),
    foodAllergies: stringValue(lifestyle?.food_allergies),
    dietPreference: stringValue(lifestyle?.diet_preference),
    motivationReason: stringValue(lifestyle?.motivation_reason),
    motivationScore: numberValue(lifestyle?.motivation_score),
    mainGoal: stringValue(goal?.main_goal),
    secondaryGoals: arrayValue(goal?.secondary_goals)
  };

  return normalizePayload(payload as unknown as Partial<z.infer<typeof onboardingSchema>>);
}

function stringValue(value: DatabaseProfileRow[string]) {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: DatabaseProfileRow[string]) {
  return typeof value === "number" ? value : undefined;
}

function optionalNumberValue(value: DatabaseProfileRow[string]) {
  return typeof value === "number" ? value : undefined;
}

function booleanValue(value: DatabaseProfileRow[string]) {
  return typeof value === "boolean" ? value : undefined;
}

function arrayValue(value: DatabaseProfileRow[string]) {
  return Array.isArray(value) ? value : undefined;
}

function dashboardFromProfile(profile: ReturnType<typeof normalizePayload>) {
  const bmi = calculateBmi(profile.currentWeightKg, profile.heightCm);
  const range = getHealthyWeightRange(profile.heightCm);
  return {
    currentWeight: profile.currentWeightKg,
    targetWeight: profile.targetWeightKg,
    bmi,
    bmiCategory: getBmiCategory(bmi),
    healthyWeightRange: `${range.min} - ${range.max} kg`,
    fitnessLevel: profile.fitnessLevel,
    mealsPerDay: profile.healthyMealsPerDay,
    waterIntake: profile.waterDaily,
    workoutFrequency: profile.exerciseDaysPerWeek,
    goal: profile.mainGoal,
    currentStreak: 0,
    daysUntilTarget: estimateDaysUntilTarget(profile.currentWeightKg, profile.targetWeightKg),
    progressPercentage: getGoalProgress(profile.currentWeightKg, profile.targetWeightKg, profile.currentWeightKg)
  };
}
