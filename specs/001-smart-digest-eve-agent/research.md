# Research: Smart Digest & Market Intelligence Discord Bot

**Feature**: `001-smart-digest-eve-agent`  
**Date**: 2026-06-20

## R1: Agent Framework & Project Scaffold

**Decision**: Initialize the project with `npx eve@latest init .` at the repository root (existing git repo; skip nested `my-agent/` directory).

**Rationale**: [Eve getting started](https://eve.dev/docs/getting-started) recommends `eve init` for new agents and `eve init .` for existing projects with `package.json`. Eve is filesystem-first: capabilities live under `agent/` and are auto-discovered. Node 24+ is required.

**Alternatives considered**:
- Manual `npm install eve ai zod` — viable but slower; init wires scripts, tsconfig, and default channel.
- `@eve-dev/sdk` — not the published package name; official dependency is `eve@latest`.

---

## R2: Agent Configuration Format

**Decision**: Use `agent/agent.ts` with `defineAgent({ model: "openai/gpt-4o" })` (or gateway-equivalent model id), not `agent.json`.

**Rationale**: [Eve project layout](https://eve.dev/docs/reference/project-layout) specifies `agent.ts` as the runtime config slot. There is no `agent.json` discovery path. Model, options, and experimental flags belong in TypeScript.

**Alternatives considered**:
- JSON config file — not supported by Eve discovery; would require custom loader (out of scope).

**Credential note**: GPT-4o via OpenAI needs `OPENAI_API_KEY` or routing through Vercel AI Gateway with `AI_GATEWAY_API_KEY`. Document in quickstart.

---

## R3: Discord Channel Integration

**Decision**: Add `agent/channels/discord.ts` exporting `discordChannel()` from `eve/channels/discord`. Store digest target channel ID `123456789012345678` as a named constant (e.g., in `agent/lib/discord-config.ts`) referenced by the schedule handler and documented for operator replacement.

**Rationale**: [Discord channel docs](https://eve.dev/docs/channels/discord) wire HTTP interactions and support proactive delivery via `receive(discord, { message, target: { channelId }, auth: appAuth })` from schedule handlers. Credentials (`DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`, `DISCORD_BOT_TOKEN`) are env-based.

**Alternatives considered**:
- Embedding `channels.discord.channelId` in a JSON agent config — not Eve-native; constant + env is simpler and type-safe.

---

## R4: Daily Schedule at 8:00 AM

**Decision**: Create `agent/schedules/daily-digest.ts` using `defineSchedule` with handler form (`run`), cron `"0 8 * * *"`, and `receive(discord, …)` to hand off digest work.

**Rationale**: [Schedules docs](https://eve.dev/docs/schedules) support `.ts` (defineSchedule) or `.md` (frontmatter `cron` + prompt body). Handler form is required to proactively post to a specific Discord channel. Markdown task mode cannot park on channel delivery as cleanly.

**Timezone caveat**: On Vercel, cron evaluates in **UTC**. `"0 8 * * *"` = 08:00 UTC, not local. For local 8 AM, operator must offset cron or accept UTC. Document in quickstart.

**Alternatives considered**:
- `schedules/daily-digest.json` — not a supported Eve schedule format.
- Markdown-only schedule — simpler but cannot pass `target.channelId` without handler.

**Dev testing**: `POST /eve/v1/dev/schedules/daily-digest` triggers one-shot dispatch during `eve dev`.

---

## R5: News Fetch Tool & HN Algolia API

**Decision**: Implement `agent/tools/fetch_tech_news.ts` (snake_case filename per Eve naming rule) calling:

```
GET https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=15
```

Parse `hits[]` → `{ title, url, points }` (use HN discussion URL fallback when `url` is null: `https://news.ycombinator.com/item?id={objectID}`).

**Rationale**: [Tools docs](https://eve.dev/docs/tools) require snake_case tool names from filenames. Algolia front_page tag returns current front-page stories without auth. Fields: `title`, `url`, `points`, `objectID`.

**Alternatives considered**:
- `fetchTechNews.ts` — violates Eve snake_case discovery rule.
- Firebase HN API (`/topstories.json`) — requires N+1 fetches for metadata; Algolia single call is simpler.

---

## R6: Research Skill (Filtering Lens)

**Decision**: Create `agent/skills/research.md` with YAML frontmatter `description` routing digest curation, body defining include/exclude criteria (deep technical changes, Rails/Sidekiq/Redis/AWS ECS/SQS, AI agent engineering; exclude funding rounds and marketing hype).

**Rationale**: [Skills docs](https://eve.dev/docs/skills) load on demand via `load_skill`. Keeps instructions lean while giving the model a detailed curation procedure during digest runs.

---

## R7: Instructions Workflow

**Decision**: `agent/instructions.md` documents the end-to-end digest pipeline: on schedule trigger → call `fetch_tech_news` → load `research` skill → filter → categorize (Infrastructure, AI, Backend, etc.) → synthesize punchy Discord markdown (bold headers, bullets, links) → deliver via channel.

**Rationale**: Instructions are always-on system prompt per Eve layout. Schedule handler message can reinforce the same workflow for task-mode clarity.

---

## R8: Build & Verification

**Decision**: Verify with `npm run build` or `npx eve build` plus TypeScript check (`tsc --noEmit` if configured). Run dev schedule dispatch curl to smoke-test tool + session start.

**Rationale**: Spec SC-006 requires clean build on first setup. Eve compiles agent surface to `.eve/`.

---

## R9: Testing Strategy

**Decision**: Manual verification for v1: (1) unit-level tool test via dev TUI or HTTP session asking to call tool, (2) schedule dispatch in dev, (3) optional mocked fetch for CI later. No automated test suite in initial scope unless tasks phase adds it.

**Rationale**: Greenfield Eve agent; constitution template not ratified with TDD mandate. Focus on compile + integration smoke per spec success criteria.

---

## R10: YouTube Must-Watch via Operator Channel IDs

**Decision**: Add `agent/lib/youtube-config.ts` with `YOUTUBE_CHANNEL_IDS: readonly string[]` (operator-editable) and `fetch_youtube_videos.ts` tool that polls each channel's public Atom RSS feed:

```
GET https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}
```

Filter entries to `YOUTUBE_LOOKBACK_HOURS` (default 48). Agent selects up to 3 **must-watch** picks after applying `research` skill. Optional env override: `YOUTUBE_CHANNEL_IDS=UCaaa,UCbbb`.

**Rationale**: Operator-specified channel IDs match the user's request for a personal watchlist—no global YouTube trending or search API. RSS requires no API key and avoids quota limits. Channel ID is stable (unlike @handles).

**Alternatives considered**:
- YouTube Data API search — quota-heavy, broader discovery than needed.
- Hardcoded channel list in tool code — not operator-configurable.
- @handle-based URLs — less stable; channel ID preferred.

**Finding channel IDs**: YouTube channel page → View Page Source → search `channel_id=`, or use the channel's `/about` page URL when logged in.

---

## Summary Table

| Topic | Choice |
|-------|--------|
| Package | `eve`, `ai`, `zod` |
| Config | `agent/agent.ts` |
| Model | `openai/gpt-4o` (or gateway alias) |
| Discord | `agent/channels/discord.ts` + env credentials |
| Channel ID | Constant `123456789012345678` (placeholder) |
| Schedule | `agent/schedules/daily-digest.ts`, cron `0 8 * * *` |
| Tool (news) | `agent/tools/fetch_tech_news.ts` |
| Tool (video) | `agent/tools/fetch_youtube_videos.ts` |
| YouTube config | `agent/lib/youtube-config.ts` — `YOUTUBE_CHANNEL_IDS[]` |
| Skill | `agent/skills/research.md` |
| News API | HN Algolia front_page, 15 hits |
| Video feed | YouTube RSS per channel ID, 48h lookback |
