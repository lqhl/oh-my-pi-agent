#!/usr/bin/env python3
"""Find project session transcripts without reading other projects' messages."""

import argparse
import json
import os
import sys
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

AGENT_DIR = Path(
    os.environ.get("PI_CODING_AGENT_DIR") or Path.home() / ".pi" / "agent"
).expanduser()
SESSIONS_ROOT = AGENT_DIR / "sessions"


def iter_session_files(root: Path):
    if not root.is_dir():
        return
    for path in root.glob("*/*.jsonl"):
        if any(part.startswith(("run-", ".")) for part in path.relative_to(root).parts[:-1]):
            continue
        yield path


def iter_records(path: Path):
    with path.open(encoding="utf-8") as stream:
        for line in stream:
            try:
                value = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(value, dict):
                yield value


def parse_date(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError(f"invalid date: {value}") from error
    return parsed.replace(tzinfo=parsed.tzinfo or timezone.utc)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cwd", type=Path, default=Path.cwd())
    parser.add_argument("--topic", help="Literal text to find in user or assistant messages.")
    parser.add_argument("--since", type=parse_date)
    parser.add_argument("--until", type=parse_date)
    parser.add_argument("--sessions-dir", type=Path, default=SESSIONS_ROOT)
    parser.add_argument("--exclude-session", action="append", default=[])
    args = parser.parse_args()
    workspace = args.cwd.expanduser().resolve()
    sessions_root = args.sessions_dir.expanduser().resolve()
    if not sessions_root.is_dir():
        parser.error(f"session directory is unavailable: {sessions_root}")
    if args.since and args.until and args.since > args.until:
        parser.error("--since must not be later than --until")
    excluded = set(args.exclude_session)
    excluded.add(os.environ.get("PI_SESSION_ID", ""))
    current_file = os.environ.get("PI_SESSION_FILE")
    current_path = Path(current_file).resolve() if current_file else None
    needle = args.topic.casefold() if args.topic else None
    matches = []
    for path in iter_session_files(sessions_root):
        if path.resolve() == current_path:
            continue
        try:
            modified = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc)
        except OSError:
            continue
        if args.since and modified < args.since:
            continue
        if args.until and modified > args.until:
            continue
        with closing(iter_records(path)) as records:
            header = next(records, {})
            if not isinstance(header, dict) or header.get("type") != "session":
                continue
            if not header.get("cwd") or Path(header["cwd"]).resolve() != workspace:
                continue
            session_id = header.get("id")
            if not session_id or session_id in excluded:
                continue
            found = needle is None
            first_prompt = ""
            for record in records:
                if record.get("type") != "message":
                    continue
                message = record.get("message") or {}
                role = message.get("role")
                if role not in ("user", "assistant"):
                    continue
                content = message.get("content") or []
                text = content if isinstance(content, str) else "\n".join(
                    block.get("text", "") for block in content
                    if isinstance(block, dict) and block.get("type") == "text"
                )
                if role == "user" and not first_prompt:
                    first_prompt = text[:300]
                if needle and needle in text.casefold():
                    found = True
                if found and first_prompt:
                    break
            if found:
                matches.append({"id": session_id, "path": str(path.resolve()),
                                "updated_at": modified.isoformat(), "first_prompt": first_prompt})
    matches.sort(key=lambda item: item["updated_at"], reverse=True)
    print(json.dumps(matches, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
