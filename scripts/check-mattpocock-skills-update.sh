#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
submodule="$repo_root/vendor/mattpocock-skills"

if [[ ! -e "$submodule/.git" ]]; then
  echo "error: mattpocock-skills submodule is not initialized" >&2
  echo "run: git submodule update --init vendor/mattpocock-skills" >&2
  exit 1
fi

git -C "$submodule" fetch --quiet origin

current="$(git -C "$submodule" rev-parse HEAD)"
upstream_ref="$(git -C "$submodule" symbolic-ref --quiet refs/remotes/origin/HEAD || true)"
if [[ -z "$upstream_ref" ]]; then
  upstream_ref="refs/remotes/origin/main"
fi
latest="$(git -C "$submodule" rev-parse "$upstream_ref")"

printf 'current:  %s\n' "$current"
printf 'upstream: %s (%s)\n' "$latest" "$upstream_ref"

if [[ "$current" == "$latest" ]]; then
  echo "mattpocock-skills is up to date"
  exit 0
fi

echo
echo "upstream commits:"
git -C "$submodule" log --oneline --decorate "$current..$latest"

echo
echo "skill changes:"
git -C "$submodule" diff --stat "$current..$latest" -- skills/

echo
echo "Review the full skill diff before updating:"
printf '  git -C %q diff %q -- skills/\n' "$submodule" "$current..$latest"
printf '  git -C %q checkout %q\n' "$submodule" "$latest"
