import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCsrf, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const progressSchema = z.object({
  action: z.enum(["start", "complete", "stop"])
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(request, 20, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const { id } = await params;
  const parsed = progressSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid progress action." }, { status: 400 });

  if (parsed.data.action === "stop") {
    const { error } = await supabase.from("daily_challenge_completions").delete().eq("user_id", user.id).eq("challenge_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ progress: null });
  }

  const now = new Date().toISOString();
  const payload: Record<string, string | null> =
    parsed.data.action === "complete"
      ? { user_id: user.id, challenge_id: id, started_at: now, completed_at: now }
      : { user_id: user.id, challenge_id: id, started_at: now, completed_at: null };

  const { data, error } = await supabase
    .from("daily_challenge_completions")
    .upsert(payload as never, { onConflict: "user_id,challenge_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ progress: data });
}
