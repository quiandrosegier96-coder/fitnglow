import { redirect } from "next/navigation";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { createClient } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?redirectedFrom=/welcome");

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/welcome");

  const [bodyProfile, profile] = await Promise.all([
    supabase.from("body_profiles").select("first_name,onboarding_completed").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("full_name,welcome_completed").eq("id", user.id).maybeSingle()
  ]);

  if (bodyProfile.data?.onboarding_completed !== true) redirect("/onboarding");
  if (profile.data?.welcome_completed === true) redirect("/dashboard");

  const firstName =
    bodyProfile.data?.first_name ||
    profile.data?.full_name?.split(" ").filter(Boolean)[0] ||
    user.email?.split("@")[0] ||
    "beautiful";

  return <WelcomeScreen firstName={firstName} />;
}
