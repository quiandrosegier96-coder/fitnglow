import { Badge } from "@/components/ui/badge";
import type { Difficulty } from "@/data/workouts";

const tones: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/45 dark:text-emerald-100",
  Intermediate: "bg-secondary text-foreground",
  Advanced: "bg-primary text-white",
  beginner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/45 dark:text-emerald-100",
  intermediate: "bg-secondary text-foreground",
  advanced: "bg-primary text-white"
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty | string }) {
  return <Badge className={tones[difficulty] ?? "bg-secondary"}>{difficulty}</Badge>;
}
