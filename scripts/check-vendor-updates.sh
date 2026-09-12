#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ $# -eq 0 ]]; then
  set -- $(git config -f .gitmodules --get-regexp '^submodule\..*\.path$' | awk '{print $2}')
fi

for submodule in "$@"; do
  if [[ ! -d "$submodule" ]]; then
    echo "error: submodule path does not exist: $submodule" >&2
    exit 1
  fi
  if ! git -C "$submodule" rev-parse --git-dir >/dev/null 2>&1; then
    echo "error: not an initialized Git submodule: $submodule" >&2
    exit 1
  fi

  git -C "$submodule" fetch --quiet origin
  current="$(git -C "$submodule" rev-parse HEAD)"
  upstream_ref="$(git -C "$submodule" symbolic-ref --quiet refs/remotes/origin/HEAD || true)"
  if [[ -z "$upstream_ref" ]]; then
    upstream_ref="refs/remotes/origin/main"
  fi
  latest="$(git -C "$submodule" rev-parse "$upstream_ref")"

  printf '\n%s\n' "=== $submodule ==="
  printf 'current:  %s\n' "$current"
  printf 'upstream: %s (%s)\n' "$latest" "$upstream_ref"
  if [[ "$current" == "$latest" ]]; then
    echo "up to date"
    continue
  fi

  echo
  echo "upstream commits:"
  git -C "$submodule" log --oneline --decorate "$current..$latest"
  echo
  echo "skill changes:"
  git -C "$submodule" diff --stat "$current..$latest" -- skills/
  echo
  echo "Review before updating:"
  printf '  git -C %q diff %q -- skills/\n' "$submodule" "$current..$latest"
  printf '  git -C %q checkout %q\n' "$submodule" "$latest"
done
