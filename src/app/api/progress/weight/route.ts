import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { calculateBmiDashboard, calculateWeightProgress } from "@/lib/dashboard-calculations";
import { weightLogSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { UserMetricsService } from "@/lib/user-metrics-service";

const missingWeightLogsMessage = "Database setup incomplete: run supabase/sql/fix_weight_logs_table.sql in the Supabase SQL Editor.";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json(emptyProgressMetrics());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to load weight history." }, { status: 401 });
  const metrics = await getProgressMetrics(new UserMetricsService(supabase), user.id);
  return NextResponse.json(metrics);
}

function emptyProgressMetrics() {
  return {
    logs: [],
    currentWeight: null,
    weightProgress: { startingWeight: 0, currentWeight: 0, difference: 0, trend: "Stable", trendDirection: "stable" },
    bmi: { bmi: 0, category: "Healthy", healthyRange: "Complete onboarding", targetWeight: 0, daysUntilTarget: 0, progressPercentage: 0 }
  };
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

  if (error) {
    if (isMissingWeightLogsTable(error)) {
      return NextResponse.json({ error: missingWeightLogsMessage }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const dashboard = await new UserMetricsService(supabase).getDashboardMetrics(user.id);
  return NextResponse.json({ log: { weightKg: Number(data.weight_kg), loggedAt: data.logged_at }, dashboard }, { status: 201 });
}

function isMissingWeightLogsTable(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42P01" || error.code === "PGRST205" || (message.includes("weight_logs") && message.includes("schema cache"));
}

async function getProgressMetrics(service: UserMetricsService, userId: string) {
  const [logs, bodyProfile] = await Promise.all([
    service.getWeightHistory(userId),
    service.getBodyProfile(userId)
  ]);
  const currentWeight = logs.at(-1)?.weight_kg ?? null;
  const profile = {
    height_cm: bodyProfile?.height_cm ?? null,
    target_weight_kg: bodyProfile?.target_weight_kg ?? null,
    latestWeightKg: currentWeight
  };

  return {
    logs: logs.map((row) => ({ weightKg: row.weight_kg, loggedAt: row.logged_at })),
    currentWeight,
    weightProgress: calculateWeightProgress(logs, profile),
    bmi: calculateBmiDashboard(profile)
  };
}
