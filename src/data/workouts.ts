export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type WorkoutExercise = {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  image: string;
  videoUrl: string;
  sets: number;
  repetitions: string;
  restSeconds: number;
  weight?: string;
  muscleGroup: string;
  difficulty: Difficulty;
  notes: string;
};

export type Workout = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  coverImage: string;
  coach: string;
  durationMinutes: number;
  difficulty: Difficulty;
  estimatedCalories: number;
  equipment: string[];
  muscleGroups: string[];
  favorite: boolean;
  rating: number;
  ratingCount: number;
  completedCount: number;
  goalTags: string[];
  exercises: WorkoutExercise[];
};

export const workoutCategories = ["Sculpt", "Strength", "Pilates", "HIIT", "Mobility", "Recovery"];
export const muscleGroups = ["Glutes", "Legs", "Core", "Upper body", "Full body", "Back", "Shoulders"];
export const durationFilters = ["Under 20", "20-35", "35-50", "50+"];
export const difficultyFilters: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

export const workoutLibrary: Workout[] = [
  {
    id: "rose-sculpt-lower-body",
    slug: "rose-sculpt-lower-body",
    title: "Rose Sculpt Lower Body",
    description:
      "A controlled lower-body strength session built around glutes, legs, tempo work, and a Pilates-inspired finisher.",
    category: "Sculpt",
    coverImage: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=85",
    coach: "Mila Hart",
    durationMinutes: 42,
    difficulty: "Intermediate",
    estimatedCalories: 380,
    equipment: ["Mat", "Medium dumbbells", "Resistance band"],
    muscleGroups: ["Glutes", "Legs", "Core"],
    favorite: true,
    rating: 4.9,
    ratingCount: 842,
    completedCount: 12840,
    goalTags: ["Strength", "Tone", "Fat loss"],
    exercises: [
      {
        id: "banded-glute-bridge",
        name: "Banded Glute Bridge",
        description: "A focused glute activation move that sets up the rest of the session.",
        instructions: ["Place the band above your knees.", "Drive through your heels.", "Pause at the top and lower with control."],
        image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/banded-glute-bridge",
        sets: 3,
        repetitions: "15 reps",
        restSeconds: 35,
        weight: "Bodyweight",
        muscleGroup: "Glutes",
        difficulty: "Beginner",
        notes: "Keep ribs stacked over hips."
      },
      {
        id: "bulgarian-split-squat",
        name: "Bulgarian Split Squat",
        description: "A unilateral strength exercise for glutes, quads, and balance.",
        instructions: ["Set rear foot on a bench.", "Lower until front thigh is near parallel.", "Press up without bouncing."],
        image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/bulgarian-split-squat",
        sets: 4,
        repetitions: "10 each side",
        restSeconds: 50,
        weight: "2 x 8-12kg",
        muscleGroup: "Legs",
        difficulty: "Intermediate",
        notes: "Use a shorter stance to bias quads, longer stance for glutes."
      },
      {
        id: "tempo-squat",
        name: "Tempo Goblet Squat",
        description: "A slow eccentric squat designed to build strength and position.",
        instructions: ["Hold one dumbbell at chest.", "Lower for three counts.", "Stand tall and squeeze glutes."],
        image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/tempo-goblet-squat",
        sets: 4,
        repetitions: "12 reps",
        restSeconds: 45,
        weight: "12-18kg",
        muscleGroup: "Legs",
        difficulty: "Intermediate",
        notes: "Keep knees tracking over toes."
      },
      {
        id: "pilates-pulse-finisher",
        name: "Pilates Pulse Finisher",
        description: "A short burn sequence for glute endurance and control.",
        instructions: ["Move with small range.", "Keep constant tension.", "Breathe steadily through the burn."],
        image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/pilates-pulse-finisher",
        sets: 2,
        repetitions: "45 seconds",
        restSeconds: 30,
        muscleGroup: "Glutes",
        difficulty: "Intermediate",
        notes: "This should feel spicy but controlled."
      }
    ]
  },
  {
    id: "soft-power-upper-body",
    slug: "soft-power-upper-body",
    title: "Soft Power Upper Body",
    description: "A graceful upper-body workout for posture, shoulders, back, arms, and core support.",
    category: "Strength",
    coverImage: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=1400&q=85",
    coach: "Ava Stone",
    durationMinutes: 31,
    difficulty: "Beginner",
    estimatedCalories: 245,
    equipment: ["Light dumbbells", "Mat"],
    muscleGroups: ["Upper body", "Back", "Shoulders", "Core"],
    favorite: false,
    rating: 4.8,
    ratingCount: 516,
    completedCount: 9840,
    goalTags: ["Posture", "Strength", "Beginner"],
    exercises: [
      {
        id: "incline-push-up",
        name: "Incline Push-Up",
        description: "A joint-friendly pushing pattern for chest, triceps, and core.",
        instructions: ["Hands under shoulders.", "Lower chest toward the surface.", "Press away and keep hips steady."],
        image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/incline-push-up",
        sets: 3,
        repetitions: "10 reps",
        restSeconds: 40,
        muscleGroup: "Upper body",
        difficulty: "Beginner",
        notes: "Use a higher surface if form breaks."
      },
      {
        id: "supported-row",
        name: "Supported Dumbbell Row",
        description: "Back and posture work with stable support.",
        instructions: ["Brace one hand on a bench.", "Pull elbow toward hip.", "Lower slowly."],
        image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/supported-row",
        sets: 3,
        repetitions: "12 each side",
        restSeconds: 40,
        weight: "6-10kg",
        muscleGroup: "Back",
        difficulty: "Beginner",
        notes: "Avoid shrugging at the top."
      },
      {
        id: "half-kneeling-press",
        name: "Half-Kneeling Shoulder Press",
        description: "A shoulder press variation that trains core control.",
        instructions: ["Kneel tall.", "Press weight overhead.", "Lower to shoulder with control."],
        image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/half-kneeling-press",
        sets: 3,
        repetitions: "10 each side",
        restSeconds: 45,
        weight: "4-8kg",
        muscleGroup: "Shoulders",
        difficulty: "Beginner",
        notes: "Keep ribs down as the arm presses."
      }
    ]
  },
  {
    id: "glow-hiit-express",
    slug: "glow-hiit-express",
    title: "Glow HIIT Express",
    description: "A fast, athletic conditioning workout with short intervals, strong music energy, and a sharp finish.",
    category: "HIIT",
    coverImage: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1400&q=85",
    coach: "Noor Vale",
    durationMinutes: 24,
    difficulty: "Advanced",
    estimatedCalories: 330,
    equipment: ["Mat"],
    muscleGroups: ["Full body", "Core", "Legs"],
    favorite: true,
    rating: 4.7,
    ratingCount: 1104,
    completedCount: 15420,
    goalTags: ["Conditioning", "Fat loss", "Energy"],
    exercises: [
      {
        id: "skater-hop",
        name: "Skater Hop",
        description: "A lateral power movement for legs and conditioning.",
        instructions: ["Push side to side.", "Land softly.", "Keep chest proud."],
        image: "https://images.unsplash.com/photo-1518609571773-39b7d303a87b?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/skater-hop",
        sets: 4,
        repetitions: "35 seconds",
        restSeconds: 25,
        muscleGroup: "Legs",
        difficulty: "Advanced",
        notes: "Step instead of hop for lower impact."
      },
      {
        id: "mountain-climber",
        name: "Mountain Climber",
        description: "A plank-based cardio exercise that lights up the core.",
        instructions: ["Stack shoulders over wrists.", "Drive knees forward.", "Keep hips low."],
        image: "https://images.unsplash.com/photo-1609899464726-209befaac5bc?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/mountain-climber",
        sets: 4,
        repetitions: "40 seconds",
        restSeconds: 25,
        muscleGroup: "Core",
        difficulty: "Advanced",
        notes: "Slow down if the lower back arches."
      },
      {
        id: "jump-squat",
        name: "Jump Squat",
        description: "Explosive lower-body power with a controlled landing.",
        instructions: ["Squat down.", "Jump tall.", "Land quietly into the next rep."],
        image: "https://images.unsplash.com/photo-1434596922112-19c563067271?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/jump-squat",
        sets: 4,
        repetitions: "30 seconds",
        restSeconds: 30,
        muscleGroup: "Full body",
        difficulty: "Advanced",
        notes: "Substitute air squats when needed."
      }
    ]
  },
  {
    id: "pilates-core-lift",
    slug: "pilates-core-lift",
    title: "Pilates Core Lift",
    description: "A refined core session for deep abdominal strength, posture, and waistline control.",
    category: "Pilates",
    coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=85",
    coach: "Elise Moon",
    durationMinutes: 36,
    difficulty: "Intermediate",
    estimatedCalories: 260,
    equipment: ["Mat", "Pilates ball"],
    muscleGroups: ["Core", "Glutes"],
    favorite: false,
    rating: 4.9,
    ratingCount: 704,
    completedCount: 7680,
    goalTags: ["Core", "Posture", "Tone"],
    exercises: [
      {
        id: "dead-bug-reach",
        name: "Dead Bug Reach",
        description: "A deep-core stability drill with controlled breathing.",
        instructions: ["Press low back gently down.", "Reach opposite arm and leg.", "Return without rushing."],
        image: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/dead-bug-reach",
        sets: 3,
        repetitions: "12 each side",
        restSeconds: 30,
        muscleGroup: "Core",
        difficulty: "Beginner",
        notes: "Exhale through each reach."
      },
      {
        id: "side-plank-lift",
        name: "Side Plank Lift",
        description: "Oblique strength and shoulder stability in one precise move.",
        instructions: ["Stack elbow under shoulder.", "Lift hips.", "Lower with control."],
        image: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=900&q=80",
        videoUrl: "https://example.com/videos/side-plank-lift",
        sets: 3,
        repetitions: "10 each side",
        restSeconds: 35,
        muscleGroup: "Core",
        difficulty: "Intermediate",
        notes: "Bend bottom knee to modify."
      }
    ]
  }
];

export const recentlyCompleted = [
  { workoutId: "soft-power-upper-body", date: "2026-07-12", durationMinutes: 33, calories: 252, completion: 100, pace: "Steady", notes: "Felt strong through rows." },
  { workoutId: "pilates-core-lift", date: "2026-07-10", durationMinutes: 34, calories: 238, completion: 92, pace: "Controlled", notes: "Repeat side planks next week." },
  { workoutId: "rose-sculpt-lower-body", date: "2026-07-08", durationMinutes: 44, calories: 392, completion: 100, pace: "Powerful", notes: "Increase goblet squat weight." }
];

export function getWorkoutBySlug(slug: string) {
  return workoutLibrary.find((workout) => workout.slug === slug);
}

export function getRelatedWorkouts(workout: Workout) {
  return workoutLibrary
    .filter((item) => item.id !== workout.id)
    .filter((item) => item.category === workout.category || item.muscleGroups.some((group) => workout.muscleGroups.includes(group)))
    .slice(0, 3);
}

export function getRecommendedWorkouts() {
  return [...workoutLibrary].sort((a, b) => b.rating - a.rating).slice(0, 3);
}
