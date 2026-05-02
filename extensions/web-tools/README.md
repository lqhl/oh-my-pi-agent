# Pi Web Tools

Web search and fetch extension for [pi](https://github.com/badlogic/pi-mono) coding agent.

## Features

- **`web_search`** - Search the web using Brave Search API
- **`web_fetch`** - Fetch and extract content from any URL

## Installation

```bash
# Clone to extensions directory
git clone https://github.com/yourusername/pi-web-tools ~/.pi/agent/extensions/web-tools

# Or manually copy files
mkdir -p ~/.pi/agent/extensions/web-tools
cp -r * ~/.pi/agent/extensions/web-tools/
```

## Configuration

Set your Brave Search API key:

```bash
export BRAVE_API_KEY="your_api_key_here"
```

Get a free API key at [https://brave.com/search/api/](https://brave.com/search/api/)

Or use the configuration command:

```
pi /web-config
```

## Usage

Once configured, the tools are automatically available to the LLM:

```
You: What are the new features in TypeScript 5.5?
LLM: [uses web_search to find current information]

You: Summarize this article: https://example.com/blog/post
LLM: [uses web_fetch to extract content]
```

### Manual Tool Calls

You can also explicitly request tool usage:

```
/web_search "vite 6 release notes"
/web_fetch https://github.com/vitejs/vite/releases
```

## Tools Reference

### web_search

Search the web for current information.

**Parameters:**
- `query` (string, required): Search query
- `count` (number, optional): Number of results (default: 10, max: 20)
- `include_content` (boolean, optional): Include page content snippets (default: false)

### web_fetch

Fetch content from a URL.

**Parameters:**
- `url` (string, required): URL to fetch
- `format` (string, optional): Output format - `markdown`, `text`, or `html` (default: markdown)
- `max_length` (number, optional): Maximum characters to return (default: 50000)

## Troubleshooting

**"BRAVE_API_KEY not configured"**
- Set the environment variable: `export BRAVE_API_KEY="xxx"`
- Run `/web-config` for setup instructions

**Search returns no results**
- Check your API key is valid
- Verify network connectivity
- Check Brave Search API status

**Fetch timeout**
- Some websites block automated requests
- Try a different URL
- Check the site is accessible

## License

MIT
