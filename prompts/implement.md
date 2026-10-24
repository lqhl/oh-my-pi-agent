---
description: Scout context, plan in the parent, then implement through a bounded writer
---
Use one native async workflow. Scout first, then launch one writer with the resulting context. The parent retains design and acceptance.

```js workflow
const scan = await runs.run("scan", {
  label: "Map the implementation surface",
  agent: "pstack-scout",
  context: "fresh",
  task: "Find the files, entry points, contracts, tests, and risks for this task. Do not edit files.\n\nTask:\n" + args.task
});
const implementation = await runs.run("implement", {
  label: "Implement the scoped task",
  agent: "poteto-agent",
  context: "fresh",
  task: "Implement this task within the parent's scope. Verify the real behavior and report changed files, commands, results, and unresolved risks.\n\nTask:\n" + args.task + "\n\nScout context:\n" + scan.output
});
return { context: scan.output, implementation: implementation.output, runId: implementation.runId };
```

Call `subagent({ workflow: true, args: { task: $@ } })`. Review the returned diff and evidence before claiming completion.
