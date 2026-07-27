"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
<<<<<<< HEAD
import { Activity, Apple, ChefHat, Dumbbell, Home, LayoutDashboard, Search, Settings, ShieldCheck, Sparkles, Trophy, UsersRound } from "lucide-react";
=======
import { useEffect, useState } from "react";
import { Activity, Apple, Bell, ChefHat, ChevronDown, Dumbbell, Heart, History, Home, LayoutDashboard, Route, Search, Settings, ShieldCheck, Sparkles, Trophy, UsersRound, Youtube } from "lucide-react";
>>>>>>> origin/agent/community-challenges-grow-with-jo
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationCenter } from "@/components/notification-center";
import { ProfileDropdown } from "@/components/profile-dropdown";
<<<<<<< HEAD
=======
import { createClient } from "@/lib/supabase/client";
import { getFirstName } from "@/lib/member-name";
>>>>>>> origin/agent/community-challenges-grow-with-jo

const navIcons = {
  Dashboard: LayoutDashboard,
  Workout: Dumbbell,
  Recipes: ChefHat,
  Nutrition: Apple,
  Tips: Sparkles,
  Progress: Activity,
<<<<<<< HEAD
  Community: UsersRound
=======
  Community: UsersRound,
  Meldingen: Bell
>>>>>>> origin/agent/community-challenges-grow-with-jo
};

const mobileNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/workouts", label: "Workout", icon: Dumbbell },
  { href: "/recipes", label: "Food", icon: ChefHat },
  { href: "/progress", label: "Progress", icon: Activity }
];

<<<<<<< HEAD
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
=======
const workoutSubtabs = [
  { href: "/workouts/grow-with-jo", label: "Grow With Jo", icon: Youtube },
  { href: "/workouts/strava", label: "Strava", icon: Route },
  { href: "/workouts/favorites", label: "Favorieten", icon: Heart },
  { href: "/workouts/history", label: "Geschiedenis", icon: History }
];

const encouragements = [
  "Blijf gaan, je doet het geweldig!",
  "Elke kleine stap telt vandaag.",
  "Je bent sterker dan je denkt.",
  "Vandaag kies je opnieuw voor jezelf.",
  "Rustig blijven ademen, jij kan dit.",
  "Kleine gewoontes, grote verandering.",
  "Je glow begint bij consistentie.",
  "Stap voor stap bouw je resultaat.",
  "Vandaag is weer een mooie kans."
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [encouragement, setEncouragement] = useState(encouragements[0]);
  const [workoutOpen, setWorkoutOpen] = useState(pathname.startsWith("/workouts"));
  const [memberName, setMemberName] = useState("Member");
  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);

  useEffect(() => {
    const nextEncouragement = () => {
      const index = Math.floor(Math.random() * encouragements.length);
      setEncouragement(encouragements[index]);
    };

    nextEncouragement();
    const interval = window.setInterval(nextEncouragement, 45_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMemberName() {
      const supabase = createClient();
      if (!supabase) return;

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const fallbackName = getFirstName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "Member");
      const [bodyProfile, profile] = await Promise.all([
        supabase.from("body_profiles").select("first_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle()
      ]);

      if (cancelled) return;

      setMemberName(
        getFirstName(
          bodyProfile.data?.first_name ||
            profile.data?.full_name ||
            fallbackName
        )
      );
      setMemberAvatar(profile.data?.avatar_url ?? null);
    }

    loadMemberName();

    const supabase = createClient();
    const {
      data: { subscription }
    } = supabase?.auth.onAuthStateChange(() => {
      loadMemberName();
    }) ?? { data: { subscription: null } };

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/workouts")) setWorkoutOpen(true);
  }, [pathname]);
>>>>>>> origin/agent/community-challenges-grow-with-jo

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] border-r border-border bg-card px-4 py-5 lg:flex lg:flex-col">
        <Link href="/dashboard" className="mb-8 block">
<<<<<<< HEAD
          <Image src="/logo.svg" alt="Fit & Glow Club" width={126} height={78} priority className="mx-auto h-auto w-[126px]" />
=======
          <Image src="/logo.svg" alt="Fit & Glow" width={126} height={78} priority className="mx-auto h-auto w-[126px]" />
>>>>>>> origin/agent/community-challenges-grow-with-jo
        </Link>

        <nav className="flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = navIcons[item.label as keyof typeof navIcons] ?? Sparkles;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
<<<<<<< HEAD
=======
            if (item.label === "Workout") {
              return (
                <div key={item.href} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setWorkoutOpen((open) => !open)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-semibold text-muted hover:bg-secondary/20 hover:text-foreground",
                      active && "bg-secondary/35 text-primary"
                    )}
                    aria-expanded={workoutOpen}
                  >
                    <Icon size={17} />
                    <span className="flex-1">{item.label}</span>
                    <ChevronDown size={16} className={cn("transition-transform", workoutOpen && "rotate-180")} />
                  </button>
                  {workoutOpen && (
                    <div className="ml-5 space-y-1 border-l border-secondary/60 pl-3">
                      {workoutSubtabs.map((subtab) => {
                        const SubIcon = subtab.icon;
                        const subActive = pathname === subtab.href;
                        return (
                          <Link
                            key={subtab.href}
                            href={subtab.href}
                            className={cn(
                              "flex items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-extrabold text-muted hover:bg-secondary/20 hover:text-foreground",
                              subActive && "bg-secondary/30 text-primary"
                            )}
                          >
                            <SubIcon size={14} />
                            {subtab.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
>>>>>>> origin/agent/community-challenges-grow-with-jo
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-muted hover:bg-secondary/20 hover:text-foreground",
                  active && "bg-secondary/35 text-primary"
                )}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="my-2 h-px bg-border" />
          <SidebarLink href="/coach" label="Coach" icon={Trophy} pathname={pathname} />
          <SidebarLink href="/admin" label="Admin" icon={ShieldCheck} pathname={pathname} />
          <SidebarLink href="/settings" label="Settings" icon={Settings} pathname={pathname} />
        </nav>

        <div className="rounded-[24px] border border-border bg-background p-3">
          <div className="flex items-center gap-3">
<<<<<<< HEAD
            <Avatar name="Joyce" className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Joyce</p>
=======
            <Avatar src={memberAvatar ?? undefined} name={memberName} className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{memberName}</p>
>>>>>>> origin/agent/community-challenges-grow-with-jo
              <p className="truncate text-xs font-medium text-muted">Premium member</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-30 border-b border-border bg-background/92 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
<<<<<<< HEAD
              <p className="text-lg font-extrabold">Hey Joyce! <span className="text-primary">Hi</span></p>
              <p className="text-sm font-medium text-muted">Blijf gaan, je doet het geweldig!</p>
=======
              <p className="text-lg font-extrabold">Hey {memberName}</p>
              <p className="text-sm font-medium text-muted transition-opacity duration-300">{encouragement}</p>
>>>>>>> origin/agent/community-challenges-grow-with-jo
            </div>

            <div className="hidden w-full max-w-xs items-center gap-2 rounded-2xl border border-border bg-card px-3 py-1.5 md:flex">
              <Search size={17} className="text-muted" />
              <Input className="h-9 border-0 bg-transparent px-0 focus:ring-0" placeholder="Search" />
            </div>

            <div className="flex items-center gap-1.5">
              <Button size="icon" variant="ghost" aria-label="Search" className="md:hidden">
                <Search size={18} />
              </Button>
              <NotificationCenter />
              <ProfileDropdown />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {mobileNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold text-muted hover:bg-secondary/25 hover:text-foreground",
                  active && "bg-secondary/35 text-primary"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  pathname
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-muted hover:bg-secondary/20 hover:text-foreground",
        active && "bg-secondary/35 text-primary"
      )}
    >
      <Icon size={17} />
      <span>{label}</span>
    </Link>
  );
}
