"use client";

import { useEffect, useState } from "react";
import { Activity, CalendarDays, Droplets, Dumbbell, Scale, Target, Utensils } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

type DashboardProfile = {
  currentWeight: number;
  targetWeight: number;
  bmi: number;
  bmiCategory: string;
  healthyWeightRange: string;
  fitnessLevel: string;
  mealsPerDay: string;
  waterIntake: string;
  workoutFrequency: string;
  goal: string;
  currentStreak: number;
  daysUntilTarget: number;
  progressPercentage: number;
};

export function BodyProfileSummary() {
  const [profile, setProfile] = useState<DashboardProfile | null>(null);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setProfile(payload?.dashboard ?? null))
      .catch(() => undefined);
  }, []);

  if (!profile) return null;

  const cards = [
    { label: "Current Weight", value: `${profile.currentWeight} kg`, icon: Scale },
    { label: "Target Weight", value: `${profile.targetWeight} kg`, icon: Target },
    { label: "BMI", value: String(profile.bmi), icon: Activity },
    { label: "BMI Category", value: profile.bmiCategory, icon: Activity },
    { label: "Healthy Range", value: profile.healthyWeightRange, icon: Scale },
    { label: "Fitness Level", value: profile.fitnessLevel, icon: Dumbbell },
    { label: "Meals per day", value: profile.mealsPerDay, icon: Utensils },
    { label: "Water intake", value: profile.waterIntake, icon: Droplets },
    { label: "Workout frequency", value: profile.workoutFrequency, icon: CalendarDays },
    { label: "Goal", value: profile.goal, icon: Target },
    { label: "Current streak", value: `${profile.currentStreak} days`, icon: CalendarDays },
    { label: "Days until target", value: `${profile.daysUntilTarget}`, icon: Target }
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge>Body Profile</Badge>
          <CardTitle className="mt-3">Your personal baseline</CardTitle>
        </div>
        <div className="min-w-64">
          <div className="mb-2 flex justify-between text-sm font-bold text-muted">
            <span>Progress to goal</span>
            <span>{profile.progressPercentage}%</span>
          </div>
          <ProgressBar value={profile.progressPercentage} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.label} className="hover:-translate-y-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-muted">{item.label}</p>
                <p className="mt-2 text-2xl font-black">{item.value}</p>
              </div>
              <div className="rounded-2xl bg-secondary/45 p-3 text-primary">
                <item.icon size={21} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
