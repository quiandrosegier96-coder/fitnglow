import { Clock3, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { GrowWithJoLibrary, type GrowWithJoVideo } from "@/components/workouts/grow-with-jo-library";
import { Card, CardTitle } from "@/components/ui/card";
import { ContentRating } from "@/components/workouts/content-rating";

export default async function FavoriteWorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { data: friendshipRows } =
    supabase && user
      ? await supabase
          .from("community_friendships")
          .select("requester_id,addressee_id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      : { data: [] };
  const friendIds = (friendshipRows ?? []).map((friendship) =>
    friendship.requester_id === user?.id ? friendship.addressee_id : friendship.requester_id
  );
  const { data: favoriteRows } =
    supabase && user
      ? await supabase.from("grow_with_jo_favorites").select("video_id,user_id").in("user_id", [user.id, ...friendIds])
      : { data: [] };
  const favoriteVideoIds = (favoriteRows ?? []).filter((favorite) => favorite.user_id === user?.id).map((favorite) => favorite.video_id);
  const { data: completionRows } =
    supabase && user ? await supabase.from("grow_with_jo_completions").select("video_id").eq("user_id", user.id) : { data: [] };
  const completedVideoIds = (completionRows ?? []).map((completion) => completion.video_id);
  const friendFavoriteVideoIds = [
    ...new Set((favoriteRows ?? []).filter((favorite) => favorite.user_id !== user?.id).map((favorite) => favorite.video_id))
  ];
  const allFavoriteVideoIds = [...new Set([...favoriteVideoIds, ...friendFavoriteVideoIds])];
  const [{ data: growVideos }, { data: friendProfiles }] =
    supabase && allFavoriteVideoIds.length
      ? await Promise.all([
          supabase
            .from("grow_with_jo_videos")
            .select("id,title,description,youtube_url,youtube_video_id,duration_minutes,created_at")
            .in("id", allFavoriteVideoIds)
            .eq("is_published", true)
            .order("created_at", { ascending: false }),
          friendIds.length ? supabase.from("profiles").select("id,full_name").in("id", friendIds) : Promise.resolve({ data: [] })
        ])
      : [{ data: [] }, { data: [] }];
  const profileNames = new Map((friendProfiles ?? []).map((profile) => [profile.id, profile.full_name?.split(/\s+/)[0] || "Een vriend"]));
  const likedBy = (favoriteRows ?? []).reduce<Record<string, string[]>>((result, favorite) => {
    if (favorite.user_id === user?.id) return result;
    const name = profileNames.get(favorite.user_id) ?? "Een vriend";
    result[favorite.video_id] = [...(result[favorite.video_id] ?? []), name];
    return result;
  }, {});
  const ownGrowVideos = (growVideos ?? []).filter((video) => favoriteVideoIds.includes(video.id));
  const friendGrowVideos = (growVideos ?? []).filter((video) => friendFavoriteVideoIds.includes(video.id) && !favoriteVideoIds.includes(video.id));
  const { data: challengeFavoriteRows } =
    supabase && user
      ? await supabase.from("content_favorites").select("item_id").eq("user_id", user.id).eq("item_type", "daily_challenge")
      : { data: [] };
  const challengeIds = (challengeFavoriteRows ?? []).map((favorite) => favorite.item_id);
  const { data: favoriteChallenges } =
    supabase && challengeIds.length
      ? await supabase
          .from("daily_challenges")
          .select("id,title,description,video_url,thumbnail_url,duration_minutes,challenge_date")
          .in("id", challengeIds)
          .order("challenge_date", { ascending: false })
      : { data: [] };
  const ownFavoriteCount = favoriteVideoIds.length + (favoriteChallenges?.length ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Favorieten" title="Jouw favoriete workouts" description="Alleen de Grow With Jo-video’s en challenges die jij een hartje hebt gegeven." />
      <div className="mb-5 flex items-center gap-2 text-primary"><Heart className="fill-primary" /> {ownFavoriteCount} favorieten</div>
      {!ownFavoriteCount && !friendGrowVideos.length ? (
        <Card className="grid min-h-64 place-items-center text-center">
          <div>
            <Heart className="mx-auto text-primary" size={30} />
            <CardTitle className="mt-4">Nog geen favorieten</CardTitle>
            <p className="mt-2 text-sm font-semibold text-muted">Geef een Grow With Jo-video of challenge een hartje om die hier te bewaren.</p>
          </div>
        </Card>
      ) : null}
      {ownGrowVideos.length ? (
        <section>
          <h2 className="mb-4 font-serif text-2xl font-extrabold">Mijn Grow With Jo-favorieten</h2>
          <GrowWithJoLibrary videos={ownGrowVideos as GrowWithJoVideo[]} canManage={false} favoriteVideoIds={favoriteVideoIds} likedBy={likedBy} completedVideoIds={completedVideoIds} />
        </section>
      ) : null}
      {friendGrowVideos.length ? (
        <section>
          <h2 className="mb-1 font-serif text-2xl font-extrabold">Geliefd bij vrienden</h2>
          <p className="mb-4 text-sm font-semibold text-muted">Grow With Jo-video’s die jouw vrienden een hartje hebben gegeven.</p>
          <GrowWithJoLibrary videos={friendGrowVideos as GrowWithJoVideo[]} canManage={false} favoriteVideoIds={favoriteVideoIds} likedBy={likedBy} completedVideoIds={completedVideoIds} />
        </section>
      ) : null}
      {favoriteChallenges?.length ? (
        <section>
          <h2 className="mb-4 font-serif text-2xl font-extrabold">Favoriete challenges</h2>
          <div className="grid gap-6 xl:grid-cols-2">
            {favoriteChallenges.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden p-0">
                <video controls preload="metadata" poster={challenge.thumbnail_url ?? undefined} src={challenge.video_url} className="aspect-video w-full bg-black object-contain" />
                <div className="p-5">
                  <CardTitle className="text-xl">{challenge.title}</CardTitle>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-extrabold text-muted"><Clock3 className="mr-1 inline" size={16} />{challenge.duration_minutes ? `${challenge.duration_minutes} min` : "Duur niet ingesteld"}</span>
                    <ContentRating itemType="daily_challenge" itemId={challenge.id} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
