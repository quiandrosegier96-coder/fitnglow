"use client";

import { Bell, Droplets, Dumbbell, Utensils } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";

const notifications = [
  { title: "Workout reminder", body: "Rose Sculpt starts at 18:30.", icon: Dumbbell },
  { title: "Water reminder", body: "Drink 400ml before dinner.", icon: Droplets },
  { title: "Nutrition reminder", body: "Protein snack is scheduled now.", icon: Utensils }
];

export function NotificationCenter() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button size="icon" variant="ghost" aria-label="Notifications">
          <Bell size={18} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" className="z-50 mt-3 w-80 rounded-[1.5rem] border border-primary/10 bg-card p-3 shadow-2xl">
          <p className="px-2 py-2 font-serif text-xl font-bold">Notifications</p>
          {notifications.map((item) => (
            <DropdownMenu.Item key={item.title} className="flex cursor-default gap-3 rounded-2xl p-3 outline-none hover:bg-secondary/25">
              <item.icon className="mt-1 text-primary" size={18} />
              <div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs text-muted">{item.body}</p>
              </div>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
