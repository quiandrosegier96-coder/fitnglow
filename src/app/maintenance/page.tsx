import Image from "next/image";
import { Card, CardTitle } from "@/components/ui/card";

export default function MaintenancePage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="max-w-xl text-center">
        <Image src="/logo.svg" alt="Fit & Glow Club" width={190} height={56} className="mx-auto mb-6" />
        <CardTitle>We are polishing the experience</CardTitle>
        <p className="mt-3 leading-7 text-muted">Fit & Glow Club is temporarily in maintenance mode. Your data remains protected.</p>
      </Card>
    </main>
  );
}
