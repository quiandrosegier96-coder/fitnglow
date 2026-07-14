import Image from "next/image";
import Link from "next/link";
import { Crown, Dumbbell, Home, Menu, Search, Settings, ShieldCheck, Sparkles, Utensils } from "lucide-react";
import { navItems } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";
import { ProfileDropdown } from "@/components/profile-dropdown";

const mobileNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/workouts", label: "Workout", icon: Dumbbell },
  { href: "/recipes", label: "Recipes", icon: Utensils },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Fit & Glow Club" width={170} height={50} priority />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted hover:bg-secondary/35 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" aria-label="Search">
              <Search size={18} />
            </Button>
            <NotificationCenter />
            <ThemeToggle />
            <ProfileDropdown />
            <Button size="icon" variant="outline" className="lg:hidden" aria-label="Menu">
              <Menu size={18} />
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr] lg:py-10">
        <aside className="sticky top-24 hidden h-fit rounded-[1.75rem] border border-primary/10 bg-card/72 p-3 shadow-xl shadow-primary/5 lg:block">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-2xl px-4 py-3 text-sm font-bold text-muted hover:bg-secondary/35 hover:text-foreground">
              {item.label}
            </Link>
          ))}
          <div className="my-3 h-px bg-primary/10" />
          <Link href="/coach" className="block rounded-2xl px-4 py-3 text-sm font-bold text-muted hover:bg-secondary/35 hover:text-foreground">Coach</Link>
          <Link href="/admin" className="block rounded-2xl px-4 py-3 text-sm font-bold text-muted hover:bg-secondary/35 hover:text-foreground">Admin</Link>
        </aside>
        <main>{children}</main>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/10 bg-background/90 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {mobileNav.map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold text-muted hover:bg-secondary/35 hover:text-foreground">
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pb-8 pt-2 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" /> Luxury wellness, built for daily consistency.
        </div>
        <div className="flex gap-3">
          <Link href="/coach" className="inline-flex items-center gap-1 hover:text-primary">
            <Crown size={15} /> Coach
          </Link>
          <Link href="/admin" className="inline-flex items-center gap-1 hover:text-primary">
            <ShieldCheck size={15} /> Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
