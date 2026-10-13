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


if __name__ == "__main__":
    unittest.main()
