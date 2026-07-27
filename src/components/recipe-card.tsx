<<<<<<< HEAD
import Image from "next/image";
import { Heart, Search } from "lucide-react";
=======
"use client";

import Image from "next/image";
import { Search } from "lucide-react";
>>>>>>> origin/agent/community-challenges-grow-with-jo
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export function RecipeCard({ recipe }: { recipe: (typeof import("@/data/catalog").recipes)[number] }) {
<<<<<<< HEAD
=======
  function trackView() {
    void fetch("/api/content-history", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: "recipe",
        contentId: recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: recipe.title,
        imageUrl: recipe.image
      })
    });
  }

>>>>>>> origin/agent/community-challenges-grow-with-jo
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-48">
        <Image src={recipe.image} alt={recipe.title} fill className="object-cover" />
<<<<<<< HEAD
        <Button size="icon" variant="secondary" className="absolute right-4 top-4" aria-label="Favorite">
          <Heart size={17} />
        </Button>
=======
>>>>>>> origin/agent/community-challenges-grow-with-jo
      </div>
      <div className="p-5">
        <Badge>{recipe.category}</Badge>
        <CardTitle className="mt-3">{recipe.title}</CardTitle>
        <p className="mt-2 text-sm font-semibold text-muted">{recipe.time} · {recipe.calories} calories</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-2xl bg-secondary/30 p-3"><b>{recipe.protein}g</b><br />Protein</div>
          <div className="rounded-2xl bg-secondary/30 p-3"><b>{recipe.carbs}g</b><br />Carbs</div>
          <div className="rounded-2xl bg-secondary/30 p-3"><b>{recipe.fat}g</b><br />Fat</div>
        </div>
<<<<<<< HEAD
        <Button variant="outline" className="mt-5 w-full">
=======
        <Button type="button" variant="outline" className="mt-5 w-full" onClick={trackView}>
>>>>>>> origin/agent/community-challenges-grow-with-jo
          <Search size={17} /> View preparation
        </Button>
      </div>
    </Card>
  );
}
