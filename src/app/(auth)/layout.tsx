import Image from "next/image";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen px-4 py-6 lg:grid-cols-[1fr_520px] lg:p-6">
      <section className="relative hidden overflow-hidden rounded-[2rem] lg:block">
        <Image
          src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=85"
          alt="Fit & Glow Club training"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/78 via-black/35 to-primary/35" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur">
            <Sparkles size={16} /> Premium fitness club
          </div>
          <h1 className="max-w-xl font-serif text-6xl font-black">Train softly. Glow powerfully.</h1>
          <div className="mt-8 grid max-w-xl gap-3 text-sm font-semibold text-white/88">
            {["Guided workouts", "Nutrition and progress tracking", "Coach-ready member experience"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 size={18} /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className="grid place-items-center">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Image src="/logo.svg" alt="Fit & Glow Club" width={210} height={62} priority />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
