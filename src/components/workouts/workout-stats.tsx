import { Dumbbell, Flame, Star, Timer } from "lucide-react";
import { StatisticsCard } from "@/components/statistics-card";
import type { Workout } from "@/data/workouts";

export function WorkoutStats({ workout }: { workout: Workout }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatisticsCard title="Duration" value={`${workout.durationMinutes} min`} trend="Guided session" icon={Timer} />
      <StatisticsCard title="Calories" value={`${workout.estimatedCalories}`} trend="Estimated burn" icon={Flame} />
      <StatisticsCard title="Exercises" value={`${workout.exercises.length}`} trend="Structured blocks" icon={Dumbbell} />
      <StatisticsCard title="Rating" value={`${workout.rating}`} trend={`${workout.ratingCount} reviews`} icon={Star} />
    </div>
  );
}
