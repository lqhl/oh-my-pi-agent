import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const skillPath = fileURLToPath(new URL("../skills/pstack/poteto-mode/SKILL.md", import.meta.url));
const stateType = "pstack-mode";

function readInstructions(): string {
	return readFileSync(skillPath, "utf8").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
}

export default function pstackMode(pi: ExtensionAPI): void {
	let enabled = false;

	function restore(ctx: ExtensionContext): void {
		enabled = false;
		for (const entry of ctx.sessionManager.getBranch()) {
			if (entry.type !== "custom" || entry.customType !== stateType) continue;
			const data = entry.data as { enabled?: unknown } | undefined;
			if (typeof data?.enabled === "boolean") enabled = data.enabled;
		}
		ctx.ui.setStatus("pstack", enabled ? "pstack" : undefined);
	}

	pi.registerCommand("pstack", {
		description: "Persistent pstack mode: on, off, status (default)",
		handler: async (args, ctx) => {
			restore(ctx);
			const action = args.trim() || "status";
			if (!["on", "off", "status"].includes(action)) {
				ctx.ui.notify("Usage: /pstack on | off | status", "error");
				return;
			}
			if (action === "on") {
				try {
					readInstructions();
				} catch (error) {
					ctx.ui.notify(`Cannot load pstack instructions: ${error}`, "error");
					return;
				}
			}
			if (action !== "status" && enabled !== (action === "on")) {
				enabled = action === "on";
				pi.appendEntry(stateType, { enabled });
				ctx.ui.setStatus("pstack", enabled ? "pstack" : undefined);
			}
			ctx.ui.notify(`pstack mode ${enabled ? "on" : "off"}`, "info");
		},
	});

	pi.on("session_start", async (_event, ctx) => restore(ctx));
	pi.on("session_tree", async (_event, ctx) => restore(ctx));
	pi.on("before_agent_start", async (event, ctx) => {
		restore(ctx);
		delete event.systemPromptOptions.sections.pstack_mode;
		if (enabled) {
			event.systemPromptOptions.sections.pstack_mode = [
				"[PSTACK MODE ACTIVE]",
				`Skill directory: ${fileURLToPath(new URL("../skills/pstack/poteto-mode/", import.meta.url))}`,
				"Apply the playbook to a new task. Continue the current task after compaction. Casual turns do not start a workflow.",
				readInstructions(),
			].join("\n\n");
		}
	});
}
