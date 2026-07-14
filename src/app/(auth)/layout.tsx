import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image src="/logo.svg" alt="Fit & Glow Club" width={210} height={62} priority />
        </div>
        {children}
      </div>
    </main>
  );
}
