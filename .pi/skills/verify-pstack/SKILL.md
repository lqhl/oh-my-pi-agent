---
name: verify-pstack
description: Verify this Pi configuration's pstack skill loading, persistent mode, session restoration, and native agent contracts after changing local pstack files.
---

# Verify this pstack configuration

## Launch

Run from this configuration repository. Require Python 3, Bash, Node compatible with the installed Pi (currently Node 22.19+), and `pi` on PATH. No app server or model API is needed for the standard pass. The SDK tests create isolated temporary agent directories and intercept provider requests locally.

## Doctor

Run `git status --short`, `node --version`, and `pi --version`. Confirm this checkout contains `settings.json`, `extensions/pstack-mode.ts`, `adapters/pstack/bootstrap.ts`, and `tests/pstack-bootstrap.test.mjs`. Do not modify unrelated changes or update packages as part of verification.

## Drive

1. Run `./scripts/check-enabled-skills.sh`. It must report pristine upstream files, the declared disabled set, valid names, no duplicates, no broken relative links, the Pi adapter, and current prompt workflows.
2. Run `node --test tests/*.test.mjs`. All current tests must pass. Also run `python3 -B -m unittest discover -s tests -p 'test_*.py' -v` to check the real validation command and configuration pack against isolated valid and invalid snapshots. Run the Node suite twice: once with the CLI Pi SDK and once with `PSTACK_TEST_SDK_ROOT` set to the pi-web SDK. They cover pristine upstream loading, adapter-skill composition, fresh child bootstrap, branch restoration, compaction, mode removal, delayed runtime reload, and scoped history selection. A reload requested during an agent run must keep its tools usable until the run settles, apply once, and provide fresh tool handles afterward.
3. In a real interactive Pi session, after reloading resources, run `/pstack status`, `/pstack on`, `/pstack status`, `/pstack off`. Check the notifications and `pstack` footer status. The sequence must not start an agent task or change active tools.
4. For context skills, invoke `/skill:ketchup` in the active chat and check that it starts with the pending user-action count. Invoke `/skill:recall <topic>` in a project and check its stated workspace, window, cited session IDs, and live Git state. An empty match and an unavailable session store must be reported differently.
5. Check that `sharpen`, `in-your-own-words`, `create-formal-verification-skill`, and `maintain-formal-verification-skill` load as explicit-only commands. For formal workflow changes, follow [the formal workflow checks](features/formal-workflows.md) in an isolated fixture. Standard offline checks need no Java or verifier.
6. Inspect native `subagent` capabilities and model resolution when agent definitions or overrides changed. Real cross-model review or parallel write probes require the requested delegation scope and existing authentication; run those in isolated test worktrees and record actual native results separately from the offline checks.

The mapped surfaces are indexed in [features/README.md](features/README.md). Read the relevant feature when a check fails.

## Evidence

Save command output and terminal observations in a fresh task evidence directory outside the checkout, such as `/tmp/pstack-verification-<run>/`. Keep test totals, actual commands, exit codes, model/run IDs when delegated, and native output/handoff references. Static checks, intercepted SDK requests, interactive command behavior, and live delegated work are separate evidence.

## Cleanup

Tests remove only directories they create. Close a terminal session or process that this run started. Keep logs and native artifacts. Do not remove a user's existing session, credential files, or unrelated worktrees. Follow the native reviewed cleanup procedure for retained managed worktrees.

## Finish or stop

Report pass, failure, or blocker per surface with its evidence path. A missing Pi installation, unsupported SDK API, unavailable model, failed child, or missing authentication is not a pass. Standard offline checks do not establish browser UI behavior or successful cross-model delegation.
