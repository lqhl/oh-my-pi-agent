import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

export function inventory(root) {
	const files = {};
	function walk(directory) {
		for (const name of readdirSync(directory).sort()) {
			const path = join(directory, name);
			const stat = lstatSync(path);
			if (stat.isSymbolicLink()) throw new Error(`upstream symlink is unsupported: ${path}`);
			if (stat.isDirectory()) walk(path);
			else files[relative(root, path).replaceAll("\\", "/")] = {
				sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
				executable: Boolean(stat.mode & 0o111),
			};
		}
	}
	walk(root);
	return files;
}

export function assertSource(root, lock) {
	if (lock.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(lock.commit) || !/^[a-f0-9]{40}$/.test(lock.tree)) {
		throw new Error("invalid upstream lock");
	}
	const actual = inventory(join(root, "vendor/pstack"));
	for (const name of new Set([...Object.keys(lock.files), ...Object.keys(actual)])) {
		if (JSON.stringify(actual[name]) !== JSON.stringify(lock.files[name])) throw new Error(`upstream file changed: ${name}`);
	}
}

export function sourceNames(files, kind) {
	const pattern = kind === "skills" ? /^skills\/([^/]+)\/SKILL\.md$/ : /^skills\/poteto-mode\/playbooks\/([^/]+)\.md$/;
	return Object.keys(files).flatMap(path => path.match(pattern)?.[1] ?? []).sort();
}

export function assertCoverage(root, lock, previous) {
	const policy = JSON.parse(readFileSync(join(root, "adapters/pstack/policy.json"), "utf8"));
	const adapter = readFileSync(join(root, "adapters/pstack/pi.md"), "utf8");
	for (const term of lock.terms) if (!adapter.includes(term.key)) throw new Error(`adapter has no row for ${term.key}`);
	for (const name of sourceNames(lock.files, "playbooks")) {
		if (!policy.playbooks[name]) throw new Error(`unclassified playbook: ${name}`);
	}
	if (previous) {
		const known = new Set(sourceNames(previous.files, "skills"));
		for (const name of sourceNames(lock.files, "skills")) {
			if (!known.has(name) && !policy.disabledSkills[name] && !policy.acceptedSkills.includes(name)) {
				throw new Error(`unclassified upstream skill: ${name}`);
			}
		}
	}
	for (const name of Object.keys(policy.disabledSkills)) {
		const expectedLater = !lock.files[`skills/${name}/SKILL.md`];
		if (expectedLater && previous?.files[`skills/${name}/SKILL.md`] && !lock.files[`skills/${name}/SKILL.md`]) {
			throw new Error(`disabled skill disappeared from a newer upstream: ${name}`);
		}
	}
}
