import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { workoutCompletionSchema } from "@/lib/schemas";
import { requireUser, unauthorized } from "@/lib/workout-api";

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
  return NextResponse.json({ completion: data }, { status: 201 });
}
