# Feature Specification: Smart Digest & Market Intelligence Discord Bot

**Feature Branch**: `001-smart-digest-eve-agent`

**Created**: 2026-06-20

**Status**: Draft

**Input**: User description: "Initialize a new agent project for a Smart Digest & Market Intelligence bot targeting Discord. Scaffold the agent with daily scheduled digest, front-page tech news fetch (top 15), research filtering skill, categorized synthesis, and Discord delivery."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Receive Daily Engineering Digest on Discord (Priority: P1)

As an engineering team member subscribed to the target Discord channel, I want a concise daily digest of high-signal technical news delivered every morning so I can stay informed on infrastructure, backend, and AI engineering trends without manually scanning multiple sources.

**Why this priority**: This is the core value proposition—automated, curated intelligence delivered where the team already collaborates.

**Independent Test**: Can be fully tested by triggering the scheduled digest workflow and verifying that a formatted message appears in the configured Discord channel within the expected delivery window.

**Acceptance Scenarios**:

1. **Given** the agent is deployed with a valid Discord channel configuration, **When** the daily schedule fires at 8:00 AM, **Then** a digest message is posted to that channel containing filtered, categorized story summaries with working links.
2. **Given** the schedule has fired, **When** the digest is delivered, **Then** the message uses clear formatting (bold section headers, bulleted items, and clickable links) readable on mobile and desktop Discord clients.
3. **Given** multiple high-signal stories exist, **When** the digest is composed, **Then** stories are grouped under engineering-relevant categories (e.g., Infrastructure, AI, Backend) rather than presented as a flat list.

---

### User Story 2 - Curated Filtering Over Raw Headlines (Priority: P2)

As an engineering leader, I want the digest to emphasize deep technical system changes, backend infrastructure, and AI agent engineering while excluding generic startup funding announcements and marketing hype so my attention goes to actionable engineering intelligence.

**Why this priority**: Raw news feeds are noisy; the filtering lens is what differentiates this bot from a simple reposter.

**Independent Test**: Can be tested by feeding a known set of front-page stories (mix of engineering depth and funding/marketing items) and verifying only high-signal items appear in the final digest with appropriate categorization.

**Acceptance Scenarios**:

1. **Given** a front-page batch containing both infrastructure posts (e.g., job queues, caching, cloud orchestration) and generic funding news, **When** the agent applies the research filtering criteria, **Then** infrastructure and backend topics are included and funding round announcements are excluded.
2. **Given** stories about AI agent frameworks and tooling, **When** filtering runs, **Then** AI agent engineering content is prioritized and included in the digest.
3. **Given** a story that is primarily product marketing with no technical substance, **When** filtering runs, **Then** that story is omitted from the digest.

---

### User Story 3 - Must-Watch Videos from My YouTube Channels (Priority: P3)

As a software engineer trying to grow my skills, I want the daily digest to surface new videos from YouTube channels I choose to follow so I do not miss high-value talks and deep dives without manually checking each channel.

**Why this priority**: Long-form engineering content complements headline news; operator-controlled channel lists keep signal high and personal.

**Independent Test**: Can be tested by configuring a known YouTube channel ID, invoking the video-fetch capability, and verifying new uploads from that channel appear in a **Must-Watch** digest section when they pass the research filter.

**Acceptance Scenarios**:

1. **Given** the operator has listed one or more YouTube channel IDs in configuration, **When** the digest workflow runs, **Then** the agent fetches recent uploads from only those configured channels.
2. **Given** a configured channel published a new engineering-relevant video within the lookback window, **When** filtering runs, **Then** the video appears under a **Must-Watch** section with title, link, and a one-line "why watch" synthesis.
3. **Given** the operator adds or removes a channel ID in configuration, **When** the next digest runs, **Then** the watch list reflects the updated set without code changes beyond configuration.

---

### User Story 4 - Reliable News Ingestion from Public Front Page (Priority: P4)

As the digest operator, I want the agent to pull the current top 15 front-page stories from a public tech news community feed so each digest reflects what practitioners are discussing today.

**Why this priority**: Ingestion is a prerequisite for filtering and synthesis; without reliable fetch and parsing, downstream curation cannot run.

**Independent Test**: Can be tested by invoking the news-fetch capability in isolation and confirming up to 15 stories are returned, each with a clean title, URL, and score/points value.

**Acceptance Scenarios**:

1. **Given** the public front-page feed is reachable, **When** the fetch capability runs, **Then** it returns up to 15 stories with title, URL, and points/score for each item.
2. **Given** the feed returns malformed or partial entries, **When** parsing completes, **Then** only well-formed stories are passed forward and parsing errors do not crash the workflow.
3. **Given** the feed is temporarily unavailable, **When** the scheduled run executes, **Then** the operator receives a clear failure indication rather than a silent no-op or corrupted message.

---

### Edge Cases

- What happens when none of the 15 fetched stories pass the filtering criteria? The agent should post a brief "no high-signal items today" message rather than skipping delivery entirely or sending an empty digest.
- What happens when the news source is down or rate-limited? The agent should fail gracefully with an operator-visible error and not post misleading content to Discord.
- What happens when the Discord channel is misconfigured or the bot lacks post permissions? The workflow should surface a delivery failure without retrying indefinitely.
- What happens when duplicate or near-duplicate stories appear across consecutive days? Each daily digest reflects that day's front page only; cross-day deduplication is out of scope for v1.
- What happens when a story title links to a discussion thread versus an external article? The digest should still include the link and title as fetched, letting readers decide whether to follow.
- What happens when a configured YouTube channel has no new uploads in the lookback window? Omit that channel silently; do not post placeholder video entries.
- What happens when the operator configures zero YouTube channel IDs? Skip the **Must-Watch** section entirely; the news digest still runs normally.
- What happens when YouTube RSS is temporarily unavailable for one channel? Continue with other channels and news sources; surface partial failure only if all video fetches fail.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a new agent project scaffold ready to run as a durable, scheduled bot connected to Discord.
- **FR-002**: System MUST target a single configured Discord channel for digest delivery (channel identifier supplied at deployment time).
- **FR-003**: System MUST run an automated daily digest workflow at 8:00 AM every day in the deployment environment's timezone.
- **FR-004**: System MUST fetch the top 15 current front-page stories from a public tech community news feed.
- **FR-005**: System MUST parse each fetched story into a structured record containing at minimum: title, URL, and points/score.
- **FR-006**: System MUST include a research skill document defining filtering criteria that prioritize deep technical system changes, backend infrastructure (job queues, caching layers, cloud orchestration services), and AI agent engineering.
- **FR-007**: System MUST instruct the agent to exclude generic startup funding news and marketing hype from the digest output.
- **FR-008**: System MUST include agent instructions describing the end-to-end workflow: wake on schedule trigger → fetch stories → apply research filter → group high-signal items into bulleted engineering categories → post a punchy synthesis to Discord using clean, readable message formatting.
- **FR-009**: System MUST expose a dedicated fetch capability that performs news retrieval and parsing with real logic (no stub or placeholder behavior in production paths).
- **FR-010**: System MUST configure the agent with a capable language model suitable for summarization and categorization tasks.
- **FR-011**: System MUST produce a clean project structure that builds successfully on first clone and dependency install.
- **FR-012**: Digest messages MUST use readable formatting: bold headers for categories, bulleted lists for items, and clear hyperlinks to source URLs.
- **FR-013**: System MUST allow the operator to specify a list of YouTube channel IDs to monitor (add, remove, or replace entries in configuration).
- **FR-014**: System MUST fetch recent uploads from each configured YouTube channel using a public feed mechanism that does not require global YouTube search or trending discovery.
- **FR-015**: System MUST expose a dedicated video-fetch capability that returns structured video records (title, URL, channel identity, publish time) with real logic—no stub data.
- **FR-016**: System MUST apply the research lens to video candidates and include up to three **must-watch** picks in the digest when they meet engineer-growth criteria (actionable depth, not hype or entertainment).
- **FR-017**: Each included video MUST show a one-line "why watch" synthesis explaining its engineering value.

### Key Entities

- **Story**: A single news item with title, URL, and community score/points as returned from the front-page feed.
- **YouTube Watchlist**: Operator-configured list of YouTube channel IDs to monitor for new uploads.
- **Video**: A YouTube upload with title, URL, channel ID, channel name, and publish timestamp.
- **Research Lens**: Documented filtering criteria defining what counts as high-signal engineering content versus noise to exclude (applies to both articles and videos).
- **Digest**: The composed daily output—a categorized news summary plus an optional **Must-Watch** video section, formatted for Discord delivery.
- **Schedule**: A daily trigger at 8:00 AM that initiates the digest workflow without manual intervention.
- **Channel Target**: The Discord channel identifier where all digest messages are posted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On 95% of scheduled days over a two-week observation period, a digest message (or explicit "no high-signal items" notice) appears in the target Discord channel within 5 minutes of the 8:00 AM scheduled time.
- **SC-002**: Each successful digest reviews exactly the top 15 front-page stories before filtering—no more, no fewer fetched for curation.
- **SC-003**: In a blind review of 10 digest outputs, at least 8 are rated "engineering-relevant" by a technical reviewer (funding round and pure marketing items absent unless they contain substantive technical detail).
- **SC-004**: A team member can scan a typical digest and identify actionable items in under 2 minutes without opening external references first.
- **SC-005**: 100% of links included in a digest resolve to valid URLs (no broken or missing links in the posted message).
- **SC-006**: The project scaffold passes a clean build verification on first setup with zero compilation or configuration errors.
- **SC-007**: When a configured YouTube channel publishes an engineering-relevant video within the lookback window, it appears in the **Must-Watch** section on the next scheduled digest at least 90% of the time in a two-week test period.
- **SC-008**: The digest includes at most three **must-watch** video picks per day to remain scannable.

## Assumptions

- Discord bot credentials and channel permissions are configured by the operator outside this specification; the feature supplies a placeholder channel identifier to be replaced at deploy time.
- YouTube channel IDs are supplied by the operator in a dedicated configuration file (with optional environment-variable override for deployment); no YouTube Data API key is required for v1 (public per-channel RSS feeds).
- Video lookback window defaults to the last 48 hours relative to digest run time; operator may adjust in configuration.
- The daily 8:00 AM schedule uses the timezone of the environment where the agent is deployed unless the operator configures otherwise.
- The public tech community front-page feed remains accessible for read-only queries without special authentication.
- Digest content is English-only for the initial release.
- One digest run per day is sufficient; intraday updates or on-demand digests are out of scope for v1.
- The agent platform handles session durability, schedule invocation, and Discord integration according to its standard project conventions.
