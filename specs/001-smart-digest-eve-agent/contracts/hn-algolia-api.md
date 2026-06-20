# Contract: HN Algolia Front Page API (External)

**Provider**: Hacker News Algolia Search API  
**Base URL**: `https://hn.algolia.com/api/v1`  
**Auth**: None required

## Endpoint

```
GET /search?tags=front_page&hitsPerPage=15
```

## Request Parameters

| Parameter | Value | Required |
|-----------|-------|----------|
| `tags` | `front_page` | yes |
| `hitsPerPage` | `15` | yes |

## Response Shape

```json
{
  "hits": [
    {
      "objectID": "37392676",
      "title": "Example story title",
      "url": "https://example.com/article",
      "author": "username",
      "points": 284,
      "num_comments": 47,
      "created_at": "2023-09-05T15:00:00.000Z",
      "_tags": ["story", "front_page"]
    }
  ],
  "nbHits": 15,
  "page": 0,
  "nbPages": 1,
  "hitsPerPage": 15,
  "processingTimeMS": 1
}
```

## Fields Consumed by Agent

| Algolia field | Maps to | Notes |
|---------------|---------|-------|
| `title` | Story.title | Required on every hit |
| `url` | Story.url | May be null for Ask HN; fallback to `https://news.ycombinator.com/item?id={objectID}` |
| `points` | Story.points | Integer ≥ 0 |
| `objectID` | Story.objectId | HN item identifier |

## Error Handling

| Condition | Expected behavior |
|-----------|-------------------|
| HTTP non-2xx | Tool throws with status; agent reports fetch failure |
| Empty `hits` | Return `{ stories: [], fetchedAt, source }` |
| Missing `title` | Skip hit |
| Network timeout | Tool throws; no digest posted (or error notice) |

## Rate Limits

Public API; no documented hard limit for front_page queries at 1/day cadence. Tool should use standard fetch with reasonable timeout (e.g., 10s).
