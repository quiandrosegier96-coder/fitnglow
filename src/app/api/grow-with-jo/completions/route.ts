import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCsrf, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 60, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is niet ingesteld." }, { status: 503 });
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });

  const parsed = z.object({ videoId: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige video." }, { status: 400 });

  const existing = await supabase
    .from("grow_with_jo_completions")
    .select("video_id")
    .eq("user_id", user.id)
    .eq("video_id", parsed.data.videoId)
    .maybeSingle();
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 400 });

  if (existing.data) {
    const { error } = await supabase
      .from("grow_with_jo_completions")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", parsed.data.videoId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ completed: false });
  }

  const { error } = await supabase.from("grow_with_jo_completions").insert({
    user_id: user.id,
    video_id: parsed.data.videoId
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ completed: true });
}
