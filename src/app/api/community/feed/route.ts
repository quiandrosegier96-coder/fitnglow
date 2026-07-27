import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const postSchema = z.object({
  body: z.string().min(2, "Schrijf minstens 2 tekens.").max(800, "Een post mag maximaal 800 tekens bevatten.")
});

const updatePostSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(2, "Schrijf minstens 2 tekens.").max(800, "Een post mag maximaal 800 tekens bevatten.")
});

const deletePostSchema = z.object({
  postId: z.string().uuid()
});

type FeedItem = {
  id: string;
  type: "post" | "strava" | "workout" | "challenge";
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  ownedByMe: boolean;
  date: string;
  title: string;
  body: string;
  meta: string[];
  imageUrl?: string | null;
  likeCount: number;
  likedByMe: boolean;
  comments: Array<{
    id: string;
    authorName: string;
    authorAvatarUrl: string | null;
    body: string;
    createdAt: string;
    ownedByMe: boolean;
    replies: Array<{
      id: string;
      authorName: string;
      authorAvatarUrl: string | null;
      body: string;
      createdAt: string;
      ownedByMe: boolean;
    }>;
  }>;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type BodyProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ items: [], profile: null });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to load community feed." }, { status: 401 });

  await ensureProfile(supabase, user);
  const scope = request.nextUrl.searchParams.get("scope") === "me" ? "me" : "all";
  const friendIds = scope === "me" ? [] : await loadAcceptedFriendIds(supabase, user.id);
  const visibleUserIds = [user.id, ...friendIds];

  const [profileResult, bodyProfileResult, authorProfilesResult, authorBodyProfilesResult, postsResult, stravaResult, workoutsResult, challengesResult] = await Promise.all([
    supabase.from("profiles").select("full_name,avatar_url,email").eq("id", user.id).maybeSingle(),
    supabase.from("body_profiles").select("first_name,last_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("id,full_name,avatar_url,email").in("id", visibleUserIds),
    supabase.from("body_profiles").select("user_id,first_name,last_name").in("user_id", visibleUserIds),
    supabase.from("community_posts").select("id,user_id,body,created_at").in("user_id", visibleUserIds).order("created_at", { ascending: false }).limit(80),
    supabase
      .from("strava_activities")
      .select("id,user_id,name,sport_type,type,distance_meters,moving_time_seconds,calories,total_elevation_gain,image_url,start_date")
      .in("user_id", visibleUserIds)
      .order("start_date", { ascending: false })
      .limit(80),
    supabase
      .from("completed_workouts")
      .select("id,user_id,duration_minutes,calories,completion_percentage,personal_notes,completed_at,workouts(title,coach_name,cover_image_url)")
      .in("user_id", visibleUserIds)
      .order("completed_at", { ascending: false })
      .limit(80),
    supabase
      .from("daily_challenge_completions")
      .select("challenge_id,user_id,started_at,completed_at,daily_challenges(title,thumbnail_url,duration_minutes)")
      .in("user_id", visibleUserIds)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(80)
  ]);

  if (postsResult.error && isMissingCommunityPostsTable(postsResult.error)) {
    return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/fix_community_feed.sql in the Supabase SQL Editor." }, { status: 503 });
  }

  const authorName =
    bodyProfileResult.data?.first_name ||
    profileResult.data?.full_name?.split(/\s+/).filter(Boolean)[0] ||
    user.email?.split("@")[0] ||
    "Member";

  const authorMap = buildAuthorMap((authorProfilesResult.data ?? []) as ProfileRow[], (authorBodyProfilesResult.data ?? []) as BodyProfileRow[]);

  const items = [
    ...((postsResult.data ?? []) as Array<{ id: string; user_id: string; body: string; created_at: string }>).map((post) => ({
      id: `post-${post.id}`,
      type: "post" as const,
      ...authorFields(post.user_id, authorMap),
      ownedByMe: post.user_id === user.id,
      date: post.created_at,
      title: `${authorFields(post.user_id, authorMap).authorName} deelde een update`,
      body: post.body,
      meta: ["Eigen post"],
      imageUrl: null
    })),
    ...(stravaResult.error ? [] : ((stravaResult.data ?? []) as Array<{
      id: string;
      user_id: string;
      name: string;
      sport_type: string | null;
      type: string | null;
      distance_meters: number | null;
      moving_time_seconds: number | null;
      calories: number | null;
      total_elevation_gain: number | null;
      image_url: string | null;
      start_date: string;
    }>).map((activity) => ({
      id: `strava-${activity.id}`,
      type: "strava" as const,
      ...authorFields(activity.user_id, authorMap),
      ownedByMe: activity.user_id === user.id,
      date: activity.start_date,
      title: activity.name || `${activity.sport_type ?? activity.type ?? "Strava"} activiteit`,
      body: "Strava activiteit gesynchroniseerd met Fit & Glow.",
      meta: [
        activity.sport_type ?? activity.type ?? "Strava",
        formatDistance(activity.distance_meters),
        formatDuration(activity.moving_time_seconds),
        `${Math.round(Number(activity.calories ?? 0))} kcal`
      ].filter(Boolean),
      imageUrl: activity.image_url
    }))),
    ...(workoutsResult.error ? [] : ((workoutsResult.data ?? []) as Array<{
      id: string;
      user_id: string;
      duration_minutes: number | null;
      calories: number | null;
      completion_percentage: number | null;
      personal_notes: string | null;
      completed_at: string;
      workouts: { title?: string | null; coach_name?: string | null; cover_image_url?: string | null } | null;
    }>).map((workout) => ({
      id: `workout-${workout.id}`,
      type: "workout" as const,
      ...authorFields(workout.user_id, authorMap),
      ownedByMe: workout.user_id === user.id,
      date: workout.completed_at,
      title: workout.workouts?.title ?? "Workout voltooid",
      body: workout.personal_notes || "Workout afgerond en toegevoegd aan je Fit & Glow voortgang.",
      meta: [
        "Workout",
        workout.duration_minutes ? `${Math.round(Number(workout.duration_minutes))} min` : "",
        `${Math.round(Number(workout.calories ?? 0))} kcal`,
        `${Math.round(Number(workout.completion_percentage ?? 100))}% voltooid`
      ].filter(Boolean),
      imageUrl: workout.workouts?.cover_image_url ?? null
    }))),
    ...(challengesResult.error ? [] : ((challengesResult.data ?? []) as Array<{
      challenge_id: string;
      user_id: string;
      completed_at: string;
      daily_challenges: { title?: string | null; thumbnail_url?: string | null; duration_minutes?: number | null } | null;
    }>).map((challenge) => ({
      id: `challenge-${challenge.challenge_id}-${challenge.completed_at}`,
      type: "challenge" as const,
      ...authorFields(challenge.user_id, authorMap),
      ownedByMe: challenge.user_id === user.id,
      date: challenge.completed_at,
      title: challenge.daily_challenges?.title ?? "Challenge voltooid",
      body: "Challenge van de dag afgevinkt.",
      meta: ["Challenge", challenge.daily_challenges?.duration_minutes ? `${challenge.daily_challenges.duration_minutes} min` : ""].filter(Boolean),
      imageUrl: challenge.daily_challenges?.thumbnail_url ?? null
    })))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const enrichedItems = await addInteractions(supabase, user.id, items, authorMap);

  return NextResponse.json({
    profile: {
      name: authorName,
      avatarUrl: profileResult.data?.avatar_url ?? null
    },
    scope,
    friendCount: friendIds.length,
    items: enrichedItems
  });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 25, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to create a post." }, { status: 401 });

  let payload: z.infer<typeof postSchema>;
  try {
    payload = validateBody(postSchema, await request.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Controleer je post." }, { status: 400 });
    }
    throw error;
  }

  await ensureProfile(supabase, user);
  const { data, error } = await supabase
    .from("community_posts")
    .insert({ user_id: user.id, body: payload.body.trim() })
    .select("id,body,created_at")
    .single();

  if (error) {
    if (isMissingCommunityPostsTable(error)) {
      return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/fix_community_feed.sql in the Supabase SQL Editor." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ post: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, 25, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to edit a post." }, { status: 401 });

  let payload: z.infer<typeof updatePostSchema>;
  try {
    payload = validateBody(updatePostSchema, await request.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Controleer je post." }, { status: 400 });
    }
    throw error;
  }

  const { error } = await supabase
    .from("community_posts")
    .update({ body: payload.body.trim(), updated_at: new Date().toISOString() })
    .eq("id", payload.postId)
    .eq("user_id", user.id);

  if (error) {
    if (isMissingCommunityPostsTable(error)) {
      return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/fix_community_feed.sql in the Supabase SQL Editor." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, 25, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to delete a post." }, { status: 401 });

  let payload: z.infer<typeof deletePostSchema>;
  try {
    payload = validateBody(deletePostSchema, await request.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Controleer je post." }, { status: 400 });
    }
    throw error;
  }

  const { error } = await supabase.from("community_posts").delete().eq("id", payload.postId).eq("user_id", user.id);

  if (error) {
    if (isMissingCommunityPostsTable(error)) {
      return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/fix_community_feed.sql in the Supabase SQL Editor." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
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

function isMissingCommunityPostsTable(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42P01" || error.code === "PGRST205" || (message.includes("community_posts") && message.includes("schema cache"));
}

async function loadAcceptedFriendIds(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("community_friendships")
    .select("requester_id,addressee_id,status")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "accepted");

  if (error) return [];

  return Array.from(
    new Set(
      ((data ?? []) as Array<{ requester_id: string; addressee_id: string }>).map((friendship) =>
        friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id
      )
    )
  );
}

function buildAuthorMap(profiles: ProfileRow[], bodyProfiles: BodyProfileRow[]) {
  const bodyMap = new Map(bodyProfiles.map((profile) => [profile.user_id, profile]));
  return new Map(
    profiles.map((profile) => {
      const bodyProfile = bodyMap.get(profile.id);
      const firstName = bodyProfile?.first_name?.trim();
      const fullName = [bodyProfile?.first_name, bodyProfile?.last_name].filter(Boolean).join(" ").trim();
      return [
        profile.id,
        {
          authorId: profile.id,
          authorName: firstName || fullName || profile.full_name || profile.email?.split("@")[0] || "Fit & Glow member",
          authorAvatarUrl: profile.avatar_url ?? null
        }
      ];
    })
  );
}

function authorFields(userId: string, authorMap: Map<string, { authorId: string; authorName: string; authorAvatarUrl: string | null }>) {
  return (
    authorMap.get(userId) ?? {
      authorId: userId,
      authorName: "Fit & Glow member",
      authorAvatarUrl: null
    }
  );
}

async function addInteractions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  currentUserId: string,
  items: Array<Omit<FeedItem, "likeCount" | "likedByMe" | "comments">>,
  authorMap: Map<string, { authorId: string; authorName: string; authorAvatarUrl: string | null }>
) {
  if (!supabase || items.length === 0) {
    return items.map((item) => ({ ...item, likeCount: 0, likedByMe: false, comments: [] }));
  }

  const itemIds = items.map((item) => item.id);
  const [reactionsResult, commentsResult] = await Promise.all([
    supabase.from("community_reactions").select("feed_item_id,user_id").in("feed_item_id", itemIds).eq("reaction_type", "like"),
    supabase.from("community_comments").select("id,user_id,parent_comment_id,feed_item_id,body,created_at").in("feed_item_id", itemIds).order("created_at", { ascending: true })
  ]);

  if (reactionsResult.error || commentsResult.error) {
    return items.map((item) => ({ ...item, likeCount: 0, likedByMe: false, comments: [] }));
  }

  const reactions = (reactionsResult.data ?? []) as Array<{ feed_item_id: string; user_id: string }>;
  const comments = (commentsResult.data ?? []) as Array<{ id: string; user_id: string; parent_comment_id: string | null; feed_item_id: string; body: string; created_at: string }>;
  const missingCommentAuthorIds = Array.from(new Set(comments.map((comment) => comment.user_id).filter((id) => !authorMap.has(id))));

  if (missingCommentAuthorIds.length > 0) {
    const [profilesResult, bodyProfilesResult] = await Promise.all([
      supabase.from("profiles").select("id,full_name,avatar_url,email").in("id", missingCommentAuthorIds),
      supabase.from("body_profiles").select("user_id,first_name,last_name").in("user_id", missingCommentAuthorIds)
    ]);
    buildAuthorMap((profilesResult.data ?? []) as ProfileRow[], (bodyProfilesResult.data ?? []) as BodyProfileRow[]).forEach((value, key) => authorMap.set(key, value));
  }

  return items.map((item) => {
    const itemReactions = reactions.filter((reaction) => reaction.feed_item_id === item.id);
    const itemComments = comments.filter((comment) => comment.feed_item_id === item.id);
    const repliesByParent = new Map<string, typeof itemComments>();
    itemComments
      .filter((comment) => comment.parent_comment_id)
      .forEach((comment) => {
        const parentId = comment.parent_comment_id as string;
        repliesByParent.set(parentId, [...(repliesByParent.get(parentId) ?? []), comment]);
      });
    return {
      ...item,
      likeCount: itemReactions.length,
      likedByMe: itemReactions.some((reaction) => reaction.user_id === currentUserId),
      comments: itemComments.filter((comment) => !comment.parent_comment_id).map((comment) => {
        const author = authorFields(comment.user_id, authorMap);
        return {
          id: comment.id,
          authorName: author.authorName,
          authorAvatarUrl: author.authorAvatarUrl,
          body: comment.body,
          createdAt: comment.created_at,
          ownedByMe: comment.user_id === currentUserId,
          replies: (repliesByParent.get(comment.id) ?? []).map((reply) => {
            const replyAuthor = authorFields(reply.user_id, authorMap);
            return {
              id: reply.id,
              authorName: replyAuthor.authorName,
              authorAvatarUrl: replyAuthor.authorAvatarUrl,
              body: reply.body,
              createdAt: reply.created_at,
              ownedByMe: reply.user_id === currentUserId
            };
          })
        };
      })
    };
  });
}

function formatDistance(meters: number | null) {
  const value = Number(meters ?? 0);
  if (!value) return "";
  return `${(value / 1000).toFixed(2)} km`;
}

function formatDuration(seconds: number | null) {
  const value = Number(seconds ?? 0);
  if (!value) return "";
  const hours = Math.floor(value / 3600);
  const minutes = Math.round((value % 3600) / 60);
  return hours ? `${hours}u ${minutes}m` : `${minutes} min`;
}
