import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters")
});

export const registerSchema = authSchema
  .extend({
    fullName: z.string().min(2, "Enter your full name"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    acceptTerms: z.boolean().refine((value) => value, "Accept the privacy and membership terms")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const progressSchema = z.object({
  weight: z.coerce.number().min(25, "Weight must be at least 25 kg").max(350, "Weight must be below 350 kg"),
  bodyFat: z.coerce.number().min(0).max(80).optional(),
  waist: z.coerce.number().positive().optional(),
  note: z.string().max(400).optional()
});

export const weightLogSchema = z.object({
  weightKg: z.coerce.number().min(25, "Weight must be at least 25 kg").max(350, "Weight must be below 350 kg"),
  loggedAt: z.string().datetime().optional()
});

export const workoutQuerySchema = z.object({
  search: z.string().optional(),
  difficulty: z.string().optional(),
  category: z.string().optional(),
  muscleGroup: z.string().optional(),
  sort: z.enum(["newest", "duration", "rating", "popular"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12)
});

export const workoutMutationSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(12).max(1200),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  durationMinutes: z.coerce.number().int().positive(),
  estimatedCalories: z.coerce.number().int().nonnegative(),
  categoryId: z.string().uuid().optional(),
  equipment: z.array(z.string()).default([]),
  muscleGroups: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false)
});

export const workoutCompletionSchema = z.object({
  workoutId: z.string().min(2),
  durationMinutes: z.coerce.number().positive(),
  calories: z.coerce.number().nonnegative(),
  completionPercentage: z.coerce.number().min(0).max(100),
  averagePace: z.string().min(2).max(80),
  personalNotes: z.string().max(800).optional()
});

export const workoutCommentSchema = z.object({
  body: z.string().min(2).max(600)
});

export const workoutRatingSchema = z.object({
  rating: z.coerce.number().min(1).max(5)
});

export const personalInformationSchema = z.object({
  firstName: z.string().min(2, "Enter your first name").max(80),
  lastName: z.string().min(2, "Enter your last name").max(80),
  gender: z.enum(["female", "male", "non_binary", "prefer_not_to_say"]),
  dateOfBirth: z.string().min(1, "Select your date of birth"),
  country: z.string().min(2, "Enter your country").max(80),
  preferredLanguage: z.string().min(2, "Choose your preferred language").max(40)
});

export const bodyProfileSchema = z.object({
  heightCm: z.coerce.number().min(80, "Height must be at least 80 cm").max(250, "Height must be below 250 cm"),
  currentWeightKg: z.coerce.number().min(35, "Enter current weight").max(250),
  targetWeightKg: z.coerce.number().min(35, "Enter target weight").max(250),
  waistCm: z.coerce.number().min(40).max(200),
  chestCm: z.coerce.number().min(40).max(200),
  hipCm: z.coerce.number().min(40).max(220),
  bodyFatPercentage: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().min(3).max(70).optional())
});

export const fitnessProfileSchema = z.object({
  exerciseDaysPerWeek: z.enum(["Never", "1 day", "2 days", "3 days", "4 days", "5 days", "6 days", "Every day"]),
  averageWorkoutDuration: z.enum(["15 min", "30 min", "45 min", "60 min", "90+ min"]),
  fitnessLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Professional"])
});

export const goalProfileSchema = z.object({
  mainGoal: z.enum(["Lose weight", "Build muscle", "Stay healthy", "Improve endurance", "Become stronger", "Tone the body", "Gain weight", "General fitness"]),
  secondaryGoals: z.array(z.string()).min(1, "Choose at least one secondary goal")
});

export const nutritionProfileSchema = z.object({
  healthyMealsPerDay: z.enum(["0", "1", "2", "3", "4", "5+"]),
  waterDaily: z.string().min(1, "Choose your daily water intake"),
  snacksPerDay: z.enum(["0", "1", "2", "3", "4+"]),
  eatsBreakfast: z.boolean(),
  drinksSoftDrinks: z.boolean(),
  drinksAlcohol: z.boolean(),
  usesSupplements: z.boolean(),
  supplements: z.array(z.string())
});

export const lifestyleProfileSchema = z.object({
  averageSleep: z.string().min(1, "Choose average sleep"),
  stressLevel: z.enum(["Low", "Moderate", "High", "Very high"]),
  occupation: z.string().min(2, "Enter your occupation").max(120),
  dailyActivityLevel: z.enum(["Sedentary", "Lightly active", "Active", "Very active"]),
  smokes: z.boolean(),
  vapes: z.boolean(),
  injuries: z.string().max(600).optional(),
  medicalLimitations: z.string().max(600).optional(),
  foodAllergies: z.string().max(600).optional(),
  dietPreference: z.enum(["None", "Vegetarian", "Vegan", "Pescatarian", "Low Carb", "Keto", "Gluten Free", "Lactose Free", "Other"])
});

export const motivationProfileSchema = z.object({
  motivationReason: z.string().min(10, "Write at least one clear sentence").max(1200),
  motivationScore: z.coerce.number().min(1).max(10)
});

export const onboardingSchema = personalInformationSchema
  .merge(bodyProfileSchema)
  .merge(fitnessProfileSchema)
  .merge(goalProfileSchema)
  .merge(nutritionProfileSchema)
  .merge(lifestyleProfileSchema)
  .merge(motivationProfileSchema)
  .extend({
    onboardingStep: z.coerce.number().min(1).max(7).default(1),
    onboardingCompleted: z.boolean().default(false)
  });

export const onboardingStepSchemas = [
  personalInformationSchema,
  bodyProfileSchema,
  fitnessProfileSchema,
  goalProfileSchema,
  nutritionProfileSchema,
  lifestyleProfileSchema,
  motivationProfileSchema
] as const;
