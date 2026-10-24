import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export function ensureProcessCwd(fallback: string): "valid" | "recovered" {
	try {
		process.cwd();
		return "valid";
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
		process.chdir(fallback);
		return "recovered";
	}
}

export default function stableProcessCwd(pi: ExtensionAPI): void {
	pi.on("session_start", async (_event, ctx) => {
		const result = ensureProcessCwd(ctx.cwd);
		if (result === "recovered") ctx.ui.notify(`Recovered an invalid process working directory using ${ctx.cwd}.`, "warning");
	});
}
