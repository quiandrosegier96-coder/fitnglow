import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({ src, name, className }: { src?: string; name: string; className?: string }) {
  return (
    <div className={cn("relative grid h-10 w-10 place-items-center overflow-hidden rounded-full rose-gold text-sm font-black text-white", className)}>
      {src ? <Image src={src} alt={name} fill className="object-cover" /> : name.slice(0, 1).toUpperCase()}
    </div>
  );
}
