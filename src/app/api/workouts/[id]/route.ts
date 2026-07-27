import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { workoutMutationSchema } from "@/lib/schemas";
import { forbidden, localWorkout, requireStaff, unauthorized } from "@/lib/workout-api";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const workout = localWorkout(id);
  if (!workout) return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  return NextResponse.json({ workout });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  const { id } = await context.params;
  const { supabase, allowed, user } = await requireStaff();
  if (!user) return unauthorized();
  if (!allowed) return forbidden();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const payload = validateBody(workoutMutationSchema, await request.json());
  const { data, error } = await supabase.from("workouts").update({
    title: payload.title,
    description: payload.description,
    difficulty: payload.difficulty,
    duration_minutes: payload.durationMinutes,
    estimated_calories: payload.estimatedCalories,
    category_id: payload.categoryId,
    equipment: payload.equipment,
    muscle_groups: payload.muscleGroups,
    is_published: payload.isPublished
  }).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ workout: data });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request, 8, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  const { id } = await context.params;
  const { supabase, allowed, user } = await requireStaff();
  if (!user) return unauthorized();
  if (!allowed) return forbidden();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
