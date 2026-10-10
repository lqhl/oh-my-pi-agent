---
name: swarm
description: Run bounded local Pi workers over independent slices or competing attempts, isolate concurrent writers in worktrees, and return one evidence-backed coverage report. Use for /skill:swarm or an explicit parallel task.
disable-model-invocation: true
---

# Swarm

Fan out local workers over slices, a race, or a mix. The parent owns coverage, integration, and acceptance. Read [`../poteto-mode/references/pi-runtime.md`](../poteto-mode/references/pi-runtime.md) before launching.

## Frame

1. Name the outcome, pass predicate, and coverage matrix. Each slice has a distinct source seam, scenario, or artifact. Do not clone vague prompts with different numbers.
2. Choose the smallest useful worker count within the native budget. One worker is valid. For code coupled across components, assign exclusive owners and integrate after blocking prerequisites; do not fan out overlapping writers.
3. Select executable native agents and confirmed available models. Use `scout` for source slices, `reviewer` for independent checks, and `poteto-agent` for bounded writes. A model race names each exact provider/model up front.
4. Assign stable keys, short labels, allowed paths, evidence, and a run-bound output path per worker. Read-only workers may share a directory. Concurrent writers require separate managed worktrees from a clean intended source tree.

## Run

Launch all workers inside one native async workflow. Use `runs.all` for independent slices and `await runs.run` for dependencies. Children are leaves and do not fan out again. When this skill is part of a larger workflow, add its steps to that workflow.

Let native completion wake the parent. Check terminal results, status, native artifact references, diffs, and verification evidence at each dependency barrier. A runtime or launch failure blocks dependent work. A failed scenario is a finding, not a successful verification; keep it visible in the matrix.

## Integrate and report

Read every required output. Reconcile overlapping findings and label disagreements. For writes, the parent selects or integrates diffs in one directory and verifies the integrated artifact. Never accept a worker's success summary in place of its evidence.

Return one report with slice coverage, actual models, run IDs, output references, worktree/branch information for writers, observed results, and unresolved risks. Keep artifacts and worktrees until integration is checked; use the native reviewed cleanup procedure afterward. Missing coverage prevents a complete-coverage claim.
