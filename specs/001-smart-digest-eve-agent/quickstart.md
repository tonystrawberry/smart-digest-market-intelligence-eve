# Quickstart: Smart Digest & Market Intelligence Discord Bot

**Feature**: `001-smart-digest-eve-agent`  
**Branch**: `001-smart-digest-eve-agent`

## Prerequisites

- Node.js 24+
- npm
- Google Gemini API key ([AI Studio](https://aistudio.google.com/apikey)) for `gemini-2.5-flash`
- Discord application with bot token and interactions endpoint configured

## 1. Install dependencies

This repo is already scaffolded. From the repository root (Node.js **24+** required):

```bash
npm install --legacy-peer-deps
```

Pinned versions in `package.json`: `eve@^0.11.7`, `ai@7.0.0-beta.178`, `@ai-sdk/google@^3`, `zod@^4`.

## 2. Configure environment

Create `.env` (do not commit):

```bash
# Google Gemini (required)
GOOGLE_GENERATIVE_AI_API_KEY=...

# Discord (required for delivery)
DISCORD_PUBLIC_KEY=...
DISCORD_APPLICATION_ID=...
DISCORD_BOT_TOKEN=...
```

Replace placeholder channel ID in `agent/lib/discord-config.ts` with your real Discord channel snowflake.

### YouTube watchlist

Edit `agent/lib/youtube-config.ts` and add the channel IDs you want to follow:

```typescript
export const YOUTUBE_CHANNEL_IDS = [
  "UCxxxxxxxxxxxxxxxxxxxxxxxxxx", // your channel 1
  "UCyyyyyyyyyyyyyyyyyyyyyyyyyy", // your channel 2
] as const;
```

Or set at deploy time:

```bash
YOUTUBE_CHANNEL_IDS=UCaaa...,UCbbb...
```

No YouTube API key needed — the tool uses public RSS feeds per channel ID.

Register Discord interactions endpoint: `https://<your-host>/eve/v1/discord`

## 3. Project layout (after implementation)

```text
agent/
├── agent.ts                 # model: gemini-2.5-flash (Google)
├── instructions.md          # digest workflow
├── channels/
│   └── discord.ts
├── schedules/
│   └── daily-digest.ts      # cron 0 8 * * *
├── skills/
│   └── research.md          # filtering lens
├── tools/
│   ├── fetch_tech_news.ts      # HN Algolia fetch
│   └── fetch_youtube_videos.ts # RSS fetch per watchlist channel IDs
└── lib/
    ├── discord-config.ts       # DIGEST_CHANNEL_ID
    └── youtube-config.ts       # YOUTUBE_CHANNEL_IDS watchlist
```

## 4. Run locally

```bash
npm run dev
# headless server only:
npx eve dev --no-ui --port 3000
```

## 5. Smoke-test the fetch tool

In the dev TUI or via HTTP:

```bash
curl -X POST http://127.0.0.1:3000/eve/v1/session \
  -H 'content-type: application/json' \
  -d '{"message":"Call fetch_tech_news and fetch_youtube_videos; summarize what you found."}'
```

## 6. Trigger the daily digest (dev only)

```bash
curl -X POST http://127.0.0.1:3000/eve/v1/dev/schedules/daily-digest
```

Inspect session stream:

```bash
curl http://127.0.0.1:3000/eve/v1/session/<sessionId>/stream
```

## 7. Verify build

```bash
npx eve build
# or
npm run build
```

Expect zero TypeScript compilation errors.

## 8. Production notes

- Vercel cron runs in **UTC** — adjust `0 8 * * *` if you need local 8 AM.
- `eve dev` does not fire schedules on cron; use dev dispatch route or deploy for cadence testing.
- Ensure bot has permission to send messages in the target channel.

## Next steps

- Add your YouTube channel IDs to `agent/lib/youtube-config.ts`
- Replace `DIGEST_CHANNEL_ID` in `agent/lib/discord-config.ts`
- Copy `.env.example` → `.env` and fill credentials
- Deploy with `npm run build && npm run start`
