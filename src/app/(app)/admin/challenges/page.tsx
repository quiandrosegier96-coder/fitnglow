import { PageHeader } from "@/components/page-header";
import { DailyChallengeManager } from "@/components/admin/daily-challenge-manager";

export default function AdminChallengesPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Admin challenges" title="Upload de challenge van de dag" description="Publiceer dagelijks je eigen video challenge. Het dashboard toont alleen wat jij uploadt." />
      <DailyChallengeManager />
    </div>
  );
}
