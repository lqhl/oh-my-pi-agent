---
name: ketchup
description: Catch the user up on this chat since their last message, explain changes with existing evidence, and list every pending user decision. Use for /skill:ketchup.
disable-model-invocation: true
---

# Catch up on this chat

Catch the user up since the last message they wrote before invoking this skill. Automated notifications and subagent results do not set that boundary. Assume they remember their last message and nothing after it. Follow the plain voice of [bro](../../../vendor/bro/skills/bro/SKILL.md), without its restating step.

## Gather the current state

Keep this turn read-only. Read the active conversation branch, using `vcc_recall` for entries lost to compaction. State a history gap rather than inventing progress. Collect this run's work and reports in the chat. Check the current state of the PRs, checks and agents it touched through read-only `git`, `gh` or native status calls. Do not start or resume an agent to check its state.

Read the [Pi execution contract](../poteto-mode/references/pi-runtime.md) when checking native runs. Execution completion, acceptance, a queued reload and a finished reload are different states. Verify a number against its source before reporting it.

A user action is a decision or step only the user can take. Include every unresolved one, even if raised before the catch-up boundary. Work you can still do yourself is remaining work. Existing authorization stays valid and is not a new approval request. Do not invent a decision to fill the reply.

For each waiting item, collect its name, actual link when available, user impact, evidence, risk and recommendation. Mark a necessary unknown explicitly. Do not invent a link.

## Write the update

Open with the number of pending user actions, or say there are none. If nothing changed and nothing waits on the user, say so and stop.

Show existing screenshots and videos inline before explaining visible changes. Add a small diagram when it explains a relationship, flow or meaningful alternative. Then give one short result per requested outcome, including whether it is done, running, failed or not checked. A result still waiting on the user is not done. Keep the progress story brief and omit information repeated in the action items.

List every pending item. Never omit or shrink items to fit a total word count. A count cannot replace the list, and a linked report cannot replace the information needed to decide. When several items share one decision, state the decision and recommendation once, then give each item its own line with its link, impact, evidence and risk. Put the riskiest first. Give each option's gain and cost when a choice has alternatives. State prerequisites with the recommendation, including anything irreversible.

Name any remaining work you can do in one line. Do not turn it into a user action.

## Use evidence for visuals

Reuse artifacts already produced by the work. Do not change files, launch an app or job, or post anything to obtain a picture. For a visible change without a screenshot, say that no screenshot is available and describe the change. Never draw an uncaptured screen or invent chart values.

Use Mermaid for a small dependency or behavior diagram grounded in the chat. Do not draw status lists, action-item lists or unrelated boxes. Keep labels short and avoid repeating the same fact in a visual and prose.

This update does not approve an action, modify files, send messages or create another workflow.
