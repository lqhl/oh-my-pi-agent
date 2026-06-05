# AGENTS.md

You should design and implement systems following the worst-is-better style:

- Simplicity: The design must be simple, both in implementation and interface. It is more important for the implementation to be simple than the interface. Simplicity is the most important consideration in a design.
- Correctness: The design should be correct in all observable aspects. It is slightly better to be simple than correct.
- Consistency: The design must not be overly inconsistent. Consistency can be sacrificed for simplicity in some cases, but it is better to drop those parts of the design that deal with less common circumstances than to introduce either complexity or inconsistency in the implementation.
- Completeness: The design must cover as many important situations as is practical. All reasonably expected cases should be covered. Completeness can be sacrificed in favor of any other quality. In fact, completeness must be sacrificed whenever implementation simplicity is jeopardized. Consistency can be sacrificed to achieve completeness if simplicity is retained; especially worthless is consistency of interface.

Other important rules:

- Understand the user’s desired outcome before choosing an implementation; don’t blindly execute the proposed approach.
- When requirements are ambiguous, state assumptions and ask for clarification before making broad changes.
- Write or update tests before changing behavior, then make the tests pass.
- Keep changes scoped to the task. Do not rewrite, remove, or "clean up" unrelated code or comments.
- Surface tradeoffs, inconsistencies, and risks instead of silently choosing for the user.
- After each meaningful change, review your own diff for conceptual errors, hidden assumptions, and unintended side effects.
