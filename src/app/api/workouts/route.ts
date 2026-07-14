import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { workoutLibrary } from "@/data/workouts";
import { workoutMutationSchema, workoutQuerySchema } from "@/lib/schemas";
import { requireStaff } from "@/lib/workout-api";

export async function GET(request: NextRequest) {
  const query = workoutQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  let results = [...workoutLibrary];

  if (query.search) {
    const search = query.search.toLowerCase();
    results = results.filter((workout) =>
      [workout.title, workout.description, workout.coach, workout.category, ...workout.muscleGroups, ...workout.equipment]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }
  if (query.difficulty) results = results.filter((workout) => workout.difficulty.toLowerCase() === query.difficulty?.toLowerCase());
  if (query.category) results = results.filter((workout) => workout.category.toLowerCase() === query.category?.toLowerCase());
  if (query.muscleGroup) results = results.filter((workout) => workout.muscleGroups.some((group) => group.toLowerCase() === query.muscleGroup?.toLowerCase()));

  if (query.sort === "duration") results.sort((a, b) => a.durationMinutes - b.durationMinutes);
  if (query.sort === "rating") results.sort((a, b) => b.rating - a.rating);
  if (query.sort === "popular") results.sort((a, b) => b.completedCount - a.completedCount);

  const start = (query.page - 1) * query.pageSize;
  const paginated = results.slice(start, start + query.pageSize);

  return NextResponse.json({
    workouts: paginated,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: results.length,
      totalPages: Math.ceil(results.length / query.pageSize)
    }
  });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  const { supabase, allowed, user } = await requireStaff();
  if (!allowed) return user ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = validateBody(workoutMutationSchema, await request.json());
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const { data, error } = await supabase.from("workouts").insert({
    title: payload.title,
    description: payload.description,
    difficulty: payload.difficulty,
    duration_minutes: payload.durationMinutes,
    estimated_calories: payload.estimatedCalories,
    category_id: payload.categoryId,
    equipment: payload.equipment,
    muscle_groups: payload.muscleGroups,
    is_published: payload.isPublished,
    created_by: user?.id
  }).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ workout: data }, { status: 201 });
}
