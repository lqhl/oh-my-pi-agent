import { spawnSync, execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const mode = process.argv[2] ?? "--offline";
if (mode !== "--offline") {
	console.error("Usage: node scripts/verify-advisor.mjs --offline");
	process.exit(2);
}

const pi = execFileSync("which", ["pi"], { encoding: "utf8" }).trim();
const checks = [
	{
		name: "SDK behavior and advisor lifecycle",
		command: process.execPath,
		args: ["--test", "tests/advisor.test.mjs"],
	},
	{
		name: "Pi CLI loads the extension",
		command: pi,
		args: ["--extension", "./extensions/advisor/index.ts", "--list-models"],
	},
];
const results = checks.map((check) => {
	const run = spawnSync(check.command, check.args, {
		cwd: root,
		encoding: "utf8",
		maxBuffer: 8_000_000,
		windowsHide: true,
	});
	return {
		name: check.name,
		command: [check.command, ...check.args],
		exitCode: run.status,
		error: run.error?.message,
		stdoutTail: run.stdout?.slice(-8_000),
		stderrTail: run.stderr?.slice(-8_000),
	};
});
const report = { mode, completedAt: new Date().toISOString(), results };
const outputDir = join(root, ".artifacts", "advisor");
mkdirSync(outputDir, { recursive: true });
const outputPath = join(outputDir, "verification.json");
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
for (const result of results) console.log(`${result.name}: ${result.exitCode === 0 ? "pass" : "fail"}`);
console.log(`Evidence: ${outputPath}`);
if (results.some((result) => result.exitCode !== 0 || result.error)) process.exitCode = 1;
