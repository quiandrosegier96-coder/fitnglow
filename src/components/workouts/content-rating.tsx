"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type RatingSummary = { average: number; count: number; myRating: number | null };

export function ContentRating({
  itemType,
  itemId,
  interactive = false
}: {
  itemType: "grow_with_jo" | "daily_challenge";
  itemId: string;
  interactive?: boolean;
}) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<RatingSummary>({ average: 0, count: 0, myRating: null });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/content-ratings?itemType=${itemType}&itemIds=${itemId}`, { credentials: "same-origin" });
    if (!response.ok) return;
    const payload = await response.json();
    setSummary(payload.ratings?.[itemId] ?? { average: 0, count: 0, myRating: null });
  }, [itemId, itemType]);

  useEffect(() => {
    void load();
  }, [load]);

  async function rate(rating: number) {
    setSaving(true);
    try {
      const response = await fetch("/api/content-ratings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId, rating })
      });
      const payload = await response.json().catch(() => ({ error: "Beoordeling kon niet opgeslagen worden." }));
      if (!response.ok) throw new Error(payload.error);
      await load();
      toast({ title: "Bedankt voor je beoordeling!" });
    } catch (error) {
      toast({ title: "Beoordelen mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setSaving(false);
    }
  }

  if (!interactive) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-black text-muted">
        <Star size={16} className="text-primary" fill="currentColor" />
        {summary.count ? summary.average.toFixed(1) : "Nieuw"}
      </span>
    );
  }

  return (
    <div>
      <p className="text-sm font-extrabold">Wat vond je van deze workout?</p>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => rate(rating)}
            disabled={saving}
            aria-label={`${rating} sterren`}
            className="rounded-lg p-1 text-primary transition hover:scale-110 disabled:opacity-60"
          >
            <Star size={24} fill={rating <= (summary.myRating ?? 0) ? "currentColor" : "none"} />
          </button>
        ))}
        {saving ? <Loader2 className="ml-2 animate-spin text-primary" size={17} /> : null}
        <span className="ml-2 text-sm font-bold text-muted">{summary.count ? `${summary.average.toFixed(1)} (${summary.count})` : "Nog geen beoordelingen"}</span>
      </div>
    </div>
  );
}
