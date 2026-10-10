#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

python3 - <<'PY'
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

settings = json.loads(Path("settings.json").read_text())
paths = settings.get("skills", [])
missing = [p for p in paths if not (Path(p) / "SKILL.md").is_file()]
if missing:
    print("missing enabled skills:")
    print("\n".join(f"  {p}" for p in missing))
    raise SystemExit(1)

local_files = [p for root in (Path("skills"), Path(".pi/skills")) for p in sorted(root.rglob("SKILL.md"))
               if not any(part.startswith(".") or part == "node_modules" for part in p.relative_to(root).parts)]
files = list(dict.fromkeys(p.resolve() for p in local_files + [Path(p) / "SKILL.md" for p in paths]))
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
    if "pstack" in file.parts and (len(name) > 64 or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name)
                                  or name != file.parent.name):
        print(f"invalid pstack skill name or directory: {file}: {name}")
        raise SystemExit(1)
    names.setdefault(name, []).append(str(file))

link_files = sorted(Path("skills/pstack").rglob("*.md")) + sorted(Path(".pi/skills/verify-pstack").rglob("*.md"))
for file in link_files:
    text = re.sub(r"(?ms)^```[^\n]*\n.*?^```[ \t]*$", "", file.read_text())
    for target in re.findall(r"\]\(([^)]+)\)", text):
        target = target.strip().split()[0].strip("<>")
        url = urlsplit(target)
        if url.scheme or url.netloc or not url.path:
            continue
        if not (file.parent / unquote(url.path)).exists():
            print(f"broken relative link: {file}: {target}")
            raise SystemExit(1)

duplicates = {name: values for name, values in names.items() if len(values) > 1}
if duplicates:
    print("duplicate enabled skill names:")
    for name, values in duplicates.items():
        print(f"  {name}: {', '.join(values)}")
    raise SystemExit(1)

expected = [
    "./vendor/bro/skills/bro",
    "./vendor/bro/skills/readback",
    "./vendor/bro/skills/facts",
    "./vendor/bro/skills/recap",
    "./vendor/bro/skills/status",
    "./vendor/bro/skills/clean-room",
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

print(f"explicitly enabled skills: {len(paths)}")
print(f"auto-discovered local skills: {len(local_files)}")
print(f"unique enabled skill names: {len(names)}")
print("selected bro and baoyu skills, local names, and pstack links: OK")
PY
