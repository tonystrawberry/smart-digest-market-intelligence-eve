# Contract: fetch_youtube_videos Tool

**Tool name**: `fetch_youtube_videos` (from `agent/tools/fetch_youtube_videos.ts`)  
**Framework**: Eve `defineTool`  
**Config**: [youtube-watchlist-config.md](./youtube-watchlist-config.md)

## Input Schema

```typescript
z.object({})  // no parameters; channel list read from config
```

## Output Schema

```typescript
{
  videos: Array<{
    title: string;
    url: string;
    channelId: string;
    channelName: string;
    publishedAt: string;  // ISO 8601
  }>;
  fetchedAt: string;      // ISO 8601
  channelsChecked: number;
}
```

## Fetch Behavior

For each channel ID in `YOUTUBE_CHANNEL_IDS` (or env override):

```
GET https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}
```

Parse Atom XML (`entry` elements):

| RSS/Atom field | Maps to |
|----------------|---------|
| `entry.title` | `title` |
| `entry.link[@href]` or `entry.id` | `url` |
| `entry.author.name` | `channelName` |
| watchlist ID | `channelId` |
| `entry.published` | `publishedAt` |

Filter: keep entries where `publishedAt` is within `YOUTUBE_LOOKBACK_HOURS` of fetch time.

## Example Output

```json
{
  "videos": [
    {
      "title": "How we run Sidekiq at scale",
      "url": "https://www.youtube.com/watch?v=abc123",
      "channelId": "UCxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "channelName": "Stripe",
      "publishedAt": "2026-06-19T14:30:00.000Z"
    }
  ],
  "fetchedAt": "2026-06-20T08:00:02.000Z",
  "channelsChecked": 3
}
```

## Behavior Contract

1. MUST read channel IDs from `youtube-config.ts` (env override when set).
2. MUST perform live HTTP GET per configured channel (no stub data).
3. MUST NOT use YouTube search/trending APIs.
4. MUST skip channels that fail fetch; continue with others.
5. MUST return all videos within lookback window (agent filters to max 3 must-watch picks).

## Errors

| Condition | Behavior |
|-----------|----------|
| All channel fetches fail | Throw with aggregate error message |
| Single channel fails | Skip channel; include others in result |
| Empty watchlist | Return `{ videos: [], channelsChecked: 0, fetchedAt }` |

## Model-facing Description

> Fetch recent uploads from the operator-configured YouTube channel watchlist. Returns title, URL, channel name, and publish time for each video within the lookback window.
