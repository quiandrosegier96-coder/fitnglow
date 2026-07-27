import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function ensureUserProfile(supabase: SupabaseClient, user: User) {
  const fullName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email ?? "Fit & Glow Member";

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName
    },
    { onConflict: "id" }
  );

  if (error) throw new Error(error.message);
}
