import { ShoppingBag } from "lucide-react";
import { nutritionPlan } from "@/data/catalog";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NutritionPage() {
  const total = nutritionPlan.reduce((sum, meal) => sum + meal.calories, 0);
  return (
    <div>
      <PageHeader eyebrow="Nutrition plans" title="Daily schedule, shopping list, progress" description="Admin-created meal plans with calories, meal structure, grocery lists, and adherence tracking." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardTitle>Today’s meal schedule</CardTitle>
          <div className="mt-5 space-y-3">
            {nutritionPlan.map((meal) => (
              <div key={meal.time} className="flex items-center justify-between rounded-3xl bg-secondary/25 p-4">
                <div><p className="text-sm font-bold text-primary">{meal.time} · {meal.meal}</p><p className="font-semibold">{meal.title}</p></div>
                <b>{meal.calories} kcal</b>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>{total} kcal</CardTitle>
          <p className="mt-2 text-muted">Balanced for strength, recovery, and steady fat loss.</p>
          <Button className="mt-5 w-full"><ShoppingBag size={17} /> Open shopping list</Button>
        </Card>
      </div>
    </div>
  );
}
