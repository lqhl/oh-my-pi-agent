import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

let sdkDir = process.env.PSTACK_TEST_SDK_ROOT;
if (!sdkDir) {
	let entry = realpathSync(execFileSync("which", ["pi"], { encoding: "utf8" }).trim());
	const installDir = resolve(dirname(entry), "../install");
	const versionFile = join(installDir, "current-version");
	if (existsSync(versionFile)) {
		const version = readFileSync(versionFile, "utf8").trim();
		if (!/^[a-zA-Z0-9_-][a-zA-Z0-9._+-]*$/.test(version)) throw new Error(`Invalid managed Pi version in ${versionFile}`);
		entry = realpathSync(join(installDir, "releases", version, "node_modules/.bin/pi"));
	}
	sdkDir = dirname(entry);
	while (!existsSync(join(sdkDir, "package.json"))) {
		const parent = dirname(sdkDir);
		if (parent === sdkDir) throw new Error("Cannot locate the installed Pi SDK");
		sdkDir = parent;
	}
}
const metadata = JSON.parse(readFileSync(join(sdkDir, "package.json"), "utf8"));
if (metadata.name !== "@earendil-works/pi-coding-agent") throw new Error(`Not a Pi SDK: ${sdkDir}`);
const sdk = await import(pathToFileURL(resolve(sdkDir, metadata.exports["."].import)).href);
export { sdk, sdkDir, metadata };
