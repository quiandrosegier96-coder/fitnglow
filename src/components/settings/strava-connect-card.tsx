"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Loader2, RefreshCw, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

type StravaStatus = {
  configured: boolean;
  connected: boolean;
  connection?: {
    athlete_id: number;
    scope: string;
    connected_at: string;
    last_sync_at: string | null;
    athlete?: { firstname?: string; lastname?: string; profile_medium?: string };
  } | null;
  activityCount: number;
};

export function StravaConnectCard() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<StravaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadStatus() {
    setLoading(true);
    const response = await fetch("/api/strava/status", { credentials: "same-origin" });
    const payload = await response.json();
    setStatus(payload);
    setLoading(false);
  }

  useEffect(() => {
    loadStatus().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const result = searchParams.get("strava");
    if (result === "connected") toast({ title: "Strava gekoppeld", description: "Je kan nu activiteiten synchroniseren." });
    if (result === "missing-env") toast({ title: "Strava mist instellingen", description: "Voeg STRAVA_CLIENT_ID en STRAVA_CLIENT_SECRET toe." });
    if (result === "error") toast({ title: "Strava koppeling mislukt", description: "Controleer je Strava app instellingen en redirect URL." });
  }, [searchParams, toast]);

  async function sync() {
    setBusy(true);
    const response = await fetch("/api/strava/sync", {
      method: "POST",
      credentials: "same-origin"
    });
    const payload = await response.json().catch(() => ({ error: "Sync failed." }));
    setBusy(false);
    if (!response.ok) {
      toast({ title: "Strava sync mislukt", description: payload.error ?? "Probeer opnieuw." });
      return;
    }
    toast({ title: "Strava gesynchroniseerd", description: `${payload.synced ?? 0} activiteiten opgehaald.` });
    await loadStatus();
  }

  async function disconnect() {
    setBusy(true);
    const response = await fetch("/api/strava/disconnect", {
      method: "POST",
      credentials: "same-origin"
    });
    setBusy(false);
    if (!response.ok) {
      toast({ title: "Loskoppelen mislukt", description: "Probeer opnieuw." });
      return;
    }
    toast({ title: "Strava losgekoppeld", description: "Je Strava tokens en activiteiten zijn verwijderd." });
    await loadStatus();
  }

  const athleteName = [status?.connection?.athlete?.firstname, status?.connection?.athlete?.lastname].filter(Boolean).join(" ");

  return (
    <Card className="mt-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fc4c02]/10 text-[#fc4c02]">
              <Activity size={21} />
            </div>
            <div>
              <CardTitle>Strava</CardTitle>
              <p className="mt-1 text-sm font-medium text-muted">Koppel je runs, wandelingen en ritten met Fit & Glow.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {loading ? (
              <Badge>Loading</Badge>
            ) : status?.connected ? (
              <>
                <Badge className="bg-emerald-50 text-emerald-800"><CheckCircle2 size={14} /> Connected</Badge>
                <Badge>{status.activityCount} activiteiten</Badge>
                {athleteName && <Badge>{athleteName}</Badge>}
              </>
            ) : (
              <Badge className="bg-secondary/35 text-primary">Niet gekoppeld</Badge>
            )}
          </div>
          {status?.connection?.last_sync_at && (
            <p className="mt-3 text-sm font-semibold text-muted">Laatste sync: {new Date(status.connection.last_sync_at).toLocaleString("nl-BE")}</p>
          )}
          {!status?.configured && !loading && (
            <p className="mt-3 rounded-2xl bg-secondary/20 p-3 text-sm font-semibold text-muted">
              Voeg `STRAVA_CLIENT_ID` en `STRAVA_CLIENT_SECRET` toe aan je environment variables.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          {!status?.connected ? (
            <Button asChild disabled={!status?.configured || loading}>
              <a href="/api/strava/connect">Connect Strava</a>
            </Button>
          ) : (
            <>
              <Button onClick={sync} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />} Sync
              </Button>
              <Button onClick={disconnect} disabled={busy} variant="outline">
                <Unlink size={17} /> Disconnect
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
