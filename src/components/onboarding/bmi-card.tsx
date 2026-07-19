import { Activity, Scale } from "lucide-react";
import { calculateBmi, getBmiCategory, getHealthyWeightRange, getWeightDifference } from "@/lib/body-profile";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const categoryTone = {
  Underweight: "bg-sky-100 text-sky-900",
  Healthy: "bg-emerald-100 text-emerald-900",
  Overweight: "bg-amber-100 text-amber-900",
  Obese: "bg-rose-100 text-rose-900"
};

export function BmiCard({ heightCm, currentWeightKg, targetWeightKg }: { heightCm: number; currentWeightKg: number; targetWeightKg: number }) {
  const bmi = calculateBmi(currentWeightKg, heightCm);
  const category = getBmiCategory(bmi || 0);
  const range = getHealthyWeightRange(heightCm);
  const difference = getWeightDifference(currentWeightKg, targetWeightKg);

  return (
    <Card className="rose-gold text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-white/80">BMI preview</p>
          <CardTitle className="mt-3 text-5xl">{bmi || "--"}</CardTitle>
        </div>
        <div className="rounded-2xl bg-white/18 p-3">
          <Activity />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Badge className={categoryTone[category]}>{bmi ? category : "Complete body data"}</Badge>
        <span className="rounded-2xl bg-white/15 p-3 text-sm font-bold">
          Healthy: {range.min || "--"} - {range.max || "--"} kg
        </span>
        <span className="rounded-2xl bg-white/15 p-3 text-sm font-bold">
          <Scale size={15} className="mr-1 inline" /> Goal diff: {difference > 0 ? "+" : ""}{difference || "--"} kg
        </span>
      </div>
    </Card>
  );
}
