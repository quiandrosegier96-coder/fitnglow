import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCsrf, rateLimit, validateBody } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const notificationSchema = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(2).max(500),
  kind: z.enum(["push", "email", "in_app"]),
  scheduledAt: z.string().datetime().optional()
});

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ notifications: [] });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ notifications: data });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = validateBody(notificationSchema, await request.json());
  const { error } = await supabase.from("notifications").insert({
    user_id: user.id,
    title: payload.title,
    body: payload.body,
    kind: payload.kind,
    scheduled_at: payload.scheduledAt
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
