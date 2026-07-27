"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="max-w-lg text-center">
        <CardTitle>Something needs a reset</CardTitle>
        <p className="mt-3 text-muted">The page could not finish loading. Please retry the view.</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </Card>
    </main>
  );
}
