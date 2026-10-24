#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"
node adapters/pstack/check.mjs

python3 - <<'PY'
import json, re, subprocess
from pathlib import Path
from urllib.parse import unquote, urlsplit

settings = json.loads(Path("settings.json").read_text())
paths = settings.get("skills", [])
for path in paths:
    if path.startswith(("-", "+")):
        continue
    directory = Path(path)
    if not directory.exists() or not (directory.is_file() or any(directory.rglob("SKILL.md"))):
        print(f"missing enabled skills: {path}")
        raise SystemExit(1)
for stale in (Path("skills/pstack"), Path("vendor/bro")):
    if stale.exists():
        print(f"legacy path still present: {stale}")
        raise SystemExit(1)
policy = json.loads(Path("adapters/pstack/policy.json").read_text())
loaded = subprocess.run(["node", "scripts/check-skill-loading.mjs", str(Path.cwd())],
                        text=True, capture_output=True, check=True)
resources = json.loads(loaded.stdout)
if resources["diagnostics"]:
    print("skill loading diagnostics:")
    print(json.dumps(resources["diagnostics"], indent=2))
    raise SystemExit(1)
files = [Path(p) for p in resources["files"]]
names = {}
for file in files:
    text = file.read_text()
    frontmatter = re.match(r"\A---\n(.*?)\n---(?:\n|$)", text, re.S)
    if not frontmatter:
        print(f"missing YAML frontmatter: {file}")
        raise SystemExit(1)
    fields = dict(re.findall(r"^(name|description):[ \t]*(.*)$", frontmatter[1], re.M))
    name = fields.get("name", "").strip().strip("\"'")
    if not name or not fields.get("description", "").strip():
        print(f"missing frontmatter name or description: {file}")
        raise SystemExit(1)
    if len(name) > 64 or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name) or name != file.parent.name:
        print(f"invalid skill name or directory: {file}: {name}")
        raise SystemExit(1)
    names.setdefault(name, []).append(str(file))

for name in policy["disabledSkills"]:
    if name in names:
        print(f"disabled upstream skill is still loaded: {name}")
        raise SystemExit(1)
for name in ["bro", "poteto-mode", "how", "sharpen", "setup-pstack"] + policy["localSkills"]:
    if name not in names:
        print(f"required skill is not loaded: {name}")
        raise SystemExit(1)

for root in (Path("adapters/pstack"), Path("skills/pi-native"), Path(".pi/skills")):
    for file in sorted(root.rglob("*.md")):
        text = re.sub(r"(?ms)^```[^\n]*\n.*?^```[ \t]*$", "", file.read_text())
        for target in re.findall(r"\]\(([^)]+)\)", text):
            target = target.strip().split()[0].strip("<>")
            url = urlsplit(target)
            if url.scheme or url.netloc or not url.path:
                continue
            if not (file.parent / unquote(url.path)).exists():
                print(f"broken relative link: {file}: {target}")
                raise SystemExit(1)

for file in sorted(Path("prompts").glob("*.md")):
    text = file.read_text()
    if re.search(r"chain parameter|\{previous\}|\"planner\"", text):
        print(f"legacy workflow in prompts/{file.name}")
        raise SystemExit(1)

duplicates = {name: values for name, values in names.items() if len(values) > 1}
if duplicates:
    print("duplicate enabled skill names:")
    for name, values in duplicates.items():
        print(f"  {name}: {', '.join(values)}")
    raise SystemExit(1)

expected = [
    "./vendor/baoyu-skills/skills/baoyu-post-to-wechat",
    "./vendor/baoyu-skills/skills/baoyu-markdown-to-html",
    "./vendor/baoyu-skills/skills/baoyu-format-markdown",
    "./vendor/baoyu-skills/skills/baoyu-cover-image",
    "./vendor/baoyu-skills/skills/baoyu-article-illustrator",
    "./vendor/baoyu-skills/skills/baoyu-image-gen",
    "./vendor/baoyu-skills/skills/baoyu-youtube-transcript",
    "./vendor/baoyu-skills/skills/baoyu-url-to-markdown",
]
configured = {p.rstrip("/") for p in paths}
missing_expected = [p for p in expected if p not in configured]
if missing_expected:
    print("expected selected skills are not enabled:")
    print("\n".join(f"  {p}" for p in missing_expected))
    raise SystemExit(1)

print(f"enabled skills: {len(names)} unique names")
print(f"upstream skills mounted from vendor with {len(policy['disabledSkills'])} declared exclusions")
print("Pi adapter, pristine upstream, links, local skills, and prompts: OK")
PY
