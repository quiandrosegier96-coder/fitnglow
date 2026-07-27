import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const addFriendSchema = z.object({
  userId: z.string().uuid()
});

const updateFriendSchema = z.object({
  friendshipId: z.string().uuid(),
  action: z.enum(["accept", "remove"])
});

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  accepted_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ friends: [], incoming: [], outgoing: [], members: [] });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required to load friends." }, { status: 401 });

  await ensureProfile(supabase, user);

  const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";

  const friendshipsResult = await supabase
    .from("community_friendships")
    .select("id,requester_id,addressee_id,status,created_at,accepted_at")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (friendshipsResult.error) {
    if (isMissingFriendshipsTable(friendshipsResult.error)) {
      return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/add_community_friends.sql in the Supabase SQL Editor." }, { status: 503 });
    }
    return NextResponse.json({ error: friendshipsResult.error.message }, { status: 400 });
  }

  const friendships = (friendshipsResult.data ?? []) as FriendshipRow[];
  const relatedIds = Array.from(new Set(friendships.flatMap((friendship) => [friendship.requester_id, friendship.addressee_id]).filter((id) => id !== user.id)));
  const searchedProfiles = search.length >= 2 ? await searchProfiles(supabase, user.id, search) : [];
  const allProfileIds = Array.from(new Set([...relatedIds, ...searchedProfiles.map((profile) => profile.id)]));
  const profileMap = await loadProfileMap(supabase, allProfileIds);

  const friendItems = friendships
    .filter((friendship) => friendship.status === "accepted")
    .map((friendship) => toFriendItem(friendship, user.id, profileMap))
    .filter(Boolean);

  const incoming = friendships
    .filter((friendship) => friendship.status === "pending" && friendship.addressee_id === user.id)
    .map((friendship) => toFriendItem(friendship, user.id, profileMap))
    .filter(Boolean);

  const outgoing = friendships
    .filter((friendship) => friendship.status === "pending" && friendship.requester_id === user.id)
    .map((friendship) => toFriendItem(friendship, user.id, profileMap))
    .filter(Boolean);

  const connectedIds = new Set(friendships.flatMap((friendship) => [friendship.requester_id, friendship.addressee_id]));
  const members = searchedProfiles
    .filter((profile) => profile.id !== user.id && !connectedIds.has(profile.id))
    .map((profile) => ({
      id: profile.id,
      name: profile.full_name || profile.email?.split("@")[0] || "Fit & Glow member",
      email: profile.email,
      avatarUrl: profile.avatar_url
    }));

  return NextResponse.json({ friends: friendItems, incoming, outgoing, members });
}

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
  if (!user) return NextResponse.json({ error: "Login required to add friends." }, { status: 401 });

  let payload: z.infer<typeof addFriendSchema>;
  try {
    payload = validateBody(addFriendSchema, await request.json());
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Controleer je verzoek." }, { status: 400 });
    throw error;
  }

  if (payload.userId === user.id) return NextResponse.json({ error: "Je kunt jezelf niet toevoegen." }, { status: 400 });

  await ensureProfile(supabase, user);

  const { data: reverse } = await supabase
    .from("community_friendships")
    .select("id,status")
    .eq("requester_id", payload.userId)
    .eq("addressee_id", user.id)
    .maybeSingle();

  if (reverse?.id) {
    const { error } = await supabase
      .from("community_friendships")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", reverse.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ status: "accepted" });
  }

  const { error } = await supabase.from("community_friendships").upsert(
    {
      requester_id: user.id,
      addressee_id: payload.userId,
      status: "pending"
    },
    { onConflict: "requester_id,addressee_id" }
  );

  if (error) {
    if (isMissingFriendshipsTable(error)) {
      return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/add_community_friends.sql in the Supabase SQL Editor." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ status: "pending" }, { status: 201 });
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
  if (!user) return NextResponse.json({ error: "Login required to update friends." }, { status: 401 });

  let payload: z.infer<typeof updateFriendSchema>;
  try {
    payload = validateBody(updateFriendSchema, await request.json());
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Controleer je verzoek." }, { status: 400 });
    throw error;
  }

  if (payload.action === "remove") {
    const { error } = await supabase.from("community_friendships").delete().eq("id", payload.friendshipId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ status: "removed" });
  }

  const { error } = await supabase
    .from("community_friendships")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", payload.friendshipId)
    .eq("addressee_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ status: "accepted" });
}

async function searchProfiles(supabase: Awaited<ReturnType<typeof createClient>>, currentUserId: string, search: string) {
  if (!supabase) return [];
  const safeSearch = search.replace(/[%_]/g, "");
  const { data } = await supabase
    .from("profiles")
    .select("id,full_name,email,avatar_url")
    .neq("id", currentUserId)
    .or(`full_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`)
    .order("full_name", { ascending: true })
    .limit(8);
  return (data ?? []) as ProfileRow[];
}

async function loadProfileMap(supabase: Awaited<ReturnType<typeof createClient>>, ids: string[]) {
  const map = new Map<string, ProfileRow>();
  if (!supabase || ids.length === 0) return map;
  const { data } = await supabase.from("profiles").select("id,full_name,email,avatar_url").in("id", ids);
  ((data ?? []) as ProfileRow[]).forEach((profile) => map.set(profile.id, profile));
  return map;
}

function toFriendItem(friendship: FriendshipRow, currentUserId: string, profileMap: Map<string, ProfileRow>) {
  const userId = friendship.requester_id === currentUserId ? friendship.addressee_id : friendship.requester_id;
  const profile = profileMap.get(userId);
  if (!profile) return null;
  return {
    friendshipId: friendship.id,
    userId,
    status: friendship.status,
    name: profile.full_name || profile.email?.split("@")[0] || "Fit & Glow member",
    email: profile.email,
    avatarUrl: profile.avatar_url,
    createdAt: friendship.created_at
  };
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

function isMissingFriendshipsTable(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42P01" || error.code === "PGRST205" || (message.includes("community_friendships") && message.includes("schema cache"));
}
