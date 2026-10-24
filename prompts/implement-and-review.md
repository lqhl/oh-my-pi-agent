---
description: One writer implements, a fresh reviewer checks, then the writer addresses accepted feedback
---
Use one native async workflow with a writer, a fresh read-only reviewer, and a retained writer follow-up. Review findings are evidence; the parent decides what to accept.

Before launching, inspect `subagent({ action: "models" })` for the effective native `reviewer` route in this session. Pass that exact provider/model as `reviewerModel`, with its effective thinking level as a supported model suffix (for example, `provider/model:high`). If reviewer inherits the parent, resolve the actual parent model and effort. Do not substitute the writer route or invent a model ID. A missing or unavailable route blocks this workflow before implementation.

```js workflow
if (typeof args.reviewerModel !== "string" || !args.reviewerModel.trim()) {
  throw new Error("Resolve the effective native reviewer model and thinking into reviewerModel before launching");
}
const implementation = await runs.run("implement", {
  label: "Implement the scoped task",
  agent: "poteto-agent",
  context: "fresh",
  task: "Implement this task within the supplied scope. Verify real behavior and report changed files, tests, evidence, and residual risks.\n\nTask:\n" + args.task
});
const review = await runs.run("review", {
  label: "Review implementation and evidence",
  agent: "pstack-reviewer",
  model: args.reviewerModel,
  context: "fresh",
  task: "Review the implementation against the task, its tests, edge cases, and the supplied evidence. Report confirmed findings with file and symbol. Do not edit files.\n\nTask:\n" + args.task + "\n\nImplementation report:\n" + implementation.output
});
if (!implementation.runId) return { implementation: implementation.output, review: review.output, followUp: "writer was not retained" };
const followUp = await runs.run("followup", {
  label: "Address accepted review findings",
  resume: implementation.runId,
  context: "fresh",
  task: "Review this independent report. Address findings you can confirm within the original scope, rerun verification, and report anything rejected or still blocked.\n\nReview:\n" + review.output
});
return { implementation: implementation.output, review: review.output, followUp: followUp.output };
```

Call `subagent({ workflow: true, args: { task: $@, reviewerModel: "<resolved reviewer provider/model:thinking>" } })` after replacing the route with the actual resolved value. The parent checks the final integrated diff and evidence.
