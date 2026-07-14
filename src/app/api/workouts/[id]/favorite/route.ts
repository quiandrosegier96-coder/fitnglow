import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit } from "@/lib/security";
import { requireUser, unauthorized } from "@/lib/workout-api";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  const { id } = await context.params;
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  if (!supabase) return NextResponse.json({ ok: true, favorite: true });
  const { error } = await supabase.from("favorite_workouts").upsert({ user_id: user.id, workout_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, favorite: true });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  const { id } = await context.params;
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  if (!supabase) return NextResponse.json({ ok: true, favorite: false });
  const { error } = await supabase.from("favorite_workouts").delete().eq("user_id", user.id).eq("workout_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, favorite: false });
}
