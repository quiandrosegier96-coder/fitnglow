export function getPublicOrigin(requestUrl: string) {
  const parsed = new URL(requestUrl);
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const origin = configured ? configured.replace(/\/$/, "") : parsed.origin;

  if (origin.includes("://0.0.0.0")) {
    return origin.replace("://0.0.0.0", "://localhost");
  }

  return origin;
}

export function createPublicUrl(path: string, requestUrl: string) {
  return new URL(path, getPublicOrigin(requestUrl));
}
