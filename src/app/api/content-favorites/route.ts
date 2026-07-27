import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCsrf, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ itemType: z.enum(["daily_challenge"]), itemId: z.string().uuid() });

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ favorite: false });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorite: false });
  const parsed = schema.safeParse({ itemType: request.nextUrl.searchParams.get("itemType"), itemId: request.nextUrl.searchParams.get("itemId") });
  if (!parsed.success) return NextResponse.json({ favorite: false });
  const { data } = await supabase.from("content_favorites").select("item_id").eq("user_id", user.id).eq("item_type", parsed.data.itemType).eq("item_id", parsed.data.itemId).maybeSingle();
  return NextResponse.json({ favorite: Boolean(data) });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 60, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is niet ingesteld." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Ongeldig favoriet." }, { status: 400 });
  const query = supabase.from("content_favorites").select("item_id").eq("user_id", user.id).eq("item_type", parsed.data.itemType).eq("item_id", parsed.data.itemId);
  const { data: existing, error: readError } = await query.maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });
  if (existing) {
    const { error } = await supabase.from("content_favorites").delete().eq("user_id", user.id).eq("item_type", parsed.data.itemType).eq("item_id", parsed.data.itemId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ favorite: false });
  }
  const { error } = await supabase.from("content_favorites").insert({ user_id: user.id, item_type: parsed.data.itemType, item_id: parsed.data.itemId });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ favorite: true });
}
