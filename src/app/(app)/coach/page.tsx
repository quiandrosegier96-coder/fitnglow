import { Megaphone, Send, Users, Video } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const coachModules = [
  "Users",
  "Recipes",
  "Nutrition plans",
  "Challenges",
  "Tips",
  "Videos",
  "Announcements",
  "Push notifications",
  "Statistics"
];

export default function CoachPage() {
  return (
    <div>
      <PageHeader eyebrow="Coach dashboard" title="Manage members with premium care" description="A role-protected coach workspace for assigned users, content, challenges, announcements, push notifications, and statistics." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {coachModules.map((module, index) => (
          <Card key={module}>
            {index % 3 === 0 ? <Users className="text-primary" /> : index % 3 === 1 ? <Video className="text-primary" /> : <Megaphone className="text-primary" />}
            <CardTitle className="mt-4">{module}</CardTitle>
            <p className="mt-2 text-muted">Create, review, assign, and measure this area through coach permissions.</p>
            <Button className="mt-5 w-full" variant="outline"><Send size={17} /> Open</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
