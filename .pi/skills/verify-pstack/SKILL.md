---
name: verify-pstack
description: Verify this Pi configuration's pstack skill loading, persistent mode, session restoration, and native agent contracts after changing local pstack files.
---

# Verify this pstack configuration

## Launch

Run from this configuration repository. Require Python 3, Bash, Node compatible with the installed Pi (currently Node 22.19+), and `pi` on PATH. No app server or model API is needed for the standard pass. The SDK tests create isolated temporary agent directories and intercept provider requests locally.

## Doctor

Run `git status --short`, `node --version`, and `pi --version`. Confirm this checkout contains `settings.json`, `extensions/pstack-mode.ts`, and `tests/pstack-mode.test.mjs`. Do not modify unrelated changes or update packages as part of verification.

## Drive

1. Run `./scripts/check-enabled-skills.sh`. It must report no missing skills, invalid pstack names, duplicate names, or broken relative links.
2. Run `node --test tests/pstack-mode.test.mjs`. All eight tests must pass, including actual Pi loading, branch restoration, compaction, reload, and removal of the mode section from model context.
3. In a real interactive Pi session, after reloading resources, run `/pstack status`, `/pstack on`, `/pstack status`, `/pstack off`. Check the notifications and `pstack` footer status. The sequence must not start an agent task or change active tools.
4. Inspect native `subagent` capabilities and model resolution when agent definitions or overrides changed. Real cross-model review or parallel write probes require the requested delegation scope and existing authentication; run those in isolated test worktrees and record actual native results separately from the offline checks.

The mapped surfaces are indexed in [features/README.md](features/README.md). Read the relevant feature when a check fails.

## Evidence

Save command output and terminal observations in a fresh task evidence directory outside the checkout, such as `/tmp/pstack-verification-<run>/`. Keep test totals, actual commands, exit codes, model/run IDs when delegated, and native output/handoff references. Static checks, intercepted SDK requests, interactive command behavior, and live delegated work are separate evidence.

## Cleanup

Tests remove only directories they create. Close a terminal session or process that this run started. Keep logs and native artifacts. Do not remove a user's existing session, credential files, or unrelated worktrees. Follow the native reviewed cleanup procedure for retained managed worktrees.

## Finish or stop

Report pass, failure, or blocker per surface with its evidence path. A missing Pi installation, unsupported SDK API, unavailable model, failed child, or missing authentication is not a pass. Standard offline checks do not establish browser UI behavior or successful cross-model delegation.
