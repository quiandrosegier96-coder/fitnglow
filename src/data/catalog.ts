import {
  Award,
  Bike,
  CalendarDays,
  Dumbbell,
  Flame,
  HeartPulse,
  Leaf,
  Moon,
  Trophy,
  Utensils,
  Waves
} from "lucide-react";

export const metrics = [
  { label: "Current streak", value: "18 days", icon: Flame, tone: "text-primary" },
  { label: "Calories burned", value: "12,840", icon: HeartPulse, tone: "text-rose-500" },
  { label: "Weight progress", value: "-4.8 kg", icon: Waves, tone: "text-amber-600" },
  { label: "Level", value: "Glow 7", icon: Trophy, tone: "text-primary" }
];

export const workouts = [
  {
    title: "Rose Sculpt Lower Body",
    difficulty: "Intermediate",
    duration: "42 min",
    kcal: 380,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
    exercises: ["Glute bridge", "Bulgarian split squat", "Tempo squat", "Pilates finisher"]
  },
  {
    title: "Soft Power Upper Body",
    difficulty: "Beginner",
    duration: "31 min",
    kcal: 245,
    image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=900&q=80",
    exercises: ["Incline push-up", "Row", "Shoulder press", "Core hold"]
  },
  {
    title: "Glow HIIT Express",
    difficulty: "Advanced",
    duration: "24 min",
    kcal: 330,
    image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=900&q=80",
    exercises: ["Skater", "Mountain climber", "Jump squat", "Plank jack"]
  }
];

export const recipes = [
  {
    title: "Pink Protein Smoothie Bowl",
    category: "Breakfast",
    time: "12 min",
    calories: 410,
    protein: 34,
    carbs: 45,
    fat: 12,
    image: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=900&q=80",
    ingredients: ["Greek yogurt", "Raspberries", "Vanilla protein", "Chia", "Granola"]
  },
  {
    title: "Rosemary Salmon Glow Plate",
    category: "Dinner",
    time: "28 min",
    calories: 560,
    protein: 43,
    carbs: 38,
    fat: 24,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80",
    ingredients: ["Salmon", "Sweet potato", "Asparagus", "Lemon", "Rosemary"]
  },
  {
    title: "Cacao Recovery Dessert",
    category: "Desserts",
    time: "8 min",
    calories: 260,
    protein: 22,
    carbs: 24,
    fat: 9,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
    ingredients: ["Cacao", "Skyr", "Dates", "Sea salt", "Almond butter"]
  }
];

export const tips = [
  { title: "Hydration ritual", type: "Hydration", body: "Pair every coffee with a tall glass of mineral water.", icon: Waves },
  { title: "Sleep cue", type: "Sleep", body: "Dim lights 45 minutes before bed to make recovery easier.", icon: Moon },
  { title: "Mindset reset", type: "Mindset", body: "Choose the next elegant action, not the perfect plan.", icon: Leaf },
  { title: "Recovery walk", type: "Recovery", body: "A ten-minute walk after dinner supports digestion and calm.", icon: HeartPulse }
];

export const nutritionPlan = [
  { time: "07:30", meal: "Breakfast", title: "Protein smoothie bowl", calories: 410 },
  { time: "10:30", meal: "Snack", title: "Cottage cheese and berries", calories: 190 },
  { time: "13:00", meal: "Lunch", title: "Chicken quinoa glow salad", calories: 520 },
  { time: "16:00", meal: "Snack", title: "Matcha shake", calories: 220 },
  { time: "19:00", meal: "Dinner", title: "Salmon and sweet potato", calories: 560 }
];

export const progress = [
  { week: "W1", weight: 73, waist: 82 },
  { week: "W2", weight: 72.3, waist: 81 },
  { week: "W3", weight: 71.8, waist: 80 },
  { week: "W4", weight: 70.9, waist: 78.5 },
  { week: "W5", weight: 70.1, waist: 77.8 },
  { week: "W6", weight: 69.7, waist: 77 }
];

export const quickActions = [
  { href: "/workouts", label: "Start workout", icon: Dumbbell },
  { href: "/recipes", label: "Find recipe", icon: Utensils },
  { href: "/progress", label: "Log progress", icon: Bike },
  { href: "/tips", label: "Daily tip", icon: CalendarDays }
];

export const achievements = [
  { name: "14-day streak", progress: 100, icon: Award },
  { name: "Protein queen", progress: 76, icon: Utensils },
  { name: "Monthly challenge", progress: 58, icon: Trophy }
];

export const communityPosts = [
  { name: "Mila", text: "Completed my first full month and finally feel strong again.", likes: 128 },
  { name: "Sofia", text: "The evening walks made my sleep score jump this week.", likes: 84 },
  { name: "Ava", text: "Shared my meal prep board with my coach and got a perfect adjustment.", likes: 96 }
];
