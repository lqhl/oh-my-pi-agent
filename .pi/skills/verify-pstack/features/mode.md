# Persistent mode

## Sub-features

On/off/status, repeated on, full workflow injection, resource reload, session resume, compaction, and active-branch restoration.

## How to get to it (user POV)

Reload Pi resources and enter `/pstack on`. The footer and notification show the mode. Ask a task to apply the workflow; casual turns do not start one. Use `/pstack off` to remove the persistent instructions.

## Driving it with the SDK and terminal

From the repository, run `node --test tests/pstack-mode.test.mjs`. The final test calls actual SDK commands and intercepts three provider requests to check mode on, reload, and off. It asserts the provider's system-section removal and preserves the original tool selection. Branch and compaction tests use the real SessionManager.

In an interactive session, run status, on, status, off and retain the visible notifications. An isolated terminal probe must close the process it started and preserve its transcript.

## Gotchas

A one-task `/skill:poteto-mode` does not enable the switch. A new session starts off. `session.systemPrompt` outside a run can return the base prompt; observe the active request to prove per-run instructions. Do not mistake a notification for proof of model-context injection or a launch receipt for a child result.
