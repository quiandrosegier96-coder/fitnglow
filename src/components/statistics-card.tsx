import type { LucideIcon } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StatisticsCard({ title, value, trend, icon: Icon }: { title: string; value: string; trend: string; icon: LucideIcon }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-muted">{title}</p>
          <CardTitle className="mt-2">{value}</CardTitle>
        </div>
        <div className="rounded-2xl bg-secondary/45 p-3 text-primary">
          <Icon size={22} />
        </div>
      </div>
      <Badge className="mt-4">{trend}</Badge>
    </Card>
  );
}
