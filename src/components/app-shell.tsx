"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Apple, ChefHat, Dumbbell, Home, LayoutDashboard, Search, Settings, ShieldCheck, Sparkles, Trophy, UsersRound } from "lucide-react";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationCenter } from "@/components/notification-center";
import { ProfileDropdown } from "@/components/profile-dropdown";

const navIcons = {
  Dashboard: LayoutDashboard,
  Workout: Dumbbell,
  Recipes: ChefHat,
  Nutrition: Apple,
  Tips: Sparkles,
  Progress: Activity,
  Community: UsersRound
};

const mobileNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/workouts", label: "Workout", icon: Dumbbell },
  { href: "/recipes", label: "Food", icon: ChefHat },
  { href: "/progress", label: "Progress", icon: Activity }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] border-r border-border bg-card px-4 py-5 lg:flex lg:flex-col">
        <Link href="/dashboard" className="mb-8 block">
          <Image src="/logo.svg" alt="Fit & Glow Club" width={126} height={78} priority className="mx-auto h-auto w-[126px]" />
        </Link>

        <nav className="flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = navIcons[item.label as keyof typeof navIcons] ?? Sparkles;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
            <Avatar name="Joyce" className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Joyce</p>
              <p className="truncate text-xs font-medium text-muted">Premium member</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-30 border-b border-border bg-background/92 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-lg font-extrabold">Hey Joyce! <span className="text-primary">Hi</span></p>
              <p className="text-sm font-medium text-muted">Blijf gaan, je doet het geweldig!</p>
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
