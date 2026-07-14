import { Crown, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  return (
    <div>
      <PageHeader eyebrow="Profile" title="Joyce’s member profile" description="Goals, role, contact details, badges, notification preferences, and coaching access live here." />
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 place-items-center rounded-full rose-gold text-4xl font-black text-white">J</div>
          <div className="flex-1">
            <CardTitle>Joyce Premium</CardTitle>
            <p className="mt-2 text-muted">Fat loss, strength, recovery, and consistency.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge><Crown size={14} /> Coach enabled</Badge>
              <Badge><ShieldCheck size={14} /> User role</Badge>
              <Badge><Sparkles size={14} /> Glow level 7</Badge>
              <Badge><Mail size={14} /> Verified email</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
