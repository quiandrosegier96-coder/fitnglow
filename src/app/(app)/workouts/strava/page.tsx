import { Route } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { StravaSyncActions } from "@/components/workouts/strava-sync-actions";
import { StravaActivityGallery, type StravaActivityItem } from "@/components/workouts/strava-activity-gallery";

export default async function WorkoutStravaPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const { data: activities } =
    supabase && user
      ? await supabase
          .from("strava_activities")
          .select("id,name,type,sport_type,distance_meters,moving_time_seconds,total_elevation_gain,calories,image_url,map_polyline,raw,start_date")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false })
          .limit(30)
      : { data: [] };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workout - Strava" title="Strava activiteiten" description="Bekijk je loopjes, wandelingen en ritten binnen de workout-tab." />

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-xl">Strava sync</CardTitle>
          <p className="mt-1 text-sm font-medium leading-6 text-muted">Koppel of synchroniseer Strava via instellingen. Daarna verschijnen je activiteiten hier automatisch.</p>
        </div>
        <StravaSyncActions />
      </Card>

      {!activities?.length ? (
        <Card className="grid min-h-[280px] place-items-center text-center">
          <div className="max-w-md">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary/35 text-primary">
              <Route size={24} />
            </div>
            <h2 className="mt-5 font-serif text-3xl font-extrabold">Nog geen Strava activiteiten</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-muted">Zodra Strava gekoppeld en gesynchroniseerd is, zie je hier je laatste loopjes en ritten.</p>
          </div>
        </Card>
      ) : (
        <StravaActivityGallery
          activities={activities.map((activity) => ({
            ...activity,
            photo_urls: getPhotoUrls(activity.raw, activity.image_url)
          })) as StravaActivityItem[]}
        />
      )}
    </div>
  );
}

function getPhotoUrls(raw: unknown, fallback: string | null) {
  if (!raw || typeof raw !== "object") return fallback ? [fallback] : [];
  const activity = raw as { photo_urls?: unknown; photos?: { primary?: { urls?: Record<string, string> } } };
  const stored = Array.isArray(activity.photo_urls) ? activity.photo_urls.filter((url): url is string => typeof url === "string" && Boolean(url)) : [];
  const primaryUrls = Object.values(activity.photos?.primary?.urls ?? {}).filter(Boolean);
  return [...new Set([...stored, ...primaryUrls, ...(fallback ? [fallback] : [])])];
}
