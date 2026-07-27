"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bike, CheckCircle2, Dumbbell, Heart, Loader2, MessageCircle, MoreHorizontal, Pencil, Plus, RefreshCw, Route, Send, Sparkles, Trash2, UserCheck, UserMinus, UserPlus, Users, X } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

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

type FeedPayload = {
  profile: { name: string; avatarUrl: string | null } | null;
  scope: "all" | "me";
  friendCount: number;
  items: FeedItem[];
};

type FriendItem = {
  friendshipId: string;
  userId: string;
  status: "pending" | "accepted" | "blocked";
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

type FriendsPayload = {
  friends: FriendItem[];
  incoming: FriendItem[];
  outgoing: FriendItem[];
  members: Array<{ id: string; name: string; email: string | null; avatarUrl: string | null }>;
};

const typeStyles = {
  post: { label: "Update", icon: Sparkles, color: "bg-secondary/35 text-primary" },
  strava: { label: "Strava", icon: Route, color: "bg-orange-100 text-orange-600" },
  workout: { label: "Workout", icon: Dumbbell, color: "bg-emerald-100 text-emerald-700" },
  challenge: { label: "Challenge", icon: CheckCircle2, color: "bg-pink-100 text-primary" }
};

export function CommunityFeed() {
  const { toast } = useToast();
  const [targetItemId] = useState(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("item");
  });
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [postBody, setPostBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [scope, setScope] = useState<"all" | "me">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | FeedItem["type"]>("all");
  const [friendSearch, setFriendSearch] = useState("");
  const [friendAction, setFriendAction] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [interactionAction, setInteractionAction] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const query = useQuery({
    queryKey: ["community-feed", scope],
    queryFn: async () => {
      const response = await fetch(`/api/community/feed?scope=${scope}`, { credentials: "same-origin" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Community feed kon niet geladen worden.");
      return payload as FeedPayload;
    },
    refetchOnWindowFocus: true
  });

  const friendsQuery = useQuery({
    queryKey: ["community-friends", friendSearch],
    queryFn: async () => {
      const params = friendSearch.trim().length >= 2 ? `?search=${encodeURIComponent(friendSearch.trim())}` : "";
      const response = await fetch(`/api/community/friends${params}`, { credentials: "same-origin" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Vrienden konden niet geladen worden.");
      return payload as FriendsPayload;
    },
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel("community-feed-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "completed_workouts" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "strava_activities" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_challenge_completions" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_reactions" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_comments" }, () => query.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_friendships" }, () => {
        query.refetch();
        friendsQuery.refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [query, friendsQuery]);

  useEffect(() => {
    if (!targetItemId || !query.data?.items.some((item) => item.id === targetItemId)) return;

    setTypeFilter("all");
    setHighlightedItemId(targetItemId);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`feed-item-${targetItemId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timeout = window.setTimeout(() => setHighlightedItemId(null), 3000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [query.data?.items, targetItemId]);

  async function createPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPosting(true);
    try {
      const response = await fetch("/api/community/feed", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: postBody })
      });
      const payload = await response.json().catch(() => ({ error: "Post kon niet geplaatst worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Post kon niet geplaatst worden.");
      setPostBody("");
      toast({ title: "Post geplaatst", description: "Je update staat bovenaan je tijdlijn." });
      await query.refetch();
    } catch (error) {
      toast({ title: "Post mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setPosting(false);
    }
  }

  async function updateFriend(action: "add" | "accept" | "remove", id: string) {
    setFriendAction(`${action}-${id}`);
    try {
      const response = await fetch("/api/community/friends", {
        method: action === "add" ? "POST" : "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "add" ? { userId: id } : { friendshipId: id, action })
      });
      const payload = await response.json().catch(() => ({ error: "Actie kon niet uitgevoerd worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Actie kon niet uitgevoerd worden.");
      toast({
        title: action === "add" ? "Verzoek verstuurd" : action === "accept" ? "Vriend toegevoegd" : "Vriend verwijderd",
        description: action === "add" ? "Zodra je verzoek geaccepteerd is, verschijnt hun feed bij jou." : "Je community feed is bijgewerkt."
      });
      await Promise.all([friendsQuery.refetch(), query.refetch()]);
    } catch (error) {
      toast({ title: "Actie mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setFriendAction(null);
    }
  }

  async function toggleLike(item: FeedItem) {
    setInteractionAction(`like-${item.id}`);
    try {
      const response = await fetch("/api/community/reactions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedItemId: item.id, feedItemType: item.type })
      });
      const payload = await response.json().catch(() => ({ error: "Like kon niet opgeslagen worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Like kon niet opgeslagen worden.");
      await query.refetch();
    } catch (error) {
      toast({ title: "Like mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setInteractionAction(null);
    }
  }

  async function createComment(item: FeedItem, parentCommentId?: string) {
    const body = parentCommentId ? replyDrafts[parentCommentId]?.trim() ?? "" : commentDrafts[item.id]?.trim() ?? "";
    if (!body) return;
    setInteractionAction(parentCommentId ? `reply-${parentCommentId}` : `comment-${item.id}`);
    try {
      const response = await fetch("/api/community/comments", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedItemId: item.id, feedItemType: item.type, parentCommentId: parentCommentId ?? null, body })
      });
      const payload = await response.json().catch(() => ({ error: "Reactie kon niet geplaatst worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Reactie kon niet geplaatst worden.");
      if (parentCommentId) {
        setReplyDrafts((drafts) => ({ ...drafts, [parentCommentId]: "" }));
        setOpenReplyId(null);
      } else {
        setCommentDrafts((drafts) => ({ ...drafts, [item.id]: "" }));
      }
      await query.refetch();
    } catch (error) {
      toast({ title: "Reactie mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setInteractionAction(null);
    }
  }

  async function deleteComment(commentId: string) {
    setInteractionAction(`delete-${commentId}`);
    try {
      const response = await fetch("/api/community/comments", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId })
      });
      const payload = await response.json().catch(() => ({ error: "Reactie kon niet verwijderd worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Reactie kon niet verwijderd worden.");
      await query.refetch();
    } catch (error) {
      toast({ title: "Verwijderen mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setInteractionAction(null);
    }
  }

  async function updatePost(item: FeedItem) {
    const postId = getPostUuid(item.id);
    const body = editingBody.trim();
    if (!postId || body.length < 2) return;
    setInteractionAction(`edit-${item.id}`);
    try {
      const response = await fetch("/api/community/feed", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, body })
      });
      const payload = await response.json().catch(() => ({ error: "Post kon niet aangepast worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Post kon niet aangepast worden.");
      setEditingPostId(null);
      setEditingBody("");
      toast({ title: "Post aangepast", description: "Je tijdlijn is bijgewerkt." });
      await query.refetch();
    } catch (error) {
      toast({ title: "Aanpassen mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setInteractionAction(null);
    }
  }

  async function deletePost(item: FeedItem) {
    const postId = getPostUuid(item.id);
    if (!postId) return;
    setInteractionAction(`delete-post-${item.id}`);
    try {
      const response = await fetch("/api/community/feed", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId })
      });
      const payload = await response.json().catch(() => ({ error: "Post kon niet verwijderd worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Post kon niet verwijderd worden.");
      toast({ title: "Post verwijderd", description: "Je update is uit de feed gehaald." });
      await query.refetch();
    } catch (error) {
      toast({ title: "Verwijderen mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setInteractionAction(null);
    }
  }

  const profileName = query.data?.profile?.name ?? "Member";
  const avatarUrl = query.data?.profile?.avatarUrl ?? null;
  const filteredItems = query.data?.items.filter((item) => typeFilter === "all" || item.type === typeFilter) ?? [];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Card>
          <form onSubmit={createPost} className="space-y-4">
            <div className="flex gap-3">
              <Avatar src={avatarUrl ?? undefined} name={profileName} className="h-11 w-11 shrink-0" />
              <textarea
                value={postBody}
                onChange={(event) => setPostBody(event.target.value)}
                placeholder={`Waar denk je aan, ${profileName}?`}
                className="min-h-24 flex-1 resize-none rounded-[24px] border border-border bg-background p-4 text-sm font-semibold outline-none placeholder:text-muted/70 focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
                maxLength={800}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-xs font-bold text-muted">Eigen posts, workouts, Strava en challenges komen automatisch op datum in de feed.</p>
              <Button type="submit" disabled={posting || postBody.trim().length < 2}>
                {posting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                Post plaatsen
              </Button>
            </div>
          </form>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl font-extrabold">Tijdlijn</h2>
            <p className="text-sm font-bold text-muted">
              {scope === "all" ? `Jouw feed plus ${query.data?.friendCount ?? 0} vrienden.` : "Alleen jouw eigen activiteiten en posts."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={scope === "all" ? "default" : "outline"} onClick={() => setScope("all")}>
              <Users size={16} />
              Iedereen
            </Button>
            <Button type="button" variant={scope === "me" ? "default" : "outline"} onClick={() => setScope("me")}>
              Mijn feed
            </Button>
            <Button type="button" variant="outline" onClick={() => query.refetch()}>
              <RefreshCw size={16} />
              Vernieuw
            </Button>
          </div>
        </div>

        {query.data && query.data.items.length > 0 && (
          <Card className="flex flex-wrap items-center gap-2 p-3">
            {[
              { value: "all", label: "Alles" },
              { value: "post", label: "Posts" },
              { value: "strava", label: "Strava" },
              { value: "workout", label: "Workouts" },
              { value: "challenge", label: "Challenges" }
            ].map((filter) => (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={typeFilter === filter.value ? "default" : "ghost"}
                onClick={() => setTypeFilter(filter.value as typeof typeFilter)}
              >
                {filter.label}
              </Button>
            ))}
          </Card>
        )}

        {query.isLoading && <FeedSkeleton />}
        {query.error && (
          <Card>
            <CardTitle>Feed kon niet laden</CardTitle>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">{query.error instanceof Error ? query.error.message : "Probeer opnieuw."}</p>
          </Card>
        )}
        {query.data && query.data.items.length === 0 && (
          <Card className="text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-secondary/35 text-primary">
              <Plus />
            </div>
            <CardTitle>Je tijdlijn is nog leeg</CardTitle>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-muted">Plaats je eerste update, sync Strava of rond een workout af. Alles verschijnt hier automatisch op datum.</p>
          </Card>
        )}
        {query.data && query.data.items.length > 0 && filteredItems.length === 0 && (
          <Card className="text-center">
            <CardTitle>Geen items in deze filter</CardTitle>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-muted">Kies een andere filter om opnieuw activiteiten te zien.</p>
          </Card>
        )}
        {query.data && filteredItems.length > 0 && (
          <div className="relative space-y-5 before:absolute before:left-5 before:top-2 before:h-full before:w-px before:bg-border">
            {filteredItems.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                highlighted={highlightedItemId === item.id}
                draft={commentDrafts[item.id] ?? ""}
                busyAction={interactionAction}
                onDraftChange={(value) => setCommentDrafts((drafts) => ({ ...drafts, [item.id]: value }))}
                onLike={() => toggleLike(item)}
                onComment={() => createComment(item)}
                openReplyId={openReplyId}
                replyDrafts={replyDrafts}
                onToggleReply={(commentId) => setOpenReplyId((current) => (current === commentId ? null : commentId))}
                onReplyDraftChange={(commentId, value) => setReplyDrafts((drafts) => ({ ...drafts, [commentId]: value }))}
                onReply={(commentId) => createComment(item, commentId)}
                onDeleteComment={deleteComment}
                editing={editingPostId === item.id}
                editingBody={editingBody}
                onStartEdit={() => {
                  setEditingPostId(item.id);
                  setEditingBody(item.body);
                }}
                onCancelEdit={() => {
                  setEditingPostId(null);
                  setEditingBody("");
                }}
                onEditingBodyChange={setEditingBody}
                onSaveEdit={() => updatePost(item)}
                onDeletePost={() => deletePost(item)}
              />
            ))}
          </div>
        )}
      </div>

      <FriendsPanel
        search={friendSearch}
        onSearch={setFriendSearch}
        data={friendsQuery.data}
        loading={friendsQuery.isLoading}
        error={friendsQuery.error}
        actionId={friendAction}
        onAction={updateFriend}
      />
    </div>
  );
}

function FeedCard({
  item,
  highlighted,
  draft,
  busyAction,
  onDraftChange,
  onLike,
  onComment,
  openReplyId,
  replyDrafts,
  onToggleReply,
  onReplyDraftChange,
  onReply,
  onDeleteComment
  ,
  editing,
  editingBody,
  onStartEdit,
  onCancelEdit,
  onEditingBodyChange,
  onSaveEdit,
  onDeletePost
}: {
  item: FeedItem;
  highlighted: boolean;
  draft: string;
  busyAction: string | null;
  onDraftChange: (value: string) => void;
  onLike: () => void;
  onComment: () => void;
  openReplyId: string | null;
  replyDrafts: Record<string, string>;
  onToggleReply: (commentId: string) => void;
  onReplyDraftChange: (commentId: string, value: string) => void;
  onReply: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  editing: boolean;
  editingBody: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditingBodyChange: (value: string) => void;
  onSaveEdit: () => void;
  onDeletePost: () => void;
}) {
  const style = typeStyles[item.type];
  const Icon = style.icon;
  const likeBusy = busyAction === `like-${item.id}`;
  const commentBusy = busyAction === `comment-${item.id}`;
  const editBusy = busyAction === `edit-${item.id}`;
  const deletePostBusy = busyAction === `delete-post-${item.id}`;
  const commentCount = item.comments.reduce((total, comment) => total + 1 + comment.replies.length, 0);
  return (
    <article
      id={`feed-item-${item.id}`}
      className={`relative scroll-mt-24 rounded-[28px] pl-12 transition-[box-shadow,background-color] duration-500 ${
        highlighted ? "bg-secondary/25 shadow-[0_0_0_4px_rgba(236,72,153,0.22)]" : ""
      }`}
    >
      <div className="absolute left-0 top-5 z-10 grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-primary shadow-soft">
        <Icon size={18} />
      </div>
      <Card className="overflow-hidden p-0">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <Avatar src={item.authorAvatarUrl ?? undefined} name={item.authorName} className="h-11 w-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-extrabold">{item.authorName}</p>
                <Badge className={style.color}>{style.label}</Badge>
              </div>
              <p className="mt-1 text-xs font-bold text-muted">{formatDate(item.date)}</p>
            </div>
            {item.type === "post" && item.ownedByMe && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button type="button" size="icon" variant="ghost" aria-label="Post acties">
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" className="z-50 mt-2 w-48 rounded-[20px] border border-border bg-card p-2 shadow-2xl">
                    <DropdownMenu.Item asChild>
                      <button type="button" onClick={onStartEdit} className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold outline-none hover:bg-secondary/25">
                        <Pencil size={15} />
                        Bewerken
                      </button>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <button type="button" onClick={onDeletePost} disabled={deletePostBusy} className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold text-red-500 outline-none hover:bg-red-50">
                        {deletePostBusy ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                        Verwijderen
                      </button>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}
          </div>

          <div className="mt-5">
            <CardTitle className="text-2xl">{item.title}</CardTitle>
            {editing ? (
              <div className="mt-3 space-y-3">
                <textarea
                  value={editingBody}
                  onChange={(event) => onEditingBodyChange(event.target.value)}
                  className="min-h-28 w-full resize-none rounded-[24px] border border-border bg-background p-4 text-sm font-semibold outline-none focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
                  maxLength={800}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={onCancelEdit}>
                    <X size={15} />
                    Annuleer
                  </Button>
                  <Button type="button" onClick={onSaveEdit} disabled={editBusy || editingBody.trim().length < 2}>
                    {editBusy ? <Loader2 className="animate-spin" size={15} /> : <Pencil size={15} />}
                    Opslaan
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-7 text-muted">{item.body}</p>
            )}
            {item.meta.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.meta.map((meta) => (
                  <span key={meta} className="rounded-full bg-background px-3 py-1.5 text-xs font-black text-muted">
                    {meta}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {item.imageUrl && (
          <div className="relative h-72 w-full bg-background">
            <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-border p-3">
          <Button type="button" variant="ghost" size="sm" onClick={onLike} disabled={likeBusy} className={item.likedByMe ? "text-primary" : undefined}>
            {likeBusy ? <Loader2 className="animate-spin" size={16} /> : <Heart size={16} fill={item.likedByMe ? "currentColor" : "none"} />}
            {item.likeCount > 0 ? `${item.likeCount} like${item.likeCount === 1 ? "" : "s"}` : "Like"}
          </Button>
          <Button type="button" variant="ghost" size="sm">
            <MessageCircle size={16} />
            {commentCount > 0 ? `${commentCount} reactie${commentCount === 1 ? "" : "s"}` : "Reageer"}
          </Button>
          {item.type === "strava" && (
            <span className="ml-auto flex items-center gap-1 text-xs font-black text-orange-500">
              <Bike size={14} />
              Synced
            </span>
          )}
        </div>

        <div className="space-y-3 border-t border-border bg-background/45 p-4">
          {item.comments.length > 0 && (
            <div className="space-y-3">
              {item.comments.map((comment) => (
                <div key={comment.id} className="rounded-[20px] bg-card p-3">
                  <div className="flex gap-3">
                    <Avatar src={comment.authorAvatarUrl ?? undefined} name={comment.authorName} className="h-9 w-9 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-extrabold">{comment.authorName}</p>
                          <p className="text-xs font-bold text-muted">{formatShortDate(comment.createdAt)}</p>
                        </div>
                        {comment.ownedByMe && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => onDeleteComment(comment.id)} disabled={busyAction === `delete-${comment.id}`}>
                            {busyAction === `delete-${comment.id}` ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                          </Button>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-muted">{comment.body}</p>
                      <Button type="button" variant="ghost" size="sm" className="mt-1 px-0 text-xs text-primary" onClick={() => onToggleReply(comment.id)}>
                        <MessageCircle size={14} />
                        Reageer
                      </Button>
                    </div>
                  </div>

                  {comment.replies.length > 0 && (
                    <div className="ml-12 mt-3 space-y-3 border-l border-secondary/60 pl-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3 rounded-[18px] bg-background/80 p-3">
                          <Avatar src={reply.authorAvatarUrl ?? undefined} name={reply.authorName} className="h-8 w-8 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-extrabold">{reply.authorName}</p>
                                <p className="text-[11px] font-bold text-muted">{formatShortDate(reply.createdAt)}</p>
                              </div>
                              {reply.ownedByMe && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => onDeleteComment(reply.id)} disabled={busyAction === `delete-${reply.id}`}>
                                  {busyAction === `delete-${reply.id}` ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
                                </Button>
                              )}
                            </div>
                            <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-muted">{reply.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {openReplyId === comment.id && (
                    <div className="ml-12 mt-3 flex gap-2">
                      <input
                        value={replyDrafts[comment.id] ?? ""}
                        onChange={(event) => onReplyDraftChange(comment.id, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            onReply(comment.id);
                          }
                        }}
                        placeholder={`Reageer op ${comment.authorName}...`}
                        maxLength={500}
                        className="h-10 min-w-0 flex-1 rounded-[16px] border border-border bg-background px-4 text-sm font-semibold outline-none placeholder:text-muted/70 focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
                      />
                      <Button type="button" size="sm" onClick={() => onReply(comment.id)} disabled={busyAction === `reply-${comment.id}` || !(replyDrafts[comment.id] ?? "").trim()}>
                        {busyAction === `reply-${comment.id}` ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Avatar name="Jij" className="h-9 w-9 shrink-0" />
            <input
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onComment();
                }
              }}
              placeholder="Schrijf een reactie..."
              maxLength={500}
              className="h-11 min-w-0 flex-1 rounded-[16px] border border-border bg-card px-4 text-sm font-semibold outline-none placeholder:text-muted/70 focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
            />
            <Button type="button" size="sm" onClick={onComment} disabled={commentBusy || draft.trim().length < 1}>
              {commentBusy ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
            </Button>
          </div>
        </div>
      </Card>
    </article>
  );
}

function getPostUuid(feedItemId: string) {
  return feedItemId.startsWith("post-") ? feedItemId.replace("post-", "") : null;
}

function FriendsPanel({
  search,
  onSearch,
  data,
  loading,
  error,
  actionId,
  onAction
}: {
  search: string;
  onSearch: (value: string) => void;
  data?: FriendsPayload;
  loading: boolean;
  error: unknown;
  actionId: string | null;
  onAction: (action: "add" | "accept" | "remove", id: string) => Promise<void>;
}) {
  return (
    <aside className="space-y-5">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="text-2xl">Vrienden</CardTitle>
          <Users className="text-primary" />
        </div>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Zoek op naam of e-mail"
          className="h-12 w-full rounded-[16px] border border-border bg-background px-4 text-sm font-bold outline-none placeholder:text-muted/70 focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
        />
        <p className="mt-3 text-xs font-bold leading-5 text-muted">Voeg leden toe als vriend. Na acceptatie zie je elkaars posts, workouts, Strava en challenges in dezelfde feed.</p>
      </Card>

      {Boolean(error) && (
        <Card>
          <p className="text-sm font-extrabold">Vrienden konden niet laden</p>
          <p className="mt-2 text-xs font-bold leading-5 text-muted">{error instanceof Error ? error.message : "Run de database SQL voor community friends."}</p>
        </Card>
      )}

      {loading && <Card className="h-32 animate-pulse" />}

      {data && data.incoming.length > 0 && (
        <FriendList title="Verzoeken" items={data.incoming} actionLabel="Accepteer" actionIcon={UserCheck} action="accept" actionId={actionId} onAction={onAction} />
      )}

      {data && search.trim().length >= 2 && (
        <Card>
          <p className="mb-4 text-sm font-extrabold">Zoekresultaten</p>
          {data.members.length === 0 ? (
            <p className="text-sm font-bold text-muted">Geen nieuwe leden gevonden.</p>
          ) : (
            <div className="space-y-3">
              {data.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-[20px] bg-background/80 p-3">
                  <Avatar src={member.avatarUrl ?? undefined} name={member.name} className="h-10 w-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{member.name}</p>
                    <p className="truncate text-xs font-bold text-muted">{member.email}</p>
                  </div>
                  <Button type="button" size="sm" onClick={() => onAction("add", member.id)} disabled={actionId === `add-${member.id}`}>
                    {actionId === `add-${member.id}` ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {data && data.outgoing.length > 0 && (
        <FriendList title="In afwachting" items={data.outgoing} muted actionLabel="Annuleer" actionIcon={UserMinus} action="remove" actionId={actionId} onAction={onAction} />
      )}

      {data && (
        <FriendList title="Mijn vrienden" items={data.friends} emptyText="Nog geen vrienden toegevoegd." actionLabel="Verwijder" actionIcon={UserMinus} action="remove" actionId={actionId} onAction={onAction} />
      )}
    </aside>
  );
}

function FriendList({
  title,
  items,
  emptyText,
  muted,
  actionLabel,
  actionIcon: ActionIcon,
  action,
  actionId,
  onAction
}: {
  title: string;
  items: FriendItem[];
  emptyText?: string;
  muted?: boolean;
  actionLabel: string;
  actionIcon: typeof UserPlus;
  action: "accept" | "remove";
  actionId: string | null;
  onAction: (action: "add" | "accept" | "remove", id: string) => Promise<void>;
}) {
  return (
    <Card>
      <p className="mb-4 text-sm font-extrabold">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm font-bold text-muted">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.friendshipId} className="flex items-center gap-3 rounded-[20px] bg-background/80 p-3">
              <Avatar src={item.avatarUrl ?? undefined} name={item.name} className="h-10 w-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold">{item.name}</p>
                <p className="truncate text-xs font-bold text-muted">{muted ? "Wacht op acceptatie" : item.email}</p>
              </div>
              <Button type="button" size="sm" variant={action === "accept" ? "default" : "outline"} onClick={() => onAction(action, item.friendshipId)} disabled={actionId === `${action}-${item.friendshipId}`}>
                {actionId === `${action}-${item.friendshipId}` ? <Loader2 className="animate-spin" size={14} /> : <ActionIcon size={14} />}
                <span className="sr-only">{actionLabel}</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((item) => (
        <Card key={item} className="h-48 animate-pulse" />
      ))}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
