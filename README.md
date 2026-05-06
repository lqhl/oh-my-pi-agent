# oh-my-pi-agent

My personal [pi coding agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) dotfile configuration. Drop it into `~/.pi/agent/` and you're up and running with a fully tricked-out terminal AI coding assistant.

## Overview

| What | Where | Description |
|------|-------|-------------|
| Agents | `agents/` | Specialized subagents (planner, reviewer, scout, worker) |
| Extensions | `extensions/` | 18+ TUI extensions for safety, UX, and workflows |
| Prompts | `prompts/` | Multi-agent workflow templates (scout→plan→implement→review) |
| Skills | `skills/` | 35+ installable skills for external services |
| Settings | `settings.json` | Provider, model, and thinking configuration |
| Keybindings | `keybindings.json` | Custom TUI keyboard shortcuts |

## Quick Start

```bash
git clone git@github.com:lqhl/oh-my-pi-agent.git ~/.pi/agent
cd ~/.pi/agent && npm install
```

Run `pi` and you're ready to go.

## Agents

Custom subagents that execute with isolated context windows via `subagent()`:

| Agent | Purpose |
|-------|---------|
| **scout** | Fast codebase reconnaissance — finds relevant files, types, and dependencies |
| **planner** | Converts scout findings into numbered, actionable implementation plans |
| **worker** | General-purpose implementation agent with full tool access |
| **reviewer** | Code review specialist — checks diffs for bugs, security issues, code smells |

### Workflows

Multi-agent chains defined as prompt templates:

- **Scout & Plan** — Scout gathers context, planner creates a plan (no implementation). Use for exploration.
- **Implement** — Worker executes a task in isolation.
- **Implement & Review** — Worker implements, reviewer inspects, worker applies feedback.

## Extensions

### Safety & Guardrails

| Extension | What it does |
|-----------|-------------|
| `confirm-destructive` | Prompts before clearing/switching sessions |
| `dirty-repo-guard` | Blocks session changes when there are uncommitted git changes |
| `permission-gate` | Confirms before running `rm -rf`, `sudo`, `chmod 777` |
| `protected-paths` | Blocks writes/edits to `.env`, `.git/`, `node_modules/` |

### Workflow & UX

| Extension | What it does |
|-----------|-------------|
| `custom-footer` | Rich TUI footer with git branch, token usage, extension statuses |
| `handoff` | Transfers conversation context into a new focused session |
| `interactive-shell` | Runs interactive commands (`vim`, `git rebase -i`) with full terminal access |
| `notify` | Native desktop notifications when the agent finishes and waits for input |
| `peon-ping` | Plays sound notifications on agent events |
| `session-name` | Friendly session names in the session picker |
| `ssh` | Delegates read/write/edit/bash to remote machines via SSH |
| `status-line` | Persistent status bar with turn progress and themed colors |
| `todo` | Persistent todo list stored in session state (survives branching) |
| `tools` | Interactive tool enabler/disabler in the TUI |
| `truncated-tool` | Utility for building custom tools with proper output truncation |

### Advanced Modes

| Extension | What it does |
|-----------|-------------|
| `plan-mode` | Read-only exploration mode — agent can only read and plan, no edits |
| `subagent` | Multi-agent orchestration with agent definitions, prompts, and tool configurations |
| `web-tools` | Brave Search API integration for web search and content extraction |

## Skills

35+ installable skills for external services. All come from the [pi-skills](https://github.com/badlogic/pi-skills) collection.

### Google Workspace
- **gccli** — Google Calendar (list, create, update events; check availability)
- **gdcli** — Google Drive (search, upload, download, share files)
- **gmcli** — Gmail (search, read, send, draft, manage labels)

### Lark (飞书) Suite
Full coverage of the Lark/Feishu platform:
- **Core**: `lark-shared` (auth), `lark-im` (messaging), `lark-contact` (directory), `lark-mail` (email)
- **Productivity**: `lark-calendar`, `lark-doc`, `lark-sheets`, `lark-slides`, `lark-base`, `lark-wiki`
- **Collaboration**: `lark-approval`, `lark-attendance`, `lark-task`, `lark-minutes`, `lark-vc`, `lark-whiteboard`
- **Advanced**: `lark-drive`, `lark-event`, `lark-openapi-explorer`, `lark-skill-maker`
- **Workflows**: `lark-workflow-meeting-summary`, `lark-workflow-standup-report`

### Media & Documents
- **brave-search** — Web search and content extraction via Brave Search API
- **browser-tools** — Interactive browser automation via Chrome DevTools Protocol
- **obsidian-cli** — Obsidian vault management, note reading/writing, plugin development
- **obsidian-bases** — Obsidian Bases (database-like views with filters, formulas, summaries)
- **obsidian-markdown** — Obsidian-flavored markdown with wikilinks, callouts, embeds
- **pdf** — PDF reading, extraction, merging, splitting, OCR, form filling
- **transcribe** — Speech-to-text via Groq Whisper API
- **youtube-transcript** — YouTube transcript fetching and summarization

### Utility
- **find-skills** — Discover and install new skills from the community
- **reflect** — Review chat history for mistakes and improvement opportunities
- **session-handoff** — Comprehensive handoff documents for seamless session transfers
- **vscode** — View diffs and compare files in VS Code

## Settings

```json
{
  "defaultProvider": "deepseek",
  "defaultModel": "deepseek-v4-pro",
  "defaultThinkingLevel": "medium",
  "enabledModels": [
    "openai-codex/gpt-5.4-mini",
    "openai-codex/gpt-5.5",
    "deepseek/deepseek-v4-flash",
    "deepseek/deepseek-v4-pro"
  ]
}
```

## Keybindings

```json
{
  "tui.input.newLine": ["ctrl+j", "shift+enter"]
}
```

Both `Ctrl+J` and `Shift+Enter` insert a newline in the TUI input (instead of sending).

## Structure

```
~/.pi/agent/
├── agents/            # Custom subagent definitions
├── extensions/        # TUI extensions (TypeScript)
├── prompts/           # Multi-agent workflow templates
├── sessions/          # Session history (gitignored)
├── skills/            # Installed skill modules
├── .gitignore         # Excludes auth.json, sessions, node_modules
├── settings.json      # Provider & model configuration
├── keybindings.json   # Custom key shortcut overrides
└── README.md
```

## License

MIT
