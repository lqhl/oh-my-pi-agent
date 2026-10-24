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
        for name in ("adapters", "vendor/pstack", "vendor/baoyu-skills", "scripts", "prompts", "skills", ".pi/skills", "docs"):
            shutil.copytree(REPO / name, self.root / name)
        (self.root / "settings.json").write_text((REPO / "settings.json").read_text())

    def run_check(self):
        return subprocess.run(["bash", str(self.root / "scripts/check-enabled-skills.sh")],
                              cwd=self.root, text=True, capture_output=True, timeout=60)

    def test_current_configuration_is_accepted(self):
        result = self.run_check()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Pi adapter, pristine upstream", result.stdout)

    def test_edited_upstream_file_fails(self):
        path = self.root / "vendor/pstack/skills/sharpen/SKILL.md"
        path.write_text(path.read_text() + "\nlocal edit\n")
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("upstream file changed", result.stdout + result.stderr)

    def test_legacy_rewrite_directory_fails(self):
        (self.root / "skills/pstack").mkdir(parents=True)
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue("legacy path still present" in result.stdout + result.stderr or "legacy skills/pstack" in result.stdout + result.stderr)

    def test_removed_bro_path_cannot_return(self):
        settings = json.loads((self.root / "settings.json").read_text())
        settings["skills"].append("./vendor/bro/skills/bro")
        (self.root / "settings.json").write_text(json.dumps(settings))
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue("missing enabled skills" in result.stdout + result.stderr or "removed bro skill path" in result.stdout + result.stderr)

    def test_missing_disabled_skill_exclusions_fail(self):
        path = self.root / "settings.json"
        settings = json.loads(path.read_text())
        settings["skills"] = [p for p in settings["skills"] if not p.startswith("-")]
        path.write_text(json.dumps(settings))
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("disabled upstream skill is still loaded", result.stdout + result.stderr)

    def test_misspelled_exclusion_fails(self):
        path = self.root / "settings.json"
        settings = json.loads(path.read_text())
        settings["skills"] = [p.replace("/reflect/SKILL.md", "/reflect/WRONG.md") for p in settings["skills"]]
        path.write_text(json.dumps(settings))
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("disabled upstream skill is still loaded: reflect", result.stdout + result.stderr)

    def test_required_skill_excluded_by_settings_fails(self):
        path = self.root / "settings.json"
        settings = json.loads(path.read_text())
        settings["skills"].append("-./vendor/pstack/skills/how/SKILL.md")
        path.write_text(json.dumps(settings))
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("required skill is not loaded: how", result.stdout + result.stderr)

    def test_legacy_prompt_fails(self):
        (self.root / "prompts/implement.md").write_text("Use the chain parameter and {previous}.\n")
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("legacy workflow", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
