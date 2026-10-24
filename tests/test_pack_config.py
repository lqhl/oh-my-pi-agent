import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest


class PackConfigTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        repo = Path(__file__).resolve().parents[1]
        archive = self.root / "config.tar.gz"
        subprocess.run(["python3", str(repo / "scripts/pack-config.py"), str(archive)], check=True, capture_output=True)
        self.bundle = self.root / "bundle"
        self.bundle.mkdir()
        with tarfile.open(archive) as packed:
            packed.extractall(self.bundle, filter="data")
        self.target = self.root / "company-agent"
        fakebin = self.root / "bin"
        fakebin.mkdir()
        npm = fakebin / "npm"
        npm.write_text('#!/bin/sh\nprintf "%s\\n" "$*" >> "$INSTALL_LOG"\nexit "${NPM_EXIT:-0}"\n')
        npm.chmod(0o755)
        self.log = self.root / "npm.log"
        self.env = dict(os.environ, PATH=str(fakebin) + ":" + os.environ["PATH"],
                        PI_CODING_AGENT_DIR=str(self.target), INSTALL_LOG=str(self.log))

    def install(self):
        return subprocess.run(["bash", str(self.bundle / "install.sh")], env=self.env, capture_output=True)

    def test_first_install_and_sync_preserve_company_files(self):
        self.assertEqual(self.install().returncode, 0)
        self.assertEqual((self.target / "settings.json").read_bytes(),
                         (self.bundle / "agent/settings.json").read_bytes())
        protected = {
            "settings.json": '{"defaultProvider":"corp","packages":["npm:corp-tools"]}\n',
            "keybindings.json": '{"custom":"company"}\n',
            "pi-vcc-config.json": '{"custom":"company"}\n',
            "APPEND_SYSTEM.md": "Company instructions\n",
            "models.json": '{"providers":{"corp":{}}}\n',
            "auth.json": '{"corp":"private"}\n',
            "extensions/corp-tools.ts": "company extension\n",
            "skills/corp-workflow/SKILL.md": "company skill\n",
        }
        for name, content in protected.items():
            path = self.target / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        extension = "extensions/todo.ts"
        (self.target / extension).write_text("old extension\n")
        result = self.install()
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        for name, content in protected.items():
            self.assertEqual((self.target / name).read_text(), content, name)
        self.assertEqual((self.target / extension).read_bytes(),
                         (self.bundle / "agent" / extension).read_bytes())
        calls = self.log.read_text().splitlines()
        packages = json.loads((self.bundle / "npm-packages.json").read_text())
        specs = [entry[4:] if isinstance(entry, str) else entry["source"][4:] for entry in packages]
        expected = "install --prefix " + str(self.target / "npm") + " --legacy-peer-deps " + " ".join(specs)
        self.assertEqual(calls, ["install -g @earendil-works/pi-coding-agent", expected] * 2)

    def test_failed_npm_install_preserves_company_settings(self):
        self.target.mkdir()
        settings = b'{"defaultProvider":"corp","packages":[]}\n'
        (self.target / "settings.json").write_bytes(settings)
        self.env["NPM_EXIT"] = "42"
        self.assertEqual(self.install().returncode, 42)
        self.assertEqual((self.target / "settings.json").read_bytes(), settings)

    def test_upgrade_migrates_legacy_skill_paths_and_loads_upstream(self):
        repo = Path(__file__).resolve().parents[1]
        old = json.loads((repo / "tests/fixtures/pstack-legacy-settings.json").read_text())
        old["defaultProvider"] = "corp"
        old["defaultModel"] = "company-model"
        old["subagents"] = {"agentOverrides": {"reviewer": {"model": "corp/reviewer", "thinking": "high"}}}
        old["skills"].extend(["./skills/pstack", "./skills/corp-workflow", "-./skills/corp-disabled/SKILL.md"])
        self.target.mkdir()
        settings_path = self.target / "settings.json"
        settings_path.write_text(json.dumps(old))
        custom = self.target / "skills/corp-workflow/SKILL.md"
        custom.parent.mkdir(parents=True)
        custom.write_text("---\nname: corp-workflow\ndescription: Company workflow\n---\nCompany instructions\n")
        legacy = "skills/pstack/how/SKILL.md"
        path = self.target / legacy
        path.parent.mkdir(parents=True)
        path.write_bytes((repo / "tests/fixtures/pstack-legacy-how.md").read_bytes())
        for _ in range(2):
            result = self.install()
            self.assertEqual(result.returncode, 0, result.stderr.decode())
            actual = json.loads(settings_path.read_text())
            self.assertEqual({k: v for k, v in actual.items() if k != "skills"},
                             {k: v for k, v in old.items() if k != "skills"})
            self.assertFalse(any("vendor/bro" in p or "skills/pstack" in p for p in actual["skills"]))
            self.assertEqual(actual["skills"].count("./vendor/pstack/skills"), 1)
            self.assertIn("./skills/corp-workflow", actual["skills"])
            self.assertIn("-./skills/corp-disabled/SKILL.md", actual["skills"])
            loaded = subprocess.run(["node", str(repo / "scripts/check-skill-loading.mjs"), str(self.target)],
                                    text=True, capture_output=True)
            self.assertEqual(loaded.returncode, 0, loaded.stdout + loaded.stderr)
            resources = json.loads(loaded.stdout)
            self.assertEqual(resources["diagnostics"], [])
            names = {Path(p).parent.name for p in resources["files"]}
            self.assertTrue({"how", "bro", "poteto-mode", "corp-workflow"}.issubset(names))
            policy = json.loads((self.target / "adapters/pstack/policy.json").read_text())
            self.assertFalse(set(policy["disabledSkills"]) & names)
        self.assertFalse((self.target / "skills/pstack").exists())

    def test_upgrade_migrates_auto_discovered_skills_without_explicit_paths(self):
        repo = Path(__file__).resolve().parents[1]
        path = self.target / "skills/pstack/how/SKILL.md"
        path.parent.mkdir(parents=True)
        path.write_bytes((repo / "tests/fixtures/pstack-legacy-how.md").read_bytes())
        settings_path = self.target / "settings.json"
        settings_path.write_text('{"defaultModel":"corp/model","packages":["npm:corp-tools"]}\n')
        result = self.install()
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        actual = json.loads(settings_path.read_text())
        self.assertEqual(actual["defaultModel"], "corp/model")
        self.assertEqual(actual["packages"], ["npm:corp-tools"])
        self.assertIn("./vendor/pstack/skills", actual["skills"])
        policy = json.loads((self.target / "adapters/pstack/policy.json").read_text())
        for name in policy["disabledSkills"]:
            self.assertIn(f"-./vendor/pstack/skills/{name}/SKILL.md", actual["skills"])
        before = settings_path.read_bytes()
        self.assertEqual(self.install().returncode, 0)
        self.assertEqual(settings_path.read_bytes(), before)

    def test_upgrade_removes_pristine_legacy_files_and_refuses_local_edits(self):
        bundle_manifest = json.loads((self.bundle / "agent/adapters/pstack/legacy-files.json").read_text())
        legacy = "skills/pstack/how/SKILL.md"
        self.assertIn(legacy, bundle_manifest["files"])
        content = (Path(__file__).resolve().parent / "fixtures/pstack-legacy-how.md").read_bytes()
        target = self.target / legacy
        target.parent.mkdir(parents=True)
        target.write_bytes(content)
        result = self.install()
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        self.assertFalse(target.exists())
        self.assertFalse((self.target / target.parent.relative_to(self.target)).exists())

        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("company edit\n")
        result = self.install()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("locally changed managed files", result.stderr.decode())
        self.assertEqual(target.read_text(), "company edit\n")


if __name__ == "__main__":
    unittest.main()
