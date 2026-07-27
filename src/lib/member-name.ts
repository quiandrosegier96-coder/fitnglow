export function getFirstName(value: string) {
  const clean = value.trim();
  if (!clean) return "Member";
  const withoutEmailDomain = clean.includes("@") ? clean.split("@")[0] : clean;
  return withoutEmailDomain.split(/[.\s_-]+/).filter(Boolean)[0] ?? "Member";
}
