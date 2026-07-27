"use client";

import { Activity, Clock3, Flame, Images, MapPin, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type StravaActivityItem = {
  id: string;
  name: string;
  type: string | null;
  sport_type: string | null;
  distance_meters: number | null;
  moving_time_seconds: number | null;
  total_elevation_gain: number | null;
  calories: number | null;
  image_url: string | null;
  map_polyline: string | null;
  photo_urls: string[];
  start_date: string;
};

export function StravaActivityGallery({ activities }: { activities: StravaActivityItem[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {activities.map((activity) => (
        <StravaActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

function StravaActivityCard({ activity }: { activity: StravaActivityItem }) {
  const date = formatDate(activity.start_date);
  const type = activity.sport_type || activity.type || "Activiteit";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="group block w-full rounded-[1.75rem] text-left outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
          <Card className="h-full overflow-hidden p-0 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
          <div className="relative">
            {activity.image_url ? (
              <img src={activity.image_url} alt={activity.name} className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            ) : activity.map_polyline ? (
              <RoutePreview polyline={activity.map_polyline} compact />
            ) : (
              <div className="grid h-56 place-items-center bg-gradient-to-br from-secondary/40 to-primary/15">
                <Route className="text-primary" size={34} />
              </div>
            )}
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur">
              Bekijk activiteit
            </span>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#fc4c02]/10 text-[#b93900]">{type}</Badge>
              <Badge className="bg-secondary/35 text-primary">{date}</Badge>
            </div>
            <CardTitle className="mt-3 text-xl">{activity.name}</CardTitle>
            <Stats activity={activity} />
          </div>
          </Card>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-0">
        <div className="p-6 pb-4 sm:p-8 sm:pb-5">
          <div className="flex flex-wrap items-center gap-2 pr-12">
            <Badge className="bg-[#fc4c02]/10 text-[#b93900]">{type}</Badge>
            <Badge className="bg-secondary/35 text-primary">{date}</Badge>
          </div>
          <DialogTitle className="mt-3 font-serif text-3xl font-extrabold">{activity.name}</DialogTitle>
          <DialogDescription className="mt-2 text-sm font-semibold text-muted">
            Foto&apos;s, traject en details van deze Strava-activiteit.
          </DialogDescription>
          <Stats activity={activity} />
        </div>

        <div className="grid gap-5 border-t border-border p-5 sm:p-8 lg:grid-cols-2">
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-serif text-xl font-extrabold">
              <Route size={19} className="text-[#fc4c02]" />
              Afgelegd traject
            </h3>
            {activity.map_polyline ? (
              <RoutePreview polyline={activity.map_polyline} />
            ) : (
              <EmptyVisual icon={<Route size={26} />} text="Voor deze activiteit is geen traject beschikbaar." />
            )}
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 font-serif text-xl font-extrabold">
              <Images size={19} className="text-primary" />
              Foto&apos;s
            </h3>
            {activity.photo_urls.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {activity.photo_urls.map((url, index) => (
                  <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className={index === 0 ? "sm:col-span-2" : undefined}>
                    <img
                      src={url}
                      alt={`${activity.name} foto ${index + 1}`}
                      className={`w-full rounded-[22px] object-cover transition hover:opacity-90 ${index === 0 ? "h-64" : "h-40"}`}
                    />
                  </a>
                ))}
              </div>
            ) : (
              <EmptyVisual icon={<Images size={26} />} text="Voor deze activiteit zijn geen foto’s toegevoegd." />
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stats({ activity }: { activity: StravaActivityItem }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat icon={<MapPin size={15} />} label="Afstand" value={`${((activity.distance_meters ?? 0) / 1000).toFixed(2)} km`} />
      <Stat icon={<Clock3 size={15} />} label="Tijd" value={formatDuration(activity.moving_time_seconds ?? 0)} />
      <Stat icon={<Flame size={15} />} label="Kcal" value={`${Math.round(activity.calories ?? 0)}`} />
      <Stat icon={<Activity size={15} />} label="Hoogte" value={`${Math.round(activity.total_elevation_gain ?? 0)} m`} />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background p-3">
      <div className="flex items-center gap-1.5 text-primary">
        {icon}
        <span className="text-xs font-bold text-muted">{label}</span>
      </div>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function RoutePreview({ polyline, compact = false }: { polyline: string; compact?: boolean }) {
  const points = polylineToSvgPoints(polyline, compact ? 700 : 900, compact ? 260 : 520);
  return (
    <div className={`relative overflow-hidden bg-[#f5eee9] ${compact ? "h-56" : "h-[320px] rounded-[24px]"}`}>
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(#d8cbc3_1px,transparent_1px),linear-gradient(90deg,#d8cbc3_1px,transparent_1px)] [background-size:28px_28px]" />
      <svg viewBox={`0 0 ${compact ? 700 : 900} ${compact ? 260 : 520}`} className="relative h-full w-full" role="img" aria-label="Traject van de Strava-activiteit">
        <polyline points={points} fill="none" stroke="white" strokeWidth={compact ? 11 : 14} strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <polyline points={points} fill="none" stroke="#fc4c02" strokeWidth={compact ? 6 : 8} strokeLinecap="round" strokeLinejoin="round" />
        {points && <circle cx={points.split(" ")[0]?.split(",")[0]} cy={points.split(" ")[0]?.split(",")[1]} r={compact ? 8 : 11} fill="#22c55e" stroke="white" strokeWidth="4" />}
        {points && <circle cx={points.split(" ").at(-1)?.split(",")[0]} cy={points.split(" ").at(-1)?.split(",")[1]} r={compact ? 8 : 11} fill="#fc4c02" stroke="white" strokeWidth="4" />}
      </svg>
    </div>
  );
}

function polylineToSvgPoints(encoded: string, width: number, height: number) {
  const coordinates = decodePolyline(encoded);
  if (!coordinates.length) return "";
  const padding = 34;
  const lats = coordinates.map(([lat]) => lat);
  const lngs = coordinates.map(([, lng]) => lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return coordinates
    .map(([lat, lng]) => {
      const x = padding + ((lng - minLng) / lngRange) * (width - padding * 2);
      const y = padding + (1 - (lat - minLat) / latRange) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function decodePolyline(encoded: string) {
  const points: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    const latResult = decodeValue(encoded, index);
    if (!latResult) break;
    index = latResult.index;
    lat += latResult.value;
    const lngResult = decodeValue(encoded, index);
    if (!lngResult) break;
    index = lngResult.index;
    lng += lngResult.value;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

function decodeValue(encoded: string, startIndex: number) {
  let index = startIndex;
  let result = 0;
  let shift = 0;
  let byte: number;
  do {
    if (index >= encoded.length) return null;
    byte = encoded.charCodeAt(index++) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);
  return { index, value: result & 1 ? ~(result >> 1) : result >> 1 };
}

function EmptyVisual({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="grid h-[220px] place-items-center rounded-[24px] bg-background p-6 text-center text-muted">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary/35 text-primary">{icon}</span>
        <p className="mt-3 text-sm font-bold">{text}</p>
      </div>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("nl-BE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function formatDuration(seconds: number) {
  if (!seconds) return "--";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}u ${minutes.toString().padStart(2, "0")}m` : `${minutes}m`;
}
