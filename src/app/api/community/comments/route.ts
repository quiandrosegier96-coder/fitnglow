import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const commentSchema = z.object({
  feedItemId: z.string().min(3).max(140),
  feedItemType: z.enum(["post", "strava", "workout", "challenge"]),
  parentCommentId: z.string().uuid().nullable().optional(),
  body: z.string().trim().min(1, "Schrijf eerst een reactie.").max(500, "Een reactie mag maximaal 500 tekens bevatten.")
});

const deleteSchema = z.object({
  commentId: z.string().uuid()
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 40, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to comment." }, { status: 401 });

  let payload: z.infer<typeof commentSchema>;
  try {
    payload = validateBody(commentSchema, await request.json());
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Controleer je reactie." }, { status: 400 });
    throw error;
  }

  await ensureProfile(supabase, user);

  const { data, error } = await supabase
    .from("community_comments")
    .insert({
      user_id: user.id,
      parent_comment_id: payload.parentCommentId ?? null,
      feed_item_id: payload.feedItemId,
      feed_item_type: payload.feedItemType,
      body: payload.body
    })
    .select("id,user_id,parent_comment_id,feed_item_id,body,created_at")
    .single();

  if (error) {
    if (isMissingTable(error)) return missingTableResponse();
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createCommentNotification(supabase, user, payload);

  return NextResponse.json({ comment: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, 40, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to delete a comment." }, { status: 401 });

  let payload: z.infer<typeof deleteSchema>;
  try {
    payload = validateBody(deleteSchema, await request.json());
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Controleer je reactie." }, { status: 400 });
    throw error;
  }

  const { error } = await supabase.from("community_comments").delete().eq("id", payload.commentId).eq("user_id", user.id);
  if (error) {
    if (isMissingTable(error)) return missingTableResponse();
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ deleted: true });
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
  return error.code === "42P01" || error.code === "PGRST205" || (message.includes("community_comments") && message.includes("schema cache"));
}

function missingTableResponse() {
  return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/add_community_likes_comments.sql in the Supabase SQL Editor." }, { status: 503 });
}

async function createCommentNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actor: { id: string; email?: string | null; user_metadata?: { full_name?: string; name?: string } },
  payload: z.infer<typeof commentSchema>
) {
  if (!supabase) return;

  const ownerId = payload.parentCommentId ? await getCommentOwnerId(supabase, payload.parentCommentId) : await getFeedOwnerId(supabase, payload.feedItemId, payload.feedItemType);
  if (!ownerId || ownerId === actor.id) return;

  const actorName = await getActorName(supabase, actor);
  await supabase.from("notifications").insert({
    user_id: ownerId,
    actor_id: actor.id,
    title: payload.parentCommentId ? `${actorName} reageerde op je reactie` : `${actorName} reageerde op je tijdlijn`,
    body: payload.body,
    kind: "in_app",
    notification_type: "community_comment",
    feed_item_id: payload.feedItemId,
    feed_item_type: payload.feedItemType,
    href: `/community?item=${encodeURIComponent(payload.feedItemId)}`
  });
}

async function getCommentOwnerId(supabase: Awaited<ReturnType<typeof createClient>>, commentId: string) {
  if (!supabase) return null;
  const { data } = await supabase.from("community_comments").select("user_id").eq("id", commentId).maybeSingle();
  return data?.user_id ?? null;
}

async function getFeedOwnerId(supabase: Awaited<ReturnType<typeof createClient>>, feedItemId: string, feedItemType: z.infer<typeof commentSchema>["feedItemType"]) {
  if (!supabase) return null;
  const rawId = feedItemId.replace(new RegExp(`^${feedItemType}-`), "");

  if (feedItemType === "post") {
    const { data } = await supabase.from("community_posts").select("user_id").eq("id", rawId).maybeSingle();
    return data?.user_id ?? null;
  }

  if (feedItemType === "strava") {
    const { data } = await supabase.from("strava_activities").select("user_id").eq("id", rawId).maybeSingle();
    return data?.user_id ?? null;
  }

  if (feedItemType === "workout") {
    const { data } = await supabase.from("completed_workouts").select("user_id").eq("id", rawId).maybeSingle();
    return data?.user_id ?? null;
  }

  const challengeId = rawId.split("-").slice(0, 5).join("-");
  const { data } = await supabase.from("daily_challenge_completions").select("user_id").eq("challenge_id", challengeId).maybeSingle();
  return data?.user_id ?? null;
}

async function getActorName(supabase: Awaited<ReturnType<typeof createClient>>, actor: { id: string; email?: string | null; user_metadata?: { full_name?: string; name?: string } }) {
  if (!supabase) return actor.email?.split("@")[0] ?? "Iemand";
  const [bodyProfile, profile] = await Promise.all([
    supabase.from("body_profiles").select("first_name").eq("user_id", actor.id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", actor.id).maybeSingle()
  ]);

  return (
    bodyProfile.data?.first_name ||
    profile.data?.full_name?.split(/\s+/).filter(Boolean)[0] ||
    actor.user_metadata?.full_name ||
    actor.user_metadata?.name ||
    actor.email?.split("@")[0] ||
    "Iemand"
  );
}
