import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

let sdkDir = process.env.PSTACK_TEST_SDK_ROOT;
if (!sdkDir) {
	sdkDir = dirname(realpathSync(execFileSync("which", ["pi"], { encoding: "utf8" }).trim()));
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
