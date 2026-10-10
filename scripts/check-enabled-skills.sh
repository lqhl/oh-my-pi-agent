#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

python3 - <<'PY'
import json
from pathlib import Path

settings = json.loads(Path("settings.json").read_text())
paths = settings.get("skills", [])
missing = [p for p in paths if not (Path(p) / "SKILL.md").is_file()]
if missing:
    print("missing enabled skills:")
    print("\n".join(f"  {p}" for p in missing))
    raise SystemExit(1)

names = {}
for path in paths:
    text = (Path(path) / "SKILL.md").read_text()
    name = next((line.split(":", 1)[1].strip() for line in text.splitlines() if line.startswith("name:")), None)
    if not name:
        print(f"missing frontmatter name: {path}")
        raise SystemExit(1)
    names.setdefault(name, []).append(path)

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
    "./vendor/mattpocock-skills/skills/productivity/grilling",
    "./vendor/mattpocock-skills/skills/engineering/domain-modeling",
    "./vendor/mattpocock-skills/skills/engineering/prototype",
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
print("selected bro, planning, and baoyu skills: OK")
PY
