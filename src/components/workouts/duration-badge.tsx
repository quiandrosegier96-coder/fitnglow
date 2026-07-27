import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DurationBadge({ minutes }: { minutes: number }) {
  return (
    <Badge className="inline-flex items-center gap-1 bg-card/85">
      <Clock3 size={14} /> {minutes} min
    </Badge>
  );
}
