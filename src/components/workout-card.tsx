import Image from "next/image";
import Link from "next/link";
import { Dumbbell, Flame, Heart, Play, Star, Timer, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/workouts/difficulty-badge";
import { DurationBadge } from "@/components/workouts/duration-badge";
import type { Workout } from "@/data/workouts";

type LegacyWorkout = (typeof import("@/data/catalog").workouts)[number];

function isModuleWorkout(workout: Workout | LegacyWorkout): workout is Workout {
  return "slug" in workout;
}

export function WorkoutCard({ workout, compact = false }: { workout: Workout | LegacyWorkout; compact?: boolean }) {
  const moduleWorkout = isModuleWorkout(workout);
  const title = workout.title;
  const image = moduleWorkout ? workout.coverImage : workout.image;
  const duration = moduleWorkout ? `${workout.durationMinutes} min` : workout.duration;
  const calories = moduleWorkout ? workout.estimatedCalories : workout.kcal;
  const difficulty = workout.difficulty;
  const exercises = moduleWorkout ? workout.exercises.length : workout.exercises.length;
  const coach = moduleWorkout ? workout.coach : "Fit & Glow Coach";
  const href = moduleWorkout ? `/workouts/${workout.slug}` : "/workouts";

  return (
    <Card className="group overflow-hidden p-0 hover:-translate-y-1">
      <div className={compact ? "relative h-44" : "relative h-56"}>
        <Image src={image} alt={title} fill className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute left-4 top-4">
          <DifficultyBadge difficulty={difficulty} />
        </div>
        <Button size="icon" variant="secondary" className="absolute right-4 top-4 bg-white/90" aria-label="Favorite workout">
          <Heart size={17} className={moduleWorkout && workout.favorite ? "fill-primary text-primary" : ""} />
        </Button>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Badge className="bg-secondary/35">{moduleWorkout ? workout.category : "Workout"}</Badge>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-muted">
            <Star size={14} className="fill-primary text-primary" /> {moduleWorkout ? workout.rating : "4.8"}
          </span>
        </div>
        <CardTitle>{title}</CardTitle>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-muted">
          <span className="inline-flex items-center gap-1">
            <Timer size={16} /> {duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame size={16} /> {calories} kcal
          </span>
          <span className="inline-flex items-center gap-1">
            <Dumbbell size={16} /> {exercises} exercises
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-muted">
          <span className="inline-flex items-center gap-1">
            <UserRound size={16} /> {coach}
          </span>
          {moduleWorkout && <DurationBadge minutes={workout.durationMinutes} />}
        </div>
        <Button className="mt-5 w-full" asChild>
          <Link href={href}>
            <Play size={17} /> Open workout
          </Link>
        </Button>
      </div>
    </Card>
  );
}
