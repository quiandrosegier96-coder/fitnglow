"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
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

export function NotificationsList() {
  const { toast } = useToast();
  const query = useQuery({
    queryKey: ["notifications-page"],
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
      .channel("notifications-page-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => query.refetch())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  async function markRead(notificationId?: string) {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationId ? { notificationId } : { all: true })
      });
      const payload = await response.json().catch(() => ({ error: "Melding kon niet bijgewerkt worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Melding kon niet bijgewerkt worden.");
      await query.refetch();
    } catch (error) {
      toast({ title: "Melding mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    }
  }

  if (query.isLoading) {
    return <Card className="h-64 animate-pulse" />;
  }

  if (query.error) {
    return (
      <Card>
        <CardTitle>Meldingen konden niet laden</CardTitle>
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">{query.error instanceof Error ? query.error.message : "Probeer opnieuw."}</p>
      </Card>
    );
  }

  const notifications = query.data?.notifications ?? [];

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle>Meldingen</CardTitle>
          <p className="mt-2 text-sm font-bold text-muted">{query.data?.unreadCount ?? 0} ongelezen meldingen.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => markRead()} disabled={(query.data?.unreadCount ?? 0) === 0}>
          <CheckCheck size={16} />
          Alles gelezen
        </Button>
      </Card>

      {notifications.length === 0 ? (
        <Card className="text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-secondary/35 text-primary">
            <Bell />
          </div>
          <CardTitle>Nog geen meldingen</CardTitle>
          <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-muted">Wanneer iemand reageert op jouw tijdlijn of op jouw reactie, verschijnt dat hier.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <Card key={item.id} className={!item.read_at ? "border-primary/35 bg-secondary/15" : undefined}>
              <div className="flex gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary/35 text-primary">
                  <MessageCircle size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <p className="mt-1 text-xs font-bold text-muted">{formatDate(item.created_at)}</p>
                    </div>
                    {!item.read_at && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => markRead(item.id)}>
                        <CheckCheck size={15} />
                        Gelezen
                      </Button>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-muted">{item.body}</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href={getNotificationHref(item)} onClick={() => !item.read_at && void markRead(item.id)}>
                      Bekijk in community
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
