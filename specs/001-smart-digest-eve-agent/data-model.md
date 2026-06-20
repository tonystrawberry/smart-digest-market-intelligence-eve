# Data Model: Smart Digest & Market Intelligence Discord Bot

**Feature**: `001-smart-digest-eve-agent`  
**Date**: 2026-06-20

## Overview

This agent is stateless between digest runs for v1. Entities below describe runtime data shapes flowing through tools, the model, and Discord delivery—not persisted database records.

---

## Story

A single Hacker News front-page item after fetch and normalization.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Headline text, trimmed |
| `url` | string | yes | External article URL or HN item URL when external link is null |
| `points` | number | yes | Community score (upvotes) from Algolia `points` field |
| `objectId` | string | no | HN item ID (`objectID` from API); useful for dedup/debug |

**Validation rules**:
- `title` must be non-empty after trim
- `url` must be a valid HTTP/HTTPS URL
- `points` must be ≥ 0
- Malformed hits are skipped, not passed to the model

**Source mapping** (Algolia → Story):

```
hits[].title   → title
hits[].url     → url (fallback: https://news.ycombinator.com/item?id={objectID})
hits[].points  → points
hits[].objectID → objectId
```

---

## StoryBatch

Output of the fetch tool; input to filtering/synthesis.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stories` | Story[] | yes | Up to 15 normalized stories |
| `fetchedAt` | string (ISO 8601) | yes | Timestamp of fetch |
| `source` | string | yes | Constant `"hn_algolia_front_page"` |

**Validation rules**:
- `stories.length` ≤ 15
- All entries must pass Story validation

---

## DigestCategory

A labeled group of curated stories in the final output.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Category label (e.g., `Infrastructure`, `AI`, `Backend`) |
| `items` | DigestItem[] | yes | Filtered stories with optional one-line synthesis |

---

## DigestItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Story title |
| `url` | string | yes | Link included in Discord message |
| `points` | number | yes | Score for reader context |
| `summary` | string | no | One-line agent synthesis (optional) |

---

## Digest

The composed message payload before Discord formatting.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `headline` | string | yes | Digest title, e.g., "Smart Digest — {date}" |
| `categories` | DigestCategory[] | yes | Grouped high-signal news items |
| `mustWatch` | MustWatchItem[] | no | Up to 3 filtered videos; omitted if empty |
| `filteredCount` | number | yes | Stories included after filter |
| `reviewedCount` | number | yes | Stories fetched (expect 15) |

**Empty state**: When `filteredCount === 0` and `mustWatch` is empty, emit a single notice message: no high-signal items today (still counts as successful delivery per spec edge case).

---

## YouTubeWatchlist

Operator-configured list of channels to monitor. Defined in `agent/lib/youtube-config.ts`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `channelIds` | string[] | yes | YouTube channel IDs (e.g., `UC...`) |
| `lookbackHours` | number | yes | Default `48`; only videos newer than this window |

**Validation rules**:
- Each ID must match pattern `UC` + 22 base64url characters (YouTube channel ID format)
- Empty list is valid — video fetch returns no videos; digest skips **Must-Watch** section
- Env override `YOUTUBE_CHANNEL_IDS` replaces file list when set (comma-separated)

---

## Video

A YouTube upload from a watched channel after RSS fetch and normalization.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Video title, trimmed |
| `url` | string | yes | Canonical watch URL |
| `channelId` | string | yes | Source channel ID from watchlist |
| `channelName` | string | yes | Channel display name from RSS author |
| `publishedAt` | string (ISO 8601) | yes | Upload timestamp |

**Validation rules**:
- `title` non-empty; `url` must be HTTPS YouTube watch or youtu.be link
- `publishedAt` must fall within configured lookback window to be a candidate

---

## VideoBatch

Output of `fetch_youtube_videos` tool.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `videos` | Video[] | yes | Recent uploads across all configured channels |
| `fetchedAt` | string (ISO 8601) | yes | Timestamp of fetch |
| `channelsChecked` | number | yes | Count of channel IDs polled |

---

## MustWatchItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Video title |
| `url` | string | yes | Watch link |
| `channelName` | string | yes | Source channel |
| `whyWatch` | string | yes | One-line engineering value synthesis |

**Cap**: Maximum 3 items in final digest per SC-008.

---

## ResearchLens

Documented in `agent/skills/research.md` (not a runtime struct). Logical fields:

| Dimension | Include signals | Exclude signals |
|-----------|-----------------|-----------------|
| Depth | Architecture changes, system design posts, deep technical write-ups | Surface-level product announcements |
| Infrastructure | Job queues, caching, databases, cloud orchestration (ECS, SQS, Redis, Sidekiq, Rails backend) | Generic "we raised $X" funding |
| AI engineering | Agent frameworks, LLM tooling, eval harnesses, orchestration | AI marketing buzz without technical detail |
| Video | Conference talks, architecture deep dives, actionable engineering tutorials | Reaction videos, entertainment, sponsor-only pitches |
| Noise | — | Startup funding rounds, hype posts, pure marketing |

---

## ScheduleTrigger

Logical representation of the daily cron job.

| Field | Type | Value |
|-------|------|-------|
| `scheduleId` | string | `daily-digest` |
| `cron` | string | `0 8 * * *` |
| `timezoneNote` | string | UTC on Vercel; operator-adjustable |

**State transitions**:

```
[cron fires] → schedule handler runs
           → receive(discord, { message, target, auth })
           → agent session starts
           → fetch_tech_news tool executes
           → fetch_youtube_videos tool executes
           → research skill loaded
           → digest composed (news categories + must-watch videos)
           → message posted to Discord channel
           → session completes
```

---

## ChannelTarget

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `channelId` | string | yes | Discord snowflake; placeholder `123456789012345678` |

Used in schedule `receive(..., { target: { channelId } })`.

---

## Relationships

```text
ScheduleTrigger ──starts──▶ Agent Session
Agent Session ──calls──▶ fetch_tech_news ──returns──▶ StoryBatch
Agent Session ──calls──▶ fetch_youtube_videos ──returns──▶ VideoBatch
YouTubeWatchlist ──configures──▶ fetch_youtube_videos
Agent Session ──loads──▶ ResearchLens (skill)
StoryBatch + VideoBatch + ResearchLens ──curate──▶ Digest
Digest ──format──▶ Discord Markdown Message
ChannelTarget ──routes──▶ Discord delivery
```

---

## Environment Configuration (runtime, not persisted)

| Variable | Purpose |
|----------|---------|
| `DISCORD_PUBLIC_KEY` | Interaction signature verification |
| `DISCORD_APPLICATION_ID` | Application identity |
| `DISCORD_BOT_TOKEN` | Proactive messages + typing |
| `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY` | Model inference for gpt-4o |
| `YOUTUBE_CHANNEL_IDS` | Optional comma-separated override for watchlist |

Optional future: `DISCORD_DIGEST_CHANNEL_ID` to externalize placeholder Discord channel ID.
