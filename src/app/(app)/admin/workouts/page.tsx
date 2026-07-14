import { PageHeader } from "@/components/page-header";
import { AdminWorkoutBuilder } from "@/components/workouts/admin-workout-builder";

export default function AdminWorkoutsPage() {
  return (
    <div>
      <PageHeader eyebrow="Admin workouts" title="Create, manage, and publish workouts" description="Coach and admin workflow for creating, editing, deleting, duplicating, uploading media, reordering exercises, previewing, and publishing workouts." />
      <AdminWorkoutBuilder />
    </div>
  );
}
