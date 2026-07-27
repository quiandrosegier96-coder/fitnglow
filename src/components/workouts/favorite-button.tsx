"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function FavoriteButton({ initial = false, label = "Save Favorite" }: { initial?: boolean; label?: string }) {
  const [favorite, setFavorite] = useState(initial);
  const { toast } = useToast();

  return (
    <Button
      variant={favorite ? "default" : "outline"}
      onClick={() => {
        setFavorite((current) => !current);
        toast({ title: favorite ? "Removed from favorites" : "Saved to favorites", description: "Your workout list has been updated." });
      }}
    >
      <Heart size={17} className={favorite ? "fill-white" : ""} /> {label}
    </Button>
  );
}
