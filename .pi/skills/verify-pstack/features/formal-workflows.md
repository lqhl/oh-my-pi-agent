# Formal verification workflows

## Sub-features

Creation of a project-local verify skill, source and model correspondence, failure sensitivity, drift maintenance, and unavailable-tool reporting. The two reusable entry points are `create-formal-verification-skill` and `maintain-formal-verification-skill`.

## How to get to it (user POV)

Invoke `/skill:create-formal-verification-skill` in an isolated fixture with a named property. Invoke `/skill:maintain-formal-verification-skill` after covered code changes. A model-configuration request alone does not start either workflow.

## Driving it with an isolated verifier and the real SDK

1. Choose a concrete promise in the covered code. Record its files, functions, assumptions, bounds, and sync commit. When covered code is dirty, retain its diff or content hashes too.
2. Prepare a verifier at an exact version outside the configuration checkout. Record its checksum and invocation. If no suitable verifier runs on the language, generated-input tests must exercise the real code and be labeled as tests.
3. Generate the project-local skill under the fixture's `.pi/skills/`. Follow that skill once and retain the successful command output.
4. Make a scratch change that breaks the promise in the actual covered code. Update the model from that code when necessary. The check must expose the break. Replay a model counterexample through the real implementation where practical.
5. Restore the scratch change and confirm the baseline again. Change covered code after the sync commit and run maintenance. Distinguish stale verification from a code bug, and rerun the failure check after a model update.
6. Run with the verifier deliberately unavailable. The outcome must be blocked, and the check's sync commit must not advance.

A representative mode check can cover `restore`, the command handler, and `before_agent_start` in `extensions/pstack-mode.ts`. `tests/pstack-mode.test.mjs` drives the corresponding real SDK path. A model of two boolean branch states does not cover the SDK branch graph, arbitrary handler interleavings, or provider calls.

The [v0.15.28 update verification](../../../../docs/pstack-update-verification.md) records one completed bounded-model and SDK exercise, including retained fixture paths and tool versions. It is evidence of that run, not a dependency required for every offline test.

## Gotchas

A passing old model can describe stale code. Confirm correspondence before interpreting a pass. A counterexample is a product finding only when its steps can occur in the real code. A blocked check keeps its previous sync commit. Never weaken a property just to make it pass. Mutations and tool setup stay in the fixture, and evidence survives cleanup.
