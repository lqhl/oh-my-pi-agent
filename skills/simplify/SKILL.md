---
name: simplify
description: Reviews recent code changes for code reuse, quality, and efficiency issues, then fixes them in place. Modeled on the Claude Code /simplify bundled skill. Use when the user says simplify, clean up the diff, review changed code, tidy up recent changes, or asks to run simplify on their work — typically right after implementing a feature or fixing a bug and before committing or opening a PR. Pass optional focus text as arguments, e.g. "focus on memory efficiency".
---

# Simplify — Code Review and Cleanup

Review all changed files for reuse, quality, and efficiency, then fix the issues found.
This is not a bug hunt — it is a cleanup pass over your recent work. Do not chase
correctness bugs (that is a code review concern); look for duplication, quality
smells, and wasted work in the changed code, then apply the fixes.

Optionally accept a focus hint: if the user invoked the skill with arguments (e.g.
`/skill:simplify memory efficiency`), treat that text as an **additional focus** —
the three reviews below still all run, but weight attention toward that concern and
pass it into every reviewer.

## Phase 1 — Identify changes

1. Run `git status --short` to surface untracked new files (no diff command shows these).
2. Run `git diff HEAD` to capture unstaged + staged changes to tracked files.
3. If that diff is empty, try `git diff` against the merge-base (for freshly committed work).
4. If still empty, review the most recently modified files that the user mentioned or that you edited earlier in this conversation.
5. For each untracked file from step 1, read its full contents and treat it as a fully-added file so reviewers see new files.
6. Small-diff shortcut: if the combined diff is under ~20 lines and covers a single concern, skip the parallel fanout and just dispatch the single most relevant reviewer — three reviewers on a six-line diff is noise.

## Phase 2 — Launch three reviewers in parallel

Launch three read-only `reviewer` subagents **concurrently in a single message**
(one `subagent` call with a `tasks` array). Give each the full diff plus the focus
hint, and its angle below. Each must be instructed:

- Do NOT edit, write, or modify any file. Report findings only.
- Return findings as a concise list of items, each with: file path, line or region,
  one-line summary of the issue, the concrete cost (what is duplicated, wasted, or
  harder to maintain), and a specific suggested fix.
- Skip false positives silently — do not pad the report.

Use `context: "fresh"` so each reviewer inspects the diff independently, and
`async: true` so they run in parallel without blocking your own turn.

### Reviewer 1 — Code Reuse

For each change:

1. **Search for existing utilities and helpers** that could replace newly written
   code. Look for similar patterns elsewhere in the codebase — common locations are
   utility directories, shared modules, and files adjacent to the changed ones.
2. **Flag any new function that duplicates existing functionality.** Suggest the
   existing function to use instead.
3. **Flag any inline logic that could use an existing utility** — hand-rolled
   string manipulation, manual path handling, custom environment checks, ad-hoc
   type guards, and similar patterns are common candidates.

### Reviewer 2 — Code Quality

Review the same changes for hacky patterns:

1. **Redundant state**: state that duplicates existing state, cached values that
   could be derived, observers/effects that could be direct calls.
2. **Parameter sprawl**: adding new parameters to a function instead of generalizing
   or restructuring existing ones.
3. **Copy-paste with slight variation**: near-duplicate code blocks that should be
   unified with a shared abstraction.
4. **Leaky abstractions**: exposing internal details that should be encapsulated,
   or breaking existing abstraction boundaries.
5. **Stringly-typed code**: using raw strings where constants, enums, or branded
   types already exist in the codebase.
6. **Unnecessary JSX nesting**: wrapper elements that add no layout value — check
   if inner component props already provide the needed behavior.
7. **Nested conditionals**: ternary chains (`a ? x : b ? y : ...`), nested if/else,
   or nested switch 3+ levels deep — flatten with early returns, guard clauses, a
   lookup table, or an if/else-if cascade.
8. **Unnecessary comments**: comments explaining WHAT the code does (well-named
   identifiers already do that), narrating the change, or referencing the task or
   caller — delete; keep only non-obvious WHY (hidden constraints, subtle
   invariants, workarounds).

### Reviewer 3 — Efficiency

Review the same changes for efficiency (no premature optimization):

1. **Unnecessary work**: redundant computations, repeated file reads, duplicate
   network/API calls, N+1 patterns.
2. **Missed concurrency**: independent operations run sequentially when they could
   run in parallel.
3. **Hot-path bloat**: new blocking work added to startup or per-request/per-render
   hot paths.
4. **Recurring no-op updates**: state/store updates inside polling loops, intervals,
   or event handlers that fire unconditionally — suggest a change-detection guard so
   downstream consumers aren't notified when nothing changed. Also verify wrappers
   that take an updater/reducer callback honor same-reference returns, otherwise
   callers' early-return no-ops are silently defeated.
5. **Unnecessary existence checks**: pre-checking file/resource existence before
   operating (TOCTOU anti-pattern) — operate directly and handle the error.
6. **Memory**: unbounded data structures, missing cleanup, event listener leaks.
7. **Overly broad operations**: reading entire files when only a portion is needed,
   loading all items when filtering for one.

## Phase 3 — Apply fixes

Wait for all three reviewers to complete (use `subagent_wait` when you must finish
in this turn, otherwise let Pi wake you). Then:

1. **Aggregate and dedupe** findings that point at the same line or mechanism.
2. **Filter** before applying:
   - Skip anything whose fix would change intended behavior.
   - Skip fixes that require changes well outside the reviewed diff.
   - Skip false positives. Do not argue with a finding — note it and move on.
3. **Apply fixes directly and sequentially** (you are the single writer): read each
   file first, then make the edits one at a time, top to bottom per file.
4. **Do not run the linter or formatter** for you — if the repo has one and the
   user expects it, run it once after edits and clean up anything it flags that is
   mechanical.

## Phase 4 — Report

When done, briefly summarize what was fixed (or confirm the code was already
clean), grouped per file, with a one-liner per change. Note anything you noticed
but deliberately skipped, and why.
