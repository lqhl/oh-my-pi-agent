#!/usr/bin/env node
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { sdk } from "./pi-sdk.mjs";

const root = resolve(process.argv[2] ?? ".");
const settings = JSON.parse(readFileSync(join(root, "settings.json"), "utf8"));
const directory = mkdtempSync(join(tmpdir(), "pi-skill-check-"));
try {
	const skills = [join(root, "skills"), join(root, ".pi/skills"), ...(settings.skills ?? []).map(path => {
		const prefix = /^[+-]/.test(path) ? path[0] : "";
		return prefix + resolve(root, prefix ? path.slice(1) : path);
	})];
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
