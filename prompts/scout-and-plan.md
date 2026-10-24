---
description: Scout gathers context and the parent produces an implementation plan without editing code
---
Use one native async workflow. The scout child is read-only and fresh. Do not implement.

```js workflow
const scan = await runs.run("scan", {
  label: "Map the code relevant to the request",
  agent: "pstack-scout",
  context: "fresh",
  task: "Find the files, entry points, data flow, constraints, and risks relevant to this request. Do not edit files.\n\nRequest:\n" + args.request
});
return { context: scan.output };
```

Call `subagent({ workflow: true, args: { request: $@ } })`. After the workflow returns, write the plan in the parent from the scout's cited context. Include the affected files, data shape, ordered steps, acceptance predicates, and verification commands.
