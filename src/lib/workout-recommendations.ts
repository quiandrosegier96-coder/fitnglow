import { recentlyCompleted, workoutLibrary, type Difficulty, type Workout } from "@/data/workouts";

type RecommendationProfile = {
  goals: string[];
  preferredDifficulty: Difficulty;
  favoriteCategories: string[];
};

const defaultProfile: RecommendationProfile = {
  goals: ["Strength", "Tone", "Fat loss"],
  preferredDifficulty: "Intermediate",
  favoriteCategories: ["Sculpt", "Pilates"]
};

export function recommendWorkouts(profile: RecommendationProfile = defaultProfile): Workout[] {
  const completedIds = new Set(recentlyCompleted.map((item) => item.workoutId));

  return [...workoutLibrary]
    .map((workout) => {
      const goalScore = workout.goalTags.filter((tag) => profile.goals.includes(tag)).length * 3;
      const categoryScore = profile.favoriteCategories.includes(workout.category) ? 4 : 0;
      const difficultyScore = workout.difficulty === profile.preferredDifficulty ? 3 : 0;
      const freshnessScore = completedIds.has(workout.id) ? -2 : 2;
      return { workout, score: goalScore + categoryScore + difficultyScore + freshnessScore + workout.rating };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.workout)
    .slice(0, 4);
}
