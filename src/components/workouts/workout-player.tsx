"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompletionModal } from "@/components/workouts/completion-modal";
import { ExerciseProgress } from "@/components/workouts/exercise-progress";
import { WorkoutTimer } from "@/components/workouts/workout-timer";
import type { Workout } from "@/data/workouts";

export function WorkoutPlayer({ workout }: { workout: Workout }) {
  const [current, setCurrent] = useState(0);
  const [running, setRunning] = useState(true);
  const [complete, setComplete] = useState(false);
  const exercise = workout.exercises[current];
  const next = workout.exercises[current + 1];
  const restSeconds = useMemo(() => exercise.restSeconds, [exercise.restSeconds]);

  function finishOrNext() {
    if (current === workout.exercises.length - 1) {
      setRunning(false);
      setComplete(true);
      if ("vibrate" in navigator) navigator.vibrate?.([80, 40, 80]);
      return;
    }
    setCurrent((value) => value + 1);
  }

  return (
    <div className="min-h-[calc(100vh-9rem)] space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" asChild><Link href={`/workouts/${workout.slug}`}><ChevronLeft size={18} /> Exit</Link></Button>
        <span className="rounded-full bg-secondary/40 px-4 py-2 text-sm font-bold">{workout.title}</span>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="relative h-72 sm:h-96">
          <Image src={exercise.image} alt={exercise.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <WorkoutTimer running={running} />
            <motion.h1 key={exercise.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 font-serif text-4xl font-black">
              {exercise.name}
            </motion.h1>
            <p className="mt-2 max-w-2xl text-white/85">{exercise.sets} sets · {exercise.repetitions} · {restSeconds}s rest</p>
          </div>
        </div>
        <div className="space-y-5 p-5">
          <ExerciseProgress current={current} total={workout.exercises.length} />
          <p className="leading-7 text-muted">{exercise.description}</p>
          {next && (
            <div className="rounded-[1.25rem] bg-secondary/25 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Next</p>
              <p className="mt-1 font-bold">{next.name}</p>
            </div>
          )}
        </div>
      </Card>
      <div className="sticky bottom-20 z-30 grid grid-cols-4 gap-2 rounded-[1.5rem] border border-primary/10 bg-background/90 p-2 shadow-2xl backdrop-blur-xl lg:bottom-4">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((value) => Math.max(0, value - 1))}><ChevronLeft size={18} /></Button>
        <Button variant="outline" onClick={() => setRunning((value) => !value)}>{running ? <Pause size={18} /> : <Play size={18} />}</Button>
        <Button variant="outline" onClick={() => setCurrent(0)}><RotateCcw size={18} /></Button>
        <Button onClick={finishOrNext}>{current === workout.exercises.length - 1 ? "Finish" : <ChevronRight size={18} />}</Button>
      </div>
      <CompletionModal open={complete} onOpenChange={setComplete} calories={workout.estimatedCalories} />
    </div>
  );
}
