import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createPublicUrl } from "./src/lib/public-url";

const protectedRoutes = ["/dashboard", "/workouts", "/recipes", "/nutrition", "/tips", "/progress", "/community", "/settings", "/profile", "/coach", "/admin", "/onboarding", "/welcome"];
const trustedAdminEmail = "fitandglow.joyce@gmail.com";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));

  if (isProtected && !user) {
    const login = createPublicUrl("/login", request.url);
    login.searchParams.set("redirectedFrom", path);
    return NextResponse.redirect(login);
  }

  if (user && isProtected) {
    const [onboardingResult, profileResult] = await Promise.all([
      supabase
        .from("body_profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("welcome_completed")
        .eq("id", user.id)
        .maybeSingle()
    ]);

    if (!onboardingResult.error) {
      const completed = onboardingResult.data?.onboarding_completed === true;
      const welcomeCompleted = profileResult.data?.welcome_completed === true;
      if (!completed && !path.startsWith("/onboarding")) {
        return NextResponse.redirect(createPublicUrl("/onboarding", request.url));
      }
      if (completed && path.startsWith("/onboarding")) {
        return NextResponse.redirect(createPublicUrl(welcomeCompleted ? "/dashboard" : "/welcome", request.url));
      }
      if (completed && !welcomeCompleted && !path.startsWith("/welcome")) {
        return NextResponse.redirect(createPublicUrl("/welcome", request.url));
      }
      if (completed && welcomeCompleted && path.startsWith("/welcome")) {
        return NextResponse.redirect(createPublicUrl("/dashboard", request.url));
      }
    }
  }

  if (user && (path.startsWith("/admin") || path.startsWith("/coach"))) {
    const { data: roles } = await supabase.from("roles").select("role").eq("user_id", user.id);
    const roleList = roles?.map((item) => item.role) ?? [];
    const trustedAdmin = user.email?.toLowerCase() === trustedAdminEmail;
    if (path.startsWith("/admin/challenges") && !trustedAdmin) {
      return NextResponse.redirect(createPublicUrl("/dashboard", request.url));
    }
    if (path.startsWith("/admin") && !path.startsWith("/admin/challenges") && !trustedAdmin && !roleList.includes("administrator")) {
      return NextResponse.redirect(createPublicUrl("/dashboard", request.url));
    }
    if (path.startsWith("/coach") && !roleList.some((role) => ["coach", "administrator"].includes(role))) {
      return NextResponse.redirect(createPublicUrl("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|manifest.webmanifest|sw.js).*)"]
};
