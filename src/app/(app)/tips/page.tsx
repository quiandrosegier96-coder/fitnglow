import { tips } from "@/data/catalog";
import { PageHeader } from "@/components/page-header";
import { TipCard } from "@/components/tip-card";

export default function TipsPage() {
  return (
    <div>
      <PageHeader eyebrow="Body tips" title="Small rituals with visible results" description="Daily cards for fitness, sleep, hydration, mindset, recovery, stress, and motivation." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {tips.map((tip) => (
          <TipCard key={tip.title} {...tip} />
        ))}
      </div>
    </div>
  );
}
