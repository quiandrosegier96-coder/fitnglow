import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ export: {} });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile, progress, weightLogs, settings] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("progress").select("*").eq("user_id", user.id),
    supabase.from("weight_logs").select("*").eq("user_id", user.id),
    supabase.from("settings").select("*").eq("user_id", user.id).single()
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    profile: profile.data,
    progress: progress.data,
    weightLogs: weightLogs.data,
    settings: settings.data
  });
}
