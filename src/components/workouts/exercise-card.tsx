import Image from "next/image";
import { Dumbbell, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/workouts/difficulty-badge";
import type { WorkoutExercise } from "@/data/workouts";

export function ExerciseCard({ exercise, index }: { exercise: WorkoutExercise; index: number }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 md:grid-cols-[260px_1fr]">
        <div className="relative min-h-56">
          <Image src={exercise.image} alt={exercise.name} fill className="object-cover" />
        </div>
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge>Exercise {index + 1}</Badge>
            <DifficultyBadge difficulty={exercise.difficulty} />
            <Badge className="bg-secondary/35">{exercise.muscleGroup}</Badge>
          </div>
          <CardTitle>{exercise.name}</CardTitle>
          <p className="mt-2 leading-7 text-muted">{exercise.description}</p>
          <div className="mt-4 grid gap-2 text-sm font-semibold sm:grid-cols-4">
            <span className="rounded-2xl bg-secondary/25 p-3">{exercise.sets} sets</span>
            <span className="rounded-2xl bg-secondary/25 p-3">{exercise.repetitions}</span>
            <span className="rounded-2xl bg-secondary/25 p-3"><Timer size={15} className="inline" /> {exercise.restSeconds}s rest</span>
            <span className="rounded-2xl bg-secondary/25 p-3"><Dumbbell size={15} className="inline" /> {exercise.weight ?? "Optional"}</span>
          </div>
          <ol className="mt-4 list-inside list-decimal space-y-1 text-sm leading-6 text-muted">
            {exercise.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
          </ol>
          <p className="mt-4 rounded-2xl bg-primary/10 p-3 text-sm font-semibold text-muted">{exercise.notes}</p>
        </div>
      </div>
    </Card>
  );
}
