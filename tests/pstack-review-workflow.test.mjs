import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runWorkflow } from "../npm/node_modules/@tintinweb/pi-subagents/dist/workflow/runtime.js";

const prompt = readFileSync(new URL("../prompts/implement-and-review.md", import.meta.url), "utf8");
const script = prompt.match(/```js workflow\n([\s\S]*?)\n```/)[1];
const args = {
	task: "Fix the scoped issue",
	reviewerModel: "corp/judgment",
	reviewerEffort: "high",
	adapterPath: "/fixture/adapters/pstack/pi.md",
	potetoPath: "/fixture/vendor/pstack/skills/poteto-mode",
};

function execute(args, launches, failLabel) {
	return runWorkflow({
		script,
		args,
		host: {
			spawnAgent: async (request) => {
				launches.push(request);
				if (request.label === failLabel) return { ok: false, error: "fixture failure" };
				return { ok: true, text: `${request.label} evidence` };
			},
			resumeAgent: async (agentId, prompt) => {
				launches.push({ resume: agentId, prompt });
				return { ok: true, text: "follow-up evidence" };
			},
			abortAgent: () => { throw new Error("Unexpected abort"); },
		},
	});
}

test("review workflow passes the reviewer model and effort to the restricted profile", async () => {
	const launches = [];
	const result = await execute(args, launches);
	assert.equal(result.status, "completed", result.error);
	assert.deepEqual(result.value, {
		implementation: "implement evidence",
		review: "review evidence",
		followUp: "follow-up evidence",
	});
	const [writer, review, followUp] = launches;
	assert.equal(writer.agentType, "poteto-agent");
	assert.ok(writer.prompt.includes(`${args.potetoPath}/SKILL.md`));
	assert.equal(review.agentType, "pstack-reviewer");
	assert.equal(review.model, args.reviewerModel);
	assert.equal(review.effort, args.reviewerEffort);
	assert.match(review.prompt, /implement evidence/);
	assert.equal(followUp.resume, writer.agentId);
	assert.match(followUp.prompt, /review evidence/);
	for (const { prompt } of launches) {
		assert.equal(prompt.split("\n")[0], `Read ${args.potetoPath}/worker.md before anything else.`);
		assert.ok(prompt.includes(args.adapterPath));
	}
});

test("review workflow rejects a missing reviewer route before starting a writer", async () => {
	const launches = [];
	const result = await execute({ ...args, reviewerModel: null }, launches);
	assert.equal(result.status, "failed");
	assert.match(result.error, /reviewerModel/);
	assert.equal(launches.length, 0);
});

test("review workflow stops when the reviewer fails", async () => {
	const launches = [];
	const result = await execute(args, launches, "review");
	assert.equal(result.status, "failed");
	assert.match(result.error, /Review failed: fixture failure/);
	assert.deepEqual(launches.map(item => item.label), ["implement", "review"]);
});
