import Image from "next/image";
import { Mail, MessageCircle, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const coachEmail = "fitandglow.joyce@gmail.com";
const coachWhatsApp = "32470907781";

export default function CoachPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Coach"
        title="Joyce staat voor je klaar"
        description="Heb je een vraag over je challenge, voeding, progressie of motivatie? Stuur Joyce gerust een bericht."
      />

      <Card className="grid gap-8 overflow-hidden border-border/70 bg-card p-6 shadow-soft md:grid-cols-[340px_1fr] md:p-8 lg:grid-cols-[400px_1fr] lg:p-10">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[400px] self-start overflow-hidden rounded-[24px] bg-secondary/25 shadow-soft">
            <Image
              src="/coach-joyce-contact.jpg"
              alt="Joyce, coach van Fit & Glow"
              fill
              sizes="(max-width: 768px) 88vw, 400px"
              className="object-contain"
              priority
            />
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-secondary/60 px-4 py-2 text-sm font-extrabold text-primary">
              <Sparkles size={17} />
              Persoonlijke begeleiding
            </div>
            <CardTitle className="text-4xl md:text-5xl">Welkom! 💕</CardTitle>
            <div className="mt-5 max-w-3xl space-y-6 text-base font-medium leading-7 text-muted">
              <div className="space-y-3">
                <p className="text-lg font-bold text-foreground">Welkom bij Fit & Glow.</p>
                <p>
                  Leuk dat je hier bent! Door vandaag voor jezelf te kiezen, heb je al de eerste stap gezet naar een gezondere, energieker en gelukkigere versie van jezelf.
                </p>
                <p>
                  Bij Fit & Glow draait het niet om perfect zijn. Het draait om kleine dagelijkse gewoontes die op lange termijn een groot verschil maken.
                </p>
                <p>
                  Ik ben ontzettend blij dat ik jou op deze reis mag begeleiden. Samen werken we stap voor stap aan jouw persoonlijke doelen, op een manier die haalbaar is en vooral vol te houden is.
                </p>
                <div className="rounded-[24px] bg-secondary/45 p-5 text-center font-serif text-2xl font-bold text-foreground">
                  Kleine gewoontes, grote verandering 🩷
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-serif text-2xl font-bold text-foreground">Wie ben ik?</p>
                <p className="text-lg font-bold text-foreground">Hey, ik ben Joyce! 👋</p>
                <p>
                  Ik ben de oprichtster van <strong>Fit & Glow</strong> en mama van twee geweldige zoontjes. Samen met mijn gezin woon ik in West-Vlaanderen.
                </p>
                <p>
                  Net als veel anderen weet ik hoe moeilijk het kan zijn om jezelf op de eerste plaats te zetten. Een druk leven, werk, gezin en alle dagelijkse verantwoordelijkheden zorgen er vaak voor dat je jezelf vergeet.
                </p>
                <p>
                  Daarom heb ik Fit & Glow opgericht: een plek waar je niet alleen werkt aan gewichtsverlies, maar vooral aan meer energie, een gezonde levensstijl en meer zelfvertrouwen.
                </p>
                <p>
                  Ik geloof dat je geen perfect dieet of uren in de fitness nodig hebt om resultaten te behalen. Met kleine, haalbare stappen kun je veel bereiken.
                </p>
                <p>En precies daarbij help ik jou, elke dag opnieuw.</p>
              </div>

              <div className="space-y-3">
                <p className="font-serif text-2xl font-bold text-foreground">Waar sta ik voor?</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "❤️ Persoonlijke begeleiding",
                    "🌱 Een gezonde levensstijl zonder extremen",
                    "💪 Duurzame resultaten in plaats van snelle oplossingen",
                    "🤝 Een warme community waar niemand er alleen voor staat",
                    "✨ Kleine dagelijkse gewoontes die een groot verschil maken",
                    "🏆 Samen groeien, stap voor stap"
                  ].map((value) => (
                    <div key={value} className="rounded-[20px] bg-background/80 p-4 text-sm font-bold text-foreground shadow-soft">
                      {value}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-serif text-2xl font-bold text-foreground">Mijn missie</p>
                <p>
                  Mijn missie is om jou te laten ervaren dat een gezonde levensstijl niet ingewikkeld hoeft te zijn. Met de juiste begeleiding, dagelijkse motivatie en een sterke community help ik je om doelen te bereiken die echt vol te houden zijn.
                </p>
                <p className="font-bold text-foreground">Welkom bij Fit & Glow. Laten we samen stralen! ✨</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Button asChild className="h-14 rounded-[16px] text-base">
                <a href={`https://wa.me/${coachWhatsApp}`} target="_blank" rel="noreferrer">
                  <MessageCircle size={19} />
                  WhatsApp Joyce
                </a>
              </Button>
              <Button asChild variant="outline" className="h-14 rounded-[16px] text-base">
                <a href={`mailto:${coachEmail}`}>
                  <Mail size={19} />
                  E-mail Joyce
                </a>
              </Button>
            </div>

            <div className="mt-6 rounded-[24px] bg-background/80 p-5 text-sm font-bold leading-6 text-muted">
              <p>WhatsApp: +32 470 90 77 81</p>
              <p>E-mail: {coachEmail}</p>
            </div>
          </div>
      </Card>
    </div>
  );
}
