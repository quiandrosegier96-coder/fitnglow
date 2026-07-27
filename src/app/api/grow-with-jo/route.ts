import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCsrf, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { getYouTubeVideoId } from "@/lib/youtube";

const trustedAdminEmail = "fitandglow.joyce@gmail.com";
const videoSchema = z.object({
  title: z.string().trim().min(2, "Geef de video een titel.").max(120),
  description: z.string().trim().max(500).optional(),
  youtubeUrl: z.string().trim().url("Geef een geldige YouTube-link op."),
  durationMinutes: z.coerce.number().int().min(1).max(300)
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 20, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is niet ingesteld." }, { status: 503 });
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== trustedAdminEmail) {
    return NextResponse.json({ error: "Alleen Joyce kan video’s toevoegen." }, { status: 403 });
  }

  const parsed = videoSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Controleer de video." }, { status: 400 });
  const videoId = getYouTubeVideoId(parsed.data.youtubeUrl);
  if (!videoId) return NextResponse.json({ error: "Deze YouTube-link wordt niet herkend." }, { status: 400 });

  const { data, error } = await supabase
    .from("grow_with_jo_videos")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      youtube_url: parsed.data.youtubeUrl,
      youtube_video_id: videoId,
      duration_minutes: parsed.data.durationMinutes,
      created_by: user.id,
      is_published: true
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ video: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, 30, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is niet ingesteld." }, { status: 503 });
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== trustedAdminEmail) {
    return NextResponse.json({ error: "Alleen Joyce kan video’s verwijderen." }, { status: 403 });
  }

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige video." }, { status: 400 });
  const { error } = await supabase.from("grow_with_jo_videos").delete().eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
