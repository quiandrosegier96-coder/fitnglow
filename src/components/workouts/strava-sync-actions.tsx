"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StravaSyncActions() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function sync() {
    setSyncing(true);
    try {
      await fetch("/api/strava/sync", {
        method: "POST",
        credentials: "same-origin"
      });
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <Link href="/settings">Strava instellingen</Link>
      </Button>
      <Button type="button" onClick={sync} disabled={syncing}>
        {syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
        Sync Strava
      </Button>
    </div>
  );
}
