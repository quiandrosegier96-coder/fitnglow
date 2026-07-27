export function getYouTubeVideoId(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

    if (hostname === "youtu.be") return cleanVideoId(url.pathname.split("/").filter(Boolean)[0]);
    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (url.pathname === "/watch") return cleanVideoId(url.searchParams.get("v"));
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0] ?? "")) return cleanVideoId(parts[1]);
    }
  } catch {
    return null;
  }

  return null;
}

function cleanVideoId(value: string | null | undefined) {
  return value && /^[A-Za-z0-9_-]{11}$/.test(value) ? value : null;
}

export function getYouTubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}
