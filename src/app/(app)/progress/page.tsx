import { PageHeader } from "@/components/page-header";
import { WeightProgressPanel } from "@/components/progress/weight-progress-panel";

export default function ProgressPage() {
  return (
    <div>
      <PageHeader eyebrow="Progress" title="Measure what matters, beautifully" description="Track weight history with one source of truth. Every new entry updates charts, dashboard cards, BMI, statistics, and achievements." />
      <WeightProgressPanel />
    </div>
  );
}
