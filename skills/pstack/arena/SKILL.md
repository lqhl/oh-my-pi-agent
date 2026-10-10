---
name: arena
description: "Spawn N parallel candidates at the same task, pick a base, graft the strongest parts of the losers into it. Use for /skill:arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape."
disable-model-invocation: true
---

# Arena

Fan out N parallel attempts at the same task. Read every candidate end to end. Pick the strongest as the base. Graft the best ideas from the others into it. Verify the synthesized result.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Cross-judge
4. Pick
5. Graft
6. Verify

## Phase A: Frame

The N candidates will receive the same prompt, so the prompt is the contract.

1. State the artifact each candidate is producing.
2. Derive the rubric. State what success looks like for *this* task, then turn it into 3-6 concrete gradeable criteria. The rubric is the picker's tool in Phase D. Candidates only see the task.
3. Pick at least two runners from the confirmed available coding and judgment models, following [`../poteto-mode/references/pi-runtime.md`](../poteto-mode/references/pi-runtime.md). Use `poteto-agent` for candidates, with native model overrides when needed. Compare distinct model families for judgment-sensitive work. When delegation is not authorized, explore distinct approaches directly and label the missing independent comparison.
4. Bind each candidate's report with the run's `output`. Code candidates use separate managed worktrees from a clean source. Read-only design candidates return design packages as runtime-routed output; they do not edit a shared checkout.

## Phase B: Fan out

Compose candidates and the dependent cross-judge in one native async workflow. Launch candidates with `runs.all`, distinct stable keys, short labels, bound output paths, the shared brief, source pointers, and their edit boundary. Ordinary candidates do not spawn children.

Each rationale names the alternatives considered and rejected. Inspect all terminal results before judging. A candidate's substantive failure can be recorded as a dropout when enough candidates remain for the promised comparison. A runtime or launch failure blocks dependent phases under the Pi execution contract; never silently shrink the panel.

## Phase C: Cross-judge

After every required candidate completes, use a fresh native `reviewer` on the configured judgment model, preferably a different family from the parent. It reads the rubric and candidate artifacts by path label, scores each criterion, and recommends a base. Bind its report on the run. It may run while the parent reads candidates, but never while candidates are still writing. Without authorized delegation, judge directly and state that independent cross-judgment was not performed.

## Phase D: Pick a base

Read every candidate end to end before picking.

Score each candidate against the rubric criterion by criterion, not on holistic feel. Compare against the cross-judge. Agreement on the base confirms the pick. Disagreement means one of you is biased or the rubric was ambiguous. Read both rationales before deciding.

Pick the base on which candidate a future maintainer can extend most easily without breaking invariants. Prefer the cleaner boundary or smaller API when two feel tied, per the Laziness Protocol.

Record the pick and the reason in a short synthesis note alongside the base artifact, including the cross-judge's verdict.

## Phase E: Graft

Walk each losing candidate once more and identify what is worth porting into the base. The signal is usually one or two things per candidate, not most of it.

Fold each graft in by hand, per the **redesign-from-first-principles** principle skill. Don't paste mechanically. The result has to remain coherent under one mental model.

Record what was grafted, from which candidate, and what was rejected and why.

When N candidates converge on the same shape, that is a strong agreement signal. Note the convergence in the record and ship the consensus shape. No graft is needed. When N candidates wildly diverge, Phase A was under-specified. Reframe and re-run rather than averaging the divergence.

## Phase F: Verify

The synthesized artifact has to hold up under the same scrutiny as any other output, per the **prove-it-works** principle skill.

If verification surfaces a problem the arena did not catch, either Phase A was wrong (re-frame and re-run) or one candidate caught it and you missed the graft (go back to Phase E). Don't paper over.

## Outputs

One synthesized artifact. One short synthesis note alongside, naming the base, the grafts (with source candidate), the rejections, the dropouts if any, and the verification result.
