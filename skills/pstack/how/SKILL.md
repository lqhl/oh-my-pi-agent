---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
disable-model-invocation: true
---

# How

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

Read [`../poteto-mode/references/pi-runtime.md`](../poteto-mode/references/pi-runtime.md) for the execution contract. A simple question is answered directly. When delegation is authorized, use native `scout` explorers and a fresh `reviewer` explainer, with durable output paths and the native model defaults.

## Step 1. Assess Complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work"): explore and explain directly. Go to Step 2b.
- **Complex** (a subsystem spanning multiple files or services, a cross-cutting feature, a full architectural overview): use 2 to 4 exploration angles. When delegation is authorized, compose explorers and the dependent explainer into one native async workflow. Otherwise inspect the angles directly. Go to Step 2a.

When in doubt, take the simple path.

## Step 2a. Explore (complex questions only)

Decompose the question into 2 to 4 distinct slices. For authorized delegation, launch fresh native `scout` children with `runs.all`, one output path per angle. They inspect source only and do not edit files. Otherwise investigate those angles in the parent.

Each explorer uses `references/explorer-prompt.md` with its angle filled in. Then go to Step 3.

## Step 2b. Direct Explain (simple questions)

Explore and explain in the parent using `references/explainer-prompt.md` without the explorer-findings section. If the operator explicitly requests a separate explainer, use a fresh native `reviewer` with a bound output path. Go to Step 4.

## Step 3. Synthesize (complex questions only)

After every required angle has a completed result, synthesize with `references/explainer-prompt.md` and all findings. For authorized delegation, run a dependent fresh `reviewer` inside the same workflow, on the configured judgment model, with its output bound on the run. Spot-check citations. A failed required explorer blocks synthesis; a missing result is not evidence.

## Step 4. Present

Present the explainer's output to the user. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.

## Output Format

The explanation uses the sections defined in `references/explainer-prompt.md`, dropping any that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.
