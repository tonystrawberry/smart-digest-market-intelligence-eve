# Contract: daily-digest Schedule

**Schedule ID**: `daily-digest` (from `agent/schedules/daily-digest.ts`)

## Cron

```
0 8 * * *
```

Five-field cron (minute hour day-of-month month day-of-week). On Vercel, evaluated in UTC.

## Handler Contract

```typescript
defineSchedule({
  cron: "0 8 * * *",
  async run({ receive, waitUntil, appAuth }) {
    waitUntil(
      receive(discord, {
        message: "<digest workflow prompt>",
        target: { channelId: DIGEST_CHANNEL_ID },
        auth: appAuth,
      }),
    );
  },
});
```

## Parameters

| Field | Value | Description |
|-------|-------|-------------|
| `cron` | `0 8 * * *` | Daily at 08:00 |
| `message` | Digest instruction string | Tells agent to run full workflow (fetch → filter → post) |
| `target.channelId` | `123456789012345678` | Placeholder; operator replaces at deploy |
| `auth` | `appAuth` | App principal for scheduled runs |

## Expected Agent Behavior on Trigger

1. Call `fetch_tech_news` tool
2. Call `fetch_youtube_videos` tool (uses operator-configured channel IDs)
3. Load `research` skill for filtering criteria
4. Filter and categorize high-signal stories; select up to 3 must-watch videos with "why watch"
5. Compose Discord markdown digest (news categories + optional **Must-Watch** section)
6. Deliver to configured channel (via Discord channel events / proactive session)

## Dev Dispatch

```
POST /eve/v1/dev/schedules/daily-digest
→ { "scheduleId": "daily-digest", "sessionIds": ["..."] }
```

Available only during `eve dev`.

## Failure Modes

| Failure | Expected outcome |
|---------|------------------|
| Discord credentials missing | Session fails; error logged |
| Fetch tool fails | Agent posts error notice or fails session visibly |
| YouTube fetch partial failure | Continue with news; include videos from successful channels |
| No stories or videos pass filter | Post "no high-signal items today" message |
