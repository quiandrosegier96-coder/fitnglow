import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { UserMetricsService } from "@/lib/user-metrics-service";

const targetWeightSchema = z.object({
  targetWeightKg: z.coerce.number().min(25, "Streefgewicht moet minstens 25 kg zijn.").max(350, "Streefgewicht mag maximaal 350 kg zijn.")
});

const missingBodyProfilesMessage = "Database setup incomplete: run supabase/sql/fix_body_profiles_table.sql in the Supabase SQL Editor.";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 20, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to save target weight." }, { status: 401 });

  let payload: z.infer<typeof targetWeightSchema>;
  try {
    payload = validateBody(targetWeightSchema, await request.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Controleer het streefgewicht." }, { status: 400 });
    }
    throw error;
  }

  await ensureProfile(supabase, user);
  const bodyProfile = await new UserMetricsService(supabase).getBodyProfile(user.id).catch(() => null);

  const { data, error } = await supabase
    .from("body_profiles")
    .upsert(
      {
        user_id: user.id,
        target_weight_kg: payload.targetWeightKg,
        height_cm: bodyProfile?.height_cm ?? 170
      },
      { onConflict: "user_id" }
    )
    .select("target_weight_kg")
    .single();

  if (error) {
    if (isMissingBodyProfilesTable(error)) {
      return NextResponse.json({ error: missingBodyProfilesMessage }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const dashboard = await new UserMetricsService(supabase).getDashboardMetrics(user.id).catch(() => null);
  return NextResponse.json({ targetWeightKg: Number(data.target_weight_kg), dashboard }, { status: 201 });
}

function isMissingBodyProfilesTable(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42P01" || error.code === "PGRST205" || (message.includes("body_profiles") && message.includes("schema cache"));
}

async function ensureProfile(supabase: Awaited<ReturnType<typeof createClient>>, user: { id: string; email?: string | null; user_metadata?: { full_name?: string; name?: string } }) {
  if (!supabase) return;
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Fit & Glow Member"
    },
    { onConflict: "id" }
  );
}
