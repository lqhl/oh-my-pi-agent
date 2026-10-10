### Bug fix

**You own this task. Plan, review, verify.** Execute directly unless bounded delegation is authorized under the Pi execution contract.

Be scientific. Every shipped line traces to runtime evidence. Belt-and-suspenders that "might help" is a hypothesis, not a fix. It does not ship. When evidence refutes a hypothesis, revert what it motivated. The smallest change the evidence justifies ships, nothing more.

1. Reproduce it yourself on the matching surface via the control skill (Non-negotiables), even when a debug or instrumentation protocol says to ask the user to reproduce. Ask the user only with a stated, specific reason the control surface cannot reach the target, and only after driving it as far as it goes. If it won't reproduce directly, synthesize the trigger, tighten conditions, or instrument until it fires.
2. Binary-search the cause. Form the candidate hypotheses, then rule them out until one survives. Seed them with `how` over the affected subsystem and the **why** skill for regression history. Each pass, take the split that cuts the most remaining problem space, get runtime evidence, eliminate. When program state is unclear, add instrumentation or logging and read it as the code runs. Don't guess. Continue a stubborn hunt with a concrete reproduction and elimination check for each hypothesis. Use pi-goal only when the user explicitly requests goal mode. Confirm the surviving *mechanism* with runtime evidence before design or review.
3. Plan the fix. If a meaningful design change crosses a function boundary, `architect` first. Implement directly, or use a bounded native `poteto-agent` when delegation is authorized. Name allowed paths, the root cause, acceptance criteria, and the original reproduction. Review any delegated diff before acceptance.
4. Verify on the same surface. The original repro now passes. "Inconclusive" or wrong-surface is not a pass. Flag it. Unit tests show branch behavior, not bug absence.
5. Keep the failing reproduction as evidence before the fix. Use **tdd** when there is a cheap meaningful local test. Keep commits small when committing is part of delivery; do not rewrite unrelated history to manufacture a failing-test commit.
6. Prepare delivery under **Opening a PR** when the user wants a PR; otherwise report the checked local diff.

**Reply:** what was broken, root cause, fix, how you verified. Paste failing-then-passing repro output verbatim.
