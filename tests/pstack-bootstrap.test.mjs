import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { sdk } from "./support/pi-sdk.mjs";

const repo = fileURLToPath(new URL("../", import.meta.url));

async function fixture(t, extension) {
	const dir = mkdtempSync(join(tmpdir(), "pstack-bootstrap-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const settingsManager = sdk.SettingsManager.inMemory({ packages: [], skills: [join(repo, "vendor/pstack/skills")], retry: { enabled: false }, compaction: { enabled: false } });
	const loader = new sdk.DefaultResourceLoader({ cwd: dir, agentDir: dir, settingsManager, noExtensions: true,
		additionalExtensionPaths: [join(repo, extension)], noContextFiles: true, noPromptTemplates: true, noThemes: true });
	await loader.reload();
	assert.deepEqual(loader.getExtensions().errors, []);
	const modelRuntime = await sdk.ModelRuntime.create({ authPath: join(dir, "auth.json"), modelsPath: null,
		modelsStorePath: join(dir, "models.json"), allowModelNetwork: false, refreshOnCreate: false });
	modelRuntime.registerProvider("bootstrap-test", { baseUrl: "http://127.0.0.1:1", api: "openai-completions", apiKey: "offline",
		models: [{ id: "offline", name: "Offline", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 100000, maxTokens: 1000 }] });
	const { session } = await sdk.createAgentSession({ cwd: dir, agentDir: dir, resourceLoader: loader, settingsManager, modelRuntime,
		model: modelRuntime.getModel("bootstrap-test", "offline"), sessionManager: sdk.SessionManager.inMemory(dir), tools: ["read"] });
	t.after(() => session.dispose());
	await session.bindExtensions({});
	const observed = [];
	modelRuntime.streamSimple = (_model, context) => {
		observed.push({ prompt: session.systemPrompt, messages: structuredClone(context.messages) });
		throw new Error("offline probe: no provider request");
	};
	return { session, observed, async prompt(text) {
		await session.prompt(text).catch(error => assert.match(error.message, /offline probe/));
		return observed.at(-1);
	} };
}

test("standalone skills include the Pi adapter and the exact upstream body with mode off", async (t) => {
	const f = await fixture(t, "extensions/pstack-mode.ts");
	for (const name of ["how", "sharpen", "setup-pstack"]) {
		const request = await f.prompt(`/skill:${name} inspect this fixture`);
		assert.match(request.prompt, /PSTACK PI HOST ADAPTER/);
		assert.match(request.prompt, /# pstack in Pi/);
		assert.doesNotMatch(request.prompt, /PSTACK MODE ACTIVE/);
		const body = readFileSync(join(repo, `vendor/pstack/skills/${name}/SKILL.md`), "utf8").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
		const text = request.messages.filter(message => message.role === "user").flatMap(message => typeof message.content === "string" ? [message.content] : message.content.filter(block => block.type === "text").map(block => block.text)).join("\n");
		assert.ok(text.includes(body), `${name} upstream body is unchanged`);
	}
});

test("ordinary requests retain a small adapter locator without enabling a workflow", async (t) => {
	const f = await fixture(t, "extensions/pstack-mode.ts");
	const request = await f.prompt("hello");
	assert.match(request.prompt, /adapters\/pstack\/pi\.md/);
	assert.doesNotMatch(request.prompt, /# pstack in Pi|PSTACK MODE ACTIVE/);
	assert.deepEqual(f.session.getActiveToolNames(), ["read"]);
});

test("a fresh child-only bootstrap supplies host rules without inherited context", async (t) => {
	const f = await fixture(t, "adapters/pstack/bootstrap.ts");
	const request = await f.prompt("Inspect the assigned files only");
	assert.match(request.prompt, /# pstack in Pi/);
	assert.match(request.prompt, /PSTACK PI HOST ADAPTER/);
	assert.doesNotMatch(request.prompt, /PSTACK MODE ACTIVE/);
	assert.deepEqual(f.session.getActiveToolNames(), ["read"]);
});
