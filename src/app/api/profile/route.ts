import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z.string().min(2, "Naam moet minstens 2 tekens bevatten.").max(120),
  avatarUrl: z.string().url().nullable().optional(),
  goal: z.string().max(180).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  heightCm: z.coerce.number().min(80, "Lengte moet minstens 80 cm zijn.").max(250, "Lengte mag maximaal 250 cm zijn.").nullable().optional(),
  firstName: z.string().max(80).nullable().optional(),
  lastName: z.string().max(80).nullable().optional(),
  gender: z.string().max(40).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  preferredLanguage: z.string().max(40).nullable().optional(),
  targetWeightKg: z.coerce.number().min(25).max(350).nullable().optional()
});

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to load profile." }, { status: 401 });

  await ensureProfile(supabase, user);

  let profileQuery = await supabase.from("profiles").select("id,full_name,avatar_url,email,goal,date_of_birth,height_cm,created_at,updated_at").eq("id", user.id).maybeSingle();
  if (isMissingOptionalProfileColumn(profileQuery.error)) {
    profileQuery = await supabase.from("profiles").select("id,full_name,avatar_url,email,created_at,updated_at").eq("id", user.id).maybeSingle();
  }

  const [bodyProfile, roles, settings] = await Promise.all([
    supabase.from("body_profiles").select("first_name,last_name,gender,date_of_birth,country,preferred_language,height_cm,target_weight_kg,onboarding_completed").eq("user_id", user.id).maybeSingle(),
    supabase.from("roles").select("role").eq("user_id", user.id),
    supabase.from("settings").select("theme,language,push_enabled,email_enabled,community_visibility").eq("user_id", user.id).maybeSingle()
  ]);

  return NextResponse.json({
    auth: {
      id: user.id,
      email: user.email ?? profileQuery.data?.email ?? "",
      emailVerified: Boolean(user.email_confirmed_at),
      createdAt: user.created_at
    },
    profile: profileQuery.data ?? null,
    bodyProfile: bodyProfile.error ? null : bodyProfile.data ?? null,
    roles: roles.error ? ["user"] : (roles.data ?? []).map((item) => item.role),
    settings: settings.error ? null : settings.data ?? null
  });
}

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, 30, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to update profile." }, { status: 401 });

  let payload: z.infer<typeof profileSchema>;
  try {
    payload = validateBody(profileSchema, await request.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Controleer je profielgegevens." }, { status: 400 });
    }
    throw error;
  }

  await ensureProfile(supabase, user);

  const fullNameParts = payload.fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = payload.firstName?.trim() || fullNameParts[0] || "";
  const lastName = payload.lastName?.trim() || fullNameParts.slice(1).join(" ");

  let profileResult = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: payload.fullName.trim(),
        avatar_url: payload.avatarUrl ?? null,
        goal: payload.goal?.trim() || null,
        date_of_birth: payload.dateOfBirth || null,
        height_cm: payload.heightCm ?? null
      },
      { onConflict: "id" }
    )
    .select("id,full_name,avatar_url,email,goal,date_of_birth,height_cm,created_at,updated_at")
    .single();

  if (isMissingOptionalProfileColumn(profileResult.error)) {
    profileResult = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          full_name: payload.fullName.trim(),
          avatar_url: payload.avatarUrl ?? null
        },
        { onConflict: "id" }
      )
      .select("id,full_name,avatar_url,email,created_at,updated_at")
      .single();
  }

  if (profileResult.error) {
    if (isMissingOptionalProfileColumn(profileResult.error)) {
      return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/fix_profile_settings.sql in the Supabase SQL Editor." }, { status: 503 });
    }
    return NextResponse.json({ error: profileResult.error.message }, { status: 400 });
  }

  const bodyResult = await supabase
    .from("body_profiles")
    .upsert(
      {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        gender: payload.gender || "prefer_not_to_say",
        date_of_birth: payload.dateOfBirth || null,
        country: payload.country?.trim() || "",
        preferred_language: payload.preferredLanguage?.trim() || "Dutch",
        height_cm: payload.heightCm ?? 170,
        target_weight_kg: payload.targetWeightKg ?? 65
      },
      { onConflict: "user_id" }
    )
    .select("first_name,last_name,gender,date_of_birth,country,preferred_language,height_cm,target_weight_kg,onboarding_completed")
    .single();

  if (bodyResult.error) {
    if (isMissingTable(bodyResult.error, "body_profiles")) {
      return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/fix_body_profiles_table.sql in the Supabase SQL Editor." }, { status: 503 });
    }
    return NextResponse.json({ error: bodyResult.error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: profileResult.data, bodyProfile: bodyResult.data });
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

function isMissingTable(error: { code?: string; message?: string }, table: string) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42P01" || error.code === "PGRST205" || (message.includes(table) && message.includes("schema cache"));
}

function isMissingOptionalProfileColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error?.message?.toLowerCase() ?? "";
  return error.code === "42703" || error.code === "PGRST204" || (message.includes("profiles") && message.includes("schema cache"));
}
