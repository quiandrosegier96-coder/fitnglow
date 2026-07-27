import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="max-w-lg text-center">
        <CardTitle>Page not found</CardTitle>
<<<<<<< HEAD
        <p className="mt-3 text-muted">This part of Fit & Glow Club is not available.</p>
=======
        <p className="mt-3 text-muted">This part of Fit & Glow is not available.</p>
>>>>>>> origin/agent/community-challenges-grow-with-jo
        <Button asChild className="mt-6"><Link href="/dashboard">Back to dashboard</Link></Button>
      </Card>
    </main>
  );
}
