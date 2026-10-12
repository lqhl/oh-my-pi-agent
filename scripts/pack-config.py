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
    "extensions", "skills", "prompts", "themes", "agents", "vendor", ".pi/skills",
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
    (bundle / "install.sh").write_text('''#!/usr/bin/env bash
set -euo pipefail
bundle_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PI_CODING_AGENT_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
mkdir -p "$PI_CODING_AGENT_DIR"
cp -a "$bundle_dir/agent/." "$PI_CODING_AGENT_DIR/"
export npm_config_registry="${npm_config_registry:-https://registry.npmmirror.com}"
npm install -g @earendil-works/pi-coding-agent
node - "$PI_CODING_AGENT_DIR/settings.json" <<'JS'
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const settings = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (const entry of settings.packages || []) {
    const source = typeof entry === 'string' ? entry : entry.source;
    const result = spawnSync('pi', ['install', source], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
}
JS
printf '%s\\n' "配置已复制到 $PI_CODING_AGENT_DIR。请配置内部 models.json，并修改 settings.json 的默认模型和 subagents 模型。"
''')
    (bundle / "install.sh").chmod(0o755)
    (bundle / "README.txt").write_text('''运行 bash install.sh，默认复制到 ~/.pi/agent 并通过 npmmirror 安装 Pi 和 npm 插件。
若目标已有配置，安装会覆盖同名文件。建议先备份，或使用独立目录。
指定目录示例：PI_CODING_AGENT_DIR="$HOME/.pi/agent-corp" bash install.sh
启动示例：PI_CODING_AGENT_DIR="$HOME/.pi/agent-corp" pi
压缩包包含本地扩展、技能、vendor 实际文件和配置，不包含 node_modules、Git 元数据、个人凭据、会话、缓存和 models.json。
不打包 baoyu-skills 和 guizang-ppt-skill，打包后的 settings.json 同时移除这些技能路径。
打包时使用 Git 的忽略规则，包括子模块和嵌套目录的 .gitignore，另行排除凭据和虚拟环境。
在目标目录创建内部 models.json，并修改 settings.json 中 defaultProvider、defaultModel 和 subagents.agentOverrides 的 model。
npm 插件沿用 settings.json 中的包来源。脚本不额外锁定版本。
本地技能依赖的非 npm 工具需要另行安装。
''')
    output.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(output, "w:gz") as archive:
        for path in sorted(bundle.iterdir()):
            archive.add(path, arcname=path.name)

print(f"已生成 {output} ({output.stat().st_size / 1024 / 1024:.1f} MiB)")
print("解压后运行 bash install.sh。内部 API 配置需在目标机器填写。")
