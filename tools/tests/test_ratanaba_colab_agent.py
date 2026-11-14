import importlib.util
import json
import struct
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    "ratanaba_agent", ROOT / "tools/ratanaba_colab_agent.py")
agent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent)


class AgentSafetyTests(unittest.TestCase):
    def test_real_queue_is_valid(self):
        jobs = agent.load_queue(ROOT / "tasks/colab/queue.json")
        self.assertEqual(jobs[0]["kind"], "banido_v003")

    def test_reject_arbitrary_commands_and_traversal(self):
        with tempfile.TemporaryDirectory() as td:
            q = Path(td) / "queue.json"
            for job in (
                {"id": "../../escape", "kind": "banido_v003", "enabled": True},
                {"id": "run-shell", "kind": "shell", "enabled": True},
                {"id": "bad-command", "kind": "banido_v003",
                 "enabled": True, "command": "curl secret"},
            ):
                q.write_text(json.dumps({"version": 1, "jobs": [job]}))
                with self.assertRaises(ValueError):
                    agent.load_queue(q)

    def test_reject_duplicate_jobs(self):
        with tempfile.TemporaryDirectory() as td:
            q = Path(td) / "queue.json"
            job = {"id": "banido-v003", "kind": "banido_v003", "enabled": True}
            q.write_text(json.dumps({"version":1,"jobs":[job,job]}))
            with self.assertRaises(ValueError):
                agent.load_queue(q)

    def test_validate_glb(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "ok.glb"
            body = json.dumps({"asset":{"version":"2.0"},
                               "meshes":[{"primitives":[]}]}).encode()
            body += b" " * (-len(body) % 4)
            data = struct.pack("<4sIIII", b"glTF",2,20+len(body),
                               len(body),0x4E4F534A)+body
            p.write_bytes(data)
            self.assertEqual(agent.validate_glb(p)["meshes"], 1)
            p.write_bytes(data[:12])
            with self.assertRaises(ValueError):
                agent.validate_glb(p)


if __name__ == "__main__":
    unittest.main()
