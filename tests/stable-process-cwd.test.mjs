import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const extension = fileURLToPath(new URL("../extensions/stable-process-cwd.ts", import.meta.url));

test("an invalid process cwd is recovered from the active Session directory", (t) => {
	const dir = mkdtempSync(join(tmpdir(), "stable-cwd-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const deleted = join(dir, "deleted");
	const valid = join(dir, "valid");
	execFileSync("mkdir", [deleted, valid]);
	const entry = join(dir, "entry.mjs");
	writeFileSync(entry, `import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const base = ${JSON.stringify(dir)};
const scratch = join(base, "scratch");
mkdirSync(scratch);
process.chdir(scratch);
rmSync(scratch, { recursive: true });
const { ensureProcessCwd } = await import(${JSON.stringify(extension)});
const { sdkDir } = await import(${JSON.stringify(fileURLToPath(new URL("../tests/support/pi-sdk.mjs", import.meta.url)))});
const { executeCodemode } = await import(new URL("dist/extensions/codemode/execute.js", "file://" + sdkDir + "/").href);
const result = ensureProcessCwd(${JSON.stringify(valid)});
const observed = process.cwd();
const execution = await executeCodemode("stable-cwd", { code: "return 7;" });
const text = execution.content.filter((block) => block.type === "text").map((block) => block.text).join("");
writeFileSync(join(base, "result.json"), JSON.stringify({ result, observed, codemode: !execution.isError && /7/.test(text) }));
`);
	const result = execFileSync(process.execPath, ["--experimental-strip-types", entry], { encoding: "utf8" });
	const observed = JSON.parse(execFileSync("cat", [join(dir, "result.json")], { encoding: "utf8" }));
	assert.deepEqual(observed, { result: "recovered", observed: valid, codemode: true });
	assert.equal(result, "");
});
