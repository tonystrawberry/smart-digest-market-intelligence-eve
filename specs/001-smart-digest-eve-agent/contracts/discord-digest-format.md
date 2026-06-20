# Contract: Discord Digest Message Format

**Channel**: Configured Discord text channel  
**Max length**: 2000 characters per message (Discord limit; Eve splits automatically)

## Structure

```markdown
**Smart Digest — {YYYY-MM-DD}**

**Infrastructure**
• {title} ({points} pts) — {url}
• ...

**AI**
• {title} ({points} pts) — {url}

**Backend**
• ...

**Must-Watch**
• *{title}* — {channelName} — {url}
  Why: {one-line engineering value}
```

## Formatting Rules

| Element | Format |
|---------|--------|
| Digest title | `**Smart Digest — {date}**` |
| Category header | `**{Category Name}**` on its own line |
| Story line | `• {title} ({points} pts) — {url}` |
| Must-Watch header | `**Must-Watch**` (omit section if no videos pass filter) |
| Video line | `• *{title}* — {channelName} — {url}` then indented `Why: {whyWatch}` |
| Empty digest | `**Smart Digest — {date}**\n\nNo high-signal engineering items today.` |

## Content Rules

1. Only include stories that pass the research lens filter.
2. Group news into 1–4 engineering categories; omit empty categories.
3. Include up to **3** must-watch videos that pass the video filter; omit section if none qualify.
4. Include working URLs for every bullet.
5. Each video MUST include a one-line **Why** explaining engineer-growth value.
6. Keep synthesis punchy; prefer scannable bullets over paragraphs.
7. Do not use `@everyone` or role mentions unless explicitly configured later.

## Example

```markdown
**Smart Digest — 2026-06-20**

**Infrastructure**
• Redis 8 cluster mode improvements (312 pts) — https://example.com/redis-8
• Running Sidekiq at scale on ECS (198 pts) — https://example.com/sidekiq-ecs

**AI**
• A practical guide to agent eval harnesses (245 pts) — https://example.com/agent-evals

**Must-Watch**
• *Running Redis Cluster in Production* — AWS Developers — https://youtube.com/watch?v=...
  Why: Concrete failover patterns applicable to any distributed cache layer.
```
