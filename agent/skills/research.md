---
description: Apply engineer-growth filtering when curating the daily Smart Digest for articles and videos.
---

# Research Lens

Use this skill whenever composing the daily Smart Digest. Your job is to help the reader become a better software engineer—not to recap hype or headlines.

## Include (high signal)

- Deep technical system changes, architecture write-ups, and postmortems
- Backend infrastructure: Ruby on Rails, Sidekiq, Redis, PostgreSQL, job queues, caching
- Cloud and ops: AWS (ECS, SQS, Lambda), Kubernetes, observability, SLOs, incident response
- AI agent engineering: frameworks, eval harnesses, orchestration, tooling with implementation detail
- Conference talks and long-form videos that teach concrete techniques or tradeoffs

Ask: *Would a senior engineer learn something actionable from this?*

## Exclude (noise)

- Generic startup funding rounds ("raised $X Series B") unless the post contains substantive technical detail
- Product marketing and launch hype without engineering depth
- Generic listicles, hot takes, and reaction content
- Entertainment or "day in the life" videos with no technical substance

## Video-specific rules

- Prefer uploads from the configured watchlist within the lookback window
- Skip shorts and sponsor-only pitches unless technically substantive
- Maximum **3** must-watch picks per digest
- Each pick needs a one-line **Why:** explaining engineering value

## News categorization

Group surviving stories under 1–4 bold headers such as:

- **Infrastructure**
- **Backend**
- **AI**
- **Reliability & Operations**
- **Security**

Omit empty categories.
