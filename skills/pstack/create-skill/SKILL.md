---
name: create-skill
description: Create or update a native Pi SKILL.md with a clear trigger, bounded workflow, valid frontmatter, local references, and proportional verification. Use when asked to create, add, or modify a skill.
---

# Create a Pi skill

Produce a skill the next agent can use without this conversation. A skill defines when to act, the outcome, the steps, the evidence, and when to stop. Keep it small; reference an existing skill instead of repeating its contract.

## Locate and understand

Read the installed Pi `docs/skills.md` and a nearby skill before writing. Inspect existing skills and applicable project instructions. Check whether this workflow already has an owner.

Use `<project>/.pi/skills/<name>/SKILL.md` for a project workflow. Use the agent configuration's `skills/<name>/SKILL.md` for a reusable personal workflow. Honor the user's chosen location. Avoid a global change for a project-specific task. A name is lowercase letters, numbers, and single hyphens, at most 64 characters, and matches the directory.

Infer the trigger and outcome from the request. Ask only for a material ambiguity that context cannot settle. State the expected pass predicate and scope before implementing.

## Write

Use YAML frontmatter with a specific `name` and `description`. The description names the situation where the skill is useful. For an explicit-only workflow, add `disable-model-invocation: true`; it still has `/skill:<name>`.

```markdown
---
name: verify-example
description: Verify Example's CLI output and exit status after command or serialization changes.
---

# Verify Example

## Outcome

Name the observable result and what counts as a pass.

## Scope and prerequisites

Name allowed changes, required tools or services, and discovered project commands.

## Workflow

1. Establish the starting state.
2. Execute the real path.
3. Check the observable result and retain its evidence.

## Finish or stop

Report the result and evidence. If a required prerequisite is unavailable, report the blocker and next input instead of claiming a pass.
```

Replace the example with discovered names, paths, commands, and predicates. Do not leave placeholders in the resulting skill. Put long reference material in `references/`. Use relative links from the file that refers to them. Put scripts in `scripts/` only when they perform reusable work; document their exact invocation and make shell entry points executable.

Use native Pi tools. For a workflow using children, reference [`../poteto-mode/references/pi-runtime.md`](../poteto-mode/references/pi-runtime.md) and the installed `pi-subagents` contract rather than creating another scheduler. Do not require delegation, goal mode, publishing, or external messages that the user did not authorize.

## Validate

1. Parse frontmatter and check name, description, directory match, duplicate names, and relative references. In this configuration repository, run `./scripts/check-enabled-skills.sh`. In another project, use its checker or Pi's actual resource loader.
2. Load the skill through Pi. Restart or reload resources when adding it to an existing session. Check the `/skill:<name>` entry and resource diagnostics; an existing file alone does not prove registration.
3. Verify behavior in proportion to the change. Run reusable scripts. For a workflow, try one representative task and a material blocked path. A wording edit needs a content and reference check; it does not need a synthetic agent eval.
4. Read the final skill cold. Remove instructions that repeat existing rules or do not change a decision. Keep concrete finish and blocked conditions.

Report the skill path, trigger, any scripts or references, what was checked, and remaining prerequisites. Writing a skill does not publish it or start the workflow it defines.
