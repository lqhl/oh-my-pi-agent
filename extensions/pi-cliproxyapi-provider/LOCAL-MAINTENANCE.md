# Local maintenance

Copied from installed `pi-cliproxyapi-provider` 0.15.32 (MIT), without creating a separate repository. Source remains identical to the installed version. User settings load `./extensions/pi-cliproxyapi-provider` instead of the npm package. Runtime configuration remains in `~/.pi/agent/pi-cliproxyapi-provider/config.json`; credentials remain outside this source directory.

## Subagent startup diagnosis

The original failing call used `async: false`. In this installed pi-subagents version, foreground children do not load ambient extensions. CPA is registered by an extension, so its models were absent from that child's registry. The reported `cpa/gpt-6-astra:low` lookup error was not evidence that CPA rejected a request or thinking suffix.

`pi-subagents/src/runs/shared/child-session.ts` loads extensions, flushes provider registrations, then calls Pi's `resolveCliModel`. Pi separates model identity from thinking level before creating the session. `docs/agents.md` explicitly requires background (`async: true`) children for ambient provider extensions.

Use `subagent({agent: "scout", task: "...", async: true})`. Do not disable thinking or register colon-suffixed model aliases as a workaround. No provider protocol patch is justified by this failure.

Verified run `2f407eae-b222-4fb1-8617-7daeaf434370`: model `cpa/gpt-6-astra`, thinking `low`, successful read of this package's package.json, final `SUBAGENT_OK pi-cliproxyapi-provider 0.15.32`. Final-state verification is recorded in the parent session.

## Test limitations

The published npm package omits its upstream test directory and tsconfig.json, although package.json retains test/typecheck scripts. Therefore those scripts do not provide a working test suite in this copy. No typecheck pass is claimed. Live subagent tests cover registration, authentication, model response and tool execution, not every provider feature.
