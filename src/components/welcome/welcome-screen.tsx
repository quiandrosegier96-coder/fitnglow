"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Loader2, Sprout, Trophy, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const values = [
  { title: "Persoonlijke begeleiding", icon: Heart },
  { title: "Gezonde levensstijl zonder extremen", icon: Sprout },
  { title: "Duurzame resultaten", icon: Trophy },
  { title: "Warme community", icon: UsersRound },
  { title: "Kleine gewoontes, grote verandering", icon: Heart },
  { title: "Samen groeien, stap voor stap", icon: Trophy }
];

export function WelcomeScreen({ firstName }: { firstName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  async function startJourney() {
    setSaving(true);
    const response = await fetch("/api/welcome/complete", {
      method: "POST",
      credentials: "same-origin"
    });
    setSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Kon je welkomscherm niet opslaan." }));
      toast({ title: "Niet opgeslagen", description: payload.error ?? "Probeer het nog eens." });
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[900px] items-center"
      >
        <Card className="w-full overflow-hidden p-0">
          <div className="p-6 sm:p-10 lg:p-12">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.28 }}>
              <h1 className="font-serif text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">Welkom, {firstName} 💕</h1>
              <div className="mt-6 space-y-4 text-base font-medium leading-8 text-muted sm:text-lg">
                <p>Welkom bij Fit & Glow.</p>
                <p>Leuk dat je hier bent!</p>
                <p>Door vandaag voor jezelf te kiezen, heb je al de eerste stap gezet naar een gezondere, energieker en gelukkigere versie van jezelf.</p>
                <p>Bij Fit & Glow draait het niet om perfect zijn.</p>
                <p>Het draait om kleine dagelijkse gewoontes die op lange termijn een groot verschil maken.</p>
                <p>Ik ben ontzettend blij dat ik jou op deze reis mag begeleiden.</p>
                <p>Samen werken we stap voor stap aan jouw persoonlijke doelen, op een manier die haalbaar is en vooral vol te houden is.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.16, duration: 0.28 }}
              className="my-8 rounded-[24px] bg-secondary/35 p-6 text-center"
            >
              <p className="font-serif text-2xl font-extrabold text-foreground sm:text-3xl">“Kleine gewoontes, grote verandering 🩷”</p>
            </motion.div>

            <section className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22, duration: 0.28 }}>
                <div className="relative mx-auto aspect-[4/5] max-w-[320px] overflow-hidden rounded-[24px] shadow-[0_18px_45px_rgba(111,72,84,0.12)]">
                  <Image src="/coach-joyce.jpg" alt="Joyce, coach en oprichtster van Fit & Glow" fill sizes="(max-width: 768px) 85vw, 320px" className="object-cover" priority />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.26, duration: 0.28 }}>
                <CardTitle className="text-3xl">Hey, ik ben Joyce! 👋</CardTitle>
                <div className="mt-4 space-y-4 text-sm font-medium leading-7 text-muted sm:text-base">
                  <p>Ik ben de oprichtster van Fit & Glow en mama van twee geweldige zoontjes.</p>
                  <p>Samen met mijn gezin woon ik in West-Vlaanderen.</p>
                  <p>Net als veel anderen weet ik hoe moeilijk het kan zijn om jezelf op de eerste plaats te zetten.</p>
                  <p>Een druk leven, werk, gezin en alle dagelijkse verantwoordelijkheden zorgen er vaak voor dat je jezelf vergeet.</p>
                  <p>Daarom heb ik Fit & Glow opgericht:</p>
                  <p>Een plek waar je niet alleen werkt aan gewichtsverlies, maar vooral aan meer energie, een gezonde levensstijl en meer zelfvertrouwen.</p>
                  <p>Ik geloof dat je geen perfect dieet of uren in de fitness nodig hebt om resultaten te behalen.</p>
                  <p>Met kleine, haalbare stappen kun je ontzettend veel bereiken.</p>
                  <p>En precies daarbij help ik jou, elke dag opnieuw.</p>
                </div>
              </motion.div>
            </section>

            <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ delay: 0.08 * index, duration: 0.24 }}
                  className="rounded-[24px] border border-border bg-card p-5 shadow-[0_12px_30px_rgba(111,72,84,0.05)]"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/35 text-primary">
                    <item.icon size={20} />
                  </div>
                  <p className="mt-4 text-sm font-extrabold leading-6">{item.title}</p>
                </motion.div>
              ))}
            </section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.28 }}
              className="mt-10 rounded-[24px] border border-border bg-background p-6 sm:p-8"
            >
              <CardTitle>Mijn missie</CardTitle>
              <div className="mt-4 space-y-4 text-base font-medium leading-8 text-muted">
                <p>Mijn missie is om jou te laten ervaren dat een gezonde levensstijl niet ingewikkeld hoeft te zijn.</p>
                <p>Met de juiste begeleiding, dagelijkse motivatie en een sterke community help ik je om doelen te bereiken die écht vol te houden zijn.</p>
                <p>Welkom bij Fit & Glow.</p>
                <p>Laten we samen stralen! ✨</p>
              </div>
            </motion.section>

            <div className="mt-10">
              <Button className="h-14 w-full text-base" disabled={saving} onClick={startJourney}>
                {saving ? <Loader2 className="animate-spin" size={18} /> : null}
                Start mijn reis 💖
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}
