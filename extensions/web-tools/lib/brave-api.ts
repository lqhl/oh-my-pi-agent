import { ProxyAgent, request } from "undici";

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  content?: string;
}

function getDispatcher() {
  const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY ||
                   process.env.http_proxy || process.env.HTTP_PROXY;
  if (proxyUrl) {
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

// Fetch wrapper that uses undici.request() when a proxy dispatcher is needed,
// because Node.js global fetch() is incompatible with external dispatchers.
async function proxyFetch(url: string, options: {
  headers?: Record<string, string>;
  signal?: AbortSignal;
} = {}): Promise<{ status: number; json(): Promise<any>; text(): Promise<string> }> {
  const dispatcher = getDispatcher();
  if (dispatcher) {
    const resp = await request(url, {
      method: "GET",
      headers: options.headers,
      signal: options.signal,
      dispatcher,
    });
    return {
      status: resp.statusCode,
      json: () => resp.body.json(),
      text: () => resp.body.text(),
    };
  }
  // No proxy - use global fetch
  return fetch(url, {
    method: "GET",
    headers: options.headers,
    signal: options.signal,
  });
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

  const response = await proxyFetch(url, {
    headers: {
      "X-Subscription-Token": apiKey,
      "Accept": "application/json",
    },
    signal,
  });

  if (response.status < 200 || response.status >= 300) {
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
