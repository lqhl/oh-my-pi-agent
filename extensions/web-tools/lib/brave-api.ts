import { ProxyAgent } from "undici";

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  content?: string;
}

// 获取代理 dispatcher
function getDispatcher() {
  const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY ||
                   process.env.http_proxy || process.env.HTTP_PROXY;
  if (proxyUrl) {
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

export async function searchBrave(
  query: string,
  count: number,
  apiKey: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    count: Math.min(count, 20).toString(),
  });

  const url = `https://api.search.brave.com/res/v1/web/search?${params}`;
  const dispatcher = getDispatcher();
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Subscription-Token": apiKey,
      "Accept": "application/json",
    },
    signal,
    ...(dispatcher ? { dispatcher } : {}),
  } as any);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  const result = await response.json();
  const webResults = result.web?.results || [];

  return webResults.map((item: any) => ({
    title: item.title || "Untitled",
    url: item.url || "",
    description: item.description || "",
    content: item.extra_snippets?.join("\n") || undefined,
  }));
}
