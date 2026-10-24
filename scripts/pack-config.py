#!/usr/bin/env python3
import argparse
import json
import shutil
import subprocess
import tarfile
import tempfile
from pathlib import Path

parser = argparse.ArgumentParser(description="打包 Pi 本地配置，npm 插件在目标机器安装。")
parser.add_argument("output", nargs="?", default="pi-agent-config.tar.gz", help="输出压缩包路径")
args = parser.parse_args()
source = Path(__file__).resolve().parent.parent
output = Path(args.output).resolve()
settings = json.loads((source / "settings.json").read_text())
packages = settings.get("packages", [])
non_npm = [p for p in packages if not (p if isinstance(p, str) else p["source"]).startswith("npm:")]
if non_npm:
    parser.error(f"发现非 npm 包，需要先改为本地资源或 npm 来源: {non_npm}")

paths = [
    "settings.json", "keybindings.json", "APPEND_SYSTEM.md", "SYSTEM.md",
    "AGENTS.md", "AGENTS.override.md", "CLAUDE.md", "pi-vcc-config.json",
    "extensions", "skills", "prompts", "themes", "agents", "adapters", "vendor", ".pi/skills",
]
omitted = (Path("vendor/baoyu-skills"), Path("skills/guizang-ppt-skill"))
settings["skills"] = [
    skill for skill in settings.get("skills", [])
    if not any((source / skill).resolve().is_relative_to(source / root) for root in omitted)
]
always_excluded = shutil.ignore_patterns(
    ".git", "node_modules", ".venv", "venv", "__pycache__", ".DS_Store", ".env", ".env.*",
    "auth.json", ".secrets.yaml", "*.pyc",
)

def excluded(directory, names):
    skipped = set(always_excluded(directory, names))
    skipped.update(name for name in names if (Path(directory) / name).relative_to(source) in omitted)
    entries = [name + ("/" if (Path(directory) / name).is_dir() else "") for name in names]
    if entries:
        result = subprocess.run(
            ["git", "-C", str(directory), "check-ignore", "--no-index", "-z", "--stdin"],
            input="\0".join(entries) + "\0", capture_output=True, text=True,
        )
        if result.returncode not in (0, 1):
            raise RuntimeError(result.stderr.strip())
        skipped.update(name.rstrip("/") for name in result.stdout.split("\0") if name)
    return skipped


with tempfile.TemporaryDirectory(prefix="pi-pack-") as temp:
    bundle = Path(temp)
    agent = bundle / "agent"
    agent.mkdir()
    for name in paths:
        src = source / name
        dst = agent / name
        if src.name in excluded(src.parent, [src.name]):
            continue
        if src.is_dir():
            shutil.copytree(src, dst, ignore=excluded)
        elif src.is_file():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)

    (agent / "settings.json").write_text(json.dumps(settings, ensure_ascii=False, indent=2) + "\n")
    (bundle / "npm-packages.json").write_text(json.dumps(packages, ensure_ascii=False, indent=2) + "\n")
    (bundle / "install.sh").write_text('''#!/usr/bin/env bash
set -euo pipefail
bundle_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PI_CODING_AGENT_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
mkdir -p "$PI_CODING_AGENT_DIR"
node - "$bundle_dir/agent/adapters/pstack/legacy-files.json" "$PI_CODING_AGENT_DIR" "$bundle_dir/agent/settings.json" <<'JS'
const { createHash } = require('node:crypto');
const { existsSync, readFileSync, rmSync, writeFileSync, renameSync } = require('node:fs');
const { join, resolve, sep } = require('node:path');
const manifest = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const target = process.argv[3];
const conflicts = [];
for (const [name, expected] of Object.entries(manifest.files)) {
  const path = join(target, name);
  if (!existsSync(path)) continue;
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (actual !== expected) conflicts.push(name);
}
if (conflicts.length) {
  console.error('Refusing to upgrade: locally changed managed files: ' + conflicts.join(', '));
  process.exit(1);
}
const settingsPath = join(target, 'settings.json');
if (existsSync(settingsPath)) {
  const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  const legacyRoots = ['skills/pstack', 'vendor/bro'].map(name => resolve(target, name));
  const isLegacy = entry => {
    const path = resolve(target, entry.replace(/^[-+]/, ''));
    return legacyRoots.some(root => path === root || path.startsWith(root + sep));
  };
  const skills = settings.skills ?? [];
  if (legacyRoots.some(root => existsSync(root)) || skills.some(isLegacy)) {
    const bundled = JSON.parse(readFileSync(process.argv[4], 'utf8'));
    const managed = bundled.skills.filter(entry => entry.replace(/^[-+]/, '').startsWith('./vendor/pstack/skills'));
    const retained = skills.filter(entry => !isLegacy(entry) && !managed.includes(entry));
    settings.skills = [...retained, ...managed];
    const temporary = settingsPath + '.pstack-upgrade';
    writeFileSync(temporary, JSON.stringify(settings, null, 2) + '\\n');
    renameSync(temporary, settingsPath);
  }
}
for (const name of Object.keys(manifest.files)) {
  const path = join(target, name);
  if (existsSync(path)) rmSync(path, { force: true });
}
const { readdirSync, rmdirSync } = require('node:fs');
function prune(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) prune(join(directory, entry.name));
  }
  try { rmdirSync(directory); } catch {}
}
for (const root of manifest.roots) prune(join(target, root));
JS
for path in "$bundle_dir"/agent/* "$bundle_dir"/agent/.[!.]*; do
    [[ -e "$path" ]] || continue
    name="$(basename "$path")"
    if [[ -d "$path" ]]; then
        mkdir -p "$PI_CODING_AGENT_DIR/$name"
        cp -a "$path/." "$PI_CODING_AGENT_DIR/$name/"
    elif [[ ! -e "$PI_CODING_AGENT_DIR/$name" && ! -L "$PI_CODING_AGENT_DIR/$name" ]]; then
        cp -a "$path" "$PI_CODING_AGENT_DIR/$name"
    else
        printf '%s\\n' "保留已有配置 $name"
    fi
done
export npm_config_registry="${npm_config_registry:-https://registry.npmmirror.com}"
npm install -g @earendil-works/pi-coding-agent
node - "$bundle_dir/npm-packages.json" "$PI_CODING_AGENT_DIR/npm" <<'JS'
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const packages = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const specs = packages.map(entry => (typeof entry === 'string' ? entry : entry.source).slice(4));
if (specs.length) {
    const result = spawnSync('npm', ['install', '--prefix', process.argv[3], '--legacy-peer-deps', ...specs], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
}
JS
printf '%s\\n' "配置已复制到 $PI_CODING_AGENT_DIR。请配置内部 models.json，并修改 settings.json 的默认模型和 subagents 模型。"
''')
    (bundle / "install.sh").chmod(0o755)
    (bundle / "README.txt").write_text('''运行 bash install.sh，默认复制到 ~/.pi/agent 并通过 npmmirror 安装 Pi 和 npm 插件。
已有的顶层配置文件仅在缺失时复制。升级旧 pstack 时只迁移 settings.json 中旧 pstack/bro 技能路径并加入新版挂载和排除项，其它配置保留。
扩展、技能等目录更新包内同名文件。升级前按随包受管清单删除未修改的旧 pstack 与 vendor/bro 文件；发现用户修改过的受管文件会拒绝升级。公司额外文件保留，公司定制请使用独立名称。
指定目录示例：PI_CODING_AGENT_DIR="$HOME/.pi/agent-corp" bash install.sh
启动示例：PI_CODING_AGENT_DIR="$HOME/.pi/agent-corp" pi
压缩包包含本地扩展、技能、vendor 实际文件和配置，不包含 node_modules、Git 元数据、个人凭据、会话、缓存和 models.json。
不打包 baoyu-skills 和 guizang-ppt-skill，打包后的 settings.json 同时移除这些技能路径。
打包时使用 Git 的忽略规则，包括子模块和嵌套目录的 .gitignore，另行排除凭据和虚拟环境。
在目标目录创建内部 models.json，并修改 settings.json 中 defaultProvider、defaultModel 和 subagents.agentOverrides 的 model。
npm 插件从 npm-packages.json 安装，公司 packages 和模型配置保留。脚本不额外锁定版本。
以后新增插件需要手动加入公司 settings.json 的 packages 才会启用。
本地技能依赖的非 npm 工具需要另行安装。
''')
    output.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(output, "w:gz") as archive:
        for path in sorted(bundle.iterdir()):
            archive.add(path, arcname=path.name)

print(f"已生成 {output} ({output.stat().st_size / 1024 / 1024:.1f} MiB)")
print("解压后运行 bash install.sh。内部 API 配置需在目标机器填写。")
