import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  getYoutubeChannelIds,
  YOUTUBE_LOOKBACK_HOURS,
} from "../lib/youtube-config.js";

const YOUTUBE_RSS_BASE = "https://www.youtube.com/feeds/videos.xml";

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? decodeXml(match[1].trim()) : null;
}

function extractLinkHref(block: string): string | null {
  const match = block.match(/<link[^>]*href="([^"]+)"/);
  return match?.[1] ?? null;
}

function parseFeedEntries(xml: string): string[] {
  return xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
}

function isWithinLookback(publishedAt: string, lookbackHours: number): boolean {
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) return false;
  const cutoff = Date.now() - lookbackHours * 60 * 60 * 1000;
  return published >= cutoff;
}

async function fetchChannelVideos(
  channelId: string,
  lookbackHours: number,
): Promise<
  Array<{
    title: string;
    url: string;
    channelId: string;
    channelName: string;
    publishedAt: string;
  }>
> {
  const response = await fetch(
    `${YOUTUBE_RSS_BASE}?channel_id=${encodeURIComponent(channelId)}`,
    { headers: { Accept: "application/atom+xml" } },
  );

  if (!response.ok) {
    throw new Error(
      `YouTube RSS failed for ${channelId}: ${response.status} ${response.statusText}`,
    );
  }

  const xml = await response.text();
  const videos: Array<{
    title: string;
    url: string;
    channelId: string;
    channelName: string;
    publishedAt: string;
  }> = [];

  for (const entry of parseFeedEntries(xml)) {
    const title = extractTag(entry, "title");
    const url = extractLinkHref(entry) ?? extractTag(entry, "id");
    const publishedAt = extractTag(entry, "published");
    const authorBlock = entry.match(/<author>[\s\S]*?<\/author>/);
    const channelName = authorBlock
      ? (extractTag(authorBlock[0], "name") ?? channelId)
      : channelId;

    if (!title || !url || !publishedAt) continue;
    if (!isWithinLookback(publishedAt, lookbackHours)) continue;

    videos.push({
      title,
      url,
      channelId,
      channelName,
      publishedAt: new Date(publishedAt).toISOString(),
    });
  }

  return videos;
}

export default defineTool({
  description:
    "Fetch recent uploads from the operator-configured YouTube channel watchlist. Returns title, URL, channel name, and publish time for each video within the lookback window.",
  inputSchema: z.object({}),
  async execute() {
    const channelIds = getYoutubeChannelIds();
    const fetchedAt = new Date().toISOString();

    if (channelIds.length === 0) {
      return { videos: [], fetchedAt, channelsChecked: 0 };
    }

    const videos: Array<{
      title: string;
      url: string;
      channelId: string;
      channelName: string;
      publishedAt: string;
    }> = [];
    const errors: string[] = [];

    for (const channelId of channelIds) {
      try {
        videos.push(...(await fetchChannelVideos(channelId, YOUTUBE_LOOKBACK_HOURS)));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : `Unknown error for ${channelId}`;
        errors.push(message);
        console.warn(`[fetch_youtube_videos] ${message}`);
      }
    }

    if (videos.length === 0 && errors.length === channelIds.length) {
      throw new Error(
        `All YouTube channel fetches failed: ${errors.join("; ")}`,
      );
    }

    videos.sort(
      (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    );

    return {
      videos,
      fetchedAt,
      channelsChecked: channelIds.length,
    };
  },
});
