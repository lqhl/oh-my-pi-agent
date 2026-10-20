import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { renderEvidence, captureEvidence } from "../extensions/advisor/evidence.ts";

const piPath = realpathSync(execFileSync("which", ["pi"], { encoding: "utf8" }).trim());
let sdkDir = dirname(piPath);
while (!existsSync(join(sdkDir, "package.json"))) sdkDir = dirname(sdkDir);
const { createJiti } = createRequire(piPath)("jiti");
const tempDir = mkdtempSync(join(tmpdir(), "advisor-test-"));
process.env.PI_CODING_AGENT_DIR = tempDir;
const jiti = createJiti(join(process.cwd(), "tests/advisor.test.mjs"));
const metadata = JSON.parse(readFileSync(join(sdkDir, "package.json"), "utf8"));
const sdk = await import(pathToFileURL(join(sdkDir, metadata.exports["."].import)).href);
const { DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager, createAgentSession } = sdk;
const { parseAdvisorResult, parseConfig, supportedThinking, consult, defaultConfig } = await jiti.import(join(process.cwd(), "extensions/advisor/advisor.ts"));
mkdirSync(tempDir, { recursive: true });
writeFileSync(join(tempDir, "advisor.json"), JSON.stringify({ ...defaultConfig(), enabled: true, model: "test/strong" }));
test.after(() => { rmSync(tempDir, { recursive: true, force: true }); });
test("advisor is off without a selected model and parsing rejects invalid settings", () => {
	assert.deepEqual(parseConfig(null), defaultConfig());
	assert.equal(parseConfig({ enabled: "true", model: "bad model", maxCallsPerWork: 0 }).enabled, false);
	assert.equal(parseConfig({ enabled: true, model: "test/strong", maxCallsPerWork: 0 }).maxCallsPerWork, 4);
	assert.deepEqual(supportedThinking({ reasoning: false }), ["off"]);
});

test("advisor results require a valid purpose-specific JSON shape", () => {
	assert.deepEqual(parseAdvisorResult("review", JSON.stringify({ verdict: "pass", findings: [] })), {
		kind: "review",
		verdict: "pass",
		findings: [],
	});
	assert.equal(parseAdvisorResult("review", JSON.stringify({ verdict: "pass", findings: [{ text: "bug" }] })), null);
	assert.equal(parseAdvisorResult("review", "Looks good"), null);
	assert.equal(parseAdvisorResult("plan", JSON.stringify({ verdict: "pass", findings: [] })), null);
});

test("review evidence names unavailable baselines and never claims unprovided files were checked", () => {
	const evidence = renderEvidence({
		task: "Add a retry limit",
		conversation: [{ role: "toolResult", toolName: "test", content: "2 passed" }],
		gitStatus: "?? new.ts",
		gitDiff: "",
		baselineDiff: null,
	});
	assert.match(evidence, /Add a retry limit/);
	assert.match(evidence, /new.ts/);
	assert.match(evidence, /baseline unavailable/);
	assert.match(evidence, /No patch content/);
});

test("evidence omits obvious untracked credentials while including ordinary source files", async (t) => {
	const dir = mkdtempSync(join(tmpdir(), "advisor-evidence-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	execFileSync("git", ["init", "--quiet"], { cwd: dir });
	execFileSync("git", ["-c", "user.name=Pi Test", "-c", "user.email=pi-test@example.invalid", "commit", "--quiet", "--allow-empty", "-m", "initial"], { cwd: dir });
	writeFileSync(join(dir, ".env"), "API_KEY=do-not-send");
	writeFileSync(join(dir, ".env.production"), "DATABASE_URL=do-not-send-either");
	writeFileSync(join(dir, "credentials.json"), "access_token=secret");
	writeFileSync(join(dir, "source.ts"), "export const safe = true;");
	const evidence = await captureEvidence(dir, "Review new source", [], "");
	const text = renderEvidence(evidence);
	assert.match(text, /sensitive filename/);
	assert.doesNotMatch(text, /API_KEY=do-not-send/);
	assert.doesNotMatch(text, /DATABASE_URL=do-not-send-either|access_token/);
	assert.match(text, /export const safe = true/);
});

test("evidence is bounded and records that content was omitted", () => {
	const evidence = renderEvidence({
		task: "review",
		conversation: [{ role: "user", content: "x".repeat(1000) }],
		gitStatus: "",
		gitDiff: "",
		baselineDiff: "",
	}, 128);
	assert.ok(evidence.length <= 128);
	assert.match(evidence, /truncated/);
});

test("advisor calls the configured model with bounded evidence and returns its usage", async () => {
	let request;
	const usage = { input: 5, output: 3, cacheRead: 0, cacheWrite: 0, totalTokens: 8, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } };
	const model = { provider: "test", id: "strong", reasoning: true, contextWindow: 100_000, maxTokens: 4096 };
	const registry = {
		find: () => model,
		hasConfiguredAuth: () => true,
		streamSimple(_model, context) {
			request = context;
			return { async *[Symbol.asyncIterator]() { yield { type: "done", message: { stopReason: "stop", content: [{ type: "text", text: '{"verdict":"pass","findings":[]}' }], usage } }; } };
		},
	};
	const ctx = {
		cwd: process.cwd(),
		modelRegistry: registry,
		sessionManager: { buildSessionProjection: () => ({ messages: [{ role: "user", content: "check this" }] }), getBranch: () => [] },
		signal: undefined,
	};
	const record = await consult(ctx, "review", "check the work", "baseline", undefined);
	assert.deepEqual(record.result, { kind: "review", verdict: "pass", findings: [] });
	assert.equal(record.usage, usage);
	assert.match(request.messages[0].content[0].text, /baseline/);
	assert.ok(request.systemPrompt);
	assert.equal(request.tools, undefined);
});

test("the real Pi session runs an automatic review before settling and records its separate usage", async (t) => {
	const dir = mkdtempSync(join(tmpdir(), "advisor-session-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const settingsManager = SettingsManager.inMemory({ packages: [], retry: { enabled: false }, compaction: { enabled: false } });
	const loader = new DefaultResourceLoader({
		cwd: dir,
		agentDir: tempDir,
		settingsManager,
		noExtensions: true,
		additionalExtensionPaths: [join(process.cwd(), "extensions/advisor/index.ts")],
		noSkills: true,
		noContextFiles: true,
		noPromptTemplates: true,
		noThemes: true,
	});
	await loader.reload();
	assert.deepEqual(loader.getExtensions().errors, []);
	const modelRuntime = await ModelRuntime.create({
		authPath: join(tempDir, "auth.json"),
		modelsPath: null,
		modelsStorePath: join(tempDir, "models-cache.json"),
		allowModelNetwork: false,
		refreshOnCreate: false,
	});
	const cost = { input: 1, output: 2, cacheRead: 0.5, cacheWrite: 1 };
	const model = (id) => ({ id, name: id, reasoning: true, input: ["text"], cost, contextWindow: 100_000, maxTokens: 4096 });
	modelRuntime.registerProvider("test", { baseUrl: "http://127.0.0.1:1", api: "openai-completions", apiKey: "offline-test-key", models: [model("cheap"), model("strong")] });
	const usage = { input: 10, output: 4, cacheRead: 0, cacheWrite: 0, totalTokens: 14, cost: { input: 0.00001, output: 0.000008, cacheRead: 0, cacheWrite: 0, total: 0.000018 } };
	const calls = [];
	const advisorRequests = [];
	let cheapCalls = 0;
	let strongCalls = 0;
	let disabledPrompt = false;
	modelRuntime.streamSimple = (selected, context) => {
		calls.push(selected.id);
		let content, stopReason;
		if (disabledPrompt) {
			content = [{ type: "text", text: "Advisor stayed disabled." }];
			stopReason = "stop";
		} else if (selected.id === "strong") {
			advisorRequests.push(context);
			const responses = [
				'{"actions":["Confirm the test result."],"reasoningSummary":"The supplied evidence is consistent."}',
				'{"verdict":"changes_requested","findings":[{"severity":"important","evidence":"The candidate answer does not show the requested test result.","action":"Run the focused test and report its result."}]}',
				'{"verdict":"pass","findings":[]}',
			];
			content = [{ type: "text", text: responses[strongCalls++] }];
			stopReason = "stop";
		} else if (cheapCalls === 0) {
			cheapCalls++;
			content = [{ type: "toolCall", id: "advisor-call", name: "advisor", arguments: { purpose: "consult", question: "Check the plan." } }];
			stopReason = "toolUse";
		} else {
			content = [{ type: "text", text: cheapCalls++ === 1 ? "The initial candidate is ready." : "I ran the focused test and corrected the result." }];
			stopReason = "stop";
		}
		const message = { role: "assistant", provider: selected.provider, api: selected.api, model: selected.id, content, usage, stopReason, timestamp: Date.now() };
		return {
			async *[Symbol.asyncIterator]() { yield { type: "done", reason: stopReason, message }; },
			async result() { return message; },
		};
	};
	const errors = [];
	const sessionManager = SessionManager.inMemory(dir);
	const { session } = await createAgentSession({
		cwd: dir,
		agentDir: tempDir,
		resourceLoader: loader,
		settingsManager,
		modelRuntime,
		model: modelRuntime.getModel("test", "cheap"),
		sessionManager,
		tools: ["read", "advisor"],
	});
	t.after(() => session.dispose());
	await session.bindExtensions({ onError: (error) => errors.push(error) });
	await session.prompt("Inspect the task and finish it.");
	assert.deepEqual(calls, ["cheap", "strong", "cheap", "strong", "cheap", "strong"], JSON.stringify({ errors: errors.map(String), entries: sessionManager.getBranch().map((entry) => entry.type === "custom" ? { type: entry.type, customType: entry.customType, data: entry.data } : entry.type === "message" ? { type: entry.type, role: entry.message?.role, stopReason: entry.message?.stopReason, errorMessage: entry.message?.errorMessage, text: entry.message?.content } : { type: entry.type }) }));
	assert.ok(advisorRequests.every((request) => request.tools === undefined));
	const branch = sessionManager.getBranch();
	const toolResult = branch.find((entry) => entry.type === "message" && entry.message.role === "toolResult" && entry.message.toolName === "advisor");
	assert.equal(toolResult?.message.usage?.cost.total, usage.cost.total);
	const reviews = branch.filter((entry) => entry.type === "custom" && entry.customType === "pi-advisor.consultation" && entry.data.purpose === "review");
	assert.equal(reviews.length, 2);
	assert.equal(reviews[0].data.result.verdict, "changes_requested");
	assert.equal(reviews[1].data.billing, "extension");
	assert.deepEqual(reviews[1].data.result, { kind: "review", verdict: "pass", findings: [] });
	assert.ok(branch.some((entry) => entry.type === "custom_message" && entry.content.includes("review passed")));
	assert.equal(session.isStreaming, false);

	writeFileSync(join(tempDir, "advisor.json"), JSON.stringify(defaultConfig()));
	disabledPrompt = true;
	calls.length = 0;
	const disabledManager = SessionManager.inMemory(dir);
	const { session: disabledSession } = await createAgentSession({
		cwd: dir, agentDir: tempDir, resourceLoader: loader, settingsManager, modelRuntime,
		model: modelRuntime.getModel("test", "cheap"), sessionManager: disabledManager, tools: ["read", "advisor"],
	});
	t.after(() => disabledSession.dispose());
	await disabledSession.bindExtensions({});
	await disabledSession.prompt("Run with advisor disabled.");
	assert.deepEqual(calls, ["cheap"]);
	assert.equal(disabledSession.getActiveToolNames().includes("advisor"), false);
	assert.equal(disabledManager.getBranch().some((entry) => entry.type === "custom" && entry.customType === "pi-advisor.consultation"), false);
});

test("disabled advisor never calls a model", async () => {
	writeFileSync(join(tempDir, "advisor.json"), JSON.stringify(defaultConfig()));
	let calls = 0;
	const ctx = { cwd: process.cwd(), modelRegistry: { find() { calls++; }, hasConfiguredAuth() { calls++; } }, sessionManager: { buildSessionProjection: () => ({ messages: [] }) }, signal: undefined };
	await assert.rejects(() => consult(ctx, "review"), /Advisor is off/);
	assert.equal(calls, 0);
	writeFileSync(join(tempDir, "advisor.json"), JSON.stringify({ ...defaultConfig(), enabled: true, model: "test/strong" }));
});
