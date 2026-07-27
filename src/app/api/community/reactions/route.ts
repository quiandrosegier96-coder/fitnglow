import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const reactionSchema = z.object({
  feedItemId: z.string().min(3).max(140),
  feedItemType: z.enum(["post", "strava", "workout", "challenge"])
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 60, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to like." }, { status: 401 });

  let payload: z.infer<typeof reactionSchema>;
  try {
    payload = validateBody(reactionSchema, await request.json());
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Controleer je like." }, { status: 400 });
    throw error;
  }

  await ensureProfile(supabase, user);

  const existing = await supabase
    .from("community_reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("feed_item_id", payload.feedItemId)
    .eq("reaction_type", "like")
    .maybeSingle();

  if (existing.error) {
    if (isMissingTable(existing.error)) return missingTableResponse();
    return NextResponse.json({ error: existing.error.message }, { status: 400 });
  }

  if (existing.data?.id) {
    const { error } = await supabase.from("community_reactions").delete().eq("id", existing.data.id).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ liked: false });
  }

  const { error } = await supabase.from("community_reactions").insert({
    user_id: user.id,
    feed_item_id: payload.feedItemId,
    feed_item_type: payload.feedItemType,
    reaction_type: "like"
  });

  if (error) {
    if (isMissingTable(error)) return missingTableResponse();
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ liked: true }, { status: 201 });
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

function isMissingTable(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42P01" || error.code === "PGRST205" || (message.includes("community_reactions") && message.includes("schema cache"));
}

function missingTableResponse() {
  return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/add_community_likes_comments.sql in the Supabase SQL Editor." }, { status: 503 });
}
