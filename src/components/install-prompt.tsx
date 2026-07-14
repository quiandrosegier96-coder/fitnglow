"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onPrompt(promptEvent: Event) {
      promptEvent.preventDefault();
      setEvent(promptEvent as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!event) return null;

  return (
    <div className="fixed bottom-24 left-4 z-50 max-w-xs rounded-[1.5rem] border border-primary/10 bg-card p-4 shadow-2xl lg:bottom-6">
      <p className="font-bold">Install Fit & Glow Club</p>
      <p className="mt-1 text-sm text-muted">Add the app to your device for faster access and offline shell support.</p>
      <Button
        className="mt-4 w-full"
        onClick={async () => {
          await event.prompt();
          setEvent(null);
        }}
      >
        <Download size={17} /> Install
      </Button>
    </div>
  );
}
