import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { weightLogSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { UserMetricsService } from "@/lib/user-metrics-service";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ logs: [] });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to load weight history." }, { status: 401 });
  const logs = await new UserMetricsService(supabase).getWeightHistory(user.id);
  return NextResponse.json({ logs: logs.map((row) => ({ weightKg: row.weight_kg, loggedAt: row.logged_at })) });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 30, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to save weight." }, { status: 401 });

  const payload = validateBody(weightLogSchema, await request.json());
  const { data, error } = await supabase
    .from("weight_logs")
    .insert({
      user_id: user.id,
      weight_kg: payload.weightKg,
      logged_at: payload.loggedAt ?? new Date().toISOString()
    })
    .select("weight_kg,logged_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const dashboard = await new UserMetricsService(supabase).getDashboardMetrics(user.id);
  return NextResponse.json({ log: { weightKg: Number(data.weight_kg), loggedAt: data.logged_at }, dashboard }, { status: 201 });
}
