"use client";

<<<<<<< HEAD
import { Bell, Droplets, Dumbbell, Utensils } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";

const notifications = [
  { title: "Workout reminder", body: "Rose Sculpt starts at 18:30.", icon: Dumbbell },
  { title: "Water reminder", body: "Drink 400ml before dinner.", icon: Droplets },
  { title: "Nutrition reminder", body: "Protein snack is scheduled now.", icon: Utensils }
];

export function NotificationCenter() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button size="icon" variant="ghost" aria-label="Notifications">
          <Bell size={18} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" className="z-50 mt-3 w-80 rounded-[1.5rem] border border-primary/10 bg-card p-3 shadow-2xl">
          <p className="px-2 py-2 font-serif text-xl font-bold">Notifications</p>
          {notifications.map((item) => (
            <DropdownMenu.Item key={item.title} className="flex cursor-default gap-3 rounded-2xl p-3 outline-none hover:bg-secondary/25">
              <item.icon className="mt-1 text-primary" size={18} />
              <div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs text-muted">{item.body}</p>
              </div>
            </DropdownMenu.Item>
          ))}
=======
import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, MessageCircle } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getNotificationHref } from "@/lib/community-notification-link";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
  notification_type: string;
  feed_item_id: string | null;
  feed_item_type: string | null;
};

type NotificationsPayload = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export function NotificationCenter() {
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications", { credentials: "same-origin" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Meldingen konden niet geladen worden.");
      return payload as NotificationsPayload;
    },
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => query.refetch())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true })
    });
    await query.refetch();
  }

  async function markRead(notificationId: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId })
    });
  }

  const notifications = query.data?.notifications ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button size="icon" variant="ghost" aria-label="Meldingen" className="relative">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" className="z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-[1.5rem] border border-primary/10 bg-card p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <p className="font-serif text-xl font-bold">Meldingen</p>
            {unreadCount > 0 && (
              <Button type="button" size="sm" variant="ghost" onClick={markAllRead}>
                <CheckCheck size={15} />
                Gelezen
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-2xl bg-secondary/20 p-4 text-sm font-bold text-muted">Nog geen meldingen.</div>
          ) : (
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {notifications.slice(0, 8).map((item) => (
                <DropdownMenu.Item key={item.id} asChild className="outline-none">
                  <Link
                    href={getNotificationHref(item)}
                    onClick={() => !item.read_at && void markRead(item.id)}
                    className="flex gap-3 rounded-2xl p-3 hover:bg-secondary/25"
                  >
                    <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary/35 text-primary">
                      <MessageCircle size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-extrabold">{item.title}</span>
                        {!item.read_at && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs font-semibold text-muted">{item.body}</span>
                      <span className="mt-1 block text-[11px] font-bold text-muted/80">{formatShortDate(item.created_at)}</span>
                    </span>
                  </Link>
                </DropdownMenu.Item>
              ))}
            </div>
          )}

          <div className="mt-2 border-t border-border pt-2">
            <DropdownMenu.Item asChild className="outline-none">
              <Link href="/notifications" className="block rounded-2xl px-3 py-2 text-center text-sm font-extrabold text-primary hover:bg-secondary/25">
                Alle meldingen bekijken
              </Link>
            </DropdownMenu.Item>
          </div>
>>>>>>> origin/agent/community-challenges-grow-with-jo
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
<<<<<<< HEAD
=======

function formatShortDate(date: string) {
  return new Date(date).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
>>>>>>> origin/agent/community-challenges-grow-with-jo
