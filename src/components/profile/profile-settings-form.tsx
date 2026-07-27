"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, Loader2, Mail, Save, ShieldCheck, Sparkles, Upload, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type ProfilePayload = {
  auth: { id: string; email: string; emailVerified: boolean; createdAt: string };
  profile: {
    full_name: string;
    avatar_url: string | null;
    email: string | null;
    goal: string | null;
    date_of_birth: string | null;
    height_cm: number | null;
  } | null;
  bodyProfile: {
    first_name: string | null;
    last_name: string | null;
    gender: string | null;
    date_of_birth: string | null;
    country: string | null;
    preferred_language: string | null;
    height_cm: number | null;
    target_weight_kg: number | null;
    onboarding_completed: boolean | null;
  } | null;
  roles: string[];
  settings: {
    theme: string | null;
    language: string | null;
    push_enabled: boolean | null;
    email_enabled: boolean | null;
    community_visibility: string | null;
  } | null;
};

type FormState = {
  fullName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  goal: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  preferredLanguage: string;
  heightCm: string;
  targetWeightKg: string;
};

export function ProfileSettingsForm() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const response = await fetch("/api/profile", { credentials: "same-origin" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Profiel kon niet geladen worden.");
      setProfile(payload);
      setForm(toFormState(payload));
    } catch (error) {
      toast({ title: "Profiel laden mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          firstName: form.firstName,
          lastName: form.lastName,
          avatarUrl: form.avatarUrl,
          goal: form.goal,
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender,
          country: form.country,
          preferredLanguage: form.preferredLanguage,
          heightCm: form.heightCm ? Number(form.heightCm) : null,
          targetWeightKg: form.targetWeightKg ? Number(form.targetWeightKg) : null
        })
      });
      const payload = await response.json().catch(() => ({ error: "Profiel kon niet opgeslagen worden." }));
      if (!response.ok) throw new Error(payload.error ?? "Profiel kon niet opgeslagen worden.");
      toast({ title: "Profiel opgeslagen", description: "Je gegevens zijn bijgewerkt." });
      await loadProfile();
    } catch (error) {
      toast({ title: "Opslaan mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    const supabase = createClient();
    if (!supabase) {
      toast({ title: "Upload mislukt", description: "Supabase is niet ingesteld." });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Upload mislukt", description: "Kies een afbeelding." });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: "Upload mislukt", description: "Kies een foto kleiner dan 4 MB." });
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Log opnieuw in om een profielfoto te uploaden.");

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm((current) => ({ ...current, avatarUrl: data.publicUrl }));
      toast({ title: "Foto geupload", description: "Klik op Opslaan om deze profielfoto te bewaren." });
    } catch (error) {
      toast({
        title: "Upload mislukt",
        description: error instanceof Error ? error.message : "Run eerst supabase/sql/fix_profile_settings.sql in Supabase."
      });
    } finally {
      setUploading(false);
    }
  }

  const memberSince = useMemo(() => {
    if (!profile?.auth.createdAt) return "Onbekend";
    return new Date(profile.auth.createdAt).toLocaleDateString("nl-BE", { day: "2-digit", month: "long", year: "numeric" });
  }, [profile?.auth.createdAt]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-40 rounded-[24px] bg-secondary/20" />
      </Card>
    );
  }

  return (
    <form onSubmit={saveProfile} className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-r from-white via-[#fff8f9] to-[#fde8ef] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="relative w-fit">
              <Avatar src={form.avatarUrl ?? undefined} name={form.fullName || "Member"} className="h-28 w-28 text-4xl" />
              <label className="absolute bottom-0 right-0 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-primary text-white shadow-soft hover:bg-[#ef6e98]">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadAvatar(event.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge><UserRound size={14} /> Profiel</Badge>
                {profile?.auth.emailVerified && <Badge><CheckCircle2 size={14} /> E-mail geverifieerd</Badge>}
                {(profile?.roles ?? ["user"]).map((role) => (
                  <Badge key={role}><ShieldCheck size={14} /> {formatRole(role)}</Badge>
                ))}
              </div>
              <h2 className="mt-4 font-serif text-4xl font-extrabold">{form.fullName || "Fit & Glow member"}</h2>
              <p className="mt-2 text-sm font-semibold text-muted">Lid sinds {memberSince}</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-muted"><Mail size={15} /> {profile?.auth.email}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardTitle>Persoonlijke gegevens</CardTitle>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Volledige naam">
                <Input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required />
              </Field>
              <Field label="E-mail">
                <Input value={profile?.auth.email ?? ""} disabled />
              </Field>
              <Field label="Voornaam">
                <Input value={form.firstName} onChange={(event) => update("firstName", event.target.value)} />
              </Field>
              <Field label="Achternaam">
                <Input value={form.lastName} onChange={(event) => update("lastName", event.target.value)} />
              </Field>
              <Field label="Geboortedatum">
                <Input type="date" value={form.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} />
              </Field>
              <Field label="Gender">
                <select className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-primary/45 focus:ring-4 focus:ring-primary/10" value={form.gender} onChange={(event) => update("gender", event.target.value)}>
                  <option value="female">Vrouw</option>
                  <option value="male">Man</option>
                  <option value="non_binary">Non-binair</option>
                  <option value="prefer_not_to_say">Zeg ik liever niet</option>
                </select>
              </Field>
              <Field label="Land">
                <Input value={form.country} onChange={(event) => update("country", event.target.value)} placeholder="Belgie" />
              </Field>
              <Field label="Taal">
                <select className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-primary/45 focus:ring-4 focus:ring-primary/10" value={form.preferredLanguage} onChange={(event) => update("preferredLanguage", event.target.value)}>
                  <option value="Dutch">Nederlands</option>
                  <option value="English">Engels</option>
                  <option value="French">Frans</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card>
            <CardTitle>Body profile</CardTitle>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Lengte in cm">
                <Input inputMode="decimal" value={form.heightCm} onChange={(event) => update("heightCm", event.target.value)} min={80} max={250} />
              </Field>
              <Field label="Streefgewicht in kg">
                <Input inputMode="decimal" value={form.targetWeightKg} onChange={(event) => update("targetWeightKg", event.target.value)} min={25} max={350} />
              </Field>
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardTitle>Doel</CardTitle>
            <textarea
              className="mt-5 min-h-36 w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm outline-none placeholder:text-muted/65 focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
              value={form.goal}
              onChange={(event) => update("goal", event.target.value)}
              placeholder="Waar wil je de komende weken aan werken?"
              maxLength={180}
            />
          </Card>

          <Card>
            <CardTitle>Profielstatus</CardTitle>
            <div className="mt-5 space-y-3 text-sm">
              <InfoRow label="Onboarding" value={profile?.bodyProfile?.onboarding_completed ? "Voltooid" : "Nog niet voltooid"} />
              <InfoRow label="Thema" value={profile?.settings?.theme ?? "Systeem"} />
              <InfoRow label="Push" value={profile?.settings?.push_enabled === false ? "Uit" : "Aan"} />
              <InfoRow label="E-mail" value={profile?.settings?.email_enabled === false ? "Uit" : "Aan"} />
              <InfoRow label="Privacy" value={profile?.settings?.community_visibility ?? "members"} />
            </div>
          </Card>

          <Button type="submit" className="w-full" disabled={saving || uploading}>
            {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
            Profiel opslaan
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>
            <Upload size={17} />
            Profielfoto kiezen
          </Button>
        </aside>
      </div>
    </form>
  );

  function update(key: keyof FormState, value: string | null) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

const emptyForm: FormState = {
  fullName: "",
  firstName: "",
  lastName: "",
  avatarUrl: null,
  goal: "",
  dateOfBirth: "",
  gender: "prefer_not_to_say",
  country: "",
  preferredLanguage: "Dutch",
  heightCm: "",
  targetWeightKg: ""
};

function toFormState(payload: ProfilePayload): FormState {
  const fullName = payload.profile?.full_name || payload.auth.email?.split("@")[0] || "";
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    fullName,
    firstName: payload.bodyProfile?.first_name || parts[0] || "",
    lastName: payload.bodyProfile?.last_name || parts.slice(1).join(" "),
    avatarUrl: payload.profile?.avatar_url ?? null,
    goal: payload.profile?.goal ?? "",
    dateOfBirth: payload.bodyProfile?.date_of_birth || payload.profile?.date_of_birth || "",
    gender: payload.bodyProfile?.gender || "prefer_not_to_say",
    country: payload.bodyProfile?.country || "",
    preferredLanguage: payload.bodyProfile?.preferred_language || payload.settings?.language || "Dutch",
    heightCm: payload.bodyProfile?.height_cm ? String(payload.bodyProfile.height_cm) : payload.profile?.height_cm ? String(payload.profile.height_cm) : "",
    targetWeightKg: payload.bodyProfile?.target_weight_kg ? String(payload.bodyProfile.target_weight_kg) : ""
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-muted">{label}</span>
      {children}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-background p-3">
      <span className="font-semibold text-muted">{label}</span>
      <span className="font-extrabold">{value}</span>
    </div>
  );
}

function formatRole(role: string) {
  if (role === "administrator") return "Administrator";
  if (role === "coach") return "Coach";
  return "Member";
}
