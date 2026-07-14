import { CalendarDays, Flame, Gauge, StickyNote, Timer } from "lucide-react";
import { recentlyCompleted, workoutLibrary } from "@/data/workouts";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WorkoutHistoryPage() {
  return (
    <div>
      <PageHeader eyebrow="Workout history" title="Your completed training record" description="Completed workouts, duration, calories, completion percentage, average pace, dates, and personal notes." />
      <div className="space-y-4">
        {recentlyCompleted.map((entry) => {
          const workout = workoutLibrary.find((item) => item.id === entry.workoutId);
          return (
            <Card key={`${entry.workoutId}-${entry.date}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <Badge>{entry.date}</Badge>
                  <CardTitle className="mt-3">{workout?.title}</CardTitle>
                  <p className="mt-2 text-muted">{entry.notes}</p>
                </div>
                <div className="grid gap-2 text-sm font-bold sm:grid-cols-4 lg:w-[520px]">
                  <span className="rounded-2xl bg-secondary/25 p-3"><Timer size={15} className="inline" /> {entry.durationMinutes} min</span>
                  <span className="rounded-2xl bg-secondary/25 p-3"><Flame size={15} className="inline" /> {entry.calories} kcal</span>
                  <span className="rounded-2xl bg-secondary/25 p-3"><Gauge size={15} className="inline" /> {entry.completion}%</span>
                  <span className="rounded-2xl bg-secondary/25 p-3"><CalendarDays size={15} className="inline" /> {entry.pace}</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted"><StickyNote size={15} className="mr-1 inline" /> Personal note stored with the completed workout record.</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
