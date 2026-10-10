# Pi execution contract

Read this file before executing a pstack workflow. It owns the Pi tool mapping, model selection, delegation, and evidence rules. The operator's instructions and the runtime's tool contract take precedence.

## Skills and scope

Skills live beside `poteto-mode` under `skills/pstack/`. Read a named skill's `SKILL.md` and follow its relative references. User commands are `/skill:<name>`; reading the file is how an agent invokes a skill. Project skills belong in `<project>/.pi/skills/<name>/`.

`/skill:poteto-mode` applies to the current task. `/pstack on` keeps the mode in the session's system instructions; `/pstack off` removes it; `/pstack status` reports the switch. The switch persists on the active session branch, including resume and compaction. It does not start work or a background loop. Casual conversation does not start a playbook. A new task gets a new playbook and fresh task todos.

The bundled playbooks cover investigation, bug fixes, features, refactoring, performance fixes, prototypes, skill authoring, multi-phase plans, and opening PRs. For a task outside this set, state a bounded plan with acceptance criteria using the relevant skills. Do not claim an unimplemented playbook is available.

## Tools

| Need | Pi capability |
| --- | --- |
| Inspect and change files | `read`, `bash` with `rg`, `edit`, `write` |
| Independent tool calls | `codemode` with `Promise.allSettled`; inspect every result |
| Track steps | `todo`; do not clear an unrelated task's todos |
| Product or preference question | `questionnaire` when available, otherwise a direct question |
| Local children and workflows | `subagent` from `pi-subagents` |
| Recover this session's context | `vcc_recall` before rereading large files or declaring context lost |
| Explicit long-running goal | `create_goal` from `pi-goal`, only when the user requests goal mode |
| Real CLI or UI verification | local `control-cli`, `control-ui`, or a project's verification skill |
| GitHub history and PRs | `git` and `gh`, using existing authentication |

Call the native `subagent` tool directly; it may not be exposed as `tools.subagent` inside codemode. The `reload_runtime` tool schedules resource reload after the current agent run settles. Its receipt does not mean new resources are loaded yet. After reload, use freshly registered tools in the next run; an old tool or context handle remains invalid. Do not introduce a custom scheduler, remote workers, or another CLI agent runner. Preserve the caller's work and stay inside the authorized scope. A workflow step does not grant permission to publish, merge, deploy, force-push, delete data, or message other people. Prepare a reviewable result before any approval that the actual action requires.

## Delegation and roles

Direct execution is the default. Delegation requires the operator's request or applicable instructions. Explicitly invoking a pstack skill whose stated workflow uses children authorizes its bounded delegation, subject to the runtime's restrictions. Merely enabling `/pstack on`, matching a playbook, or having a large task does not grant delegation. When delegation is not authorized, perform the steps directly and label independent or cross-model review as unperformed.

Before a delegated run:

1. Read the installed `pi-subagents` skill and `subagent` guide for workflows and tool-reference. Check `subagent({action: "list", capabilities: true})` and use executable, non-disabled native Pi agents. Use `subagent({action: "models"})` before a model override.
2. Pick roles from the installed registry. `poteto-agent` owns a bounded implementation. `scout` explores. `reviewer` judges in fresh context. `comment-sicko` reports comment findings. Ordinary children do not orchestrate or spawn children.
3. Bind output with the run's `output` argument. Pass the objective, allowed paths, constraints, commands, and evidence paths. For reviewers, supply a readable diff packet including staged, unstaged, committed, and relevant untracked changes; `main...HEAD` alone omits ongoing work.
4. Use exactly one top-level `subagent` workflow call with `async: true` for a delegated multi-step or parallel workflow. Every child launch occurs inside that workflow. A nested skill contributes steps to the same workflow rather than launching another parent workflow.

Use `runs.all([{key, label, agent, task, output, ...}, ...])` for independent children; give each step a short verb-and-behavior label and `await runs.run(key, {...})` for dependent ones. Await a launch before accessing its output. Keep stable, distinct keys. Return each result's actual `runId`, `outputReference`, `outputPathMapping`, `artifactPaths`, evidence, and unresolved risks when present. Records passed to `emit` or returned by a workflow must be JSON values. Omit absent optional fields instead of assigning `undefined`.

Consume terminal results at dependency barriers. Check native status, errors, and evidence before advancing. A pending card, launch receipt, summary, or claimed success is not acceptance. Ordinary async runs notify the parent on completion; return control instead of sleeping or polling. Reserve `bg_wait` for work without native notification when its result is required in the current turn.

An extension, child launch, workflow, or tool-runtime failure is an infrastructure blocker. Stop the dependent lanes, preserve the partial diff, report the exact error and run/cwd/worktree/branch, and retry through the same protocol only after fixing the cause. Never silently fall back to an interactive shell, an external agent CLI, or another execution mode.

Use fresh context for independent reviewers. For follow-up work in the same role, inspect the known run with `status`, then try `resume`; it enforces eligibility. If resume rejects or no candidate exists, label a fresh same-role fallback and carry all constraints and prior findings. Fresh independent review stays fresh.

## Models

Use native agent defaults and `settings.json` → `subagents.agentOverrides`; there is no separate pstack model file. The two panel seats use explicit exact model overrides, so a reviewer default cannot accidentally collapse them onto one family.

| Role | Selection |
| --- | --- |
| Implementation and source exploration | Current available coding model, unless an agent override is set |
| Judgment and prose | Configured `reviewer` model |
| Arena or architect candidates | Coding model and judgment model, at least two distinct approaches |
| Interrogate panel | One fresh reviewer on each of those two model families |
| Comment review | `comment-sicko` override or the judgment model |

For overrides, copy an exact available `provider/id`. Set native `thinking` in the agent override, or use the documented model thinking suffix on an individual run. Do not translate provider IDs into invented model slugs. Use `/skill:setup-pstack` to change the native overrides. If a required model is unavailable or the two panel entries are the same family, report the gap and select another confirmed available model only within the operator's granted scope. Never claim dual-model review from two runs of the same family.

## Isolation and integration

One writer per working directory. Concurrent writers use managed `worktree: true` from a clean source checkout; read-only children can share a directory. A dirty source cannot allocate managed worktrees. Preserve it, then either commit the authorized changes or prepare a separate clean checkout of the intended tree. Do not discard or stash unrelated work automatically. Default `baseRef` is `HEAD`; use a supported named ref when another base is needed.

The parent reviews every candidate diff, selects or grafts changes, resolves conflicts in one integration directory, and runs verification on the integrated result. The native lifecycle may capture a patch and handoff and then reclaim a temporary worktree automatically. Inspect the returned handoff and durable artifacts rather than assuming a checkout still exists. Preserve evidence until integration is checked. For retained worktrees, use the package's reviewed cleanup procedure; never hard-reset a shared branch as a workflow shortcut.

## Evidence and finish

Name the user-visible outcome and pass predicate before changing code. Bugs require the original trigger failing before the fix and passing afterward. Refactors require a pinned behavior contract. Performance changes require comparable measured baselines. Real CLI or UI paths require commands, exit codes or observable end states, and retained artifacts. Missing credentials, tools, services, or prerequisites are `blocked` or `inconclusive`, never a pass.

Tests are proportional to the change. Use behavioral tests for bugs and stateful runtime changes. For low-impact wording, check frontmatter, references, and loading rather than manufacturing an agent eval. Distinguish static checks, runtime checks, real product verification, and cross-model judgment in the report.

PR preparation applies when delivery needs it. Create or update a PR only within the user's authorized scope; otherwise leave the checked diff and proposed title/body locally. Use `gh --body-file` for multiline text. Do not infer a merge request from a request to implement or open a PR.
