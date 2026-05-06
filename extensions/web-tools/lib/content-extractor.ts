import { ProxyAgent, request } from "undici";

function getDispatcher() {
  const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY ||
                   process.env.http_proxy || process.env.HTTP_PROXY;
  if (proxyUrl) {
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

export async function fetchContent(
  url: string,
  format: "markdown" | "text" | "html",
  maxLength: number,
  signal?: AbortSignal
): Promise<string> {
  const html = await fetchHtml(url, signal);
  
  let content: string;
  switch (format) {
    case "html":
      content = html;
      break;
    case "text":
      content = extractText(html);
      break;
    case "markdown":
    default:
      content = htmlToMarkdown(html);
      break;
  }

  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + 
      `\n\n[Content truncated: ${content.length} chars total]`;
  }

  return content;
}

async function fetchHtml(url: string, signal?: AbortSignal): Promise<string> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (compatible; pi-web-tools/1.0)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  const dispatcher = getDispatcher();
  if (dispatcher) {
    const resp = await request(url, {
      method: "GET",
      headers,
      signal,
      dispatcher,
      redirect: "follow",
    });
    if (resp.statusCode < 200 || resp.statusCode >= 400) {
      throw new Error(`HTTP ${resp.statusCode}`);
    }
    return resp.body.text();
  }

  // No proxy - use global fetch
  const response = await fetch(url, {
    headers,
    redirect: "follow",
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function extractText(html: string): string {
  return html
    .replace(/<script[^\u003e]*>[\s\S]*?\u003c\/script>/gi, " ")
    .replace(/<style[^\u003e]*>[\s\S]*?\u003c\/style>/gi, " ")
    .replace(/<[^\u003e]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToMarkdown(html: string): string {
  let md = html
    .replace(/<script[^\u003e]*>[\s\S]*?\u003c\/script>/gi, "")
    .replace(/<style[^\u003e]*>[\s\S]*?\u003c\/style>/gi, "")
    .replace(/<h1[^\u003e]*>(.*?)\u003c\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^\u003e]*>(.*?)\u003c\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^\u003e]*>(.*?)\u003c\/h3>/gi, "\n### $1\n")
    .replace(/<h4[^\u003e]*>(.*?)\u003c\/h4>/gi, "\n#### $1\n")
    .replace(/<h5[^\u003e]*>(.*?)\u003c\/h5>/gi, "\n##### $1\n")
    .replace(/<h6[^\u003e]*>(.*?)\u003c\/h6>/gi, "\n###### $1\n")
    .replace(/<strong[^\u003e]*>(.*?)\u003c\/strong>/gi, "**$1**")
    .replace(/<b[^\u003e]*>(.*?)\u003c\/b>/gi, "**$1**")
    .replace(/<em[^\u003e]*>(.*?)\u003c\/em>/gi, "*$1*")
    .replace(/<i[^\u003e]*>(.*?)\u003c\/i>/gi, "*$1*")
    .replace(/<a[^\u003e]+href="([^"]+)"[^\u003e]*>(.*?)\u003c\/a>/gi, "[$2]($1)")
    .replace(/<img[^\u003e]+src="([^"]+)"[^\u003e]*alt="([^"]*)"[^\u003e]*>/gi, "![$2]($1)")
    .replace(/<img[^\u003e]+alt="([^"]*)"[^\u003e]*src="([^"]+)"[^\u003e]*>/gi, "![$1]($2)")
    .replace(/<img[^\u003e]+src="([^"]+)"[^\u003e]*>/gi, "![]($1)")
    .replace(/<code[^\u003e]*>(.*?)\u003c\/code>/gi, "`$1`")
    .replace(/<pre[^\u003e]*>(.*?)\u003c\/pre>/gi, "\n```\n$1\n```\n")
    .replace(/<li[^\u003e]*>(.*?)\u003c\/li>/gi, "- $1\n")
    .replace(/<ul[^\u003e]*>|\u003c\/ul>/gi, "\n")
    .replace(/<ol[^\u003e]*>|\u003c\/ol>/gi, "\n")
    .replace(/<p[^\u003e]*>(.*?)\u003c\/p>/gi, "\n$1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<div[^\u003e]*>(.*?)\u003c\/div>/gi, "\n$1\n")
    .replace(/<[^\u003e]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, "...")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/\n\s*\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  return md;
}
