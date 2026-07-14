import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { workoutCommentSchema } from "@/lib/schemas";
import { requireUser, unauthorized } from "@/lib/workout-api";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { supabase } = await requireUser();
  if (!supabase) return NextResponse.json({ comments: [] });
  const { data, error } = await supabase.from("exercise_comments").select("*").eq("workout_id", id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ comments: data });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  const { id } = await context.params;
  const payload = validateBody(workoutCommentSchema, await request.json());
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  if (!supabase) return NextResponse.json({ comment: { workoutId: id, body: payload.body } }, { status: 201 });
  const { data, error } = await supabase.from("exercise_comments").insert({ user_id: user.id, workout_id: id, body: payload.body }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ comment: data }, { status: 201 });
}
