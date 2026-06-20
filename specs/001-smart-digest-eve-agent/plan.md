# Implementation Plan: Smart Digest & Market Intelligence Discord Bot

**Branch**: `001-smart-digest-eve-agent` | **Date**: 2026-06-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-smart-digest-eve-agent/spec.md`

## Summary

Build an [Eve](https://eve.dev/docs/introduction) durable agent that delivers a daily engineering-focused tech digest to Discord at 8:00 AM. The agent fetches the top 15 Hacker News front-page stories via Algolia, fetches recent uploads from operator-configured YouTube channels, applies a research skill to filter for engineer-growth signal, groups news into categories, surfaces up to three **must-watch** videos, and posts a formatted synthesis to a configured Discord channel.

## Technical Context

**Language/Version**: TypeScript on Node.js 24+  
**Primary Dependencies**: `eve@latest`, `ai`, `zod`  
**Storage**: N/A (stateless digest runs; Eve session persistence handled by framework)  
**Testing**: Manual smoke tests via `eve dev`, HTTP session API, dev schedule dispatch; `eve build` for compile verification  
**Target Platform**: Local dev + Vercel (or self-hosted via `eve start`)  
**Project Type**: Eve agent (filesystem-first bot)  
**Performance Goals**: Digest completes within 5 minutes of schedule trigger (per SC-001)  
**Constraints**: Discord 2000-char message limit; Algolia public API; YouTube per-channel RSS (no API key); Vercel cron runs UTC  
**Scale/Scope**: Single Discord channel, 1 daily run, 15 stories + videos from operator-defined YouTube channel list (max 3 picks in digest)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Project constitution (`.specify/memory/constitution.md`) is still a template—not ratified. **Gate status: PASS with defaults**:

| Principle | Status | Notes |
|-----------|--------|-------|
| Simplicity | ✅ | Single agent, two fetch tools, one skill, one schedule—no subagents or extra services |
| Test-first | ⚠️ Deferred | Manual verification for v1; no TDD mandate until constitution ratified |
| Observability | ✅ | Eve session streaming + Vercel cron logs sufficient for v1 |
| Scope discipline | ✅ | No on-demand digests, dedup, or multi-channel in v1 |

**Post-design re-check**: Design adds YouTube RSS fetches per configured channel ID only—no global search API. No constitution violations requiring complexity tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-smart-digest-eve-agent/
├── plan.md              # This file
├── research.md          # Phase 0 — technology decisions
├── data-model.md        # Phase 1 — entity shapes
├── quickstart.md        # Phase 1 — setup & smoke tests
├── contracts/           # Phase 1 — interface contracts
│   ├── hn-algolia-api.md
│   ├── fetch-tech-news-tool.md
│   ├── fetch-youtube-videos-tool.md
│   ├── youtube-watchlist-config.md
│   ├── daily-digest-schedule.md
│   └── discord-digest-format.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
smart-digest-market-intelligence-eve/
├── package.json
├── tsconfig.json
├── .env.example
├── agent/
│   ├── agent.ts                    # defineAgent({ model: "openai/gpt-4o" })
│   ├── instructions.md             # End-to-end digest workflow
│   ├── channels/
│   │   └── discord.ts              # discordChannel() + delivery events
│   ├── schedules/
│   │   └── daily-digest.ts         # cron 0 8 * * *, receive → Discord
│   ├── skills/
│   │   └── research.md             # Filtering lens (include/exclude)
│   ├── tools/
│   │   ├── fetch_tech_news.ts      # HN Algolia fetch (real HTTP)
│   │   └── fetch_youtube_videos.ts # YouTube RSS per configured channel IDs
│   └── lib/
│       ├── discord-config.ts       # DIGEST_CHANNEL_ID constant
│       └── youtube-config.ts       # YOUTUBE_CHANNEL_IDS watchlist
└── specs/                          # Spec Kit artifacts (above)
```

**Structure Decision**: Single Eve agent at repo root using nested `agent/` layout per [Eve project layout](https://eve.dev/docs/reference/project-layout). No separate backend/frontend. User-requested filenames adapted to Eve conventions (`agent.ts` not `agent.json`; `daily-digest.ts` not `.json`; `fetch_tech_news.ts` snake_case not `fetchTechNews.ts`).

## Implementation Phases

### Phase A: Scaffold & Dependencies

1. Run `npx eve@latest init .` (or manual install if partial scaffold exists)
2. Confirm `package.json` scripts: `dev`, `build`, `start`
3. Add `.env.example` documenting Discord + OpenAI keys
4. Set model in `agent/agent.ts` to `openai/gpt-4o`

### Phase B: Core Agent Files

1. **`agent/instructions.md`** — Step-by-step workflow:
   - Wake on schedule or explicit digest request
   - Call `fetch_tech_news` and `fetch_youtube_videos`
   - Load `research` skill
   - Filter news and videos for engineer-growth value
   - Categorize news; pick up to 3 **must-watch** videos with "why watch"
   - Format for Discord (bold headers, bullets, links)
   - Handle empty-filter case

2. **`agent/skills/research.md`** — Frontmatter description + criteria:
   - Prioritize: deep technical changes, Rails/Sidekiq/Redis/AWS ECS/SQS, AI agent engineering, architecture postmortems, actionable talks
   - Exclude: funding rounds, marketing hype, reaction/entertainment videos
   - Videos: include only when a senior engineer would learn something actionable

3. **`agent/lib/discord-config.ts`** — Export `DIGEST_CHANNEL_ID = "123456789012345678"`

4. **`agent/lib/youtube-config.ts`** — Export operator-editable watchlist:

```ts
export const YOUTUBE_CHANNEL_IDS = [
  "UCxxxxxxxxxxxxxxxx", // e.g. AWS Developers
  "UCyyyyyyyyyyyyyyyy", // add your channels here
] as const;
export const YOUTUBE_LOOKBACK_HOURS = 48;
```

Optional env override: `YOUTUBE_CHANNEL_IDS=UCaaa,UCbbb` (comma-separated).

### Phase C: Tool Implementation

1. **`agent/tools/fetch_tech_news.ts`**
   - `defineTool` with empty `z.object({})` input
   - Fetch `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=15`
   - Map hits → `{ title, url, points, objectId? }`
   - URL fallback for null `url`
   - Return `{ stories, fetchedAt, source }`
   - Contract: [contracts/fetch-tech-news-tool.md](./contracts/fetch-tech-news-tool.md)

2. **`agent/tools/fetch_youtube_videos.ts`**
   - Reads `YOUTUBE_CHANNEL_IDS` from `agent/lib/youtube-config.ts` (env override supported)
   - For each channel ID, fetch `https://www.youtube.com/feeds/videos.xml?channel_id={id}`
   - Parse Atom entries → `{ title, url, channelId, channelName, publishedAt }`
   - Filter to videos within `YOUTUBE_LOOKBACK_HOURS`
   - Return `{ videos, fetchedAt, channelsChecked }`
   - Contract: [contracts/fetch-youtube-videos-tool.md](./contracts/fetch-youtube-videos-tool.md)

### Phase D: Discord Channel

1. **`agent/channels/discord.ts`** — `discordChannel()` with default or custom `message.completed` delivery
2. Document env vars: `DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`, `DISCORD_BOT_TOKEN`
3. Contract: [contracts/discord-digest-format.md](./contracts/discord-digest-format.md)

### Phase E: Schedule

1. **`agent/schedules/daily-digest.ts`** — Handler form:
   - `cron: "0 8 * * *"`
   - `waitUntil(receive(discord, { message, target: { channelId: DIGEST_CHANNEL_ID }, auth: appAuth }))`
2. Contract: [contracts/daily-digest-schedule.md](./contracts/daily-digest-schedule.md)

### Phase F: Verification

1. `npx eve build` — zero TS errors
2. Dev TUI: test tool invocation
3. `POST /eve/v1/dev/schedules/daily-digest` — end-to-end smoke test
4. Verify Discord message formatting manually

## Key Design Decisions

See [research.md](./research.md) for full rationale. Highlights:

| User request | Eve-native approach |
|--------------|---------------------|
| `agent.json` + `channels.discord.channelId` | `agent/agent.ts` + `DIGEST_CHANNEL_ID` in lib/schedule |
| `schedules/daily-digest.json` | `agent/schedules/daily-digest.ts` with `defineSchedule` |
| `fetchTechNews.ts` | `agent/tools/fetch_tech_news.ts` (snake_case) |
| `@eve-dev/sdk` | `eve@latest` official package |

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Cron UTC vs local 8 AM | Document offset; operator adjusts cron |
| Discord credentials not set | Fail fast with clear error in quickstart |
| Algolia downtime | Tool throws; agent surfaces error (no fake digest) |
| YouTube RSS parse failure | Per-channel degrade; continue with news + other channels |
| Model cost at daily cadence | Single short run/day; gpt-4o acceptable for synthesis |

## Artifacts Generated

| Artifact | Path | Status |
|----------|------|--------|
| Research | [research.md](./research.md) | ✅ Complete |
| Data model | [data-model.md](./data-model.md) | ✅ Complete |
| Quickstart | [quickstart.md](./quickstart.md) | ✅ Complete |
| HN API contract | [contracts/hn-algolia-api.md](./contracts/hn-algolia-api.md) | ✅ Complete |
| Tool contract | [contracts/fetch-tech-news-tool.md](./contracts/fetch-tech-news-tool.md) | ✅ Complete |
| Schedule contract | [contracts/daily-digest-schedule.md](./contracts/daily-digest-schedule.md) | ✅ Complete |
| Discord format contract | [contracts/discord-digest-format.md](./contracts/discord-digest-format.md) | ✅ Complete |
| YouTube tool contract | [contracts/fetch-youtube-videos-tool.md](./contracts/fetch-youtube-videos-tool.md) | ✅ Complete |
| YouTube watchlist contract | [contracts/youtube-watchlist-config.md](./contracts/youtube-watchlist-config.md) | ✅ Complete |

## Next Step

Run **`/speckit-tasks`** to generate dependency-ordered `tasks.md`, then **`/speckit-implement`** to scaffold and build the agent.
