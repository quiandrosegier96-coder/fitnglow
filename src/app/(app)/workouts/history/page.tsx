import { CheckCircle2, Clock3, Eye, History, Play, Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";

type HistoryItem = {
  key: string;
  title: string;
  type: "Grow With Jo" | "Challenge" | "Recept";
  status: "Bekeken" | "Afgewerkt";
  date: string;
  imageUrl: string | null;
};

export default async function WorkoutHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const [{ data: viewedRows }, { data: growCompletions }, { data: challengeProgress }] =
    supabase && user
      ? await Promise.all([
          supabase.from("content_history").select("content_type,content_id,title,image_url,last_viewed_at").eq("user_id", user.id),
          supabase.from("grow_with_jo_completions").select("video_id,completed_at").eq("user_id", user.id),
          supabase
            .from("daily_challenge_completions")
            .select("challenge_id,started_at,completed_at,daily_challenges(title,thumbnail_url)")
            .eq("user_id", user.id)
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const completedGrowIds = new Set((growCompletions ?? []).map((row) => row.video_id));
  const viewedGrowIds = new Set((viewedRows ?? []).filter((row) => row.content_type === "grow_with_jo").map((row) => row.content_id));
  const missingCompletedIds = (growCompletions ?? []).map((row) => row.video_id).filter((id) => !viewedGrowIds.has(id));
  const { data: missingGrowVideos } =
    supabase && missingCompletedIds.length
      ? await supabase.from("grow_with_jo_videos").select("id,title,youtube_video_id").in("id", missingCompletedIds)
      : { data: [] };

  const items: HistoryItem[] = [
    ...(viewedRows ?? []).map((row) => ({
      key: `${row.content_type}-${row.content_id}`,
      title: row.title,
      type: row.content_type === "recipe" ? ("Recept" as const) : ("Grow With Jo" as const),
      status: row.content_type === "grow_with_jo" && completedGrowIds.has(row.content_id) ? ("Afgewerkt" as const) : ("Bekeken" as const),
      date: row.last_viewed_at,
      imageUrl: row.image_url
    })),
    ...(missingGrowVideos ?? []).map((video) => ({
      key: `grow-completed-${video.id}`,
      title: video.title,
      type: "Grow With Jo" as const,
      status: "Afgewerkt" as const,
      date: (growCompletions ?? []).find((row) => row.video_id === video.id)?.completed_at ?? new Date(0).toISOString(),
      imageUrl: `https://i.ytimg.com/vi/${video.youtube_video_id}/hqdefault.jpg`
    })),
    ...(challengeProgress ?? []).map((row) => {
      const challenge = Array.isArray(row.daily_challenges) ? row.daily_challenges[0] : row.daily_challenges;
      return {
        key: `challenge-${row.challenge_id}`,
        title: challenge?.title ?? "Daily challenge",
        type: "Challenge" as const,
        status: row.completed_at ? ("Afgewerkt" as const) : ("Bekeken" as const),
        date: row.completed_at ?? row.started_at ?? new Date(0).toISOString(),
        imageUrl: challenge?.thumbnail_url ?? null
      };
    })
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Geschiedenis" title="Jouw kijk- en workoutgeschiedenis" description="Bekeken en afgewerkte challenges, Grow With Jo-video’s en bekeken recepten." />
      {!items.length ? (
        <Card className="grid min-h-64 place-items-center text-center">
          <div>
            <History className="mx-auto text-primary" size={30} />
            <CardTitle className="mt-4">Je geschiedenis is nog leeg</CardTitle>
            <p className="mt-2 text-sm font-semibold text-muted">Open een workout, challenge of recept om het hier terug te vinden.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.key} className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-28 w-full rounded-2xl object-cover sm:w-44" /> : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Badge>{item.type}</Badge>
                  <Badge className={item.status === "Afgewerkt" ? "bg-emerald-50 text-emerald-700" : "bg-secondary/35 text-primary"}>
                    {item.status === "Afgewerkt" ? <CheckCircle2 size={13} /> : <Eye size={13} />}
                    {item.status}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-xl">{item.title}</CardTitle>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted">
                  {item.type === "Recept" ? <Utensils size={15} /> : <Play size={15} />}
                  <Clock3 size={15} />
                  {formatDate(item.date)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("nl-BE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
