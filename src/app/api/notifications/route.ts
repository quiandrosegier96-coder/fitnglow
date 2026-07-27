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
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,kind,notification_type,feed_item_id,feed_item_type,href,read_at,created_at,actor_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) {
    if (isMissingNotificationsTable(error)) {
      return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/add_timeline_notifications.sql in the Supabase SQL Editor." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({
    notifications: data ?? [],
    unreadCount: (data ?? []).filter((notification) => !notification.read_at).length
  });
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

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, 60, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = validateBody(z.object({ notificationId: z.string().uuid().optional(), all: z.boolean().optional() }), await request.json());
  const query = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id);
  const { error } = payload.all ? await query.is("read_at", null) : await query.eq("id", payload.notificationId);
  if (error) {
    if (isMissingNotificationsTable(error)) {
      return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/add_timeline_notifications.sql in the Supabase SQL Editor." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

function isMissingNotificationsTable(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42P01" || error.code === "PGRST205" || (message.includes("notifications") && message.includes("schema cache"));
}
