import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateLevel } from "@/lib/dashboard-calculations";
import { UserMetricsService } from "@/lib/user-metrics-service";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json(emptyDashboard());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(emptyDashboard());

  const metrics = await new UserMetricsService(supabase).getDashboardMetrics(user.id);

  return NextResponse.json({
    ...metrics,
    quickActions: [
      { href: "/workouts", label: "Start Workout" },
      { href: "/recipes", label: "Recipes" },
      { href: "/progress", label: "Log Weight" },
      { href: "/tips", label: "Today's Tip" }
    ]
  });
}

function emptyDashboard() {
  const level = calculateLevel(0);
  return {
    currentWeight: 0,
    currentStreak: 0,
    calories: { today: 0, week: 0, month: 0, total: 0 },
    weightProgress: { startingWeight: 0, currentWeight: 0, difference: 0, trend: "Stable", trendDirection: "stable" },
    bmi: { bmi: 0, category: "Healthy", healthyRange: "Complete onboarding", targetWeight: 0, daysUntilTarget: 0, progressPercentage: 0 },
    level,
    quote: "Small precise actions become visible progress.",
    achievements: [],
    weightHistory: [],
    quickActions: [
      { href: "/workouts", label: "Start Workout" },
      { href: "/recipes", label: "Recipes" },
      { href: "/progress", label: "Log Weight" },
      { href: "/tips", label: "Today's Tip" }
    ],
    empty: { workouts: true, achievements: true, weight: true }
  };
}
