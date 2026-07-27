"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Eye, ImagePlus, Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { workoutLibrary } from "@/data/workouts";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export function AdminWorkoutBuilder() {
  const [items, setItems] = useState(workoutLibrary[0].exercises);
  const { toast } = useToast();

  function move(index: number, direction: -1 | 1) {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardTitle>Create workout</CardTitle>
        <form className="mt-5 space-y-3">
          <Input placeholder="Workout title" defaultValue="Rose Sculpt Lower Body" />
          <Input placeholder="Coach name" defaultValue="Mila Hart" />
          <Input placeholder="Duration minutes" defaultValue="42" inputMode="numeric" />
          <Input placeholder="Estimated calories" defaultValue="380" inputMode="numeric" />
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline"><ImagePlus size={17} /> Cover</Button>
            <Button type="button" variant="outline"><UploadCloud size={17} /> Videos</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline"><Eye size={17} /> Preview</Button>
            <Button type="button" onClick={() => toast({ title: "Workout saved", description: "Draft validation and role checks passed." })}>Publish</Button>
          </div>
        </form>
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Exercise order</CardTitle>
          <Button variant="outline"><Plus size={17} /> Add exercise</Button>
        </div>
        <div className="mt-5 space-y-3">
          {items.map((exercise, index) => (
            <div key={exercise.id} className="flex flex-col gap-3 rounded-[1.25rem] bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge>#{index + 1}</Badge>
                <p className="mt-2 font-bold">{exercise.name}</p>
                <p className="text-sm text-muted">{exercise.sets} sets · {exercise.repetitions} · {exercise.restSeconds}s rest</p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" onClick={() => move(index, -1)}><ArrowUp size={16} /></Button>
                <Button size="icon" variant="outline" onClick={() => move(index, 1)}><ArrowDown size={16} /></Button>
                <Button size="icon" variant="outline"><Pencil size={16} /></Button>
                <Button size="icon" variant="outline"><Copy size={16} /></Button>
                <Button size="icon" variant="outline"><Trash2 size={16} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
