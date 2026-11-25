# pstack in Pi

Read this adapter before following any pstack instruction. Pi's tool contract, the operator's scope, and this adapter govern how the original Cursor instructions execute. Upstream files stay unchanged.

`<pstack>` is the `vendor/pstack` directory beside this repository's `adapters` directory. Resolve it from this file, not from the current working directory. A skill's relative references resolve from that skill's own directory. Project skills live in `.pi/skills/`. Personal Pi configuration lives in the active agent directory, including when `PI_CODING_AGENT_DIR` selects a different installation.

The support inventory is [policy.json](policy.json). Read a disabled skill as source material only. It does not enable its workflow. For a large task that upstream routes to figure-it-out or Orchestrate, form a bounded plan in the parent and use supported native workflow steps. An unsupported step blocks dependent work when its output is required. Never invent a placeholder URL, key, result, or review.

## Tools

| Cursor | Pi |
| --- | --- |
| `Task` | Pi's `Agent` tool from `@tintinweb/pi-subagents`. Use the registered tool schema. Do not start a multi-agent workflow without explicit operator opt-in. |
| `AskQuestion` | `questionnaire` when available, otherwise a direct question. Ask only for missing preferences or authority that the existing request does not settle. |
| Open a todolist | `todo`. Put the playbook steps before task-specific items. Keep skipped steps with their reason. |
| `generalPurpose` | The native role appropriate to the assignment. Use pstack-scout for read-only source exploration and poteto-agent for a bounded implementation. |
| `poteto-agent` | The native poteto-agent profile. It completes the assigned step directly. It does not run the parent's whole playbook or spawn children. |
| `comment-sicko` | The native read-only comment-sicko profile. The parent accepts findings and owns edits. |
| Run another pstack skill | Read `<pstack>/skills/<name>/SKILL.md`. User commands are `/skill:<name>`. Most upstream skills are explicit-only and intentionally absent from the automatic catalog. |
| `Read`, `Grep`, `Glob` | `read`, `bash` with `rg`, or the child's native read/search tools. |

Delegation is permitted only by the operator's request or applicable instructions. Enabling `/pstack on`, task size, a matched playbook, or an available specialist alone does not grant it. Without delegation authority, perform the steps directly and label independent review unperformed. A read-only investigation stays read-only except for its requested reports and isolated experiments.

Call `Agent` directly. Include `Read <absolute poteto-mode directory>/worker.md before anything else.` as the first line of each pstack assignment, then give the absolute path of this adapter. For `poteto-agent`, also supply the absolute path to `poteto-mode/SKILL.md`. Profiles in the active agent directory's `agents/` use built-in tools only and do not load child extensions or skills. Use stable child names and short labels. A background run reports completion to the parent. Do not sleep or poll.

## Subagent fields

| Cursor | Pi |
| --- | --- |
| `readonly: true` | Use pstack-scout or pstack-reviewer with a verified final tool allowlist. They have no bash, write, edit, or delegation tool. Output is saved by native output routing. |
| `readonly: false` | A scoped writer profile and explicit allowed files. |
| `environment: "cloud"` | `isolation: "worktree"` creates a local managed worktree. Use a clean intended source and one writer per checkout. Do not stash or discard unrelated changes. |
| `environment: "local"` | Use the current project checkout with one writer, or stop if the assigned checkout is unavailable. |
| `cloud_base_branch` | No corresponding `Agent` field. Verify the source ref before spawning. |
| `run_in_background: true` | `run_in_background: true`. |
| `resume` | Use `Agent` with the exact eligible ID in `resume`. Label a fresh same-role fallback and carry over prior findings. |
| `file_attachments` | Readable absolute file pointers in the assignment. |

A start receipt is not completion. Consume native terminal state, errors, evidence, actual outputReference/outputPathMapping/artifactPaths and the resulting diff at each dependency barrier. Ordinary child completion does not prove the assignment was fulfilled. Use an explicit structured verdict or a host verification gate where later work depends on it.

Managed worktrees may be reclaimed after patch and handoff capture. Read the returned durable handoff, integrate under one owner, and verify the combined result. Cleanup uses the native reviewed plan and apply procedure. Missing ownership evidence preserves the worktree.

A child, extension, workflow, or tool-runtime failure stops dependent work. Preserve the exact error, run, cwd, ref, worktree and partial diff. Fix the cause before a same-protocol retry. Do not silently switch to another agent CLI or execution mode.

## Models and setup-pstack

| Upstream name | Pi selection |
| --- | --- |
| `grok-`, `composer-`, `cursor-grok-`, `deepseek-` code slugs | The current effective poteto-agent route, or the current session when no override exists. |
| `claude-`, `gpt-` judgment and prose slugs | A confirmed judgment route on `pstack-reviewer`, or the current session when no override exists. |
| `inherit-parent`, `auto` | Inherit the actual parent model. Never store these as invented provider/model IDs. |
| `pstack-models.mdc`, `~/.cursor/rules/pstack-models.mdc` | Optional `model:` and `thinking:` in the active agent directory's `agents/<role>.md`, or explicit values on an `Agent` call. There is no separate pstack model registry. |

A family prefix is a role hint, never a runnable model ID. Discover exact provider/id routes and their supported reasoning levels. Use native thinking in configuration and a supported model suffix on a per-run model. Preserve user budgets. Cursor `-fast` is not a Pi suffix. Native fast is opt-in and only works for supported openai-codex children.

For `interrogate`, map its `generalPurpose` adversaries to scoped poteto-agent executions in separate worktrees, with explicit delegation authority. They may create and run repros only inside their assigned worktree. The parent reruns every finding command before keeping it. pstack-reviewer remains a read-only evidence reviewer and cannot stand in for an adversary that must execute code. If execution or model diversity is unavailable, report that part blocked instead of substituting a read-only panel.

Panels requiring diversity use two confirmed, different model families with explicit per-run routes. Two GPT variants are one family. If the current coding and reviewer routes share a family, select another confirmed route within the requested scope and budget or report the panel blocked. Resolve the effective model for each seat before dispatch and check the actual models after completion.

For setup-pstack, inspect the loaded profiles and confirm available `provider/modelId` routes and supported thinking levels. By default the pstack profiles inherit the parent model and thinking level, with both fields available for per-run selection. An explicit frontmatter value takes precedence over the caller's value. Pin a profile only when the operator wants that choice for every run of the role. Panel seats and cross-judges use confirmed per-run routes on unpinned profiles. Preserve existing choices and ask only for unresolved preferences. Do not write `.mdc` or `subagents.agentOverrides`.

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

Generated TLA+ verification workflows must record that the upstream `statechart` presentation step is unavailable under the current policy. Keep the actual model-checker command and results usable without the disabled skill, and report the missing visualization separately. Do not claim the upstream presentation step was verified.

Do not add tests for low-impact wording. Validate frontmatter, references and actual loading. Stateful behavior and bug fixes require behavioral checks. Temporary tools and experiments stay isolated and their evidence survives cleanup.
