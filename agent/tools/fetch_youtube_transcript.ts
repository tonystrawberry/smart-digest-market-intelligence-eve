import { defineTool } from "eve/tools";
import { z } from "zod";

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?#]+)/,
    /\/embed\/([^?#]+)/,
    /\/shorts\/([^?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

function extractCaptionTracks(html: string): CaptionTrack[] {
  const match = html.match(/"captionTracks":(\[.*?\])/s);
  if (!match?.[1]) return [];
  try {
    return JSON.parse(match[1]) as CaptionTrack[];
  } catch {
    return [];
  }
}

function parseCaptionXml(xml: string): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const match of xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)) {
    const line = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (line && !seen.has(line)) {
      seen.add(line);
      lines.push(line);
    }
  }
  return lines.join(" ");
}

export default defineTool({
  description:
    "Fetch the auto-generated captions/transcript for a YouTube video. Returns plain-text spoken content, capped at ~8 000 chars. Returns null transcript when no captions are available.",
  inputSchema: z.object({
    url: z.string().describe("YouTube video URL"),
  }),
  async execute({ url }) {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error(`Cannot extract video ID from: ${url}`);

    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!pageRes.ok) {
      throw new Error(`YouTube page fetch failed: ${pageRes.status}`);
    }

    const html = await pageRes.text();
    const tracks = extractCaptionTracks(html);

    if (tracks.length === 0) {
      return { videoId, transcript: null, reason: "No captions available" };
    }

    // Prefer English auto-generated, then any English, then first track
    const track =
      tracks.find((t) => t.languageCode === "en" && t.kind === "asr") ??
      tracks.find((t) => t.languageCode === "en") ??
      tracks[0];

    if (!track) {
      return { videoId, transcript: null, reason: "No suitable caption track" };
    }

    const captionRes = await fetch(track.baseUrl);
    if (!captionRes.ok) {
      throw new Error(`Caption download failed: ${captionRes.status}`);
    }

    const xml = await captionRes.text();
    const transcript = parseCaptionXml(xml).slice(0, 8000);

    return { videoId, transcript };
  },
});
