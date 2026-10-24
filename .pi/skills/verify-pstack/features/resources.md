# Skill and agent resources

## Sub-features

Pristine upstream skill loading, explicit vendor selection, unique names, relative links, the Pi adapter bootstrap, and restricted native pstack-scout/pstack-reviewer definitions.

## How to get to it (user POV)

Use `/skill:poteto-help` or `/skill:poteto-mode`. Configure native roles with `/skill:setup-pstack`. In this repository, `/skill:verify-pstack` loads this project verification workflow when project resources are trusted.

## Driving it with the checker and native registry

Run `./scripts/check-enabled-skills.sh`, then `node --test tests/*.test.mjs`. The actual Pi loader must parse the pristine upstream skill tree with the declared exclusions and register `/pstack` from the extension. `ketchup`, `recall`, `sharpen`, `in-your-own-words`, `create-formal-verification-skill`, and `maintain-formal-verification-skill` must load as explicit-only skills. History-selection tests call the real Python command and check project boundaries, current and child exclusions, file update order, time windows, and unavailable stores.

Use `subagent` list with capabilities and model discovery to inspect the two native profiles and actual available provider/model IDs. The comment reviewer has no edit/write/bash tools. Confirm the requested two model families differ before a dual-model launch. For parallel writes, use a clean test source and distinct managed worktrees; read returned handoff manifests and patches, then verify the integrated result.

## Gotchas

Registry presence does not prove authentication or a successful child launch. Agent output routing belongs on native run parameters. Managed worktrees may be reclaimed after patch capture; the returned durable handoff is authoritative. Missing coverage, runtime failure, or unavailable prerequisites stay visible as gaps.
