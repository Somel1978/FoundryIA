/** YouTube / Vimeo links → privacy-friendly embed URLs. */

export interface EmbedInfo {
  provider: "youtube" | "vimeo";
  id: string;
  embedUrl: string;
  thumbnailUrl: string | null;
}

export function parseEmbed(input: string): EmbedInfo | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, "");

  let yt: string | null = null;
  if (host === "youtu.be") yt = url.pathname.slice(1).split("/")[0] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") yt = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      yt = m?.[1] ?? null;
    }
  }
  if (yt && /^[\w-]{6,20}$/.test(yt)) {
    return {
      provider: "youtube",
      id: yt,
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/\/(?:video\/)?(\d{5,12})/);
    if (m) {
      return { provider: "vimeo", id: m[1]!, embedUrl: `https://player.vimeo.com/video/${m[1]}?dnt=1`, thumbnailUrl: null };
    }
  }
  return null;
}
