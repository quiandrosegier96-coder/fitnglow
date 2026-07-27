import { PageHeader } from "@/components/page-header";
import { CommunityFeed } from "@/components/community/community-feed";

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Community" title="Mijn tijdlijn" description="Al je workouts, Strava activiteiten, challenges en eigen posts chronologisch op een warme Fit & Glow feed." />
      <CommunityFeed />
    </div>
  );
}
