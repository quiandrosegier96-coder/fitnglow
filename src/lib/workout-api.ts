import { NextResponse } from "next/server";
import { workoutLibrary } from "@/data/workouts";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function requireStaff() {
  const { supabase, user } = await requireUser();
  if (!supabase) return { supabase: null, user: null, allowed: false };
  if (!user) return { supabase, user: null, allowed: false };
  const { data } = await supabase.from("roles").select("role").eq("user_id", user.id);
  const allowed = (data ?? []).some((item) => ["coach", "administrator"].includes(item.role));
  return { supabase, user, allowed };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function localWorkout(idOrSlug: string) {
  return workoutLibrary.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
}
