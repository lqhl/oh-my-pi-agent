import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runWorkflowScript } from "../npm/node_modules/pi-subagents/src/workflows/scripted-workflow.js";

const prompt = readFileSync(new URL("../prompts/implement-and-review.md", import.meta.url), "utf8");
const script = prompt.match(/```js workflow\n([\s\S]*?)\n```/)[1];

function execute(args, launches) {
	return runWorkflowScript({
		script,
		args,
		launch: async (key, params) => {
			launches.push({ key, ...params });
			return { key, ok: true, runId: `${key}-run`, output: `${key} evidence`, artifactPaths: [] };
		},
		status: async () => { throw new Error("Unexpected status request"); },
	});
}

test("review workflow passes the resolved reviewer model and effort to the restricted profile", async () => {
	const launches = [];
	await execute({ task: "Fix the scoped issue", reviewerModel: "corp/judgment:high" }, launches);
	const review = launches.find(item => item.key === "review");
	assert.equal(review.agent, "pstack-reviewer");
	assert.equal(review.model, "corp/judgment:high");
	assert.equal(review.context, "fresh");
	assert.match(review.task, /implement evidence/);
	assert.equal(launches.at(-1).resume, "implement-run");
});

test("review workflow rejects a missing reviewer route before starting a writer", async () => {
	const launches = [];
	await assert.rejects(execute({ task: "Fix the scoped issue" }, launches), /reviewerModel/);
	assert.equal(launches.length, 0);
});
