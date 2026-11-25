---
description: One writer implements, a fresh reviewer checks, then the writer addresses accepted feedback
---
Use one `SubagentWorkflow` with a writer, a fresh read-only reviewer, and a retained writer follow-up. Review findings are evidence. The parent decides what to accept.

Confirm the effective judgment model and thinking level before starting. Pass the exact `provider/modelId` as `reviewerModel` and the thinking level separately as `reviewerEffort`. If the reviewer inherits the parent, resolve the actual parent model and effort. Pass the absolute paths from the active pstack adapter as `adapterPath` and `potetoPath`, where `potetoPath` is the directory containing `worker.md` and `SKILL.md`.

```js workflow
export const meta = {
  name: "implement-and-review",
  description: "Implement a scoped task, review its evidence, and resume the writer for follow-up"
};
if (typeof args.reviewerModel !== "string" || !args.reviewerModel.trim()) {
  throw new Error("Resolve reviewerModel before launching");
}
if (!["minimal", "low", "medium", "high", "xhigh", "max"].includes(args.reviewerEffort)) {
  throw new Error("Resolve reviewerEffort before launching");
}
if (![args.adapterPath, args.potetoPath].every(path => typeof path === "string" && path.startsWith("/"))) {
  throw new Error("Supply absolute adapterPath and potetoPath before launching");
}
const kickoff = `Read ${args.potetoPath}/worker.md before anything else.\nRead the Pi adapter at ${args.adapterPath}.\n\n`;
const implementation = await agent(
  kickoff + `Read ${args.potetoPath}/SKILL.md in full.\n\nImplement this task within the supplied scope. Verify real behavior and report changed files, tests, evidence, and residual risks.\n\nTask:\n${args.task}`,
  { label: "implement", agentType: "poteto-agent" }
);
if (implementation === null) throw new Error("Implementation failed: " + agentError("implement"));
const review = await agent(
  kickoff + `Review the implementation against the task, its tests, edge cases, and the supplied evidence. Report confirmed findings with file and symbol. Do not edit files.\n\nTask:\n${args.task}\n\nImplementation report:\n${implementation}`,
  { label: "review", agentType: "pstack-reviewer", model: args.reviewerModel, effort: args.reviewerEffort }
);
if (review === null) throw new Error("Review failed: " + agentError("review"));
const followUp = await agent(
  kickoff + `Review this independent report. Address findings you can confirm within the original scope, rerun verification, and report anything rejected or still blocked.\n\nReview:\n${review}`,
  { label: "follow-up", resume: "implement" }
);
if (followUp === null) throw new Error("Writer follow-up failed: " + agentError("follow-up"));
return { implementation, review, followUp };
```

Run the script with `SubagentWorkflow` and pass `task` (the operator's `$@` assignment), `reviewerModel`, `reviewerEffort`, `adapterPath`, and `potetoPath` in `args`. The parent checks the final integrated diff and evidence.
