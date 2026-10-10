# Skill and agent resources

## Sub-features

Local recursive skill discovery, explicit vendor selection, unique names, relative links, 48 pstack skills, and native `poteto-agent`/`comment-sicko` definitions.

## How to get to it (user POV)

Use `/skill:poteto-help` or `/skill:poteto-mode`. Configure native roles with `/skill:setup-pstack`. In this repository, `/skill:verify-pstack` loads this project verification workflow when project resources are trusted.

## Driving it with the checker and native registry

Run `./scripts/check-enabled-skills.sh`, then `node --test tests/pstack-mode.test.mjs`. The actual Pi loader must parse all 48 pstack skills with no diagnostics and register `/pstack` from the extension.

Use `subagent` list with capabilities and model discovery to inspect the two native profiles and actual available provider/model IDs. The comment reviewer has no edit/write/bash tools. Confirm the requested two model families differ before a dual-model launch. For parallel writes, use a clean test source and distinct managed worktrees; read returned handoff manifests and patches, then verify the integrated result.

## Gotchas

Registry presence does not prove authentication or a successful child launch. Agent output routing belongs on native run parameters. Managed worktrees may be reclaimed after patch capture; the returned durable handoff is authoritative. Missing coverage, runtime failure, or unavailable prerequisites stay visible as gaps.
