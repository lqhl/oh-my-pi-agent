import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

import { sdk } from "./support/pi-sdk.mjs";

const repo = fileURLToPath(new URL("../", import.meta.url));
const { DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager, createAgentSession } = sdk;

async function fixture(t) {
	const dir = mkdtempSync(join(tmpdir(), "reload-runtime-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const probePath = join(dir, "probe.ts");
	writeFileSync(probePath, `import { Type } from "typebox";
export default function (pi) {
	pi.registerTool({ name: "runtime_probe", label: "Runtime probe", description: "Read the active tool names",
		parameters: Type.Object({}), execute() {
			return { content: [{ type: "text", text: "live" }], details: { tools: pi.getActiveTools() } };
		} });
}`);
	const settingsManager = SettingsManager.inMemory({ packages: [], retry: { enabled: false }, compaction: { enabled: false } });
	const loader = new DefaultResourceLoader({
		cwd: dir, agentDir: dir, settingsManager, noExtensions: true,
		additionalExtensionPaths: [join(repo, "extensions/reload-runtime.ts"), probePath],
		noSkills: true, noContextFiles: true, noPromptTemplates: true, noThemes: true,
	});
	await loader.reload();
	assert.deepEqual(loader.getExtensions().errors, []);
	const modelRuntime = await ModelRuntime.create({
		authPath: join(dir, "auth.json"), modelsPath: null, modelsStorePath: join(dir, "models-cache.json"),
		allowModelNetwork: false, refreshOnCreate: false,
	});
	modelRuntime.registerProvider("reload-test", {
		baseUrl: "http://127.0.0.1:1", api: "openai-completions", apiKey: "offline-test-key",
		models: [{ id: "offline", name: "Offline probe", reasoning: false, input: ["text"],
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 100000, maxTokens: 1000 }],
	});
	const { session } = await createAgentSession({
		cwd: dir, agentDir: dir, resourceLoader: loader, settingsManager, modelRuntime,
		model: modelRuntime.getModel("reload-test", "offline"), sessionManager: SessionManager.inMemory(dir),
		tools: ["read", "reload_runtime", "runtime_probe"],
	});
	t.after(() => session.dispose());
	const reloadOperations = [];
	const errors = [];
	await session.bindExtensions({
		commandContextActions: { reload: () => {
			const operation = session.reload();
			reloadOperations.push(operation);
			return operation;
		} },
		onError: (error) => errors.push(error),
	});
	session.setActiveToolsByName(["read", "reload_runtime", "runtime_probe"]);
	assert.deepEqual(session.getActiveToolNames(), ["read", "reload_runtime", "runtime_probe"]);
	return { session, modelRuntime, errors, reloads: () => reloadOperations.length,
		reloaded: () => Promise.all(reloadOperations),
		tool: (name) => session.state.tools.find((tool) => tool.name === name) };
}

for (const requests of [1, 2]) {
	test(`tools stay live through ${requests} reload request(s), then the settled run reloads once`, async (t) => {
		const f = await fixture(t);
		const oldProbe = f.tool("runtime_probe");
		const reloadTool = f.tool("reload_runtime");
		let beforeFinish;
		f.modelRuntime.streamSimple = () => {
			const actions = (async () => {
				assert.equal(f.session.isStreaming, true);
				try {
					for (let i = 0; i < requests; i++) await reloadTool.execute(`reload-${i}`, {});
					const result = await oldProbe.execute("probe-before-settle", {});
					beforeFinish = { reloads: f.reloads(), tools: result.details.tools };
				} catch (error) {
					beforeFinish = { reloads: f.reloads(), error: error.message };
				}
			})();
			return {
				async *[Symbol.asyncIterator]() { await actions; throw new Error("offline probe: no provider request"); },
				async result() { await actions; throw new Error("offline probe: no provider request"); },
			};
		};
		await f.session.prompt("exercise runtime reload").catch((error) => assert.match(error.message, /offline probe/));
		assert.deepEqual(beforeFinish, { reloads: 0, tools: ["read", "reload_runtime", "runtime_probe"] });
		assert.equal(f.reloads(), 1);
		assert.deepEqual(f.errors, []);
		const newProbe = f.tool("runtime_probe");
		assert.notEqual(newProbe, oldProbe);
		assert.deepEqual((await newProbe.execute("probe-after-reload", {})).details.tools, ["read", "reload_runtime", "runtime_probe"]);
		await assert.rejects(async () => oldProbe.execute("old-handle", {}), /This extension ctx is stale/);
	});
}

test("the explicit command reloads at idle and preserves rejection of old tool handles", async (t) => {
	const f = await fixture(t);
	const oldProbe = f.tool("runtime_probe");
	await f.session.prompt("/reload-runtime");
	assert.equal(f.reloads(), 1);
	assert.deepEqual(f.errors, []);
	assert.equal((await f.tool("runtime_probe").execute("new-handle", {})).content[0].text, "live");
	await assert.rejects(async () => oldProbe.execute("old-handle", {}), /This extension ctx is stale/);
});


test("an idle SDK tool caller applies the reload without waiting for another run", async (t) => {
	const f = await fixture(t);
	await f.tool("reload_runtime").execute("idle-reload", {});
	assert.equal(f.reloads(), 1);
	await f.reloaded();
	assert.deepEqual(f.errors, []);
	assert.equal((await f.tool("runtime_probe").execute("new-handle", {})).content[0].text, "live");
});
