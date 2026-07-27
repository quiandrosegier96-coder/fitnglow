import Link from "next/link";
import { ArrowRight, History, Play, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { workoutLibrary, workoutCategories, difficultyFilters, durationFilters, muscleGroups, recentlyCompleted } from "@/data/workouts";
import { recommendWorkouts } from "@/lib/workout-recommendations";
import { PageHeader } from "@/components/page-header";
import { WorkoutCard } from "@/components/workout-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { WorkoutStats } from "@/components/workouts/workout-stats";

export default function WorkoutsPage() {
  const featured = workoutLibrary[0];
  const recommended = recommendWorkouts();
  const completed = recentlyCompleted.map((item) => ({
    ...item,
    workout: workoutLibrary.find((workout) => workout.id === item.workoutId)
  })).filter((item) => item.workout);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Workout studio" title="Train with premium precision" description="Browse guided workouts, continue sessions, filter by goal and muscle group, and start a distraction-free training mode." />

      <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="overflow-hidden p-0">
          <div className="relative min-h-[430px] bg-cover bg-center p-6 text-white" style={{ backgroundImage: `linear-gradient(90deg, rgba(20,9,15,.82), rgba(20,9,15,.25)), url(${featured.coverImage})` }}>
            <div className="flex h-full max-w-2xl flex-col justify-end pt-32">
              <Badge className="w-fit bg-white/90">{featured.category}</Badge>
              <h2 className="mt-4 font-serif text-5xl font-black">{featured.title}</h2>
              <p className="mt-4 max-w-xl text-white/84">{featured.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
                <span className="rounded-full bg-white/16 px-4 py-2">{featured.durationMinutes} min</span>
                <span className="rounded-full bg-white/16 px-4 py-2">{featured.difficulty}</span>
                <span className="rounded-full bg-white/16 px-4 py-2">{featured.estimatedCalories} kcal</span>
                <span className="rounded-full bg-white/16 px-4 py-2">{featured.coach}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild><Link href={`/workouts/${featured.slug}/start`}><Play size={17} /> Continue workout</Link></Button>
                <Button variant="secondary" asChild><Link href={`/workouts/${featured.slug}`}>View details <ArrowRight size={17} /></Link></Button>
              </div>
            </div>
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardTitle>Recently completed</CardTitle>
            <div className="mt-4 space-y-3">
              {completed.map((item) => (
                <Link key={item.workoutId} href={`/workouts/${item.workout!.slug}`} className="flex items-center justify-between rounded-2xl bg-secondary/25 p-3 hover:bg-secondary/40">
                  <div>
                    <p className="font-bold">{item.workout!.title}</p>
                    <p className="text-sm text-muted">{item.date} · {item.completion}% · {item.calories} kcal</p>
                  </div>
                  <History size={18} className="text-primary" />
                </Link>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-4 w-full"><Link href="/workouts/history">Open history</Link></Button>
          </Card>
          <Card>
            <CardTitle>Recommendation engine</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted">Matched by goals, history, difficulty, favorite categories, and completed workouts.</p>
            <Button asChild className="mt-4 w-full"><Link href="#recommended"><Sparkles size={17} /> See recommendations</Link></Button>
          </Card>
        </div>
      </section>

      <WorkoutStats workout={featured} />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-muted" size={18} />
            <Input className="pl-11" placeholder="Search workouts, coach, equipment, or muscle group" />
          </div>
          <Button variant="outline"><SlidersHorizontal size={17} /> Filters</Button>
        </div>
        <div className="grid gap-3">
          <FilterRow title="Categories" values={workoutCategories} />
          <FilterRow title="Difficulty" values={difficultyFilters} />
          <FilterRow title="Duration" values={durationFilters} />
          <FilterRow title="Muscle group" values={muscleGroups} />
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <CardTitle>All workouts</CardTitle>
          <Button variant="ghost" asChild><Link href="/workouts/favorites">Favorites <ArrowRight size={16} /></Link></Button>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {workoutLibrary.map((workout) => <WorkoutCard key={workout.id} workout={workout} />)}
        </div>
      </section>

      <section id="recommended">
        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="text-primary" />
          <CardTitle>Recommended workouts</CardTitle>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {recommended.map((workout) => <WorkoutCard key={workout.id} workout={workout} compact />)}
        </div>
      </section>
    </div>
  );
}

function FilterRow({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-[1.5rem] bg-card/70 p-3 sm:flex-row sm:items-center">
      <span className="min-w-28 text-sm font-black text-muted">{title}</span>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => <Badge key={value} className="cursor-pointer bg-secondary/35 hover:bg-secondary">{value}</Badge>)}
      </div>
    </div>
  );
}
