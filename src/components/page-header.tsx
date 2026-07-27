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
    <section className="fade-in mb-5 flex flex-col gap-1">
      <p className="text-xs font-bold text-primary">{eyebrow}</p>
      <div className="max-w-3xl">
        <h1 className="font-serif text-2xl font-extrabold tracking-normal sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
    </section>
  );
}
