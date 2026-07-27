import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, 3, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("profiles").delete().eq("id", user.id);
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
