/**
 * CLIProxyAPI (Codex) tool-schema adapter
 *
 * pi's generic `openai-responses` path omits the `strict` field on function
 * tools when `compat.supportsStrictMode` is false, but the Codex backend
 * behind CLIProxyAPI expects an explicit `strict: null`. Without it, tools
 * with optional arguments (e.g. pi-subagents' interactive_shell) lose their
 * optional-argument semantics.
 *
 * Scope: only the `cpa` provider registered in models.json.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const PROVIDER = "cpa";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default function (pi: ExtensionAPI) {
	pi.on("before_provider_request", (event, ctx: ExtensionContext) => {
		const model = ctx.model;
		if (!model || model.provider !== PROVIDER || !model.api.includes("responses")) return;
		if (!isRecord(event.payload) || !Array.isArray(event.payload.tools)) return;

		let changed = false;
		const tools = event.payload.tools.map((tool) => {
			if (!isRecord(tool) || tool.type !== "function" || tool.strict === null) return tool;
			changed = true;
			return { ...tool, strict: null };
		});

		return changed ? { ...event.payload, tools } : undefined;
	});
}
