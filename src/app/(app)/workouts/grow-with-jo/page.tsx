import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { GrowWithJoLibrary, type GrowWithJoVideo } from "@/components/workouts/grow-with-jo-library";

const trustedAdminEmail = "fitandglow.joyce@gmail.com";

export default async function GrowWithJoPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const [{ data }, { data: favorites }, { data: completions }] =
    supabase && user
      ? await Promise.all([
          supabase
            .from("grow_with_jo_videos")
            .select("id,title,description,youtube_url,youtube_video_id,duration_minutes,created_at")
            .eq("is_published", true)
            .order("created_at", { ascending: false }),
          supabase.from("grow_with_jo_favorites").select("video_id").eq("user_id", user.id),
          supabase.from("grow_with_jo_completions").select("video_id").eq("user_id", user.id)
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workout - Grow With Jo"
        title="Grow With Jo"
        description="Een challenge op een leuke manier. Geniet van motiverende workouts, energieke muziek en een positieve vibe die je helpt om vol te houden én ervan te genieten."
      />
      <GrowWithJoLibrary
        videos={(data ?? []) as GrowWithJoVideo[]}
        canManage={user?.email?.toLowerCase() === trustedAdminEmail}
        favoriteVideoIds={(favorites ?? []).map((favorite) => favorite.video_id)}
        completedVideoIds={(completions ?? []).map((completion) => completion.video_id)}
      />
    </div>
  );
}
