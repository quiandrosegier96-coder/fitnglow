import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCsrf, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  contentType: z.enum(["grow_with_jo", "recipe"]),
  contentId: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(160),
  imageUrl: z.string().url().nullable().optional()
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 120, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is niet ingesteld." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige geschiedenis." }, { status: 400 });
  const { error } = await supabase.from("content_history").upsert(
    {
      user_id: user.id,
      content_type: parsed.data.contentType,
      content_id: parsed.data.contentId,
      title: parsed.data.title,
      image_url: parsed.data.imageUrl ?? null,
      last_viewed_at: new Date().toISOString()
    },
    { onConflict: "user_id,content_type,content_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ saved: true });
}
