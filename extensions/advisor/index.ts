import { Type } from "typebox";
import { advisorEntryType, cancelActive, consult, readConfig, supportedThinking, writeConfig, type AdvisorConfig, type AdvisorPurpose, type ConsultationRecord } from "./advisor.ts";
import { captureBaseline } from "./evidence.ts";
import type { AgentBeforeSettleEvent, ExtensionAPI, ExtensionContext, SessionBoundaryDraft, Usage } from "@earendil-works/pi-coding-agent";

const STATE_TYPE = `${advisorEntryType}.state`;
const BASELINE_TYPE = `${advisorEntryType}.baseline`;
const RECORD_TYPE = `${advisorEntryType}.consultation`;
const PURPOSES = ["plan", "consult", "review"] as const;
type WorkState = {
	workId: string;
	rootEntryId: string;
	task: string;
	baselineDiff: string | null;
	calls: number;
	reviewPasses: number;
	status: "working" | "finished";
	finalReviewDone: boolean;
};

const AdvisorParameters = Type.Object({
	purpose: Type.Union(PURPOSES.map((purpose) => Type.Literal(purpose))),
	question: Type.Optional(Type.String({ maxLength: 4000 })),
});

function isWorkState(value: unknown): value is WorkState {
	if (!value || typeof value !== "object") return false;
	const state = value as Record<string, unknown>;
	return typeof state.workId === "string" && typeof state.rootEntryId === "string" && typeof state.task === "string" &&
		typeof state.calls === "number" && typeof state.reviewPasses === "number" &&
		(state.status === "working" || state.status === "finished") && typeof state.finalReviewDone === "boolean";
}

function latestState(ctx: ExtensionContext): WorkState | undefined {
	let state: WorkState | undefined;
	const baselines = new Map<string, string | null>();
	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type !== "custom") continue;
		if (entry.customType === BASELINE_TYPE && entry.data && typeof entry.data === "object") {
			const data = entry.data as { workId?: unknown; baselineDiff?: unknown };
			if (typeof data.workId === "string" && (typeof data.baselineDiff === "string" || data.baselineDiff === null)) baselines.set(data.workId, data.baselineDiff);
			continue;
		}
		if (entry.customType !== STATE_TYPE) continue;
		const data = entry.data as unknown;
		if (isWorkState(data)) state = data;
	}
	return state ? { ...state, baselineDiff: baselines.get(state.workId) ?? null } : undefined;
}

function stateEntry(state: WorkState): SessionBoundaryDraft {
	return { type: "custom", customType: STATE_TYPE, data: { workId: state.workId, rootEntryId: state.rootEntryId, task: state.task, calls: state.calls, reviewPasses: state.reviewPasses, status: state.status, finalReviewDone: state.finalReviewDone } };
}

function recordEntry(record: Awaited<ReturnType<typeof consult>>): SessionBoundaryDraft {
	return { type: "custom", customType: RECORD_TYPE, data: record };
}

function messageEntry(text: string): SessionBoundaryDraft {
	return { type: "custom_message", customType: advisorEntryType, content: text, display: true };
}

function updateTool(pi: ExtensionAPI, enabled: boolean): void {
	const active = pi.getActiveTools();
	const present = active.includes("advisor");
	if (enabled && !present) pi.setActiveTools([...active, "advisor"]);
	if (!enabled && present) pi.setActiveTools(active.filter((name) => name !== "advisor"));
}

function updateStatus(ctx: ExtensionContext, state?: WorkState): void {
	const config = readConfig();
	if (!config.enabled || !config.model) {
		ctx.ui.setStatus("advisor", undefined);
		return;
	}
	const activity = state?.status === "working" ? ` · ${state.calls}/${config.maxCallsPerWork}` : "";
	ctx.ui.setStatus("advisor", `advisor ${config.model}${activity}`);
}

function userTask(prompt: string): string {
	return prompt.trim().slice(0, 16_000) || "Review the current session.";
}

function configError(config = readConfig()): string | undefined {
	if (!config.enabled) return "Advisor is off. Use /advisor on to enable it.";
	if (!config.model) return "No advisor model is set. Use /advisor model to choose one.";
	return undefined;
}

function getUsageLine(usage?: Usage): string {
	if (!usage) return "usage unavailable";
	return `${usage.input + usage.cacheRead + usage.cacheWrite} input tokens, ${usage.output} output tokens, ${usage.cost.total.toFixed(6)} reported cost`;
}

async function startWork(event: { messageType: string; prompt?: string }, ctx: ExtensionContext, current?: WorkState): Promise<WorkState | undefined> {
	if (event.messageType !== "user" || typeof event.prompt !== "string") return current;
	const rootEntryId = ctx.sessionManager.getLeafId() ?? `${Date.now()}`;
	if (current?.rootEntryId === rootEntryId) return current;
	return {
		workId: rootEntryId,
		rootEntryId,
		task: userTask(event.prompt),
		baselineDiff: await captureBaseline(ctx.cwd, ctx.signal),
		calls: 0,
		reviewPasses: 0,
		status: "working",
		finalReviewDone: false,
	};
}

function formatReview(record: Awaited<ReturnType<typeof consult>>): string {
	const result = record.result;
	if (result.kind === "review" && result.verdict === "pass") return "Advisor review passed for the supplied evidence.";
	if (result.kind === "review" && result.verdict === "changes_requested") {
		return `Advisor requests changes.\n${result.findings.map((finding, index) => `${index + 1}. ${finding.severity}: ${finding.evidence}\n   Action: ${finding.action}`).join("\n")}`;
	}
	if (result.kind === "insufficient") return `Advisor could not complete the review. Missing evidence:\n${result.missing.map((item) => `- ${item}`).join("\n")}`;
	return `Advisor review is unverified. ${result.kind === "unavailable" || result.kind === "invalid" ? result.reason : "No valid review result."}`;
}

function formatRecord(record: ConsultationRecord): string {
	if (record.result.kind === "plan") return `Plan\n${record.result.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\nRisks: ${record.result.risks.join("; ") || "none reported"}\nEvidence needed: ${record.result.evidenceNeeded.join("; ") || "none reported"}`;
	if (record.result.kind === "advice") return `${record.result.reasoningSummary}\n${record.result.actions.map((action, index) => `${index + 1}. ${action}`).join("\n")}`;
	return formatReview(record);
}

function costs(records: ConsultationRecord[]): { calls: number; known: number; total: number } {
	const withCost = records.filter((record) => record.usage && Number.isFinite(record.usage.cost.total));
	return { calls: records.length, known: withCost.length, total: withCost.reduce((sum, record) => sum + record.usage!.cost.total, 0) };
}

async function settleReview(event: AgentBeforeSettleEvent, ctx: ExtensionContext, state: WorkState, save: (next: WorkState) => void): Promise<SessionBoundaryDraft[]> {
	const config = readConfig();
	if (!config.autoReview || !config.enabled || !config.model || state.status !== "working" || state.finalReviewDone || event.outcome !== "completed") return [];
	if (ctx.hasPendingMessages() || event.context.pendingMessages.length > 0) return [];
	if (state.reviewPasses >= config.maxReviewPasses || state.calls >= config.maxCallsPerWork) {
		const next = { ...state, status: "finished" as const, finalReviewDone: true };
		save(next);
		return [stateEntry(next), messageEntry("Advisor review not completed because the configured review or call limit was reached. Treat the previous answer as unreviewed.")];
	}
	const next = { ...state, calls: state.calls + 1, reviewPasses: state.reviewPasses + 1 };
	save(next);
	try {
		const record = await consult(ctx, "review", "Review the candidate completion and current task evidence.", state.baselineDiff, ctx.signal, event.context.llmMessages);
		if (ctx.hasPendingMessages()) {
			const stale = { ...record, result: { kind: "unavailable" as const, reason: "The task changed during this review. Its result was not applied." } };
			const finished = { ...next, status: "finished" as const, finalReviewDone: true };
			save(finished);
			return [recordEntry(stale), stateEntry(finished)];
		}
		const resultState = record.result.kind === "review" && record.result.verdict === "pass"
			? { ...next, status: "finished" as const, finalReviewDone: true }
			: record.result.kind === "review" && record.result.verdict === "changes_requested" && next.reviewPasses < config.maxReviewPasses && next.calls < config.maxCallsPerWork
				? { ...next, status: "working" as const }
				: { ...next, status: "finished" as const, finalReviewDone: true };
		save(resultState);
		const entries: SessionBoundaryDraft[] = [recordEntry(record), stateEntry(resultState)];
		if (record.result.kind === "review" && record.result.verdict === "changes_requested" && resultState.status === "working") {
			entries.push(messageEntry(`${formatReview(record)}\nAddress valid findings, rerun relevant verification, and provide the complete corrected result.`));
			return entries;
		}
		if (record.result.kind === "review" && record.result.verdict === "changes_requested") {
			entries.push(messageEntry(`${formatReview(record)}\nThe advisor review limit was reached. Treat the answer as unreviewed.`));
			return entries;
		}
		if (!(record.result.kind === "review" && record.result.verdict === "pass")) {
			entries.push(messageEntry(`${formatReview(record)}\nThe advisor could not verify completion. Give the user an accurate final status and state that review remains incomplete.`));
			return entries;
		}
		entries.push(messageEntry(formatReview(record)));
		return entries;
	} catch (error) {
		const failed = { ...next, status: "finished" as const, finalReviewDone: true };
		save(failed);
		return [stateEntry(failed), messageEntry(`Advisor review failed. Treat the previous answer as unreviewed. ${error instanceof Error ? error.message : String(error)}`)];
	}
}

export default function advisorExtension(pi: ExtensionAPI): void {
	let state: WorkState | undefined;
	const inFlight = new Set<string>();
	const restore = (ctx: ExtensionContext) => {
		state = latestState(ctx);
		const config = readConfig();
		updateTool(pi, config.enabled && Boolean(config.model));
		updateStatus(ctx, state);
	};
	const save = (next: WorkState) => {
		if (state?.workId !== next.workId) pi.appendEntry(BASELINE_TYPE, { workId: next.workId, baselineDiff: next.baselineDiff });
		state = next;
		pi.appendEntry(STATE_TYPE, { workId: next.workId, rootEntryId: next.rootEntryId, task: next.task, calls: next.calls, reviewPasses: next.reviewPasses, status: next.status, finalReviewDone: next.finalReviewDone });
	};

	pi.registerTool({
		name: "advisor",
		label: "Advisor",
		description: "Ask the configured stronger model for a plan, advice, or review of the current task evidence. The advisor cannot use tools or edit files.",
		parameters: AdvisorParameters,
		promptGuidelines: [
			"For non-trivial coding work, call advisor with purpose=plan after investigation and before the first consequential edit. Call purpose=consult when you encounter a concrete repeated failure or decision that current evidence does not resolve.",
			"Pi automatically requests a final review when a completed run is about to settle. Do not claim that a review ran unless its result appears in this conversation. Treat advisor findings as advice and check them against the files and test output.",
		],
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const config = readConfig();
			const disabled = configError(config);
			if (disabled) return { content: [{ type: "text", text: disabled }], details: { status: "unavailable" }, isError: true };
			const work = state ?? latestState(ctx);
			if (!work || work.status !== "working") return { content: [{ type: "text", text: "No active task is available for advisor review." }], details: { status: "unavailable" }, isError: true };
			const key = `${work.workId}:${params.purpose}:${params.question ?? ""}`;
			if (inFlight.has(key)) return { content: [{ type: "text", text: "An equivalent advisor request is already running." }], details: { status: "busy" }, isError: true };
			const reservedReview = config.autoReview ? 1 : 0;
			const callLimit = Math.max(0, config.maxCallsPerWork - reservedReview);
			if (work.calls >= callLimit) return { content: [{ type: "text", text: config.autoReview ? "Advisor consultation limit reached. One call is reserved for the final review." : "Advisor call limit reached for this task." }], details: { status: "unavailable" }, isError: true };
			const next = { ...work, calls: work.calls + 1 };
			save(next);
			inFlight.add(key);
			try {
			const record = await consult(ctx, params.purpose as AdvisorPurpose, params.question ?? "", work.baselineDiff, signal);
				const nativeRecord = { ...record, billing: "native" as const };
				pi.appendEntry(RECORD_TYPE, nativeRecord);
				const text = JSON.stringify({ model: record.model, purpose: record.purpose, result: record.result }, null, 2);
				return { content: [{ type: "text", text: `${text}\n\n${getUsageLine(record.usage)}` }], details: { record: nativeRecord }, usage: record.usage };
			} finally {
				inFlight.delete(key);
				state = latestState(ctx) ?? next;
			}
		},
	});

	pi.registerCommand("advisor", {
		description: "Configure or inspect the advisor. Use status, model, on, off, plan, review, or usage.",
		async handler(args, ctx) {
			const [command = "status", ...parts] = args.trim().split(/\s+/).filter(Boolean);
			const config = readConfig();
			if (command === "status") {
				ctx.ui.notify(`Advisor ${config.enabled ? "on" : "off"}. Model ${config.model ?? "unset"}. Thinking ${config.thinking}. Automatic final review ${config.autoReview ? "on" : "off"}.`, "info");
				return;
			}
			if (command === "model") {
				if (!parts.length) {
					const models = await ctx.modelRegistry.getAvailable();
					ctx.ui.notify(models.map((model) => `${model.provider}/${model.id}`).join("\n") || "No authenticated models are available.", "info");
					return;
				}
				const spec = parts.join(" ");
				const [provider, ...modelParts] = spec.split("/");
				const model = provider && ctx.modelRegistry.find(provider, modelParts.join("/"));
				if (!model || !ctx.modelRegistry.hasConfiguredAuth(model)) {
					ctx.ui.notify("Choose an authenticated model from /advisor model.", "error");
					return;
				}
				writeConfig({ ...config, model: spec });
				restore(ctx);
				ctx.ui.notify(`Advisor model set to ${spec}. It remains off until /advisor on.`, "info");
				return;
			}
			if (command === "thinking") {
				if (!config.model) return ctx.ui.notify("Choose an advisor model first with /advisor model.", "error");
				const [provider, ...ids] = config.model.split("/");
				const model = ctx.modelRegistry.find(provider!, ids.join("/"));
				if (!model) return ctx.ui.notify(`Advisor model ${config.model} is unavailable.`, "error");
				const levels = supportedThinking(model);
				const requested = parts[0] as AdvisorConfig["thinking"] | undefined;
				if (!requested) return ctx.ui.notify(`Supported advisor thinking levels: ${levels.join(", ")}. Current: ${config.thinking}.`, "info");
				if (!levels.includes(requested)) return ctx.ui.notify(`Unsupported thinking level. Choose one of: ${levels.join(", ")}.`, "error");
				writeConfig({ ...config, thinking: requested });
				restore(ctx);
				ctx.ui.notify(`Advisor thinking set to ${requested}.`, "info");
				return;
			}
			if (command === "on" || command === "off") {
				if (command === "on") {
					const [provider, ...ids] = config.model?.split("/") ?? [];
					const model = provider && ctx.modelRegistry.find(provider, ids.join("/"));
					if (!model || !ctx.modelRegistry.hasConfiguredAuth(model)) return ctx.ui.notify("Advisor model is unavailable or has no configured credentials.", "error");
					if (!supportedThinking(model).includes(config.thinking)) return ctx.ui.notify(`Thinking level ${config.thinking} is unsupported. Use /advisor thinking to select a supported level.`, "error");
				}
				const next = { ...config, enabled: command === "on" };
				writeConfig(next);
				if (command === "off") cancelActive();
				restore(ctx);
				const destination = next.enabled && next.model ? ` Advisor requests send task evidence to ${next.model}.` : "";
				ctx.ui.notify(`Advisor ${command}. Automatic final review is ${next.enabled && next.autoReview ? "on" : "off"}.${destination}`, "info");
				return;
			}
			if (command === "review" && (parts[0] === "auto" || parts[0] === "manual")) {
				writeConfig({ ...config, autoReview: parts[0] === "auto" });
				restore(ctx);
				ctx.ui.notify(`Automatic final review ${parts[0]}.`, "info");
				return;
			}
			if (command === "plan" || command === "review") {
				const unavailable = configError(config);
				if (unavailable) return ctx.ui.notify(unavailable, "error");
				const purpose = command === "plan" ? "plan" : "review";
				const work = latestState(ctx);
				try {
					const record = await consult(ctx, purpose, parts.join(" "), work?.baselineDiff ?? await captureBaseline(ctx.cwd, ctx.signal), ctx.signal);
					pi.appendEntry(RECORD_TYPE, record);
					ctx.ui.notify(`${formatRecord(record)}\n${getUsageLine(record.usage)}`, record.result.kind === "unavailable" || record.result.kind === "invalid" ? "warning" : "info");
				} catch (error) {
					ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
				}
				return;
			}
			if (command === "usage") {
				const records: ConsultationRecord[] = ctx.sessionManager.getBranch().flatMap((entry) => {
					if (entry.type !== "custom" || entry.customType !== RECORD_TYPE || !entry.data || typeof entry.data !== "object") return [];
					const record = entry.data as ConsultationRecord;
					return typeof record.id === "string" && (record.billing === "native" || record.billing === "extension") ? [record] : [];
				});
				const native = costs(records.filter((record) => record.billing === "native"));
				const extension = costs(records.filter((record) => record.billing === "extension"));
				const label = (value: ReturnType<typeof costs>) => `${value.calls} calls, ${value.known}/${value.calls} with reported cost, ${value.total.toFixed(6)} known cost`;
				ctx.ui.notify(`Advisor native tool usage: ${label(native)}. Automatic and manual review usage outside Pi totals: ${label(extension)}. Add only the latter known cost to Pi's total.`, "info");
				return;
			}
			ctx.ui.notify("Usage: /advisor status | model [provider/id] | thinking [level] | on | off | plan | review [auto|manual] | usage", "error");
		},
	});

	pi.on("session_start", async (_event, ctx) => restore(ctx));
	pi.on("session_tree", async (_event, ctx) => restore(ctx));
	pi.on("session_shutdown", async () => cancelActive());
	pi.on("session_before_switch", async () => cancelActive());
	pi.on("session_before_tree", async () => cancelActive());
	pi.on("before_agent_start", async (event, ctx) => {
		const current = latestState(ctx);
		const started = await startWork(event, ctx, current);
		if (started) save(started);
		else state = current;
		const config = readConfig();
		updateTool(pi, config.enabled && Boolean(config.model));
		updateStatus(ctx, state);
	});
	pi.on("agent_before_settle", async (event, ctx) => {
		const current = state ?? latestState(ctx);
		if (!current) return;
		const entries = await settleReview(event, ctx, current, (next) => { state = next; });
		updateStatus(ctx, state);
		const review = entries.find((entry) => entry.type === "custom" && entry.customType === RECORD_TYPE);
		const result = review?.type === "custom" && review.data && typeof review.data === "object"
			? (review.data as ConsultationRecord).result
			: undefined;
		const passed = result?.kind === "review" && result.verdict === "pass";
		const continueRequired = entries.some((entry) => entry.type === "custom_message") && !passed;
		return entries.length ? { entries, continue: continueRequired } : undefined;
	});
}
