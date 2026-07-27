import { ProgressBar } from "@/components/ui/progress-bar";

export function ExerciseProgress({ current, total }: { current: number; total: number }) {
  const value = total === 0 ? 0 : ((current + 1) / total) * 100;
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-bold text-muted">
        <span>Exercise {current + 1} of {total}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}
