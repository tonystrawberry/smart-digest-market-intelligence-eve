# Contract: YouTube Watchlist Configuration

**Location**: `agent/lib/youtube-config.ts`  
**Override**: Environment variable `YOUTUBE_CHANNEL_IDS` (optional)

## Purpose

Allow the operator to specify which YouTube channels the digest monitors for new **must-watch** engineering videos.

## Configuration File Shape

```typescript
/** YouTube channel IDs to poll (UC + 22 chars). Edit this list to add/remove channels. */
export const YOUTUBE_CHANNEL_IDS = [
  "UCxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "UCyyyyyyyyyyyyyyyyyyyyyyyyyy",
] as const;

/** Only surface uploads newer than this many hours before digest run. */
export const YOUTUBE_LOOKBACK_HOURS = 48;
```

## Environment Override

When `process.env.YOUTUBE_CHANNEL_IDS` is set:

```
YOUTUBE_CHANNEL_IDS=UCaaa...,UCbbb...
```

- Split on comma, trim whitespace, use as watchlist instead of file array
- Useful for deployment without editing source

## Validation

| Rule | Behavior |
|------|----------|
| Empty watchlist | Valid; `fetch_youtube_videos` returns `{ videos: [], channelsChecked: 0 }` |
| Invalid ID format | Tool skips invalid entries and logs warning (does not crash) |
| Duplicate IDs | Deduplicate before fetch |

## Finding a Channel ID

1. Open the channel on YouTube  
2. View page source → search `channel_id=`  
3. Or use the channel URL from YouTube Studio / About page  

Channel IDs start with `UC` and are 24 characters total.

## Operator Workflow

1. Add channel ID to `YOUTUBE_CHANNEL_IDS` in `youtube-config.ts`  
2. Redeploy or restart agent  
3. Next digest includes new uploads from that channel (within lookback window)

No YouTube Data API key required for this configuration model.
