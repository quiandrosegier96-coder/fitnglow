"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Edit3, ImageIcon, Loader2, Plus, Save, Upload, Video, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { createClientId } from "@/lib/client-id";

type DailyChallenge = {
  id: string;
  title: string;
  description: string | null;
  coach_name: string;
  challenge_date: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  is_published: boolean;
};

export function DailyChallengeManager() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coachName, setCoachName] = useState("Joyce");
  const [challengeDate, setChallengeDate] = useState(todayKey());
  const [durationMinutes, setDurationMinutes] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [editingChallenge, setEditingChallenge] = useState<DailyChallenge | null>(null);

  const previewUrl = useMemo(() => (videoFile ? URL.createObjectURL(videoFile) : null), [videoFile]);
  const coverPreviewUrl = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : editingChallenge?.thumbnail_url ?? null), [coverFile, editingChallenge?.thumbnail_url]);

  useEffect(() => {
    loadChallenges().catch(() => undefined);
  }, []);

  async function loadChallenges() {
    const response = await fetch("/api/admin/daily-challenges", { credentials: "same-origin" });
    const payload = await response.json().catch(() => ({ challenges: [] }));
    if (response.ok) setChallenges(payload.challenges ?? []);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingChallenge && !videoFile) {
      toast({ title: "Video ontbreekt", description: "Kies eerst de video challenge die je wil publiceren." });
      return;
    }
    if (!editingChallenge && !coverFile) {
      toast({ title: "Omslagfoto ontbreekt", description: "Upload een unieke omslagfoto voor deze challenge." });
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase is niet ingesteld.");
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Je sessie is verlopen. Log opnieuw in en probeer daarna opnieuw.");

      const videoUrl = videoFile ? await uploadFile(supabase, videoFile, `videos/${challengeDate}`) : editingChallenge?.video_url;
      const thumbnailUrl = coverFile ? await uploadFile(supabase, coverFile, `covers/${challengeDate}`) : editingChallenge?.thumbnail_url;
      if (!videoUrl || !thumbnailUrl) throw new Error("Video en omslagfoto zijn verplicht.");

      const response = await fetch("/api/admin/daily-challenges", {
        method: editingChallenge ? "PUT" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingChallenge?.id,
          title,
          description,
          coachName,
          challengeDate,
          videoUrl,
          thumbnailUrl,
          durationMinutes: durationMinutes ? Number(durationMinutes) : null,
          isPublished: true
        })
      });
      const payload = await response.json().catch(() => ({ error: "Challenge kon niet worden opgeslagen." }));
      if (!response.ok) throw new Error(payload.error ?? "Challenge kon niet worden opgeslagen.");

      toast({
        title: editingChallenge ? "Challenge bijgewerkt" : "Challenge gepubliceerd",
        description: editingChallenge
          ? "De wijzigingen zijn opgeslagen voor de gekozen datum."
          : `Deze challenge wordt op ${formatChallengeDate(challengeDate)} zichtbaar voor alle gebruikers.`
      });
      resetForm();
      await loadChallenges();
    } catch (error) {
      toast({ title: editingChallenge ? "Bewerken mislukt" : "Upload mislukt", description: error instanceof Error ? error.message : "Probeer opnieuw." });
    } finally {
      setSaving(false);
    }
  }

  function startEditing(challenge: DailyChallenge) {
    setEditingChallenge(challenge);
    setTitle(challenge.title);
    setDescription(challenge.description ?? "");
    setCoachName(challenge.coach_name);
    setChallengeDate(challenge.challenge_date);
    setDurationMinutes(challenge.duration_minutes ? String(challenge.duration_minutes) : "");
    setVideoFile(null);
    setCoverFile(null);
  }

  function resetForm() {
    setEditingChallenge(null);
    setTitle("");
    setDescription("");
    setCoachName("Joyce");
    setChallengeDate(todayKey());
    setDurationMinutes("");
    setVideoFile(null);
    setCoverFile(null);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Card>
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/35 text-primary">
            <Video size={22} />
          </div>
          <div>
            <CardTitle>{editingChallenge ? "Challenge bewerken" : "Dagelijkse video challenge"}</CardTitle>
            <p className="mt-1 text-sm font-medium leading-6 text-muted">
              {editingChallenge
                ? "Pas titel, info, datum, cover of video aan. Alleen Joyce kan dit beheren."
                : "Plan meerdere challenges vooruit. Gebruikers zien elke challenge pas op de datum die jij kiest."}
            </p>
          </div>
        </div>

        {editingChallenge && (
          <div className="mb-5 flex flex-col gap-3 rounded-[24px] bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-primary">Je bewerkt nu een bestaande challenge</p>
              <p className="mt-1 text-sm font-semibold text-muted">{editingChallenge.title}</p>
            </div>
            <Button type="button" variant="outline" onClick={resetForm}>
              <X size={16} />
              Annuleer
            </Button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titel">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} maxLength={120} placeholder="Bijv. 10 min core burn" />
            </Field>
            <Field label="Datum">
              <Input type="date" value={challengeDate} onChange={(event) => setChallengeDate(event.target.value)} required />
            </Field>
            <Field label="Coach">
              <Input value={coachName} onChange={(event) => setCoachName(event.target.value)} required minLength={2} maxLength={80} />
            </Field>
            <Field label="Duur in minuten">
              <Input inputMode="numeric" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} placeholder="Bijv. 12" />
            </Field>
          </div>

          <Field label="Beschrijving">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={700}
              rows={4}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted/65 focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
              placeholder="Korte uitleg of motivatie voor vandaag..."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <FileField label={editingChallenge ? "Nieuwe video optioneel" : "Video challenge"} accept="video/mp4,video/quicktime,video/webm" file={videoFile} onChange={setVideoFile} />
            <FileField label={editingChallenge ? "Nieuwe omslagfoto optioneel" : "Omslagfoto verplicht"} accept="image/jpeg,image/png,image/webp" file={coverFile} onChange={setCoverFile} icon={<ImageIcon size={17} />} />
          </div>

          {coverPreviewUrl && (
            <div className="overflow-hidden rounded-[24px] border border-border">
              <div className="relative h-56 bg-[#1f1f1f]">
                <img src={coverPreviewUrl} alt="Omslagfoto preview" className="h-full w-full object-cover" />
                <span className="absolute right-4 top-4 rounded-2xl bg-black/35 px-4 py-2 text-sm font-black text-white backdrop-blur">
                  {durationMinutes ? `${durationMinutes} min` : "Vandaag"}
                </span>
              </div>
            </div>
          )}

          {previewUrl && (
            <div className="overflow-hidden rounded-[24px] border border-border bg-[#1f1f1f]">
              <video src={previewUrl} controls className="max-h-[520px] w-full object-contain" />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? <Loader2 className="animate-spin" size={17} /> : editingChallenge ? <Save size={17} /> : <Upload size={17} />}
              {editingChallenge ? "Wijzigingen opslaan" : "Publiceer challenge"}
            </Button>
            {!editingChallenge && (
              <Button type="button" variant="outline" onClick={resetForm}>
                <Plus size={16} />
                Leegmaken
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle className="text-xl">Geplande challenges</CardTitle>
        <div className="mt-5 space-y-3">
          {!challenges.length ? (
            <p className="rounded-2xl bg-secondary/20 p-4 text-sm font-semibold text-muted">Nog geen video challenges geupload.</p>
          ) : (
            challenges.map((challenge) => (
              <div key={challenge.id} className="rounded-2xl border border-border bg-background p-4">
                {challenge.thumbnail_url && <img src={challenge.thumbnail_url} alt={challenge.title} className="mb-3 h-28 w-full rounded-2xl object-cover" />}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold">{challenge.title}</p>
                    {challenge.duration_minutes && <p className="mt-1 text-xs font-bold text-muted">{challenge.duration_minutes} min</p>}
                  </div>
                  <Badge className={challenge.is_published ? "bg-emerald-50 text-emerald-800" : ""}>{challenge.is_published ? "Live" : "Draft"}</Badge>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted">
                  <CalendarDays size={15} /> {new Date(challenge.challenge_date).toLocaleDateString("nl-BE")}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => startEditing(challenge)} className="mt-3 w-full">
                  <Edit3 size={15} />
                  Bewerk
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-muted">{label}</span>
      {children}
    </label>
  );
}

function FileField({
  label,
  accept,
  file,
  onChange,
  icon
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block rounded-[24px] border border-dashed border-primary/25 bg-secondary/10 p-4">
      <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-muted">
        {icon}
        {label}
      </span>
      <input type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0] ?? null)} className="block w-full text-sm font-semibold text-muted file:mr-4 file:rounded-2xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-bold file:text-white" />
      {file && <span className="mt-2 block truncate text-xs font-bold text-primary">{file.name}</span>}
    </label>
  );
}

async function uploadFile(supabase: NonNullable<ReturnType<typeof createClient>>, file: File, folder: string) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const path = `${folder}/${createClientId()}.${extension}`;
  const { error } = await supabase.storage.from("daily-challenges").upload(path, file, {
    cacheControl: "31536000",
    upsert: false
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("daily-challenges").getPublicUrl(path);
  return data.publicUrl;
}

function todayKey() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function formatChallengeDate(date: string) {
  return new Intl.DateTimeFormat("nl-BE", {
    timeZone: "Europe/Brussels",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${date}T12:00:00+02:00`));
}
