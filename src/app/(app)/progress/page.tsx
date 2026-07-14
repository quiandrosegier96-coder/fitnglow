import { Camera, Download, LineChart } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressChart } from "@/components/progress-chart";

export default function ProgressPage() {
  return (
    <div>
      <PageHeader eyebrow="Progress" title="Measure what matters, beautifully" description="Track weight, body fat, waist, chest, arms, legs, photos, weekly reports, charts, and statistics." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Trend chart</CardTitle>
            <LineChart className="text-primary" />
          </div>
          <ProgressChart />
        </Card>
        <Card>
          <CardTitle>Log today</CardTitle>
          <form className="mt-5 space-y-3">
            <Input placeholder="Weight (kg)" inputMode="decimal" />
            <Input placeholder="Body fat %" inputMode="decimal" />
            <Input placeholder="Waist (cm)" inputMode="decimal" />
            <Button className="w-full">Save progress</Button>
          </form>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline"><Camera size={17} /> Photos</Button>
            <Button variant="outline"><Download size={17} /> Report</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
