"use client";

import { useEffect, useState } from "react";

export function WorkoutTimer({ running }: { running: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return <div className="font-serif text-6xl font-black tabular-nums sm:text-7xl">{minutes}:{remainingSeconds}</div>;
}
