"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Save, Sparkles } from "lucide-react";
import {
  onboardingSchema,
  onboardingStepSchemas
} from "@/lib/schemas";
import { calculateAge } from "@/lib/body-profile";
import { BmiCard } from "@/components/onboarding/bmi-card";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";

type OnboardingValues = {
  firstName: string;
  lastName: string;
  gender: "female" | "male" | "non_binary" | "prefer_not_to_say";
  dateOfBirth: string;
  country: string;
  preferredLanguage: string;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  waistCm: number;
  chestCm: number;
  hipCm: number;
  bodyFatPercentage?: number;
  exerciseDaysPerWeek: string;
  averageWorkoutDuration: string;
  fitnessLevel: string;
  mainGoal: string;
  secondaryGoals: string[];
  healthyMealsPerDay: string;
  waterDaily: string;
  snacksPerDay: string;
  eatsBreakfast: boolean;
  drinksSoftDrinks: boolean;
  drinksAlcohol: boolean;
  usesSupplements: boolean;
  supplements: string[];
  averageSleep: string;
  stressLevel: string;
  occupation: string;
  dailyActivityLevel: string;
  smokes: boolean;
  vapes: boolean;
  injuries?: string;
  medicalLimitations?: string;
  foodAllergies?: string;
  dietPreference: string;
  motivationReason: string;
  motivationScore: number;
  onboardingStep: number;
  onboardingCompleted: boolean;
};

const storageKey = "fit-glow-onboarding";
const totalSteps = 7;

const defaults: OnboardingValues = {
  firstName: "",
  lastName: "",
  gender: "female",
  dateOfBirth: "",
  country: "Belgium",
  preferredLanguage: "Dutch",
  heightCm: 170,
  currentWeightKg: 70,
  targetWeightKg: 65,
  waistCm: 78,
  chestCm: 92,
  hipCm: 98,
  exerciseDaysPerWeek: "3 days",
  averageWorkoutDuration: "45 min",
  fitnessLevel: "Beginner",
  mainGoal: "Lose weight",
  secondaryGoals: ["Tone the body"],
  healthyMealsPerDay: "3",
  waterDaily: "1.5 - 2 L",
  snacksPerDay: "1",
  eatsBreakfast: true,
  drinksSoftDrinks: false,
  drinksAlcohol: false,
  usesSupplements: false,
  supplements: [],
  averageSleep: "7 - 8 hours",
  stressLevel: "Moderate",
  occupation: "",
  dailyActivityLevel: "Lightly active",
  smokes: false,
  vapes: false,
  injuries: "",
  medicalLimitations: "",
  foodAllergies: "",
  dietPreference: "None",
  motivationReason: "",
  motivationScore: 8,
  onboardingStep: 1,
  onboardingCompleted: false
};

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<OnboardingValues>(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const cached = window.localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached) as Partial<OnboardingValues>;
      setValues({ ...defaults, ...parsed });
      setStep(parsed.onboardingStep ?? 1);
    }
    fetch("/api/onboarding")
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (payload?.profile) {
          setValues({ ...defaults, ...payload.profile });
          setStep(payload.profile.onboardingStep ?? 1);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ ...values, onboardingStep: step }));
  }, [values, step]);

  const progress = useMemo(() => Math.round((step / totalSteps) * 100), [step]);

  function update<K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function toggleArray(key: "secondaryGoals" | "supplements", value: string) {
    setValues((current) => {
      const list = current[key];
      return { ...current, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });
  }

  async function save(nextStep = step, completed = false) {
    setSaving(true);
    setSaved(false);
    const payload = { ...values, onboardingStep: nextStep, onboardingCompleted: completed };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => undefined);
    setSaving(false);
    setSaved(true);
  }

  async function next() {
    const schema = onboardingStepSchemas[step - 1];
    const result = schema.safeParse(values);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    setErrors({});
    const nextStep = Math.min(totalSteps, step + 1);
    await save(nextStep);
    setStep(nextStep);
  }

  async function back() {
    const previous = Math.max(1, step - 1);
    await save(previous);
    setStep(previous);
  }

  async function complete() {
    const result = onboardingSchema.safeParse({ ...values, onboardingCompleted: true, onboardingStep: totalSteps });
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    await save(totalSteps, true);
    window.localStorage.removeItem(storageKey);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge>Step {step} of {totalSteps}</Badge>
            <h1 className="mt-3 font-serif text-4xl font-black sm:text-5xl">Create your Body Profile</h1>
            <p className="mt-2 max-w-2xl text-muted">Your dashboard unlocks after this premium intake is complete.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-muted">
            {saving ? <Loader2 className="animate-spin text-primary" size={18} /> : saved ? <Check className="text-primary" size={18} /> : <Save className="text-primary" size={18} />}
            {saving ? "Saving" : saved ? "Saved" : "Autosave ready"}
          </div>
        </div>
        <ProgressBar value={progress} className="mb-6" />
        <Card className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22 }}>
              {step === 1 && <PersonalStep values={values} update={update} errors={errors} />}
              {step === 2 && <BodyStep values={values} update={update} errors={errors} />}
              {step === 3 && <FitnessStep values={values} update={update} errors={errors} />}
              {step === 4 && <GoalsStep values={values} update={update} toggleArray={toggleArray} errors={errors} />}
              {step === 5 && <NutritionStep values={values} update={update} toggleArray={toggleArray} errors={errors} />}
              {step === 6 && <LifestyleStep values={values} update={update} errors={errors} />}
              {step === 7 && <MotivationStep values={values} update={update} errors={errors} />}
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-primary/10 pt-5 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={back} disabled={step === 1}><ArrowLeft size={17} /> Back</Button>
            {step === totalSteps ? (
              <Button onClick={complete}><Sparkles size={17} /> Complete onboarding</Button>
            ) : (
              <Button onClick={next}>Save and continue <ArrowRight size={17} /></Button>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

function PersonalStep({ values, update, errors }: StepProps) {
  const age = calculateAge(values.dateOfBirth);
  return (
    <Step title="Personal information" description="Tell us who you are so the platform can personalize your experience.">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="First name" value={values.firstName} onChange={(value) => update("firstName", value)} error={errors.firstName} />
        <TextField label="Last name" value={values.lastName} onChange={(value) => update("lastName", value)} error={errors.lastName} />
        <SelectField label="Gender" value={values.gender} options={["female", "male", "non_binary", "prefer_not_to_say"]} onChange={(value) => update("gender", value as OnboardingValues["gender"])} />
        <TextField label="Date of birth" type="date" value={values.dateOfBirth} onChange={(value) => update("dateOfBirth", value)} error={errors.dateOfBirth} />
        <TextField label="Country" value={values.country} onChange={(value) => update("country", value)} error={errors.country} />
        <SelectField label="Preferred language" value={values.preferredLanguage} options={["Dutch", "English", "French", "German"]} onChange={(value) => update("preferredLanguage", value)} />
      </div>
      <div className="mt-5 rounded-[1.5rem] bg-secondary/25 p-4 text-sm font-bold text-muted">Calculated age: {age || "Select date of birth"}</div>
    </Step>
  );
}

function BodyStep({ values, update, errors }: StepProps) {
  return (
    <Step title="Body profile" description="We calculate your BMI and healthy range immediately as you enter your details.">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Height (cm)" value={values.heightCm} onChange={(value) => update("heightCm", value)} error={errors.heightCm} />
          <NumberField label="Current weight (kg)" value={values.currentWeightKg} onChange={(value) => update("currentWeightKg", value)} error={errors.currentWeightKg} />
          <NumberField label="Target weight (kg)" value={values.targetWeightKg} onChange={(value) => update("targetWeightKg", value)} error={errors.targetWeightKg} />
          <NumberField label="Waist circumference (cm)" value={values.waistCm} onChange={(value) => update("waistCm", value)} error={errors.waistCm} />
          <NumberField label="Chest circumference (cm)" value={values.chestCm} onChange={(value) => update("chestCm", value)} error={errors.chestCm} />
          <NumberField label="Hip circumference (cm)" value={values.hipCm} onChange={(value) => update("hipCm", value)} error={errors.hipCm} />
          <NumberField label="Body fat % (optional)" value={values.bodyFatPercentage ?? 0} onChange={(value) => update("bodyFatPercentage", value || undefined)} error={errors.bodyFatPercentage} />
        </div>
        <BmiCard heightCm={values.heightCm} currentWeightKg={values.currentWeightKg} targetWeightKg={values.targetWeightKg} />
      </div>
    </Step>
  );
}

function FitnessStep({ values, update }: StepProps) {
  return (
    <Step title="Fitness level" description="We use this to set intensity, volume, and weekly rhythm.">
      <OptionGrid label="How many days do you exercise each week?" value={values.exerciseDaysPerWeek} options={["Never", "1 day", "2 days", "3 days", "4 days", "5 days", "6 days", "Every day"]} onChange={(value) => update("exerciseDaysPerWeek", value)} />
      <OptionGrid label="Average workout duration" value={values.averageWorkoutDuration} options={["15 min", "30 min", "45 min", "60 min", "90+ min"]} onChange={(value) => update("averageWorkoutDuration", value)} />
      <OptionGrid label="Current fitness level" value={values.fitnessLevel} options={["Beginner", "Intermediate", "Advanced", "Professional"]} onChange={(value) => update("fitnessLevel", value)} />
    </Step>
  );
}

function GoalsStep({ values, update, toggleArray, errors }: StepProps) {
  const goals = ["Lose weight", "Build muscle", "Stay healthy", "Improve endurance", "Become stronger", "Tone the body", "Gain weight", "General fitness"];
  return (
    <Step title="Goals" description="Choose one main goal and any supporting goals.">
      <OptionGrid label="What is your main goal?" value={values.mainGoal} options={goals} onChange={(value) => update("mainGoal", value)} />
      <MultiGrid label="Secondary goals" selected={values.secondaryGoals} options={goals.filter((goal) => goal !== values.mainGoal)} onToggle={(value) => toggleArray?.("secondaryGoals", value)} />
      {errors.secondaryGoals && <ErrorText message={errors.secondaryGoals} />}
    </Step>
  );
}

function NutritionStep({ values, update, toggleArray }: StepProps) {
  return (
    <Step title="Nutrition" description="Your food habits help shape meal-plan recommendations later.">
      <OptionGrid label="Healthy meals per day" value={values.healthyMealsPerDay} options={["0", "1", "2", "3", "4", "5+"]} onChange={(value) => update("healthyMealsPerDay", value)} />
      <OptionGrid label="Water intake daily" value={values.waterDaily} options={["< 1 L", "1 - 1.5 L", "1.5 - 2 L", "2 - 3 L", "3+ L"]} onChange={(value) => update("waterDaily", value)} />
      <OptionGrid label="Snacks per day" value={values.snacksPerDay} options={["0", "1", "2", "3", "4+"]} onChange={(value) => update("snacksPerDay", value)} />
      <BooleanGrid values={values} update={update} items={[["eatsBreakfast", "Eat breakfast"], ["drinksSoftDrinks", "Drink soft drinks"], ["drinksAlcohol", "Drink alcohol"], ["usesSupplements", "Use supplements"]]} />
      {values.usesSupplements && <MultiGrid label="Supplements" selected={values.supplements} options={["Protein", "Creatine", "Vitamins", "Omega 3", "Meal replacements", "Other"]} onToggle={(value) => toggleArray?.("supplements", value)} />}
    </Step>
  );
}

function LifestyleStep({ values, update, errors }: StepProps) {
  return (
    <Step title="Lifestyle" description="Recovery, stress, and medical context keep recommendations safer and more realistic.">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Average sleep" value={values.averageSleep} options={["< 5 hours", "5 - 6 hours", "6 - 7 hours", "7 - 8 hours", "8+ hours"]} onChange={(value) => update("averageSleep", value)} />
        <SelectField label="Stress level" value={values.stressLevel} options={["Low", "Moderate", "High", "Very high"]} onChange={(value) => update("stressLevel", value as OnboardingValues["stressLevel"])} />
        <TextField label="Occupation" value={values.occupation} onChange={(value) => update("occupation", value)} error={errors.occupation} />
        <SelectField label="Daily activity level" value={values.dailyActivityLevel} options={["Sedentary", "Lightly active", "Active", "Very active"]} onChange={(value) => update("dailyActivityLevel", value as OnboardingValues["dailyActivityLevel"])} />
        <SelectField label="Diet preference" value={values.dietPreference} options={["None", "Vegetarian", "Vegan", "Pescatarian", "Low Carb", "Keto", "Gluten Free", "Lactose Free", "Other"]} onChange={(value) => update("dietPreference", value as OnboardingValues["dietPreference"])} />
      </div>
      <BooleanGrid values={values} update={update} items={[["smokes", "Smoke"], ["vapes", "Vape"]]} />
      <div className="mt-4 grid gap-4">
        <Textarea label="Any injuries?" value={values.injuries ?? ""} onChange={(value) => update("injuries", value)} />
        <Textarea label="Medical limitations?" value={values.medicalLimitations ?? ""} onChange={(value) => update("medicalLimitations", value)} />
        <Textarea label="Food allergies?" value={values.foodAllergies ?? ""} onChange={(value) => update("foodAllergies", value)} />
      </div>
    </Step>
  );
}

function MotivationStep({ values, update, errors }: StepProps) {
  return (
    <Step title="Motivation" description="This becomes your anchor when the plan gets hard.">
      <Textarea label="Why do you want to reach your goal?" value={values.motivationReason} onChange={(value) => update("motivationReason", value)} error={errors.motivationReason} />
      <div className="mt-5">
        <label className="text-sm font-black text-muted">How motivated are you?</label>
        <div className="mt-3 rounded-[1.5rem] bg-secondary/25 p-4">
          <input className="w-full accent-primary" type="range" min={1} max={10} value={values.motivationScore} onChange={(event) => update("motivationScore", Number(event.target.value))} />
          <div className="mt-3 flex items-center justify-between text-sm font-bold text-muted"><span>1</span><span className="text-3xl text-primary">{values.motivationScore}</span><span>10</span></div>
        </div>
      </div>
    </Step>
  );
}

type StepProps = {
  values: OnboardingValues;
  update: <K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) => void;
  toggleArray?: (key: "secondaryGoals" | "supplements", value: string) => void;
  errors: Record<string, string>;
};

function Step({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section>
      <CardTitle>{title}</CardTitle>
      <p className="mt-2 max-w-2xl text-muted">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function TextField({ label, value, onChange, error, type = "text" }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-muted">{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <ErrorText message={error} />}
    </label>
  );
}

function NumberField({ label, value, onChange, error }: { label: string; value: number; onChange: (value: number) => void; error?: string }) {
  return <TextField label={label} value={value ? String(value) : ""} onChange={(next) => onChange(Number(next))} error={error} type="number" />;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-muted">{label}</span>
      <select className="h-12 w-full rounded-2xl border border-primary/15 bg-card px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function OptionGrid({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="mb-6">
      <p className="mb-3 text-sm font-black text-muted">{label}</p>
      <div className="grid gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-2xl border px-4 py-3 text-sm font-bold ${value === option ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-primary/15 bg-card hover:bg-secondary/30"}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiGrid({ label, selected, options, onToggle }: { label: string; selected: string[]; options: string[]; onToggle?: (value: string) => void }) {
  return (
    <div className="mb-6">
      <p className="mb-3 text-sm font-black text-muted">{label}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onToggle?.(option)} className={`rounded-2xl border px-4 py-3 text-sm font-bold ${selected.includes(option) ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-primary/15 bg-card hover:bg-secondary/30"}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function BooleanGrid({ values, update, items }: { values: OnboardingValues; update: StepProps["update"]; items: Array<[keyof OnboardingValues, string]> }) {
  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-2">
      {items.map(([key, label]) => (
        <button key={String(key)} type="button" onClick={() => update(key, !values[key] as never)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold ${values[key] ? "border-primary bg-primary text-white" : "border-primary/15 bg-card hover:bg-secondary/30"}`}>
          {label}: {values[key] ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

function Textarea({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-muted">{label}</span>
      <textarea className="min-h-28 w-full rounded-2xl border border-primary/15 bg-card p-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <ErrorText message={error} />}
    </label>
  );
}

function ErrorText({ message }: { message: string }) {
  return <p className="mt-2 rounded-2xl bg-primary/10 p-3 text-sm font-semibold text-primary">{message}</p>;
}
