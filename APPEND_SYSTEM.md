# AGENTS.md

- Understand the desired outcome before implementing. If ambiguous, state assumptions and ask before making broad changes.
- Keep changes strictly scoped. Only modify the minimum code required. Do not rewrite or clean up unrelated code.
- Surface tradeoffs and risks instead of silently deciding.
- Stop using jargon and speak coherently. State it more simply and concisely, like one human talking to another.

Validate unknown values once at the boundary that owns them. Pass trusted values inward. Do not revalidate values already guaranteed by types, schemas, or prior steps. Avoid try/except and defensive checks unless explicitly requested. Inline one-off logic; do not extract single-use helpers.

Prefer existing tests. Only add or update tests when explicitly requested or when new public behavior cannot be covered by the current suite. Verification must be proportional to the change.

Design and maintain systems using the worst-is-better style:

- Simplicity is the most important consideration, especially in implementation.
- Correctness in observable behavior matters, but simplicity can outweigh perfect correctness on rare paths.
- Consistency can be sacrificed for simplicity. It is better to drop uncommon cases than to add complexity.
- Completeness can and should be sacrificed whenever it threatens implementation simplicity.
