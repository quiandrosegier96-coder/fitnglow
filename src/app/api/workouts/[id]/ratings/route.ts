import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { workoutRatingSchema } from "@/lib/schemas";
import { requireUser, unauthorized } from "@/lib/workout-api";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  const { id } = await context.params;
  const payload = validateBody(workoutRatingSchema, await request.json());
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  if (!supabase) return NextResponse.json({ rating: { workoutId: id, rating: payload.rating } }, { status: 201 });
  const { data, error } = await supabase.from("exercise_ratings").upsert({ user_id: user.id, workout_id: id, rating: payload.rating }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rating: data }, { status: 201 });
}
