# Smart Digest & Market Intelligence

A daily engineering digest bot built with [Eve](https://eve.dev). It fetches Hacker News front-page stories, monitors your chosen YouTube channels, filters for high-signal engineering content, and posts a curated summary to Discord every morning at 8:00 AM.

## What it does

1. **Fetch** — Top 15 HN stories + recent uploads from your YouTube watchlist  
2. **Filter** — Apply an engineer-growth lens (infrastructure, backend, AI agents; skip funding hype)  
3. **Synthesize** — Group news into categories and pick up to 3 **Must-Watch** videos with a one-line “why watch”  
4. **Deliver** — Post formatted markdown to your Discord channel on a daily cron  

## Prerequisites

- Node.js **24+**
- Google Gemini API key ([AI Studio](https://aistudio.google.com/apikey)) — model: `gemini-2.5-flash`
- Discord application with bot token and interactions endpoint

## Quick start

Requires **Node.js 24+** (`package.json` engines). If you use [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm use          # reads .nvmrc → Node 24
npm install --legacy-peer-deps
cp .env.example .env   # fill in credentials
npm run dev
```

Headless dev server (no TUI):

```bash
npx eve dev --no-ui --port 3000
```

## Configuration

### Discord

Set credentials in `.env`:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=...
DISCORD_PUBLIC_KEY=...
DISCORD_APPLICATION_ID=...
DISCORD_BOT_TOKEN=...
```

Replace the placeholder channel ID in `agent/lib/discord-config.ts`:

```typescript
export const DIGEST_CHANNEL_ID = "your-channel-snowflake";
```

Register your interactions endpoint: `https://<your-host>/eve/v1/discord`

Invite the bot to your server (OAuth2 URL Generator → scopes **`bot`** + **`applications.commands`**, permissions: View Channels, Send Messages, Read Message History).

Register the `/digest` slash command (once per app, or after changing command metadata):

```bash
npm run discord:register-commands
```

In Discord, run **`/digest`** in any channel the bot can access to trigger a digest on demand. The scheduled cron still posts automatically to `DIGEST_CHANNEL_ID` at 8:00 AM UTC.

### YouTube watchlist

The bot needs each channel’s **channel ID** (starts with `UC`, 24 characters total). Handles like `@Fireship` are not enough — the RSS feed is keyed by channel ID.

#### How to find a channel ID

**Option A — View page source (works for any public channel)**

1. Open the channel page in a browser (e.g. `https://www.youtube.com/@Fireship`).
2. Open page source: **View → Developer → View Source** (macOS: **Option+Cmd+U**; Windows: **Ctrl+U**).
3. Search the page for `channelId` or `"externalId"`.
4. Copy the value that looks like `UCxxxxxxxxxxxxxxxxxxxxxxxxxx` (24 chars, starts with `UC`).

**Option B — From a video on that channel**

1. Open any video uploaded by the channel.
2. View page source and search for `"channelId":"UC`.
3. Copy the same `UC…` value.

**Option C — YouTube Studio (your own channel only)**

1. [YouTube Studio](https://studio.youtube.com) → **Settings** → **Channel** → **Advanced settings**.
2. Copy **Channel ID** under “Channel URL and ID”.

**Verify** — paste the ID into a browser:

```text
https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxxxxxx
```

You should land on the correct channel page.

#### Add IDs to the watchlist

Add channel IDs to `agent/lib/youtube-config.ts`:

```typescript
export const YOUTUBE_CHANNEL_IDS = [
  "UCxxxxxxxxxxxxxxxxxxxxxxxxxx", // e.g. Fireship
  "UCyyyyyyyyyyyyyyyyyyyyyyyyyy",
] as const;
```

Or override at deploy time (comma-separated, no spaces required):

```bash
YOUTUBE_CHANNEL_IDS=UCaaa...,UCbbb...
```

No YouTube API key required — the bot uses public RSS feeds per channel.

## Project layout

```text
agent/
├── agent.ts                 # model: gemini-2.5-flash (Google)
├── instructions.md          # digest workflow
├── channels/discord.ts
├── schedules/daily-digest.ts   # cron: 0 8 * * *
├── skills/research.md          # filtering criteria
├── tools/
│   ├── fetch_tech_news.ts
│   └── fetch_youtube_videos.ts
└── lib/
    ├── discord-config.ts
    └── youtube-config.ts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Eve dev server (interactive TUI) |
| `npm run build` | Compile agent to `.output/` |
| `npm run start` | Serve production build |
| `npm run info` | Show discovered tools, schedules, channels |
| `npm run discord:register-commands` | Register `/digest` with Discord (requires `.env`) |

## Smoke tests

Trigger the digest manually in Discord:

```
/digest
```

Trigger the digest manually (dev server only):

```bash
curl -X POST http://127.0.0.1:3000/eve/v1/dev/schedules/daily-digest
```

Test tools via HTTP session:

```bash
curl -X POST http://127.0.0.1:3000/eve/v1/session \
  -H 'content-type: application/json' \
  -d '{"message":"Call fetch_tech_news and summarize the top 3 stories."}'
```

## Production notes

- Vercel cron evaluates schedules in **UTC** — adjust `0 8 * * *` in `agent/schedules/daily-digest.ts` if you need local 8 AM.
- `eve dev` does not fire cron automatically; use the dev dispatch route above or deploy.
- Ensure the bot can send messages in the target channel.

## Docs

- Operator guide: [`specs/001-smart-digest-eve-agent/quickstart.md`](specs/001-smart-digest-eve-agent/quickstart.md)
- Implementation plan: [`specs/001-smart-digest-eve-agent/plan.md`](specs/001-smart-digest-eve-agent/plan.md)
- [Eve documentation](https://eve.dev/docs/introduction)
