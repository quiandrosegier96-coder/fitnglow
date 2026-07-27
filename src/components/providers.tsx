"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ToastProvider } from "@/components/ui/toast";
import { InstallPrompt } from "@/components/install-prompt";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={client}>
        <ToastProvider>
          {children}
          <ServiceWorkerRegister />
          <InstallPrompt />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
