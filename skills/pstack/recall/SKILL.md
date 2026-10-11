---
name: recall
description: Rebuild recent project context from prior Pi chats and current Git or GitHub state. Use for /skill:recall, earlier work on a topic, or where the user left off.
disable-model-invocation: true
---

# Recall project context

Produce a cited brief of the user's goals, decisions, current work, recurring problems, and next move. Keep this turn read-only. Read the [Pi execution contract](../poteto-mode/references/pi-runtime.md) and [analyze-sessions](../../analyze-sessions/SKILL.md).

## Set the scope

State the workspace, topic, and time window. Default to the current working directory and the last seven days of file updates. Honor an explicit window or all history. Do not replace all history with a recent sample.

Use `vcc_recall` for the current conversation. Use [ketchup](../ketchup/SKILL.md) for progress since the user's last message. If the user already supplied a complete state capsule, verify it against live state and skip history mining. A request to resume one specific session requires that session's trail, not a broad search.

## Find and read earlier chats

The selector reuses the existing session parser. It checks each session header for the exact workspace before reading messages, excludes subagent logs and the active session, and orders matches by actual file update time. It searches literal user and assistant text, not thinking or tool output. It only returns session IDs, paths, update times, and first prompts.

Run it from the target workspace. For example:

```bash
python3 ~/.pi/agent/skills/pstack/recall/scripts/find-sessions.py --cwd "$(pwd -P)" --since 7d --topic pstack
```

Resolve [scripts/find-sessions.py](scripts/find-sessions.py) from this skill's actual location if the configuration lives elsewhere. Omit `--topic` for activity recall. Omit `--since` for all history. Use `--until` for an upper bound and `--sessions-dir` for a custom session store. Both date bounds use file update time.

The script excludes `PI_SESSION_ID` and `PI_SESSION_FILE` when available. Otherwise identify the active session from its opening prompt and exclude its full ID with `--exclude-session`. Do not guess IDs. Skip known eval and test chats after inspecting their metadata. Do not infer relevance from UUID order or silently include other workspaces.

Read the exact returned paths with Pi's `read` tool. Find the topic before expanding long transcripts. Read enough of each matching thread to collect its goal, decisions, open work, failures, corrections, and artifacts. Cite its session ID and path. When a claim depends on which tools actually ran, read the original tool records. Distinguish abandoned conversation branches and proposals from completed changes.

Direct exploration is the default. Only delegate history slices when separately authorized. Each slice stays in this workspace and window, and returns cited findings. Do not create a goal or background loop.

## Check the shared record

For a named feature, file, subsystem, or bug, use [why](../why/SKILL.md) to inspect relevant Git history, GitHub PRs and issues, repository documents, comments, and tests. Ask what is current, what failed before, and what remains unresolved. Pure activity recall without a named target can skip this step.

Check referenced branches and changes with `git`. Check PRs and issues with `gh` when available and authenticated. A chat report is a lead to verify. Label unverified claims and conflicting evidence. This adaptation uses local Pi history and the existing GitHub path. It has no team-message, external ticket-tracker, error-tracker, or cloud-agent dependency.

## Write the brief or report the gap

Lead with a capsule of at most five bullets. Then give one line per thread with its verified state, goal, decision, next step, and evidence. Use states such as merged, open PR, in flight, verified but uncommitted, reverted, or planned. A pending review is still pending when a task has finished executing.

List at most five recurring problems, including reverted fixes and corrections that affect the next attempt. End with one concrete next move. Apply [unslop](../unslop/SKILL.md). Keep unrelated context out and remove private material from any public summary.

An empty result means no matching recorded history in the stated scope. State that result and continue with available live evidence. An unavailable session store, missing tool, inaccessible repository, or missing authentication is a coverage gap. Report what could be checked and what remains unknown. Do not widen the scope or invent a history to fill the gap.
