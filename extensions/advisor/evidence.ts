import { execFile } from "node:child_process";
import { realpath, readFile, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";

const MAX_FILE_BYTES = 96_000;
const MAX_UNTRACKED_FILES = 64;
function isSensitivePath(name: string): boolean {
	const path = name.toLowerCase();
	const file = path.split("/").at(-1) ?? path;
	return file === ".env" || file.startsWith(".env.") ||
		[".npmrc", ".netrc", ".git-credentials", "id_rsa", "id_ed25519"].includes(file) ||
		/^(credentials?|secrets?|tokens?)(\.|$)/.test(file) || /\.(pem|key|p12|pfx|token|secret)$/.test(file);
}

type EvidenceMessage = {
	role?: string;
	content?: unknown;
	toolName?: string;
	isError?: boolean;
};

export interface EvidenceInput {
	task: string;
	conversation: EvidenceMessage[];
	gitStatus: string;
	gitDiff: string;
	baselineDiff: string | null;
	cwd: string;
}

function messageText(message: EvidenceMessage): string {
	const content = message.content;
	const body = typeof content === "string"
		? content
		: Array.isArray(content)
			? content.flatMap((block) => {
				if (!block || typeof block !== "object") return [];
				const item = block as Record<string, unknown>;
				if (item.type === "text" && typeof item.text === "string") return [item.text];
				if (item.type === "toolCall") return [`[tool call ${String(item.name)}] ${JSON.stringify(item.arguments ?? {})}`];
				return [];
			}).join("\n")
			: "";
	const role = message.role === "toolResult"
		? `Tool result ${message.toolName ?? "unknown"}${message.isError ? " (error)" : ""}`
		: message.role ?? "message";
	return `## ${role}\n${body || "(no visible text)"}`;
}

function untrackedFiles(status: string): string[] {
	return status.split("\0")
		.filter((record) => record.startsWith("?? "))
		.map((record) => record.slice(3))
		.filter(Boolean);
}

function runGit(cwd: string, args: string[], maxBuffer: number, timeout: number, signal?: AbortSignal): Promise<string> {
	return new Promise((resolveOutput, reject) => {
		execFile("git", args, { cwd, encoding: "utf8", maxBuffer, timeout, signal }, (error, stdout) => {
			if (error) reject(error);
			else resolveOutput(stdout);
		});
	});
}

async function readUntrackedFiles(status: string, cwd: string): Promise<string[]> {
	const files: string[] = [];
	const paths = untrackedFiles(status);
	for (const name of paths.slice(0, MAX_UNTRACKED_FILES)) {
		if (isSensitivePath(name)) {
			files.push(`### Untracked file ${JSON.stringify(name)}\n[content omitted: sensitive filename]`);
			continue;
		}
		try {
			const path = await realpath(resolve(cwd, name));
			if (!path.startsWith(`${resolve(cwd)}/`)) {
				files.push(`### Untracked file ${JSON.stringify(name)}\n[content unavailable or outside the workspace]`);
				continue;
			}
			const metadata = await stat(path);
			if (metadata.size > MAX_FILE_BYTES) {
				files.push(`### Untracked file ${JSON.stringify(relative(cwd, path))}\n[content omitted: file exceeds ${MAX_FILE_BYTES} bytes]`);
				continue;
			}
			const data = await readFile(path);
			if (data.includes(0)) {
				files.push(`### Untracked file ${JSON.stringify(relative(cwd, path))}\n[content omitted: binary file]`);
				continue;
			}
			files.push(`### Untracked file ${JSON.stringify(relative(cwd, path))}\n${data.toString("utf8")}`);
		} catch {
			files.push(`### Untracked file ${JSON.stringify(name)}\n[content unavailable or outside the workspace]`);
		}
	}
	if (paths.length > MAX_UNTRACKED_FILES) files.push(`[${paths.length - MAX_UNTRACKED_FILES} additional untracked files omitted]`);
	return files;
}

export async function captureEvidence(cwd: string, task: string, conversation: EvidenceMessage[], baselineDiff: string | null, signal?: AbortSignal): Promise<EvidenceInput> {
	try {
		const gitStatus = await runGit(cwd, ["status", "--porcelain=v1", "--untracked-files=all", "-z"], 2_000_000, 5_000, signal);
		const gitDiff = await runGit(cwd, ["diff", "--no-ext-diff", "--no-textconv", "--binary", "HEAD"], 2_000_000, 10_000, signal);
		const untracked = await readUntrackedFiles(gitStatus, cwd);
		return { cwd, task, conversation, gitStatus, gitDiff: [gitDiff, ...untracked].filter(Boolean).join("\n"), baselineDiff };
	} catch {
		return { cwd, task, conversation, gitStatus: "Git baseline unavailable", gitDiff: "", baselineDiff };
	}
}

export function renderEvidence(input: Omit<EvidenceInput, "cwd">, maxChars = 80_000): string {
	const sections: [string, string][] = [
		["# User task", input.task],
		["# Conversation and tool evidence", input.conversation.map(messageText).join("\n\n")],
		["# Working tree status", input.gitStatus.split("\0").filter(Boolean).join("\n") || "(clean)"],
		["# Changes at task start", input.baselineDiff === null ? "[baseline unavailable]" : input.baselineDiff || "[no changes at task start]"],
		["# Current changes and untracked text files", input.gitDiff || "[No patch content. The status may still list untracked or unavailable files.]"],
	];
	const full = sections.map(([title, body]) => `${title}\n${body}`).join("\n\n");
	if (full.length <= maxChars) return full;
	const marker = "\n\n[Evidence truncated. Some supplied material was omitted. The review must report incomplete coverage.]";
	if (maxChars < 1_000) return `${full.slice(0, Math.max(0, maxChars - marker.length))}${marker.slice(0, maxChars)}`;
	const headingSize = sections.reduce((size, [title]) => size + title.length + 2, 0) + (sections.length - 1) * 2;
	const bodyBudget = Math.max(0, maxChars - marker.length - headingSize - 2);
	const allocations = [
		Math.min(12_000, Math.floor(bodyBudget * 0.18)),
		Math.min(22_000, Math.floor(bodyBudget * 0.28)),
		Math.min(6_000, Math.floor(bodyBudget * 0.08)),
		Math.min(12_000, Math.floor(bodyBudget * 0.16)),
		0,
	];
	allocations[4] = Math.max(0, bodyBudget - allocations.slice(0, 4).reduce((sum, item) => sum + item, 0));
	const bounded = sections.map(([title, body], index) => {
		const limit = allocations[index]!;
		if (body.length <= limit) return `${title}\n${body}`;
		const note = "[section truncated]";
		const available = Math.max(0, limit - note.length - 2);
		const head = Math.ceil(available / 2);
		const tail = available - head;
		return `${title}\n${body.slice(0, head)}\n${note}\n${tail ? body.slice(-tail) : ""}`;
	});
	return `${bounded.join("\n\n")}${marker}`.slice(0, maxChars);
}

export async function captureBaseline(cwd: string, signal?: AbortSignal): Promise<string | null> {
	try {
		const gitStatus = await runGit(cwd, ["status", "--porcelain=v1", "--untracked-files=all", "-z"], 2_000_000, 5_000, signal);
		const [diff, untracked] = await Promise.all([
			runGit(cwd, ["diff", "--no-ext-diff", "--no-textconv", "--binary", "HEAD"], 2_000_000, 10_000, signal),
			readUntrackedFiles(gitStatus, cwd),
		]);
		const snapshot = [diff, ...untracked].filter(Boolean).join("\n");
		if (snapshot.length <= 96_000) return snapshot;
		return `${snapshot.slice(0, 48_000)}\n[Task-start snapshot truncated.]\n${snapshot.slice(-48_000)}`;
	} catch {
		return null;
	}
}

export function currentConversation(ctx: { sessionManager: { buildSessionProjection(): { messages: EvidenceMessage[] } } }): EvidenceMessage[] {
	return ctx.sessionManager.buildSessionProjection().messages.filter((message) =>
		message.role === "user" || message.role === "assistant" || message.role === "toolResult",
	);
}
