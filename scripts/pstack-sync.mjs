#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertCoverage, assertSource, inventory } from "../adapters/pstack/source.mjs";

const args = process.argv.slice(2);
function option(name) {
	const index = args.indexOf(name);
	if (index < 0) return undefined;
	if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`${name} needs a value`);
	return args[index + 1];
}

try {
	const source = option("--from");
	const ref = option("--ref");
	const root = resolve(option("--root") ?? fileURLToPath(new URL("../", import.meta.url)));
	if (!source || !ref) throw new Error("Usage: pstack-sync.mjs --from <git checkout> --ref <commit or ref> [--root <target>] [--dry-run]");
	const git = (...argv) => execFileSync("git", ["-C", resolve(source), ...argv], { maxBuffer: 64 * 1024 * 1024 });
	const commit = git("rev-parse", "--verify", `${ref}^{commit}`).toString().trim();
	const tree = git("rev-parse", `${commit}:pstack`).toString().trim();
	const lockPath = join(root, "adapters/pstack/upstream.lock.json");
	const previous = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, "utf8")) : undefined;
	if (previous) assertSource(root, previous);
	if (previous?.commit === commit) {
		console.log(`upstream unchanged: ${commit}`);
		process.exit(0);
	}
	if (existsSync(join(root, "vendor/pstack")) && !previous) throw new Error("unowned vendor/pstack exists; refusing to replace it");
	const stage = mkdtempSync(join(dirname(root), ".pstack-sync-"));
	try {
		const archive = git("archive", "--format=tar", commit, "pstack");
		execFileSync("tar", ["-xf", "-", "-C", stage], { input: archive });
		let terms = [];
		try {
			const generator = git("show", `${commit}:scripts/generate-pstack-harness-trees.mjs`).toString();
			terms = [...generator.matchAll(/\{ key: ("(?:[^"\\]|\\.)*"), re: (\/.*\/[a-z]*) \}/g)].map(match => {
				const split = match[2].lastIndexOf("/");
				return { key: JSON.parse(match[1]), pattern: match[2].slice(1, split), flags: match[2].slice(split + 1) };
			});
			if (!terms.length) throw new Error("cannot extract upstream TERMS");
		} catch (error) {
			if (previous?.terms?.length) throw error;
			if (existsSync(join(root, "adapters/pstack/policy.json"))) throw error;
		}
		const lock = { schemaVersion: 1, repository: "https://github.com/cursor/plugins", commit, tree,
			version: JSON.parse(readFileSync(join(stage, "pstack/plugin.json"), "utf8")).version,
			files: inventory(join(stage, "pstack")), terms };
		if (existsSync(join(root, "adapters/pstack/policy.json"))) assertCoverage(root, lock, previous);
		if (args.includes("--dry-run")) {
			console.log(`would sync pstack ${lock.version}: ${Object.keys(lock.files).length} files at ${commit}`);
		} else {
			mkdirSync(join(root, "vendor"), { recursive: true });
			mkdirSync(dirname(lockPath), { recursive: true });
			const target = join(root, "vendor/pstack");
			const backup = join(stage, "previous");
			const oldLock = existsSync(lockPath) ? readFileSync(lockPath) : undefined;
			const temporaryLock = join(stage, "lock.json");
			writeFileSync(temporaryLock, JSON.stringify(lock, null, 2) + "\n");
			const hadTarget = existsSync(target);
			if (hadTarget) renameSync(target, backup);
			try {
				renameSync(join(stage, "pstack"), target);
				renameSync(temporaryLock, lockPath);
			} catch (error) {
				rmSync(target, { recursive: true, force: true });
				if (hadTarget) renameSync(backup, target);
				if (oldLock) writeFileSync(lockPath, oldLock);
				throw error;
			}
			console.log(`synced pstack ${lock.version}: ${Object.keys(lock.files).length} files at ${commit}`);
		}
	} finally {
		rmSync(stage, { recursive: true, force: true });
	}
} catch (error) {
	console.error(`FAIL ${error.message}`);
	process.exitCode = 1;
}
