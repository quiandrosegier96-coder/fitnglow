import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Fit & Glow Club",
    template: "%s | Fit & Glow Club"
  },
  description: "A premium fitness, nutrition, coaching, and wellness platform.",
  applicationName: "Fit & Glow Club",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Fit & Glow Club",
    statusBarStyle: "default"
  },
  openGraph: {
    title: "Fit & Glow Club",
    description: "Premium training, nutrition plans, progress tracking, and community.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#F87AA2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
