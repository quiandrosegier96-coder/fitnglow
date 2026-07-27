import Link from "next/link";
import { BarChart3, Database, ShieldCheck, WandSparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const collections = ["Users", "Roles", "Recipes", "Workouts", "Exercises", "Nutrition plans", "Challenges", "Tips", "Announcements", "Analytics"];

export default function AdminPage() {
  return (
    <div>
      <PageHeader eyebrow="Admin panel" title="Full CMS without coding" description="Manage users, roles, recipes, workouts, nutrition plans, challenges, announcements, analytics, media, and audit logs." />
      <section className="grid gap-5 lg:grid-cols-4">
        <Card><ShieldCheck className="text-primary" /><CardTitle className="mt-4">RLS secured</CardTitle><p className="mt-2 text-muted">Admin mutations are guarded by database policies and audit logs.</p></Card>
        <Card><Database className="text-primary" /><CardTitle className="mt-4">CMS data</CardTitle><p className="mt-2 text-muted">Structured tables for every product surface.</p></Card>
        <Card><BarChart3 className="text-primary" /><CardTitle className="mt-4">Analytics</CardTitle><p className="mt-2 text-muted">Engagement, streaks, revenue-ready metrics, and retention.</p></Card>
        <Card><WandSparkles className="text-primary" /><CardTitle className="mt-4">Publishing</CardTitle><p className="mt-2 text-muted">Draft, review, schedule, and publish premium content.</p></Card>
      </section>
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {collections.map((item) => (
          <Button key={item} variant="outline" className="justify-start" asChild={item === "Workouts"}>
            {item === "Workouts" ? <Link href="/admin/workouts">{item}</Link> : <span>{item}</span>}
          </Button>
        ))}
      </section>
    </div>
  );
}
