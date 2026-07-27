import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const measurementSchema = z.object({
  waistCm: z.coerce.number().min(40, "Taille moet minstens 40 cm zijn.").max(220, "Taille mag maximaal 220 cm zijn."),
  chestCm: z.coerce.number().min(40, "Borst moet minstens 40 cm zijn.").max(220, "Borst mag maximaal 220 cm zijn."),
  hipCm: z.coerce.number().min(40, "Heup moet minstens 40 cm zijn.").max(240, "Heup mag maximaal 240 cm zijn."),
  upperArmCm: z.coerce.number().min(15, "Bovenarm moet minstens 15 cm zijn.").max(90, "Bovenarm mag maximaal 90 cm zijn."),
  upperLegCm: z.coerce.number().min(25, "Bovenbeen moet minstens 25 cm zijn.").max(120, "Bovenbeen mag maximaal 120 cm zijn."),
  calfCm: z.coerce.number().min(15, "Kuit moet minstens 15 cm zijn.").max(90, "Kuit mag maximaal 90 cm zijn."),
  measuredAt: z.string().datetime().optional()
});

const missingColumnsMessage = "Database setup incomplete: run supabase/sql/add_extended_body_measurements.sql in the Supabase SQL Editor.";
const missingTableMessage = "Database setup incomplete: run supabase/sql/fix_measurements_table.sql in the Supabase SQL Editor.";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 30, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to save measurements." }, { status: 401 });
  await ensureProfile(supabase, user);

  let payload: z.infer<typeof measurementSchema>;
  try {
    payload = validateBody(measurementSchema, await request.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Controleer de centimeterwaarden." }, { status: 400 });
    }
    throw error;
  }
  const { data, error } = await supabase
    .from("measurements")
    .insert({
      user_id: user.id,
      waist_cm: payload.waistCm,
      chest_cm: payload.chestCm,
      hip_cm: payload.hipCm,
      upper_arm_cm: payload.upperArmCm,
      upper_leg_cm: payload.upperLegCm,
      calf_cm: payload.calfCm,
      measured_at: payload.measuredAt ?? new Date().toISOString()
    })
    .select("waist_cm,chest_cm,hip_cm,upper_arm_cm,upper_leg_cm,calf_cm,measured_at")
    .single();

  if (error) {
    if (isMissingMeasurementsTable(error)) {
      return NextResponse.json({ error: missingTableMessage }, { status: 503 });
    }
    if (isMissingMeasurementColumn(error)) {
      return NextResponse.json({ error: missingColumnsMessage }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ measurement: data }, { status: 201 });
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

function isMissingMeasurementColumn(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42703" || error.code === "PGRST204" || (message.includes("schema cache") && (message.includes("upper_arm_cm") || message.includes("upper_leg_cm") || message.includes("calf_cm")));
}

function isMissingMeasurementsTable(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42P01" || error.code === "PGRST205" || (message.includes("measurements") && message.includes("schema cache"));
}
