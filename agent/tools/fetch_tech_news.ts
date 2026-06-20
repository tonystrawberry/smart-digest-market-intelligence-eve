import { defineTool } from "eve/tools";
import { z } from "zod";

const HN_ALGOLIA_URL =
  "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=15";

interface AlgoliaHit {
  objectID?: string;
  title?: string;
  url?: string | null;
  points?: number;
}

interface AlgoliaResponse {
  hits?: AlgoliaHit[];
}

function storyUrl(hit: AlgoliaHit): string | null {
  const title = hit.title?.trim();
  if (!title) return null;

  const external = hit.url?.trim();
  if (external) return external;

  if (hit.objectID) {
    return `https://news.ycombinator.com/item?id=${hit.objectID}`;
  }

  return null;
}

export default defineTool({
  description:
    "Fetch the current top 15 Hacker News front-page stories. Returns title, URL, and points for each story.",
  inputSchema: z.object({}),
  async execute() {
    const response = await fetch(HN_ALGOLIA_URL, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `HN Algolia request failed: ${response.status} ${response.statusText}`,
      );
    }

    let data: AlgoliaResponse;
    try {
      data = (await response.json()) as AlgoliaResponse;
    } catch {
      throw new Error("Invalid Algolia response");
    }

    const stories = (data.hits ?? [])
      .slice(0, 15)
      .map((hit) => {
        const title = hit.title?.trim();
        const url = storyUrl(hit);
        if (!title || !url) return null;

        return {
          title,
          url,
          points: typeof hit.points === "number" ? hit.points : 0,
          ...(hit.objectID ? { objectId: hit.objectID } : {}),
        };
      })
      .filter((story): story is NonNullable<typeof story> => story !== null);

    return {
      stories,
      fetchedAt: new Date().toISOString(),
      source: "hn_algolia_front_page" as const,
    };
  },
});
