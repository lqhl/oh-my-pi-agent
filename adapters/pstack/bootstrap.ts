import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export const adapterPath = fileURLToPath(new URL("./pi.md", import.meta.url));
export const upstreamPath = fileURLToPath(new URL("../../vendor/pstack/", import.meta.url));

type BootstrapOptions = { always?: boolean; modeEnabled?: () => boolean };

export function bootstrapSection(includesRules = true): string {
	return [
		"[PSTACK PI HOST ADAPTER]",
		`Pi adapter: ${adapterPath}`,
		`Original upstream: ${upstreamPath}`,
		"Before using any pstack skill, read the Pi adapter. Its host, scope, model, history and delegation rules govern the upstream Cursor instructions. This locator does not enable pstack mode or start work.",
		...(includesRules ? [readFileSync(adapterPath, "utf8")] : []),
	].join("\n\n");
}

export function registerBootstrap(pi: ExtensionAPI, options: BootstrapOptions = { always: true }): void {
	pi.on("before_agent_start", async (event) => {
		const prompt = event.messageType === "user" ? event.prompt : "";
		const expandedSkill = Boolean(prompt?.includes("vendor/pstack/skills/"));
		event.systemPromptOptions.sections.pstack_adapter = bootstrapSection(options.always || options.modeEnabled?.() || expandedSkill);
	});
}

export default function pstackBootstrap(pi: ExtensionAPI): void {
	registerBootstrap(pi);
}
