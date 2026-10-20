#!/usr/bin/env python3
"""Inventory upstream pstack changes without changing either checkout."""

import argparse
import hashlib
import json
import subprocess
from collections import Counter
from pathlib import Path


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args], text=True).strip()


def tree(repo, ref):
    rows = git(repo, "ls-tree", "-r", ref, "--", "pstack", "cursor-team-kit")
    return {path: meta.split()[2] for meta, path in
            (line.split("\t", 1) for line in rows.splitlines())}


def blob(path):
    data = path.read_bytes()
    return hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upstream", type=Path, required=True)
    parser.add_argument("--local", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--target", help="Compare to this commit instead of the recorded reviewed target")
    args = parser.parse_args()
    manifest = json.loads((args.local / "skills/pstack/upstream.json").read_text())
    base = manifest["baseCommit"]
    target = git(args.upstream, "rev-parse", f"{args.target or manifest['reviewedTarget']}^{{commit}}")
    git(args.upstream, "merge-base", "--is-ancestor", base, target)
    refs = {base, target} | {row["sourceCommit"] for row in manifest["skills"].values() if row["sourceCommit"]}
    trees = {ref: tree(args.upstream, ref) for ref in refs}
    latest = trees[target]
    skills = {}
    for entry in sorted((args.local / "skills/pstack").glob("*/SKILL.md")):
        name = entry.parent.name
        record = manifest["skills"][name]
        source = record["sourcePath"]
        upstream_path = f"{source}/SKILL.md" if source else None
        baseline = record["sourceCommit"]
        old = trees[baseline] if baseline else {}
        changed = [path for path in sorted(set(old) | set(latest))
                   if source and path.startswith(source + "/") and old.get(path) != latest.get(path)]
        local_blob = blob(entry)
        skills[name] = {
            "source": source,
            "disposition": record["disposition"],
            "baseline": baseline,
            "local_blob": local_blob,
            "baseline_blob": old.get(upstream_path),
            "target_blob": latest.get(upstream_path),
            "local_matches_baseline": local_blob == old.get(upstream_path),
            "local_matches_target": local_blob == latest.get(upstream_path),
            "upstream_changed_files": changed,
        }
    upstream_skills = {path.split("/")[2] for path in latest
                       if path.startswith("pstack/skills/") and path.endswith("/SKILL.md")
                       and len(path.split("/")) == 4}
    old_skills = {path.split("/")[2] for path in trees[base]
                  if path.startswith("pstack/skills/") and path.endswith("/SKILL.md")
                  and len(path.split("/")) == 4}
    changes = git(args.upstream, "diff", "--name-status", base, target,
                  "--", "pstack", "cursor-team-kit")
    commits = git(args.upstream, "log", "--format=%H\t%cs\t%s", f"{base}..{target}",
                  "--", "pstack", "cursor-team-kit")
    report = {
        "upstream_repo": manifest["repository"],
        "base": base,
        "target": target,
        "local_head": git(args.local, "rev-parse", "HEAD"),
        "counts": {
            "local_skills": len(skills),
            "local_skills_with_upstream_changes": sum(bool(row["upstream_changed_files"]) for row in skills.values()),
            "local_entries_matching_target": sum(row["local_matches_target"] for row in skills.values()),
            "upstream_skills_at_base": len(old_skills),
            "upstream_skills_at_target": len(upstream_skills),
            "new_upstream_skills": len(upstream_skills - old_skills),
            "commits_touching_sources": len(commits.splitlines()),
            "changed_files": len(changes.splitlines()),
        },
        "skills": skills,
        "new_upstream_skills": sorted(upstream_skills - old_skills),
        "upstream_skills_not_installed": sorted(upstream_skills - set(skills)),
        "changed_file_status_counts": dict(Counter(line.split("\t")[0] for line in changes.splitlines())),
        "changed_files": [line.split("\t") for line in changes.splitlines()],
        "commits": [dict(zip(("sha", "date", "subject"), line.split("\t", 2)))
                    for line in commits.splitlines()],
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
