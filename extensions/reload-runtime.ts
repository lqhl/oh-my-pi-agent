/**
 * Reload Runtime Extension
 *
 * Demonstrates ctx.reload() from ExtensionCommandContext and an LLM-callable
 * tool that queues a follow-up command to trigger reload.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
	let reloadPending = false;

	function sendReloadCommand() {
		reloadPending = false;
		pi.sendUserMessage("/reload-runtime", {
			deliverAs: "followUp",
			expandPromptTemplates: true,
		});
	}

	pi.on("agent_settled", async () => {
		if (reloadPending) sendReloadCommand();
	});

	// Command entrypoint for reload.
	// Treat reload as terminal for this handler.
	pi.registerCommand("reload-runtime", {
		description: "Reload extensions, skills, prompts, and themes",
		handler: async (_args, ctx) => {
			await ctx.reload();
			return;
		},
	});

	pi.registerTool({
		name: "reload_runtime",
		label: "Reload Runtime",
		description: "Reload extensions, skills, prompts, and themes after the current agent run finishes",
		parameters: Type.Object({}),
		async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
			reloadPending = true;
			if (ctx.isIdle()) sendReloadCommand();
			return {
				content: [{ type: "text", text: "Runtime reload scheduled after the current agent run finishes." }],
				details: {},
			};
		},
	});
}
