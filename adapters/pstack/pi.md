# pstack in Pi

Read this adapter before following any pstack instruction. Pi's tool contract, the operator's scope, and this adapter govern how the original Cursor instructions execute. Upstream files stay unchanged.

`<pstack>` is the `vendor/pstack` directory beside this repository's `adapters` directory. Resolve it from this file, not from the current working directory. A skill's relative references resolve from that skill's own directory. Project skills live in `.pi/skills/`. Personal Pi configuration lives in the active agent directory, including when `PI_CODING_AGENT_DIR` selects a different installation.

The support inventory is [policy.json](policy.json). Read a disabled skill as source material only. It does not enable its workflow. For a large task that upstream routes to figure-it-out or Orchestrate, form a bounded plan in the parent and use supported native workflow steps. An unsupported step blocks dependent work when its output is required. Never invent a placeholder URL, key, result, or review.

## Tools

| Cursor | Pi |
| --- | --- |
| `Task` | Native `subagent`. Confirm the installed API before use. One bounded child uses agent and task. Dependent or parallel children launch inside one top-level async workflow. |
| `AskQuestion` | `questionnaire` when available, otherwise a direct question. Ask only for missing preferences or authority that the existing request does not settle. |
| Open a todolist | `todo`. Put the playbook steps before task-specific items. Keep skipped steps with their reason. |
| `generalPurpose` | The native role appropriate to the assignment. Use pstack-scout for read-only source exploration and poteto-agent for a bounded implementation. |
| `poteto-agent` | The native poteto-agent profile. It completes the assigned step directly. It does not run the parent's whole playbook or spawn children. |
| `comment-sicko` | The native read-only comment-sicko profile. The parent accepts findings and owns edits. |
| Run another pstack skill | Read `<pstack>/skills/<name>/SKILL.md`. User commands are `/skill:<name>`. Most upstream skills are explicit-only and intentionally absent from the automatic catalog. |
| `Read`, `Grep`, `Glob` | `read`, `bash` with `rg`, or the child's native read/search tools. |

Delegation is permitted only by the operator's request or applicable instructions. Enabling `/pstack on`, task size, a matched playbook, or an available specialist alone does not grant it. Without delegation authority, perform the steps directly and label independent review unperformed. A read-only investigation stays read-only except for its requested reports and isolated experiments.

Call native subagent tools directly. They are model-only and cannot run inside codemode. Check the installed guide and executable agents before a delegated workflow. Use stable child keys, short labels, fresh review contexts, and run-bound output paths. Every launched promise must be awaited or returned. Ordinary async completion wakes the parent, so return control when only children remain. Do not sleep or poll.

## Subagent fields

| Cursor | Pi |
| --- | --- |
| `readonly: true` | Use pstack-scout or pstack-reviewer with a verified final tool allowlist. They have no bash, write, edit, or delegation tool. Output is saved by native output routing. |
| `readonly: false` | A scoped writer profile and explicit allowed files. |
| `environment: "cloud"` | Managed `worktree: true` from a clean intended source. One writer per checkout. Do not stash or discard unrelated changes. |
| `environment: "local"` | The explicitly assigned cwd, with one writer. |
| `cloud_base_branch` | Native baseRef using HEAD or a supported named ref. Do not pass arbitrary revision expressions. |
| `run_in_background: true` | `async: true`. Multi-step delegation uses one native async workflow. |
| `resume` | Inspect the exact run with status, then use native resume if eligible. A fresh same-role fallback is labeled and carries prior findings. It is not equivalent to resuming. |
| `file_attachments` | Readable absolute file pointers in the assignment. |

A start receipt is not completion. Consume native terminal state, errors, evidence, actual outputReference/outputPathMapping/artifactPaths and the resulting diff at each dependency barrier. Ordinary child completion does not prove the assignment was fulfilled. Use an explicit structured verdict or a host verification gate where later work depends on it.

Managed worktrees may be reclaimed after patch and handoff capture. Read the returned durable handoff, integrate under one owner, and verify the combined result. Cleanup uses the native reviewed plan and apply procedure. Missing ownership evidence preserves the worktree.

A child, extension, workflow, or tool-runtime failure stops dependent work. Preserve the exact error, run, cwd, ref, worktree and partial diff. Fix the cause before a same-protocol retry. Do not silently switch to another agent CLI or execution mode.

## Models and setup-pstack

| Upstream name | Pi selection |
| --- | --- |
| `grok-`, `composer-`, `cursor-grok-`, `deepseek-` code slugs | The current effective poteto-agent route, or the current session when no override exists. |
| `claude-`, `gpt-` judgment and prose slugs | The effective native reviewer route. |
| `inherit-parent`, `auto` | Inherit the actual parent model. Never store these as invented provider/model IDs. |
| `pstack-models.mdc`, `~/.cursor/rules/pstack-models.mdc` | Native `settings.json` under subagents.agentOverrides. There is no separate pstack model registry. |

A family prefix is a role hint, never a runnable model ID. Discover exact provider/id routes and their supported reasoning levels. Use native thinking in configuration and a supported model suffix on a per-run model. Preserve user budgets. Cursor `-fast` is not a Pi suffix. Native fast is opt-in and only works for supported openai-codex children.

Panels requiring diversity use two confirmed, different model families with explicit per-run routes. Two GPT variants are one family. If the current coding and reviewer routes share a family, select another confirmed route only within the requested scope and budget, or report the panel blocked. Never claim cross-model review from same-family runs. pstack-reviewer is a restricted execution profile, not a second model configuration. Resolve its judgment route from the native reviewer configuration before dispatch.

For setup-pstack, inspect native agent capabilities and effective models. Merge only requested settings fields in the active agent or trusted project's settings. Preserve unrelated values and existing choices. Do not write `.mdc`, reset every role, or ask again for a budget already established by the user. Only request an unresolved preference. Do not automatically offer unrelated setup, run reviews, install verifiers or start goals.

## Paths and history

| Cursor | Pi |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.pi/skills/` for project workflows, the active agent directory for personal resources. |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `<pstack>`, loaded directly by Pi. |
| `.cursor/rules/`, always-applied rules | The existing Pi instruction or extension mechanism. Model choices stay in native settings. |
| `agent-transcripts`, `~/.cursor/projects/<slug>/` | Scoped Pi session selection, never a cross-project transcript glob. |
| Upstream GitHub URLs | The corresponding local vendor file when present. |

For recall, state workspace, topic and time window. Run `python3 <adapter-dir>/scripts/find-sessions.py --cwd <workspace>` with the relevant dates and exclusions. It reads a session header before any message and excludes current and child sessions. An empty match differs from a missing session store. `vcc_recall` queries only this session. Git, GitHub PRs/issues and repository documents supply live and shared state. Unmounted team-message or incident services are unavailable. Do not contact people or systems beyond the request.

Session pickup restores prior evidence and the resume point, then checks the real artifacts needed for the next action. Pause safely saves a checkpoint. It does not automatically create a wip commit, publish a branch, or cancel somebody else's work.

## Goals and external features

`/loop` maps to native pi-goal only on an explicit goal request. “Continue”, “don't stop”, a duration, or an enabled mode does not create a goal or schedule. Complete the already-authorized task until its pass predicate holds or a concrete blocker remains. No extra pstack scheduler is installed.

| Cursor-only features | Pi handling |
| --- | --- |
| Cursor Automations, routine wakes, SendToUser, automation webhooks | Unsupported. No external job, message or scheduled loop is created implicitly. |
| Bugbot | Existing comments are ordinary review threads. No check, bot, polling loop or merge authority is inferred. |
| Cursor cloud agents | Managed local worktrees cover assigned file isolation. Remote dashboards and machines are unsupported. |
| cursor-team-kit deslop, control-ui, control-cli | Use the local Pi-native skill with the same public name. Prefer an existing project verification skill. |
| Built-in PR tool | Use the repository's existing authenticated forge CLI, only within the requested delivery scope. |

Opening or reviewing a PR is not authority to merge, deploy or delete data. Skills cannot grant permissions missing from the operator's request. Missing dependencies stay blocked. Ordinary external integrations are never replaced with fabricated success or a placeholder.

## Verification and delivery

Keep upstream files unchanged. Put Pi-only changes here, in native profiles, or in local support programs. Use real source paths and artifact pointers. Model a behavior before changing it, retain the failing trigger, and rerun the same trigger after the fix. A green build is not a CLI, browser, model-checker or child execution result.

Read the actual principle leaf when applying it. Separate static checks, intercepted SDK behavior, actual CLI/Web behavior, live delegated execution and independent judgment in the result. Both supported Pi SDKs must pass. An advisor consultation is not an independent subagent panel; keep its evidence and usage separate.

Do not add tests for low-impact wording. Validate frontmatter, references and actual loading. Stateful behavior and bug fixes require behavioral checks. Temporary tools and experiments stay isolated and their evidence survives cleanup.
