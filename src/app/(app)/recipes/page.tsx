import { Search, SlidersHorizontal } from "lucide-react";
import { recipes } from "@/data/catalog";
import { PageHeader } from "@/components/page-header";
import { RecipeCard } from "@/components/recipe-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RecipesPage() {
  return (
    <div>
      <PageHeader eyebrow="Recipes" title="Elegant nutrition that fits your macros" description="Search breakfast, lunch, dinner, snacks, smoothies, and desserts with calories, macros, ingredients, favorites, and prep details." />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-muted" size={18} />
          <Input className="pl-11" placeholder="Search recipes, ingredients, or macro targets" />
        </div>
        <Button variant="outline"><SlidersHorizontal size={17} /> Filters</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {recipes.map((recipe) => <RecipeCard key={recipe.title} recipe={recipe} />)}
      </div>
    </div>
  );
}
