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
  weight: z.coerce.number().positive(),
  bodyFat: z.coerce.number().min(0).max(80).optional(),
  waist: z.coerce.number().positive().optional(),
  note: z.string().max(400).optional()
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
