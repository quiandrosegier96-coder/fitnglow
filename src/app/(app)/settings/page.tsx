import { Suspense } from "react";
import { Bell, Download, Languages, Shield, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { StravaConnectCard } from "@/components/settings/strava-connect-card";
import { Skeleton } from "@/components/ui/skeleton";

const settings = [
  { title: "Language", description: "English, Dutch, French, and future app localization.", icon: Languages },
  { title: "Notifications", description: "Workout, water, nutrition, daily reminders, and motivation.", icon: Bell },
  { title: "Privacy", description: "Community visibility, coach access, and photo permissions.", icon: Shield }
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader eyebrow="Settings" title="Your account, your rhythm" description="Manage language, notifications, theme, privacy, account deletion, and export rights." />
      <div className="grid gap-5 lg:grid-cols-3">
        {settings.map((item) => (
          <Card key={item.title}>
            <item.icon className="text-primary" />
            <CardTitle className="mt-4">{item.title}</CardTitle>
            <p className="mt-2 leading-7 text-muted">{item.description}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Theme</CardTitle>
          <p className="mt-2 text-muted">Switch between light and dark mode.</p>
        </div>
        <ThemeToggle />
      </Card>
      <Suspense fallback={<Skeleton className="mt-6 h-48 w-full" />}>
        <StravaConnectCard />
      </Suspense>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline"><Download size={17} /> Export data</Button>
        <Button variant="outline"><Trash2 size={17} /> Delete account</Button>
      </div>
    </div>
  );
}
