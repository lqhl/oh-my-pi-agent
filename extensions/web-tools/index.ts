import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text } from "@mariozechner/pi-tui";
import { searchBrave } from "./lib/brave-api";
import { fetchContent } from "./lib/content-extractor";

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

function hasApiKey(): boolean {
  return !!BRAVE_API_KEY && BRAVE_API_KEY.length > 0;
}

// Log extension load
console.log("[web-tools] Extension loading...");
console.log("[web-tools] BRAVE_API_KEY present:", hasApiKey());
console.log("[web-tools] https_proxy:", process.env.https_proxy);

export default function (pi: ExtensionAPI) {
  console.log("[web-tools] Extension factory called");
  // 注册 web_search 工具
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using Brave Search API. Use for finding documentation, current information, error solutions, version details, and any facts that may have changed after the knowledge cutoff.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      count: Type.Optional(Type.Number({ default: 10, maximum: 20 })),
      include_content: Type.Optional(Type.Boolean({ default: false, description: "Include page content snippets" })),
    }),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      console.log("[web_search] Starting search for:", params.query);
      console.log("[web_search] Proxy:", process.env.https_proxy || "none");
      
      if (!hasApiKey()) {
        return {
          content: [{ type: "text", text: "Error: BRAVE_API_KEY not configured. Get one at https://brave.com/search/api/ or run /web-config" }],
          isError: true,
        };
      }

      onUpdate?.({ content: [{ type: "text", text: `Searching: ${params.query}` }] });

      try {
        const results = await searchBrave(
          params.query,
          params.count ?? 10,
          BRAVE_API_KEY!,
          signal
        );

        const formatted = formatSearchResults(results, params.include_content ?? false);

        return {
          content: [{ type: "text", text: formatted }],
          details: { results, query: params.query, count: results.length },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log("[web_search] Error:", message);
        return {
          content: [{ type: "text", text: `Search failed: ${message}` }],
          isError: true,
        };
      }
    },

    renderCall(args, theme) {
      const text = theme.fg("toolTitle", "web_search") + " " + theme.fg("dim", `"${args.query}"`);
      return new Text(text, 0, 0);
    },

    renderResult(result, options, theme) {
      if (result.isError) {
        return new Text(theme.fg("error", result.content[0].text), 0, 0);
      }
      const count = result.details?.count ?? 0;
      return new Text(theme.fg("success", `Found ${count} results`), 0, 0);
    },
  });

  // 注册 web_fetch 工具
  pi.registerTool({
    name: "web_fetch",
    label: "Web Fetch",
    description: "Fetch and extract content from a URL. Use for reading documentation pages, articles, release notes, and any web content needed for the task.",
    parameters: Type.Object({
      url: Type.String({ description: "URL to fetch" }),
      format: Type.Optional(Type.String({ default: "markdown", description: "Output format: markdown, text, or html" })),
      max_length: Type.Optional(Type.Number({ default: 50000, description: "Maximum characters to return" })),
    }),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      onUpdate?.({ content: [{ type: "text", text: `Fetching: ${params.url}` }] });

      try {
        const format = (params.format as "markdown" | "text" | "html") ?? "markdown";
        const content = await fetchContent(
          params.url,
          format,
          params.max_length ?? 50000,
          signal
        );

        return {
          content: [{ type: "text", text: content }],
          details: { url: params.url, length: content.length, format },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Fetch failed: ${message}` }],
          isError: true,
        };
      }
    },

    renderCall(args, theme) {
      const text = theme.fg("toolTitle", "web_fetch") + " " + theme.fg("dim", args.url);
      return new Text(text, 0, 0);
    },

    renderResult(result, options, theme) {
      if (result.isError) {
        return new Text(theme.fg("error", result.content[0].text), 0, 0);
      }
      const length = result.details?.length ?? 0;
      const format = result.details?.format ?? "markdown";
      return new Text(theme.fg("success", `Fetched ${length} chars (${format})`), 0, 0);
    },
  });

  // 注册配置命令
  pi.registerCommand("web-config", {
    description: "Configure web tools (Brave API key)",
    handler: async (args, ctx) => {
      if (!ctx.hasUI) {
        console.log("Web Tools Configuration");
        console.log("======================");
        console.log("Set BRAVE_API_KEY environment variable to enable web search.");
        console.log("Get your API key at: https://brave.com/search/api/");
        console.log("");
        console.log(`Current status: ${hasApiKey() ? "✓ Configured" : "✗ Not configured"}`);
        return;
      }

      const current = hasApiKey() ? "Configured" : "Not configured";
      ctx.ui.notify(`Web Tools: ${current}`, hasApiKey() ? "success" : "warning");

      if (!hasApiKey()) {
        const openBrowser = await ctx.ui.confirm(
          "Configure Web Tools",
          "Open Brave Search API page to get a key?"
        );
        if (openBrowser) {
          ctx.ui.notify("Please visit: https://brave.com/search/api/", "info");
          ctx.ui.notify("Then set BRAVE_API_KEY environment variable", "info");
        }
      }
    },
  });

  // 会话启动通知
  pi.on("session_start", async (_event, ctx) => {
    if (hasApiKey()) {
      ctx.ui.setStatus("web-tools", "● web");
    }
  });

  // 格式化搜索结果
  function formatSearchResults(results: SearchResult[], includeContent: boolean): string {
    if (results.length === 0) {
      return "No results found.";
    }

    const lines: string[] = [];
    for (const result of results) {
      lines.push(`## ${result.title}`);
      lines.push(`URL: ${result.url}`);
      if (result.description) {
        lines.push(result.description);
      }
      if (includeContent && result.content) {
        lines.push("");
        lines.push("Content:");
        lines.push(result.content.substring(0, 500));
        if (result.content.length > 500) {
          lines.push("...");
        }
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    }
    return lines.join("\n");
  }
}

interface SearchResult {
  title: string;
  url: string;
  description: string;
  content?: string;
}
