export type BmiCategory = "Underweight" | "Healthy" | "Overweight" | "Obese";

export function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return Number.isFinite(age) && age > 0 ? age : 0;
}

export function calculateBmi(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return 0;
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function getHealthyWeightRange(heightCm: number) {
  if (!heightCm) return { min: 0, max: 0 };
  const heightMeters = heightCm / 100;
  return {
    min: Number((18.5 * heightMeters * heightMeters).toFixed(1)),
    max: Number((24.9 * heightMeters * heightMeters).toFixed(1))
  };
}

export function getWeightDifference(currentWeight: number, targetWeight: number) {
  return Number((targetWeight - currentWeight).toFixed(1));
}

export function getGoalProgress(currentWeight: number, targetWeight: number, startingWeight?: number) {
  if (!startingWeight || startingWeight === targetWeight) return 0;
  const total = Math.abs(startingWeight - targetWeight);
  const done = Math.abs(startingWeight - currentWeight);
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

export function estimateDaysUntilTarget(currentWeight: number, targetWeight: number) {
  const difference = Math.abs(currentWeight - targetWeight);
  if (!difference) return 0;
  return Math.ceil((difference / 0.5) * 7);
}
