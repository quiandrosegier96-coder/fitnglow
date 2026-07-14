import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/workouts", "/recipes", "/nutrition", "/tips", "/progress", "/community", "/settings", "/profile", "/coach", "/admin"];

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
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("redirectedFrom", path);
    return NextResponse.redirect(login);
  }

  if (user && (path.startsWith("/admin") || path.startsWith("/coach"))) {
    const { data: roles } = await supabase.from("roles").select("role").eq("user_id", user.id);
    const roleList = roles?.map((item) => item.role) ?? [];
    if (path.startsWith("/admin") && !roleList.includes("administrator")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (path.startsWith("/coach") && !roleList.some((role) => ["coach", "administrator"].includes(role))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|manifest.webmanifest|sw.js).*)"]
};
