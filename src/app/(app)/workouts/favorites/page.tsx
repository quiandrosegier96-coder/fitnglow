import { Heart } from "lucide-react";
import { workoutLibrary } from "@/data/workouts";
import { PageHeader } from "@/components/page-header";
import { WorkoutCard } from "@/components/workout-card";

export default function FavoriteWorkoutsPage() {
  const favorites = workoutLibrary.filter((workout) => workout.favorite);

  return (
    <div>
      <PageHeader eyebrow="Favorites" title="Your saved workouts" description="Fast access to the sessions you love most, available from mobile and ready for offline shell caching." />
      <div className="mb-5 flex items-center gap-2 text-primary"><Heart className="fill-primary" /> {favorites.length} saved workouts</div>
      <div className="grid gap-6 lg:grid-cols-3">
        {favorites.map((workout) => <WorkoutCard key={workout.id} workout={workout} />)}
      </div>
    </div>
  );
}
