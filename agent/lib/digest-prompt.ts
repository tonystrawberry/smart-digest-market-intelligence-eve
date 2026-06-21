/** Slash command name registered with Discord (see scripts/register-discord-commands.mjs). */
export const DIGEST_COMMAND_NAME = "digest";

/** Prompt used by the daily schedule and the /digest slash command. */
export const DIGEST_PROMPT = `Run the daily Smart Digest workflow now:
1. Call fetch_youtube_videos to get recent uploads from the configured watchlist.
2. Using each video's title and description, filter for content relevant to: AI trends (new models, research breakthroughs, new tools), system design, architecture patterns, or engineering best practices. Skip anything unrelated.
3. For each relevant video, call fetch_youtube_transcript to get the full spoken content.
4. Using the transcript (or description as fallback if no captions), write a structured 3–5 sentence summary covering: what the video is about, the key ideas or findings, and why it matters for an engineer.
5. Use your judgment to mark videos as ⭐ high-value when they cover landmark releases, rare expert deep dives, or genuinely must-know content. Reserve ⭐ for the best 1–2 videos.
6. Post the digest to this Discord channel using clean markdown. Format each entry as:
   **[Video Title](url)** — ChannelName ⭐ (if high-value)
   > Summary here.
If no videos pass the filter, post a brief "nothing worth watching today" notice instead of staying silent.`;
