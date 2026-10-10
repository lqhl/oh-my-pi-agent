---
name: why
description: Investigate why code or a design took its current shape using Git history, GitHub PRs and issues, repository documents, comments, and tests. Separate stated rationale from inference. Use how for runtime behavior.
disable-model-invocation: true
---

# Why

Investigate motivation and intent. `how` explains what the code does. `why` establishes the forces that shaped it.

Read [`../poteto-mode/references/pi-runtime.md`](../poteto-mode/references/pi-runtime.md) for tools and delegated execution. Read [`references/epistemics.md`](references/epistemics.md) for confidence and phrasing. Never cite mechanics as proof of intent.

## 1. Anchor the question

Identify the target files, symbols, relevant lines, and the rationale or tradeoff in question. When context resolves an ambiguous target, state the interpretation and proceed.

Build a history anchor directly:

```bash
git blame -L <start>,<end> -- <file>
git log --follow -p -- <file>
git log --oneline -20 -- <file>
git log -1 --format=%B <commit>
```

A recent commit is not necessarily the origin of the decision. Follow renames and earlier versions. Record merge PR numbers and links to repository documents.

When GitHub access is available, read the substantive PR bodies, comments, and reviews:

```bash
gh pr view <number> --json title,body,author,createdAt,mergedAt,closingIssuesReferences,comments,reviews
gh issue view <number> --json title,body,comments
```

Check the remote and `gh auth status` first. An inaccessible private repository or missing login is a concrete coverage gap. Do not stop local investigation or invent remote evidence.

## 2. Search the relevant sources

Use these sources only:

- **Git lineage.** Commits, blame, earlier implementations, commit messages, and tests.
- **GitHub discussion.** Linked PRs, reviews, and relevant GitHub issues when available.
- **Repository documents.** READMEs, ADRs, RFCs, changelogs, design notes, and constraint comments.

For a small target, search directly. For a broad target with authorized delegation, compose source readers and the dependent synthesis into one native async workflow. Use fresh `scout` children, one per useful source, the prompt in [`references/investigator-prompt.md`](references/investigator-prompt.md), and bound output paths. Pass the question and code anchor. Readers search only their source and never edit files or external state. Do not duplicate searches just to fill a roster.

Record exact searches and null results. For retries, guards, limits, or timeouts, look for the original failure, a regression test, or a PR explaining the external constraint. Missing historical evidence stays missing.

## 3. Synthesize and verify

Use [`references/synthesizer-prompt.md`](references/synthesizer-prompt.md) and the epistemics framework. The parent can synthesize directly. With authorized delegation, run a fresh native `reviewer` after all required source results complete, in the same workflow, on the judgment model. A failed required source reader blocks that delegated synthesis.

Spot-check citations and separate direct statements, converging evidence, inference, competing hypotheses, and unknowns. Preserve contradictions. Do not upgrade confidence while editing the response.

## 4. Present

Present the question, code anchor, findings, inference, competing hypotheses when relevant, unknowns, sources actually consulted, and a confidence summary. Omit empty sections other than the coverage and unknowns. Each direct finding carries a precise citation.

When the investigation prepares a code change, conclude with concrete Preserve / Change / Avoid / Risk constraints. Evidence narrows the change; it does not authorize a larger one.
