import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <Card className="group hover:-translate-y-1">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">{label}</p>
          <p className="mt-2 text-3xl font-extrabold">{value}</p>
        </div>
        <div className="rounded-2xl bg-secondary/45 p-3">
          <Icon className={cn("h-6 w-6", tone)} />
        </div>
      </div>
    </Card>
  );
}
