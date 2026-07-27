import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";

export function TipCard({ title, type, body, icon: Icon }: { title: string; type: string; body: string; icon: LucideIcon }) {
  return (
    <Card className="hover:-translate-y-1">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/45 text-primary">
        <Icon size={22} />
      </div>
      <Badge>{type}</Badge>
      <CardTitle className="mt-3">{title}</CardTitle>
      <p className="mt-3 leading-7 text-muted">{body}</p>
    </Card>
  );
}
