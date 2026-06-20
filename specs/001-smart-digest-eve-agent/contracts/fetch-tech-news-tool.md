# Contract: fetch_tech_news Tool

**Tool name**: `fetch_tech_news` (from `agent/tools/fetch_tech_news.ts`)  
**Framework**: Eve `defineTool`

## Input Schema

```typescript
z.object({})  // no parameters
```

## Output Schema

```typescript
{
  stories: Array<{
    title: string;
    url: string;
    points: number;
    objectId?: string;
  }>;
  fetchedAt: string;   // ISO 8601
  source: "hn_algolia_front_page";
}
```

## Example Output

```json
{
  "stories": [
    {
      "title": "Show HN: A new Sidekiq monitoring dashboard",
      "url": "https://example.com/sidekiq-dashboard",
      "points": 142,
      "objectId": "39876543"
    },
    {
      "title": "Ask HN: Best practices for Redis cluster failover?",
      "url": "https://news.ycombinator.com/item?id=39876544",
      "points": 89,
      "objectId": "39876544"
    }
  ],
  "fetchedAt": "2026-06-20T08:00:01.234Z",
  "source": "hn_algolia_front_page"
}
```

## Behavior Contract

1. MUST perform a live HTTP GET to the HN Algolia front_page endpoint with `hitsPerPage=15`.
2. MUST NOT return stub or hardcoded placeholder data.
3. MUST normalize each hit to `{ title, url, points }` with URL fallback for null `url`.
4. MUST skip hits missing a non-empty title.
5. MUST return at most 15 stories.
6. MAY include `objectId` for traceability.

## Errors

| Error | Tool response |
|-------|---------------|
| Fetch failure | Throw `Error` with message including HTTP status or network cause |
| JSON parse failure | Throw `Error("Invalid Algolia response")` |

## Model-facing Description

> Fetch the current top 15 Hacker News front-page stories. Returns title, URL, and points for each story.
