#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertCoverage, assertSource, sourceNames } from "./source.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
try {
	const lock = JSON.parse(readFileSync(join(root, "adapters/pstack/upstream.lock.json"), "utf8"));
	assertSource(root, lock);
	if (!process.argv.includes("--source-only")) {
		assertCoverage(root, lock);
		if (existsSync(join(root, "skills/pstack"))) throw new Error("legacy skills/pstack is still present");
		if (existsSync(join(root, "vendor/bro"))) throw new Error("removed vendor/bro is still present");
		const settings = JSON.parse(readFileSync(join(root, "settings.json"), "utf8"));
		if (!settings.skills.includes("./vendor/pstack/skills")) throw new Error("upstream skills are not enabled");
		if (settings.skills.some(path => path.includes("vendor/bro"))) throw new Error("removed bro skill path is enabled");
		for (const name of readdirSync(join(root, "prompts"))) {
			if (!name.endsWith(".md")) continue;
			const text = readFileSync(join(root, "prompts", name), "utf8");
			if (/chain parameter|\{previous\}|"planner"/.test(text)) throw new Error(`legacy workflow in prompts/${name}`);
		}
	}
	console.log(`pstack ${lock.version}: ${Object.keys(lock.files).length} pristine files, ${sourceNames(lock.files, "skills").length} upstream skills`);
} catch (error) {
	console.error(`FAIL ${error.message}`);
	process.exitCode = 1;
}
