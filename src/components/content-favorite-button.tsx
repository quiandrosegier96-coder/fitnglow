"use client";

import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContentFavoriteButton({ itemId }: { itemId: string }) {
  const [favorite, setFavorite] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/content-favorites?itemType=daily_challenge&itemId=${itemId}`, { credentials: "same-origin" })
      .then((response) => response.json())
      .then((payload) => setFavorite(Boolean(payload.favorite)))
      .catch(() => undefined);
  }, [itemId]);

  async function toggle() {
    setBusy(true);
    try {
      const response = await fetch("/api/content-favorites", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "daily_challenge", itemId })
      });
      if (response.ok) setFavorite(Boolean((await response.json()).favorite));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" size="icon" variant="secondary" onClick={toggle} disabled={busy} className="h-12 w-12 rounded-2xl" aria-label="Challenge favoriet">
      {busy ? <Loader2 className="animate-spin" size={18} /> : <Heart size={20} className="text-primary" fill={favorite ? "currentColor" : "none"} />}
    </Button>
  );
}
