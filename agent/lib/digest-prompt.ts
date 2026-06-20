/** Slash command name registered with Discord (see scripts/register-discord-commands.mjs). */
export const DIGEST_COMMAND_NAME = "digest";

/** Prompt used by the daily schedule and the /digest slash command. */
export const DIGEST_PROMPT = `Run the daily Smart Digest workflow now:
1. Call fetch_tech_news to get the top 15 HN front-page stories.
2. Call fetch_youtube_videos for recent uploads from the configured watchlist.
3. Load the research skill and apply the engineer-growth filter to both articles and videos.
4. Group high-signal news into bold categories (Infrastructure, AI, Backend, Reliability, Security as needed).
5. Pick up to 3 must-watch videos with a one-line "Why:" for each.
6. Post the full digest to this Discord channel using clean markdown (bold headers, bullets, links).
If nothing passes the filter, post a brief "no high-signal items today" notice instead of staying silent.`;
