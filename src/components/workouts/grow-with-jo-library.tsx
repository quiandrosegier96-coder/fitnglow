"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Heart, Loader2, Play, Plus, Trash2, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { ContentRating } from "@/components/workouts/content-rating";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type GrowWithJoVideo = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  youtube_video_id: string;
  created_at: string;
  duration_minutes: number | null;
};

export function GrowWithJoLibrary({
  videos,
  canManage,
  favoriteVideoIds = [],
  likedBy = {},
  completedVideoIds = []
}: {
  videos: GrowWithJoVideo[];
  canManage: boolean;
  favoriteVideoIds?: string[];
  likedBy?: Record<string, string[]>;
  completedVideoIds?: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [activeVideo, setActiveVideo] = useState<GrowWithJoVideo | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set(favoriteVideoIds));
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState(() => new Set(completedVideoIds));
  const [completionBusyId, setCompletionBusyId] = useState<string | null>(null);

  async function addVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/grow-with-jo", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, youtubeUrl, durationMinutes: Number(durationMinutes) })
      });
      const payload = await response.json().catch(() => ({ error: "Video kon niet toegevoegd worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Video kon niet toegevoegd worden.");
      setTitle("");
      setDescription("");
      setYoutubeUrl("");
      setDurationMinutes("");
      toast({ title: "Video toegevoegd", description: "De Grow With Jo-video is nu zichtbaar voor alle gebruikers." });
      router.refresh();
    } catch (error) {
      toast({ title: "Toevoegen mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteVideo(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch("/api/grow-with-jo", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const payload = await response.json().catch(() => ({ error: "Video kon niet verwijderd worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Video kon niet verwijderd worden.");
      toast({ title: "Video verwijderd" });
      router.refresh();
    } catch (error) {
      toast({ title: "Verwijderen mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleFavorite(videoId: string) {
    setFavoriteBusyId(videoId);
    try {
      const response = await fetch("/api/grow-with-jo/favorites", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId })
      });
      const payload = await response.json().catch(() => ({ error: "Favoriet kon niet bijgewerkt worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Favoriet kon niet bijgewerkt worden.");
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (payload.favorite) next.add(videoId);
        else next.delete(videoId);
        return next;
      });
      toast({
        title: payload.favorite ? "Toegevoegd aan favorieten" : "Verwijderd uit favorieten",
        description: payload.favorite ? "Je vindt deze video nu terug onder Workout → Favorieten." : undefined
      });
      router.refresh();
    } catch (error) {
      toast({ title: "Favoriet mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setFavoriteBusyId(null);
    }
  }

  async function toggleCompleted(videoId: string) {
    setCompletionBusyId(videoId);
    try {
      const response = await fetch("/api/grow-with-jo/completions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId })
      });
      const payload = await response.json().catch(() => ({ error: "Workout kon niet afgevinkt worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Workout kon niet afgevinkt worden.");
      setCompletedIds((current) => {
        const next = new Set(current);
        if (payload.completed) next.add(videoId);
        else next.delete(videoId);
        return next;
      });
      toast({ title: payload.completed ? "Workout afgewerkt" : "Markering verwijderd" });
      router.refresh();
    } catch (error) {
      toast({ title: "Afvinken mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setCompletionBusyId(null);
    }
  }

  function openVideo(video: GrowWithJoVideo) {
    setActiveVideo(video);
    void fetch("/api/content-history", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: "grow_with_jo",
        contentId: video.id,
        title: video.title,
        imageUrl: `https://i.ytimg.com/vi/${video.youtube_video_id}/hqdefault.jpg`
      })
    });
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
              <Youtube size={23} />
            </span>
            <div>
              <CardTitle className="text-xl">YouTube-video toevoegen</CardTitle>
              <p className="mt-1 text-sm font-semibold text-muted">Plak een YouTube-link. De video wordt rechtstreeks binnen Fit & Glow afgespeeld.</p>
            </div>
          </div>
          <form onSubmit={addVideo} className="mt-5 grid gap-4">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titel van de workout" required minLength={2} maxLength={120} />
            <Input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." type="url" required />
            <Input value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} placeholder="Duur in minuten" type="number" min={1} max={300} required />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Korte beschrijving (optioneel)"
              maxLength={500}
              className="min-h-24 resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
            />
            <Button type="submit" disabled={saving} className="w-full sm:w-fit">
              {saving ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
              Video toevoegen
            </Button>
          </form>
        </Card>
      )}

      {!videos.length ? (
        <Card className="grid min-h-72 place-items-center text-center">
          <div className="max-w-md">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary/35 text-primary">
              <Play size={24} />
            </span>
            <CardTitle className="mt-4">Nog geen Grow With Jo-video’s</CardTitle>
            <p className="mt-2 text-sm font-semibold text-muted">Zodra Joyce een YouTube-workout toevoegt, verschijnt die hier.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden p-0">
              <div className="relative aspect-[16/9] overflow-hidden bg-black">
                <img src={`https://i.ytimg.com/vi/${video.youtube_video_id}/hqdefault.jpg`} alt={video.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{video.title}</CardTitle>
                  </div>
                  {canManage && (
                    <Button type="button" size="icon" variant="ghost" aria-label="Video verwijderen" onClick={() => deleteVideo(video.id)} disabled={deletingId === video.id}>
                      {deletingId === video.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </Button>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-4 text-sm font-extrabold text-muted">
                    <span><Clock3 className="mr-1 inline" size={16} />{video.duration_minutes ? `${video.duration_minutes} min` : "Duur niet ingesteld"}</span>
                  </div>
                  <ContentRating itemType="grow_with_jo" itemId={video.id} />
                </div>
                {likedBy[video.id]?.length ? (
                  <p className="mt-3 text-xs font-bold text-muted">
                    <Heart className="mr-1 inline text-primary" size={14} fill="currentColor" />
                    Geliefd bij {formatNames(likedBy[video.id])}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant={favoriteIds.has(video.id) ? "default" : "outline"}
                  onClick={() => toggleFavorite(video.id)}
                  disabled={favoriteBusyId === video.id}
                  className="mt-5 w-full"
                >
                  {favoriteBusyId === video.id ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <Heart size={18} fill={favoriteIds.has(video.id) ? "currentColor" : "none"} />
                  )}
                  {favoriteIds.has(video.id) ? "In favorieten" : "Geef een hartje"}
                </Button>
                <Button type="button" onClick={() => openVideo(video)} className="mt-3 w-full">
                  <Play size={18} fill="currentColor" />
                  Open workout
                </Button>
                <Button
                  type="button"
                  variant={completedIds.has(video.id) ? "secondary" : "outline"}
                  onClick={() => toggleCompleted(video.id)}
                  disabled={completionBusyId === video.id}
                  className="mt-3 w-full"
                >
                  {completionBusyId === video.id ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} fill={completedIds.has(video.id) ? "currentColor" : "none"} />}
                  {completedIds.has(video.id) ? "Afgewerkt" : "Afvinken als afgewerkt"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(activeVideo)} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0">
          {activeVideo && (
            <>
              <div className="aspect-video bg-black">
                <iframe
                  src={getYouTubeEmbedUrl(activeVideo.youtube_video_id)}
                  title={activeVideo.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <div className="p-6">
                <DialogTitle className="font-serif text-2xl font-extrabold">{activeVideo.title}</DialogTitle>
                <DialogDescription className="mt-2 text-sm font-semibold text-muted">{activeVideo.description || "Grow With Jo workout"}</DialogDescription>
                <div className="mt-5 border-t border-border pt-5">
                  <ContentRating itemType="grow_with_jo" itemId={activeVideo.id} interactive />
                </div>
                <Button
                  type="button"
                  variant={completedIds.has(activeVideo.id) ? "secondary" : "outline"}
                  onClick={() => toggleCompleted(activeVideo.id)}
                  disabled={completionBusyId === activeVideo.id}
                  className="mt-5"
                >
                  {completionBusyId === activeVideo.id ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
                  {completedIds.has(activeVideo.id) ? "Afgewerkt" : "Afvinken als afgewerkt"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatNames(names: string[]) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} en ${names[1]}`;
  return `${names.slice(0, 2).join(", ")} en ${names.length - 2} andere`;
}
