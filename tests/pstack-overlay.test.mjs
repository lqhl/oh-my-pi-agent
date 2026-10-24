import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { sdk } from "./support/pi-sdk.mjs";

const repo = fileURLToPath(new URL("../", import.meta.url));
const policyPath = join(repo, "adapters/pstack/policy.json");

test("the selected upstream skills load unchanged and supply bro without the removed vendor", async (t) => {
	assert.ok(existsSync(policyPath), "Pi adapter policy exists");
	const policy = JSON.parse(readFileSync(policyPath, "utf8"));
	const dir = mkdtempSync(join(tmpdir(), "pstack-overlay-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const paths = [join(repo, "vendor/pstack/skills"), ...Object.keys(policy.disabledSkills).map(name => `-${join(repo, `vendor/pstack/skills/${name}/SKILL.md`)}`)];
	const loader = new sdk.DefaultResourceLoader({ cwd: dir, agentDir: dir,
		settingsManager: sdk.SettingsManager.inMemory({ packages: [], skills: paths }),
		noExtensions: true, noContextFiles: true, noPromptTemplates: true, noThemes: true });
	await loader.reload();
	const result = loader.getSkills();
	assert.deepEqual(result.diagnostics, []);
	assert.equal(result.skills.find(skill => skill.name === "bro")?.filePath, join(repo, "vendor/pstack/skills/bro/SKILL.md"));
	assert.ok(result.skills.some(skill => skill.name === "poteto-mode"));
	for (const name of Object.keys(policy.disabledSkills)) {
		assert.ok(!result.skills.some(skill => skill.name === name), `${name} must be excluded by the actual loader`);
	}
	for (const skill of result.skills) assert.ok(existsSync(join(skill.baseDir, "SKILL.md")));
});

test("pstack child roles load the adapter without ambient extensions", () => {
	for (const name of ["poteto-agent", "comment-sicko", "pstack-scout", "pstack-reviewer"]) {
		const text = readFileSync(join(repo, `agents/${name}.md`), "utf8");
		assert.match(text, /subagentOnlyExtensions: \.\.\/adapters\/pstack\/bootstrap\.ts/);
	}
});

test("the adapter check rejects an edited upstream file", (t) => {
	const dir = mkdtempSync(join(tmpdir(), "pstack-integrity-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	cpSync(join(repo, "vendor/pstack"), join(dir, "vendor/pstack"), { recursive: true });
	cpSync(join(repo, "adapters/pstack"), join(dir, "adapters/pstack"), { recursive: true });
	const command = [join(dir, "adapters/pstack/check.mjs"), "--source-only"];
	let result = spawnSync(process.execPath, command, { encoding: "utf8" });
	assert.equal(result.status, 0, result.stdout + result.stderr);
	const path = join(dir, "vendor/pstack/skills/sharpen/SKILL.md");
	writeFileSync(path, readFileSync(path, "utf8") + "\nHand edited\n");
	result = spawnSync(process.execPath, command, { encoding: "utf8" });
	assert.notEqual(result.status, 0);
	assert.match(result.stdout + result.stderr, /upstream file changed.*sharpen/);
});

test("sync refuses local edits and repeat synchronization is unchanged", (t) => {
	const dir = mkdtempSync(join(tmpdir(), "pstack-sync-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const source = join(dir, "source");
	execFileSync("git", ["init", "-q", source]);
	cpSync(join(repo, "vendor/pstack"), join(source, "pstack"), { recursive: true });
	execFileSync("git", ["-C", source, "add", "pstack"]);
	execFileSync("git", ["-C", source, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "upstream fixture"]);
	const ref = execFileSync("git", ["-C", source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
	const args = [join(repo, "scripts/pstack-sync.mjs"), "--from", source, "--ref", ref, "--root", join(dir, "target")];
	let result = spawnSync(process.execPath, args, { encoding: "utf8" });
	assert.equal(result.status, 0, result.stdout + result.stderr);
	result = spawnSync(process.execPath, args, { encoding: "utf8" });
	assert.equal(result.status, 0, result.stdout + result.stderr);
	assert.match(result.stdout, /unchanged/);
	const target = join(dir, "target/vendor/pstack/README.md");
	writeFileSync(target, "local edit\n");
	result = spawnSync(process.execPath, args, { encoding: "utf8" });
	assert.notEqual(result.status, 0);
	assert.match(result.stderr + result.stdout, /upstream file changed/);
	assert.equal(readFileSync(target, "utf8"), "local edit\n");
});
