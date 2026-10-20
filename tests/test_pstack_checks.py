import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]


class PstackChecks(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory(prefix="pstack-checks-")
        self.addCleanup(self.scratch.cleanup)
        self.root = Path(self.scratch.name)
        for directory in ("skills/pstack", "skills/analyze-sessions", ".pi/skills/verify-pstack", "docs"):
            shutil.copytree(REPO / directory, self.root / directory)
        (self.root / "scripts").mkdir()
        shutil.copy2(REPO / "scripts/check-enabled-skills.sh", self.root / "scripts")
        shutil.copy2(REPO / "README.md", self.root)
        paths = json.loads((REPO / "settings.json").read_text())["skills"]
        (self.root / "settings.json").write_text(json.dumps({"skills": paths}))
        for path in paths:
            target = self.root / path
            target.mkdir(parents=True, exist_ok=True)
            shutil.copy2(REPO / path / "SKILL.md", target)
        self.manifest = self.root / "skills/pstack/upstream.json"

    def run_check(self):
        return subprocess.run(["bash", str(self.root / "scripts/check-enabled-skills.sh")],
                              cwd=self.root, text=True, capture_output=True)

    def test_current_snapshot_is_accepted(self):
        result = self.run_check()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_documented_skill_count_drift_fails(self):
        readme = self.root / "README.md"
        text = readme.read_text()
        count = len(list((self.root / "skills/pstack").glob("*/SKILL.md")))
        self.assertIn(f"{count} 个工程", text)
        readme.write_text(text.replace(f"{count} 个工程", "999 个工程", 1))
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("pstack skill count mismatch", result.stdout)

    def test_later_documented_count_drift_fails(self):
        feature = self.root / ".pi/skills/verify-pstack/features/resources.md"
        text = feature.read_text()
        count = len(list((self.root / "skills/pstack").glob("*/SKILL.md")))
        self.assertIn(f"parse all {count} pstack skills", text)
        feature.write_text(text.replace(f"parse all {count} pstack skills", "parse all 999 pstack skills"))
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("pstack skill count mismatch", result.stdout)

    def test_undocumented_source_entry_fails(self):
        manifest = json.loads(self.manifest.read_text())
        del manifest["skills"]["ketchup"]
        self.manifest.write_text(json.dumps(manifest))
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("pstack source inventory mismatch", result.stdout)

    def test_nonexistent_published_command_fails(self):
        readme = self.root / "skills/pstack/README.md"
        with readme.open("a") as stream:
            stream.write("\nUse `/skill:missing-pstack-command`.\n")
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("unknown published skill command", result.stdout)

    def test_invalid_source_commit_fails(self):
        manifest = json.loads(self.manifest.read_text())
        manifest["skills"]["ketchup"].update({
            "disposition": "adapt", "sourcePath": "pstack/skills/ketchup", "sourceCommit": "main",
        })
        self.manifest.write_text(json.dumps(manifest))
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("invalid pstack source record", result.stdout)


if __name__ == "__main__":
    unittest.main()
