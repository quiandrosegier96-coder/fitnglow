import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCsrf, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const itemTypeSchema = z.enum(["grow_with_jo", "daily_challenge"]);

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ratings: {} });
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });

  const itemType = itemTypeSchema.safeParse(request.nextUrl.searchParams.get("itemType"));
  const itemIds = request.nextUrl.searchParams.get("itemIds")?.split(",").filter(Boolean).slice(0, 50) ?? [];
  if (!itemType.success || !itemIds.length) return NextResponse.json({ ratings: {} });

  const { data, error } = await supabase
    .from("content_ratings")
    .select("item_id,user_id,rating")
    .eq("item_type", itemType.data)
    .in("item_id", itemIds);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const ratings = itemIds.reduce<Record<string, { average: number; count: number; myRating: number | null }>>((result, itemId) => {
    const rows = (data ?? []).filter((row) => row.item_id === itemId);
    const total = rows.reduce((sum, row) => sum + Number(row.rating), 0);
    result[itemId] = {
      average: rows.length ? Math.round((total / rows.length) * 10) / 10 : 0,
      count: rows.length,
      myRating: rows.find((row) => row.user_id === user.id)?.rating ?? null
    };
    return result;
  }, {});
  return NextResponse.json({ ratings });
}

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

  const parsed = z
    .object({ itemType: itemTypeSchema, itemId: z.string().uuid(), rating: z.number().int().min(1).max(5) })
    .safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Kies een score van 1 tot 5 sterren." }, { status: 400 });

  const { error } = await supabase.from("content_ratings").upsert(
    {
      user_id: user.id,
      item_type: parsed.data.itemType,
      item_id: parsed.data.itemId,
      rating: parsed.data.rating,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,item_type,item_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ saved: true });
}
