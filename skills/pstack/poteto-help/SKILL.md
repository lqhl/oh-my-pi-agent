---
name: poteto-help
description: Explain this local pstack adaptation, choose a Pi skill or playbook, troubleshoot a run, or help write a task with clear acceptance criteria.
disable-model-invocation: true
---

# Poteto help

Answer the user's question and link the local file that owns the answer. A help question does not start an implementation or spend tokens on children. A request to do work should proceed through [`poteto-mode`](../poteto-mode/SKILL.md).

## Start

This repository already contains pstack as locally maintained files. Read [`../README.md`](../README.md) for installation, scope, and attribution.

- `/skill:poteto-mode <goal and pass predicate>` applies the workflow to one task.
- `/pstack on` persists the workflow instructions in this session. `/pstack off` removes them. `/pstack status` reports the switch. Resume and compaction preserve the active branch's setting; a new session starts off.
- `/skill:setup-pstack` inspects and changes native agent/model overrides. Existing valid settings are enough to start.
- `/skill:create-verification-skill` builds a project-specific real-app harness when none exists.

For example:

```text
/skill:poteto-mode Add --json to this CLI. Preserve current text output. Verify the real command's JSON, text output, and exit status.
```

Task size and an enabled mode do not grant delegation. An explicitly invoked workflow skill can request its documented bounded child work; the native execution contract remains authoritative. Costs come mainly from candidate generation and review panels. A focused task, fewer useful slices, and native model defaults keep that work bounded.

## Pick a skill

| Need | Local skill |
| --- | --- |
| Restate the goal without starting work | [in-your-own-words](../in-your-own-words/SKILL.md) |
| Improve the approach before doing the task | [sharpen](../sharpen/SKILL.md) |
| Understand current behavior | [how](../how/SKILL.md) |
| Investigate rationale and history | [why](../why/SKILL.md) |
| Explain a subsystem plainly | [teach](../teach/SKILL.md) |
| Catch up on this chat since the user's last message | [ketchup](../ketchup/SKILL.md) |
| Rebuild recent project context across prior chats | [recall](../recall/SKILL.md) |
| Prove what a diff could break elsewhere | [blast-radius](../blast-radius/SKILL.md) |
| Compare type and module designs | [architect](../architect/SKILL.md) |
| Compare candidates and synthesize a result | [arena](../arena/SKILL.md) |
| Cover independent slices locally | [swarm](../swarm/SKILL.md) |
| Get fresh adversarial review on two model families | [interrogate](../interrogate/SKILL.md) |
| Fix a bug with a cheap failing regression check | [tdd](../tdd/SKILL.md) |
| Check performance measurements | [benchmark-checklist](../benchmark-checklist/SKILL.md) |
| Review comments or remove code slop | [no-comments](../no-comments/SKILL.md), [deslop](../deslop/SKILL.md) |
| Write clear docs and prose | [technical-writing](../technical-writing/SKILL.md), [unslop](../unslop/SKILL.md) |
| Apply TypeScript rules | [typescript-best-practices](../typescript-best-practices/SKILL.md) |
| Drive a real local CLI or browser | [control-cli](../control-cli/SKILL.md), [control-ui](../control-ui/SKILL.md) |
| Create or maintain a project verification workflow | [create-verification-skill](../create-verification-skill/SKILL.md), [maintain-verification-skill](../maintain-verification-skill/SKILL.md) |
| Create or maintain a formal check of a named property | [create-formal-verification-skill](../create-formal-verification-skill/SKILL.md), [maintain-formal-verification-skill](../maintain-formal-verification-skill/SKILL.md) |
| Create or modify any Pi skill | [create-skill](../create-skill/SKILL.md) |
| Keep an auditable decision trail | [show-me-your-work](../show-me-your-work/SKILL.md) |

Playbooks are files inside `poteto-mode`, not separate slash commands. Read its index before recommending one. It includes investigation, bug fixes, features, refactoring, performance fixes, prototypes, skill authoring, multi-phase plans, and PR preparation. Principle leaf skills guide decisions within the user's scope.

## Troubleshoot

A one-task invocation does not enable the persistent switch. Use `/pstack on` when that is wanted. After adding files, reload resources and inspect diagnostics. Resolve model IDs through native discovery; never guess a provider slug. Isolate concurrent writers in clean managed worktrees. A failed child or missing live harness leaves a concrete gap, not a pass.

`ketchup` covers this chat since the user's last message. `recall` searches prior chats in a stated workspace and time window, then checks the relevant Git and GitHub record. `vcc_recall` only recovers the current session's context.

Read [`../poteto-mode/references/pi-runtime.md`](../poteto-mode/references/pi-runtime.md) before explaining async notification, resume, isolation, or acceptance. Explicit long-running goal mode uses the existing `pi-goal` skill and tools; the local mode does not supply another loop or scheduler.

Lead with the answer, give at most one relevant prompt example, and link the file you actually read.
