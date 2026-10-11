---
name: ketchup
description: Catch the user up on this chat since their last message, with the current results and enough context to decide each pending action. Use for /skill:ketchup.
disable-model-invocation: true
---

# Catch up on this chat

Keep this turn read-only. Cover everything since the last message the user wrote before invoking this skill. Ignore automated notifications and subagent results when finding that boundary. Follow the plain voice of [bro](../../../vendor/bro/skills/bro/SKILL.md), without its restating step.

## Gather the current state

1. Read the active conversation branch. Use `vcc_recall` for earlier entries lost to compaction. Stay in this session. If history is unavailable, state the gap instead of reconstructing it from memory.
2. Collect this run's work, subagent reports, and other messages in the chat. Check the current state of the PRs, CI runs, and agents it touched through read-only `git`, `gh`, or native `subagent` status calls. Do not start or resume an agent to check its state. Label anything still running or not checked.
3. Identify decisions or steps only the user can take. Include unresolved requests from before the boundary. A task you can do yourself is remaining work. An action already authorized is not a new approval request.

Read the [Pi execution contract](../poteto-mode/references/pi-runtime.md) when checking native runs. Execution completion, acceptance, a queued reload, and a finished reload are different states.

## Write the update

Open with the number of pending user actions, or say there are none. If nothing changed and nothing needs the user, say so and stop.

Give the results and their consequences, most important first. Use names the user recognizes for branches, PRs, and agents. Omit steps that changed nothing. Name any remaining work you can do in one line.

For each user action, explain the decision, why it matters now, the options and costs, your recommendation, and what remains blocked without an answer. Link the detail, but give enough context to decide without opening it. Mark unknown parts instead of guessing.

This update does not approve an action, modify files, send messages, or create another workflow.
