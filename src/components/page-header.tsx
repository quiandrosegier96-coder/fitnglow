import { Badge } from "@/components/ui/badge";

export function PageHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="fade-in mb-7 flex flex-col gap-3">
      <Badge className="w-fit">{eyebrow}</Badge>
      <div className="max-w-3xl">
        <h1 className="font-serif text-4xl font-extrabold tracking-normal sm:text-5xl">{title}</h1>
        <p className="mt-3 text-base leading-7 text-muted sm:text-lg">{description}</p>
      </div>
    </section>
  );
}
