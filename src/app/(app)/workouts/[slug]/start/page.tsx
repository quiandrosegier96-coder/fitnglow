import { notFound } from "next/navigation";
import { getWorkoutBySlug } from "@/data/workouts";
import { WorkoutPlayer } from "@/components/workouts/workout-player";

export default async function StartWorkoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workout = getWorkoutBySlug(slug);
  if (!workout) notFound();
  return <WorkoutPlayer workout={workout} />;
}
