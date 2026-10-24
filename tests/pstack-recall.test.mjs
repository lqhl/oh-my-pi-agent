import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../adapters/pstack/scripts/find-sessions.py", import.meta.url));

function fixture(t) {
	const dir = mkdtempSync(join(tmpdir(), "pstack-recall-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const store = join(dir, "sessions");
	const cwd = join(dir, "project");
	mkdirSync(store);
	const add = (name, id, workspace, updated, prompt) => {
		const path = join(store, name);
		mkdirSync(dirname(path), { recursive: true });
		const records = [
			{ type: "session", id, cwd: workspace, timestamp: "2025-01-01T00:00:00Z" },
			{ type: "message", message: { role: "user", content: [{ type: "text", text: prompt }] } },
		];
		writeFileSync(path, records.map((record) => JSON.stringify(record)).join("\n") + "\n");
		utimesSync(path, new Date(updated), new Date(updated));
	};
	const query = (...args) => spawnSync("python3", [script, "--sessions-dir", store, "--cwd", cwd, ...args], {
		encoding: "utf8", env: { ...process.env, PI_SESSION_ID: "current", PI_SESSION_FILE: "" },
	});
	return { dir, store, cwd, add, query };
}

test("recall selects the exact workspace, excludes current and child logs, and sorts by updates", (t) => {
	const f = fixture(t);
	f.add("workspace/z-old.jsonl", "older", f.cwd, "2026-10-05T00:00:00Z", "Earlier export work");
	f.add("workspace/a-new.jsonl", "newer", f.cwd, "2026-10-07T00:00:00Z", "Continue export work");
	f.add("workspace/current.jsonl", "current", f.cwd, "2026-10-08T00:00:00Z", "Current export work");
	f.add("workspace/parent/child/run-0/session.jsonl", "child", f.cwd, "2026-10-09T00:00:00Z", "Child export work");
	f.add("other/private.jsonl", "other", `${f.cwd}-other`, "2026-10-09T00:00:00Z", "Unrelated export work");
	const result = f.query("--topic", "EXPORT");
	assert.equal(result.status, 0, result.stderr);
	const found = JSON.parse(result.stdout);
	assert.deepEqual(found.map(({ id, first_prompt }) => ({ id, first_prompt })), [
		{ id: "newer", first_prompt: "Continue export work" },
		{ id: "older", first_prompt: "Earlier export work" },
	]);
	assert.deepEqual(found.map(({ updated_at }) => updated_at), ["2026-10-07T00:00:00+00:00", "2026-10-05T00:00:00+00:00"]);
	assert.equal(result.stderr, "");
});

test("recall includes long-running chats by update time and honors the window and explicit exclusions", (t) => {
	const f = fixture(t);
	f.add("workspace/old.jsonl", "older", f.cwd, "2026-10-01T00:00:00Z", "Old export decision");
	f.add("workspace/new.jsonl", "newer", f.cwd, "2026-10-07T00:00:00Z", "Recent export decision");
	f.add("workspace/later.jsonl", "later", f.cwd, "2026-10-09T00:00:00Z", "Later export decision");
	const bounded = f.query("--since", "2026-10-05", "--until", "2026-10-08", "--topic", "export");
	assert.equal(bounded.status, 0, bounded.stderr);
	assert.deepEqual(JSON.parse(bounded.stdout).map(({ id }) => id), ["newer"]);
	const all = f.query("--exclude-session", "later");
	assert.equal(all.status, 0, all.stderr);
	assert.deepEqual(JSON.parse(all.stdout).map(({ id }) => id), ["newer", "older"]);
});

test("recall distinguishes no matching history from an unavailable store or invalid window", (t) => {
	const f = fixture(t);
	f.add("workspace/record.jsonl", "recorded", f.cwd, "2026-10-07T00:00:00Z", "Recorded export work");
	const present = f.query("--topic", "export");
	assert.equal(present.status, 0, present.stderr);
	assert.deepEqual(JSON.parse(present.stdout).map(({ id }) => id), ["recorded"]);
	const empty = f.query("--topic", "unrecorded topic");
	assert.equal(empty.status, 0, empty.stderr);
	assert.deepEqual(JSON.parse(empty.stdout), []);
	const missing = f.query("--sessions-dir", join(f.dir, "missing"));
	assert.equal(missing.status, 2);
	assert.match(missing.stderr, /session directory is unavailable/);
	const invalid = f.query("--since", "2026-10-08", "--until", "2026-10-05");
	assert.equal(invalid.status, 2);
	assert.match(invalid.stderr, /--since must not be later than --until/);
});
