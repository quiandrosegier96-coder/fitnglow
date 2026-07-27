import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCsrf, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const dailyChallengeSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(700).optional().nullable(),
  coachName: z.string().trim().min(2).max(80).default("Joyce"),
  challengeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  durationMinutes: z.coerce.number().int().min(1).max(240).optional().nullable(),
  isPublished: z.boolean().default(true)
});

const updateDailyChallengeSchema = dailyChallengeSchema.extend({
  id: z.string().uuid()
});

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const authorized = await canManageChallenges(supabase, user.id, user.email);
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data, error } = await supabase
    .from("daily_challenges")
    .select("*")
    .order("challenge_date", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ challenges: data ?? [] });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 10, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const authorized = await canManageChallenges(supabase, user.id, user.email);
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = dailyChallengeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid challenge data." }, { status: 400 });
  }

  const payload = parsed.data;
  const { data, error } = await supabase
    .from("daily_challenges")
    .upsert(
      {
        title: payload.title,
        description: payload.description || null,
        coach_name: payload.coachName,
        challenge_date: payload.challengeDate,
        video_url: payload.videoUrl,
        thumbnail_url: payload.thumbnailUrl || null,
        duration_minutes: payload.durationMinutes ?? null,
        is_published: payload.isPublished,
        created_by: user.id
      },
      { onConflict: "challenge_date" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ challenge: data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const limited = rateLimit(request, 20, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const authorized = await canManageChallenges(supabase, user.id, user.email);
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = updateDailyChallengeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid challenge data." }, { status: 400 });
  }

  const payload = parsed.data;
  const { data, error } = await supabase
    .from("daily_challenges")
    .update({
      title: payload.title,
      description: payload.description || null,
      coach_name: payload.coachName,
      challenge_date: payload.challengeDate,
      video_url: payload.videoUrl,
      thumbnail_url: payload.thumbnailUrl,
      duration_minutes: payload.durationMinutes ?? null,
      is_published: payload.isPublished
    })
    .eq("id", payload.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ challenge: data });
}

async function canManageChallenges(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, userId: string, email?: string) {
  void supabase;
  void userId;
  return email?.toLowerCase() === "fitandglow.joyce@gmail.com";
}
