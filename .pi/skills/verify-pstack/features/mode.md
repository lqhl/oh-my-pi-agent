# Persistent mode

## Sub-features

On/off/status, repeated on, full workflow injection, resource reload, session resume, compaction, and active-branch restoration.

## How to get to it (user POV)

Reload Pi resources and enter `/pstack on`. The footer and notification show the mode. Ask a task to apply the workflow; casual turns do not start one. Use `/pstack off` to remove the persistent instructions.

## Driving it with the SDK and terminal

From the repository, run `node --test tests/pstack-mode.test.mjs`. The final test calls actual SDK commands and intercepts three provider requests to check mode on, reload, and off. It asserts the provider's system-section removal and preserves the original tool selection. Branch and compaction tests use the real SessionManager.

In an interactive session, run status, on, status, off and retain the visible notifications. An isolated terminal probe must close the process it started and preserve its transcript.

Run `node --test tests/reload-runtime.test.mjs` for the four reload checks. A model's `reload_runtime` request stays pending until `agent_settled`. Tools from that run must remain usable until it finishes. Repeated requests cause one reload. After reload, a fresh handle works and an old handle remains rejected. The idle command and idle SDK tool paths must also work.

## Gotchas

A one-task `/skill:poteto-mode` does not enable the switch. A new session starts off. `session.systemPrompt` outside a run can return the base prompt; observe the active request to prove per-run instructions. Do not mistake a notification for proof of model-context injection or a launch receipt for a child result.
