/** YouTube channel IDs to poll (UC + 22 chars). Add channels you want to follow. */
export const YOUTUBE_CHANNEL_IDS = [
  "UCsBjURrPoezykLs9EqgamOA"
] as const;

/** Only surface uploads newer than this many hours before the digest run. */
export const YOUTUBE_LOOKBACK_HOURS = 120;

const CHANNEL_ID_PATTERN = /^UC[\w-]{22}$/;

function dedupe(ids: string[]): string[] {
  return [...new Set(ids)];
}

function validateChannelIds(ids: string[]): string[] {
  const valid: string[] = [];
  for (const id of ids) {
    if (CHANNEL_ID_PATTERN.test(id)) {
      valid.push(id);
    } else {
      console.warn(`[youtube-config] Skipping invalid channel ID: ${id}`);
    }
  }
  return dedupe(valid);
}

/** Resolved watchlist: env override wins over file config. */
export function getYoutubeChannelIds(): string[] {
  const fromEnv = process.env.YOUTUBE_CHANNEL_IDS?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (fromEnv?.length) {
    return validateChannelIds(fromEnv);
  }

  return validateChannelIds([...YOUTUBE_CHANNEL_IDS]);
}
