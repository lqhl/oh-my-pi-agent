---
name: setup-pstack
description: Configure pstack's native Pi coding and judgment agents using confirmed available provider/model IDs and subagents.agentOverrides. Use for pstack setup, model choices, or reasoning budget changes.
---

# Set up pstack in Pi

Use existing native agent configuration. Read [`../poteto-mode/references/pi-runtime.md`](../poteto-mode/references/pi-runtime.md) and the installed `pi-subagents` configuration reference. Do not write a second model registry.

1. Inspect `subagent({action: "list", capabilities: true})` and `subagent({action: "models"})`. Confirm native `poteto-agent`, `comment-sicko`, `scout`, and `reviewer` are executable. Never save an unconfirmed provider/model ID.
2. Read the agent directory's `settings.json`, plus the trusted project's `.pi/settings.json` when applicable. User overrides belong to the agent settings; a requested project-only choice belongs to project settings. Preserve unrelated fields and overrides.
3. Use the current coding model for `poteto-agent` by default. Use a confirmed strong model from another family for `reviewer` and `comment-sicko`. A task can override the model on a native run. For `inherit` behavior, omit the override rather than storing an invented alias. Ask only if the user's intended cost or family cannot be inferred; keep existing choices when they satisfy the request.
4. Set native `thinking` in each chosen agent override. Use a supported level (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`) appropriate to the user's request and model. Budget settings change reasoning effort, not the provider's model ID.
5. Update only the relevant `subagents.agentOverrides` entries. For example, after confirming the exact IDs, `reviewer` and `comment-sicko` each receive `{ "model": "<provider/id>", "thinking": "high" }`. Do not leave example placeholders in saved configuration or change the main model unless requested.
6. Reload resources or start a new session and inspect the resolved agents again. Check that the chosen panel families differ. Configuration and registry checks do not prove authentication or a child launch; run a small read-only child only when that validation is authorized, and report its actual result separately.

Report the settings path, resolved roles/models/thinking, and the commands to start a task: `/skill:poteto-mode <task>` or `/pstack on` followed by the task. A mode switch does not begin a long-running goal.
