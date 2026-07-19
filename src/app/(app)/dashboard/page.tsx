import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { achievements, metrics, quickActions, workouts } from "@/data/catalog";
import { quote } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { WorkoutCard } from "@/components/workout-card";
import { ProgressChart } from "@/components/progress-chart";
import { BodyProfileSummary } from "@/components/onboarding/body-profile-summary";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Good evening, Joyce" title="Your glow dashboard" description="A calm command center for training, nutrition, progress, reminders, and the next best action today." />
      <BodyProfileSummary />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="rose-gold text-white">
          <div className="flex h-full flex-col justify-between gap-8">
            <div>
              <Quote className="mb-4" />
              <h2 className="font-serif text-4xl font-bold">Today is made for precise, beautiful effort.</h2>
              <p className="mt-4 max-w-2xl text-white/88">{quote}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {quickActions.map((action) => (
                <Button key={action.href} asChild variant="secondary" className="bg-white/88">
                  <Link href={action.href}><action.icon size={17} />{action.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Achievements</CardTitle>
            <Badge>XP 8,420</Badge>
          </div>
          <div className="space-y-4">
            {achievements.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between text-sm font-bold">
                  <span className="inline-flex items-center gap-2"><item.icon size={17} className="text-primary" />{item.name}</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="h-3 rounded-full bg-secondary/35"><div className="h-3 rounded-full rose-gold" style={{ width: `${item.progress}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <WorkoutCard workout={workouts[0]} />
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Weight progress</CardTitle>
            <Button variant="ghost" asChild><Link href="/progress">Open <ArrowRight size={16} /></Link></Button>
          </div>
          <ProgressChart />
        </Card>
      </section>
    </div>
  );
}
