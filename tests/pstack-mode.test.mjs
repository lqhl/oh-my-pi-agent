import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import pstackMode from "../extensions/pstack-mode.ts";

const repo = fileURLToPath(new URL("../", import.meta.url));
let sdkDir = dirname(realpathSync(execFileSync("which", ["pi"], { encoding: "utf8" }).trim()));
while (!existsSync(join(sdkDir, "package.json"))) sdkDir = dirname(sdkDir);
const metadata = JSON.parse(readFileSync(join(sdkDir, "package.json"), "utf8"));
const sdk = await import(pathToFileURL(resolve(sdkDir, metadata.exports["."].import)).href);
const { DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager, createAgentSession } = sdk;

function harness(manager = SessionManager.inMemory(repo)) {
	const handlers = new Map();
	const commands = new Map();
	const statuses = new Map();
	const notices = [];
	pstackMode({
		on: (name, handler) => handlers.set(name, handler),
		registerCommand: (name, command) => commands.set(name, command),
		appendEntry: (name, data) => manager.appendCustomEntry(name, data),
	});
	const ctx = {
		sessionManager: manager,
		ui: {
			setStatus: (name, value) => statuses.set(name, value),
			notify: (text, level) => notices.push({ text, level }),
		},
	};
	return {
		manager, statuses, notices,
		command: (args) => commands.get("pstack").handler(args, ctx),
		event: (name, event = {}) => handlers.get(name)(event, ctx),
		async turn(sections = { ordinary: "keep the existing rules" }) {
			await handlers.get("before_agent_start")({ systemPromptOptions: { sections } }, ctx);
			return sections;
		},
	};
}

function modeEntries(manager) {
	return manager.getBranch().filter((entry) => entry.type === "custom" && entry.customType === "pstack-mode");
}

test("a new session stays off; status and invalid input do not change it", async () => {
	const h = harness();
	await h.event("session_start");
	await h.command("");
	await h.command("invalid");
	assert.deepEqual(await h.turn(), { ordinary: "keep the existing rules" });
	assert.equal(h.statuses.get("pstack"), undefined);
	assert.equal(modeEntries(h.manager).length, 0);
	assert.deepEqual(h.notices, [
		{ text: "pstack mode off", level: "info" },
		{ text: "Usage: /pstack on | off | status", level: "error" },
	]);
});

test("on injects the full workflow each turn without duplicating state or other sections", async () => {
	const h = harness();
	await h.command("on");
	await h.command(" on ");
	const sections = await h.turn();
	assert.equal(sections.ordinary, "keep the existing rules");
	assert.match(sections.pstack_mode, /\[PSTACK MODE ACTIVE\]/);
	assert.match(sections.pstack_mode, /## Principles/);
	assert.match(sections.pstack_mode, /## Playbooks/);
	assert.match(sections.pstack_mode, /playbooks\/bug-fix\.md/);
	assert.ok(sections.pstack_mode.includes(join(repo, "skills/pstack/poteto-mode/")));
	const original = sections.pstack_mode;
	assert.equal((await h.turn(sections)).pstack_mode, original);
	assert.equal(modeEntries(h.manager).length, 1);
	assert.equal(h.statuses.get("pstack"), "pstack");
});

test("off removes mode rules and remains off after reload", async () => {
	const h = harness();
	await h.command("on");
	const sections = await h.turn();
	await h.command("off");
	await h.command("off");
	assert.deepEqual(await h.turn(sections), { ordinary: "keep the existing rules" });
	const reloaded = harness(h.manager);
	await reloaded.event("session_start");
	assert.deepEqual(await reloaded.turn(), { ordinary: "keep the existing rules" });
	assert.equal(modeEntries(h.manager).length, 2);
});

test("branch navigation ignores an off switch on an abandoned branch", async () => {
	const h = harness();
	await h.command("on");
	const onLeaf = h.manager.getLeafId();
	await h.command("off");
	assert.equal(h.manager.getEntries().at(-1).data.enabled, false);
	h.manager.branch(onLeaf);
	await h.event("session_tree");
	assert.match((await h.turn()).pstack_mode, /PSTACK MODE ACTIVE/);
	assert.equal(h.statuses.get("pstack"), "pstack");
	h.manager.resetLeaf();
	assert.deepEqual(await h.turn(), { ordinary: "keep the existing rules" });
});

test("compaction can omit mode from model context while the branch still restores it", async () => {
	const h = harness();
	await h.command("on");
	const kept = h.manager.appendMessage({ role: "user", content: "continue this task", timestamp: Date.now() });
	h.manager.appendCompaction("task summary", kept, 1000);
	assert.equal(h.manager.buildContextEntries().some((entry) => entry.customType === "pstack-mode"), false);
	const restored = harness(h.manager);
	await restored.event("session_start");
	assert.match((await restored.turn()).pstack_mode, /PSTACK MODE ACTIVE/);
});

test("a persisted session resumes on, and a different new session starts off", async (t) => {
	const dir = mkdtempSync(join(tmpdir(), "pstack-session-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const manager = SessionManager.create(repo, dir);
	manager.appendMessage({ role: "user", content: "test session", timestamp: Date.now() });
	const h = harness(manager);
	await h.command("on");
	const reopened = harness(SessionManager.open(manager.getSessionFile()));
	await reopened.event("session_start");
	assert.match((await reopened.turn()).pstack_mode, /PSTACK MODE ACTIVE/);
	manager.newSession();
	await h.event("session_start");
	assert.deepEqual(await h.turn(), { ordinary: "keep the existing rules" });
});

test("the installed Pi loader parses all 48 skills and loads the actual extension", async (t) => {
	const dir = mkdtempSync(join(tmpdir(), "pstack-loader-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const loader = new DefaultResourceLoader({
		cwd: dir,
		agentDir: dir,
		settingsManager: SettingsManager.inMemory({ packages: [] }),
		noExtensions: true,
		additionalExtensionPaths: [join(repo, "extensions/pstack-mode.ts")],
		noSkills: true,
		additionalSkillPaths: [join(repo, "skills/pstack")],
		noContextFiles: true,
		noPromptTemplates: true,
		noThemes: true,
	});
	await loader.reload();
	assert.deepEqual(loader.getExtensions().errors, []);
	assert.deepEqual(loader.getSkills().diagnostics, []);
	assert.equal(loader.getSkills().skills.length, 48);
	assert.equal(loader.getExtensions().extensions.length, 1);
	assert.ok(loader.getExtensions().extensions[0].commands.has("pstack"));
	assert.ok(loader.getSkills().skills.some((skill) => skill.name === "poteto-mode"));
});

test("actual SDK commands update the effective system prompt and survive resource reload", async (t) => {
	const dir = mkdtempSync(join(tmpdir(), "pstack-runtime-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const settingsManager = SettingsManager.inMemory({ packages: [], retry: { enabled: false }, compaction: { enabled: false } });
	const loader = new DefaultResourceLoader({
		cwd: dir, agentDir: dir, settingsManager,
		noExtensions: true,
		additionalExtensionPaths: [join(repo, "extensions/pstack-mode.ts")],
		noSkills: true, noContextFiles: true, noPromptTemplates: true, noThemes: true,
	});
	await loader.reload();
	const modelRuntime = await ModelRuntime.create({
		authPath: join(dir, "auth.json"), modelsPath: null, modelsStorePath: join(dir, "models-cache.json"),
		allowModelNetwork: false, refreshOnCreate: false,
	});
	modelRuntime.registerProvider("pstack-test", {
		baseUrl: "http://127.0.0.1:1", api: "openai-completions", apiKey: "offline-test-key",
		models: [{ id: "offline", name: "Offline probe", reasoning: false, input: ["text"],
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 100000, maxTokens: 1000 }],
	});
	let session;
	const prompts = [];
	const contexts = [];
	modelRuntime.streamSimple = (_model, context) => {
		prompts.push(session.systemPrompt);
		contexts.push(structuredClone(context.messages));
		throw new Error("offline probe: no provider request");
	};
	const created = await createAgentSession({
		cwd: dir, agentDir: dir, resourceLoader: loader, settingsManager,
		modelRuntime, model: modelRuntime.getModel("pstack-test", "offline"),
		sessionManager: SessionManager.inMemory(dir), tools: ["read"],
	});
	session = created.session;
	t.after(() => session.dispose());
	await session.bindExtensions({});
	await session.prompt("/pstack on");
	await session.prompt("probe one").catch((error) => assert.match(error.message, /offline probe/));
	assert.equal(prompts.length, 1);
	assert.match(prompts[0], /PSTACK MODE ACTIVE/);
	assert.match(prompts[0], /## Playbooks/);
	assert.ok(contexts[0].some((message) => message.role === "system" && message.sections?.pstack_mode?.includes("PSTACK MODE ACTIVE")));
	assert.deepEqual(session.getActiveToolNames(), ["read"]);
	await session.reload();
	await session.prompt("probe after reload").catch((error) => assert.match(error.message, /offline probe/));
	assert.match(prompts[1], /PSTACK MODE ACTIVE/);
	assert.equal(prompts[1].match(/PSTACK MODE ACTIVE/g).length, 1);
	await session.prompt("/pstack off");
	await session.prompt("probe off").catch((error) => assert.match(error.message, /offline probe/));
	assert.doesNotMatch(prompts[2], /PSTACK MODE ACTIVE/);
	assert.equal(contexts[2].findLast((message) => message.role === "system").sections.pstack_mode, null);
	assert.equal(prompts.length, 3);
	assert.deepEqual(session.getActiveToolNames(), ["read"]);
});
