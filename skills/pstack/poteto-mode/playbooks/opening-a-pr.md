### Opening a PR

Prepare delivery after implementation when the user wants a PR. Otherwise leave a verified local diff and report it. A request to implement does not automatically publish, merge, or start a PR watcher.

1. **Review the change.** Resolve the intended base branch. Read the complete diff, including staged, unstaged, and relevant untracked files. Run local **deslop** and **no-comments** proportionally to the change and within delegation authority. A requested independent or cross-model review must finish before a clean-review claim.
2. **Verify.** Run the checks appropriate to the change and the real path named by acceptance criteria. Keep evidence. State blocked or inconclusive results honestly. Check the integrated result after bringing in candidate work.
3. **Prepare commits.** Work on a feature branch or isolated checkout. Preserve unrelated changes and history. Keep commits small and ordered when committing is part of delivery. Never hard-reset a shared branch or stash another person's work as a workflow shortcut.
4. **Write the briefing.** Apply **technical-writing** and **unslop**. Lead with the concrete problem and resulting behavior. A small PR needs a short explanation and verification. For a larger change, add scope, tradeoffs, and material risks only when they help a reviewer. Follow the repository template.
5. **Publish when authorized.** Check the GitHub remote and existing authentication. Use the provided PR tool when available, otherwise `gh`. Write multiline text to a file and pass `--body-file`. Use the requested base and readiness; open as a draft when checks or review remain. Keep independent work on independent branches. Use a base-branch stack only when the delivery calls for it.
6. **Report.** Read the actual created or updated PR before citing its URL. State verification and remaining work. Opening a PR does not authorize merge, force-push, deployment, or ongoing polling. A child returns its report and actual artifacts to the parent; publication stays with the parent unless expressly delegated.

Use Conventional Commits when the repository does: `type(scope): subject`, with a short imperative subject and no trailing period. Otherwise match local convention.

**Reply:** problem, resulting behavior, important choices, verification, and the actual PR URL or local diff. Keep runtime details in linked evidence when the reviewer needs them.
