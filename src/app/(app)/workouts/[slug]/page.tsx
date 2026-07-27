import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Share2, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { getRelatedWorkouts, getWorkoutBySlug } from "@/data/workouts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { WorkoutCard } from "@/components/workout-card";
import { ExerciseCard } from "@/components/workouts/exercise-card";
import { FavoriteButton } from "@/components/workouts/favorite-button";
import { WorkoutStats } from "@/components/workouts/workout-stats";
import { DifficultyBadge } from "@/components/workouts/difficulty-badge";

export function generateStaticParams() {
  return [];
}

export default async function WorkoutDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workout = getWorkoutBySlug(slug);
  if (!workout) notFound();
  const related = getRelatedWorkouts(workout);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] bg-card shadow-2xl shadow-primary/10">
        <div className="relative h-[460px]">
          <Image src={workout.coverImage} alt={workout.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
            <div className="mb-4 flex flex-wrap gap-2">
              <DifficultyBadge difficulty={workout.difficulty} />
              <Badge className="bg-white/88">{workout.category}</Badge>
              <Badge className="bg-white/88">{workout.coach}</Badge>
            </div>
            <h1 className="max-w-3xl font-serif text-5xl font-black">{workout.title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/86">{workout.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><Link href={`/workouts/${workout.slug}/start`}>Start Workout</Link></Button>
              <FavoriteButton initial={workout.favorite} />
              <Button variant="secondary"><Share2 size={17} /> Share Workout</Button>
            </div>
          </div>
        </div>
      </section>

      <WorkoutStats workout={workout} />

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardTitle>Equipment and focus</CardTitle>
            <div className="mt-4 flex flex-wrap gap-2">
              {workout.equipment.map((item) => <Badge key={item}>{item}</Badge>)}
              {workout.muscleGroups.map((item) => <Badge key={item} className="bg-secondary/35">{item}</Badge>)}
            </div>
          </Card>
          {workout.exercises.map((exercise, index) => <ExerciseCard key={exercise.id} exercise={exercise} index={index} />)}
        </div>
        <aside className="space-y-5">
          <Card>
            <CardTitle>Ratings</CardTitle>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-black">{workout.rating}</span>
              <span className="mb-2 text-muted">/ 5</span>
            </div>
            <div className="mt-3 flex gap-1 text-primary">
              {Array.from({ length: 5 }, (_, index) => <Star key={index} size={18} className="fill-primary" />)}
            </div>
            <p className="mt-2 text-sm text-muted">{workout.ratingCount} member ratings</p>
          </Card>
          <Card>
            <CardTitle>Comments</CardTitle>
            <div className="mt-4 space-y-3">
              <Comment name="Sofia" text="The pacing is perfect. My glutes were awake by minute six." />
              <Comment name="Mila" text="Loved the tempo cues and the finisher." />
            </div>
            <Button variant="outline" className="mt-4 w-full"><MessageCircle size={17} /> Add comment</Button>
          </Card>
        </aside>
      </section>

      <section>
        <CardTitle className="mb-5">Related workouts</CardTitle>
        <div className="grid gap-6 lg:grid-cols-3">
          {related.map((item) => <WorkoutCard key={item.id} workout={item} compact />)}
        </div>
      </section>
    </div>
  );
}

function Comment({ name, text }: { name: string; text: string }) {
  return (
    <div className="rounded-2xl bg-secondary/25 p-3">
      <p className="font-bold">{name}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}
