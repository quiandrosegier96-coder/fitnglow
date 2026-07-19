import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { workoutCompletionSchema } from "@/lib/schemas";
import { requireUser, unauthorized } from "@/lib/workout-api";
import { calculateCurrentStreak } from "@/lib/dashboard-calculations";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  const { id } = await context.params;
  const payload = validateBody(workoutCompletionSchema, { ...(await request.json()), workoutId: id });
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  if (!supabase) return NextResponse.json({ completion: payload }, { status: 201 });
  const { data, error } = await supabase.from("completed_workouts").insert({
    user_id: user.id,
    workout_id: id,
    duration_minutes: payload.durationMinutes,
    calories: payload.calories,
    completion_percentage: payload.completionPercentage,
    average_pace: payload.averagePace,
    personal_notes: payload.personalNotes
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data: completions } = await supabase.from("completed_workouts").select("calories,completed_at").eq("user_id", user.id);
  const streak = calculateCurrentStreak(completions ?? []);
  await supabase.from("streaks").upsert({
    user_id: user.id,
    current_count: streak,
    longest_count: streak,
    last_completed_on: new Date().toISOString().slice(0, 10)
  });
  return NextResponse.json({ completion: data }, { status: 201 });
}
