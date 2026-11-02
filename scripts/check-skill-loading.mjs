#!/usr/bin/env node
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { sdk } from "./pi-sdk.mjs";

const root = resolve(process.argv[2] ?? ".");
const userSharedRoot = join(homedir(), ".agents", "skills");
const sharedRoot = resolve(process.argv[3] ?? userSharedRoot);
const settings = JSON.parse(readFileSync(join(root, "settings.json"), "utf8"));
const directory = mkdtempSync(join(tmpdir(), "pi-skill-check-"));
try {
	const skills = [join(root, "skills"), join(root, ".pi/skills"), ...(settings.skills ?? []).map(path => {
		const prefix = /^[!+-]/.test(path) ? path[0] : "";
		return prefix + resolve(root, prefix ? path.slice(1) : path);
	})];
	if (sharedRoot !== userSharedRoot) skills.push(`!${userSharedRoot}/**`);
	skills.push(sharedRoot);
	const loader = new sdk.DefaultResourceLoader({
		cwd: directory,
		agentDir: directory,
		settingsManager: sdk.SettingsManager.inMemory({ packages: [], skills }),
		noExtensions: true,
		noContextFiles: true,
		noPromptTemplates: true,
		noThemes: true,
	});
	await loader.reload();
	const result = loader.getSkills();
	console.log(JSON.stringify({ files: result.skills.map(skill => skill.filePath), diagnostics: result.diagnostics }));
} finally {
	rmSync(directory, { recursive: true, force: true });
}
