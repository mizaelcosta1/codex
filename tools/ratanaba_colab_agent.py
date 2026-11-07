#!/usr/bin/env python3
"""Approved Blender jobs on an EXISTING Colab runtime; no GPU provisioning.

Only known job kinds and bundled scripts can execute. No shells, OAuth secrets,
public callback endpoints, or automatic GitHub writes are involved.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ALLOWED = {"banido_v003": "tools/blender/banido_v003.py"}
JOB_ID = re.compile(r"^[a-z][a-z0-9_-]{2,63}$")
OUTPUTS = ("banido_v003.glb", "preview.png", "banido_v003.blend")
BRANCH = "feature/ratanaba-colab-agent"
QUEUE = Path("tasks/colab/queue.json")
DEFAULT_BLENDER = Path("/content/ratanaba_blender/blender-4.5.15-linux-x64/blender")
DEFAULT_OUTPUT = Path("/content/ratanaba_testes")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def atomic_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".tmp")
    temp.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    os.replace(temp, path)


def load_queue(path: Path) -> list[dict]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or payload.get("version") != 1:
        raise ValueError("Queue must declare version=1")
    jobs = payload.get("jobs")
    if not isinstance(jobs, list) or len(jobs) > 12:
        raise ValueError("Queue must have a list of at most 12 jobs")
    seen = set()
    for job in jobs:
        if not isinstance(job, dict) or set(job) != {"id", "kind", "enabled"}:
            raise ValueError("Only id, kind and enabled are allowed in each job")
        if not isinstance(job["id"], str) or not JOB_ID.fullmatch(job["id"]):
            raise ValueError("Unsafe job ID")
        if job["id"] in seen:
            raise ValueError("Duplicate job ID")
        if job["kind"] not in ALLOWED:
            raise ValueError("Unsupported job kind: " + str(job["kind"]))
        if type(job["enabled"]) is not bool:
            raise ValueError("enabled must be boolean")
        seen.add(job["id"])
    return jobs


def validate_glb(path: Path) -> dict:
    """Inspect a GLB 2.0 container and nonempty mesh list; not a Godot import test."""
    with path.open("rb") as f:
        header = f.read(20)
        if len(header) != 20:
            raise ValueError("Truncated GLB header")
        magic, version, size, json_size, json_type = struct.unpack("<4sIIII", header)
        if magic != b"glTF" or version != 2 or size != path.stat().st_size:
            raise ValueError("Invalid GLB header")
        if json_type != 0x4E4F534A or json_size < 2 or json_size > size - 20:
            raise ValueError("Invalid GLB JSON chunk")
        data = json.loads(f.read(json_size).rstrip(b" \0"))
    if data.get("asset", {}).get("version") != "2.0" or not data.get("meshes"):
        raise ValueError("GLB has no glTF 2.0 mesh")
    return {"bytes": size, "meshes": len(data["meshes"])}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def validate_outputs(directory: Path) -> dict:
    glb = directory / OUTPUTS[0]
    png = directory / OUTPUTS[1]
    blend = directory / OUTPUTS[2]
    details = validate_glb(glb)
    with png.open("rb") as f:
        if f.read(8) != b"\x89PNG\r\n\x1a\n":
            raise ValueError("Render PNG missing or invalid")
    if blend.stat().st_size < 100:
        raise ValueError("Editable BLEND file missing or empty")
    return {"glb": details, "sha256": {name: sha256(directory / name) for name in OUTPUTS}}


def publish_to_gradio(job_dir: Path, output_root: Path) -> None:
    """Replace only the two documented Gradio preview paths, preserving jobs."""
    for name, dest_name in (("banido_v003.glb", "ratanaba_teste.glb"),
                             ("preview.png", "preview.png")):
        src = job_dir / name
        dest = output_root / dest_name
        temp = output_root / ("." + dest_name + ".tmp")
        shutil.copyfile(src, temp)
        os.replace(temp, dest)


def git_pull(repo: Path) -> None:
    subprocess.run(
        ["git", "-C", str(repo), "pull", "--ff-only", "origin", BRANCH],
        check=True, timeout=90, capture_output=True, text=True
    )


def process(repo: Path, blender: Path, output_root: Path, pull: bool = False) -> dict:
    if pull:
        git_pull(repo)
    if not blender.is_file():
        raise FileNotFoundError("Blender not installed at " + str(blender))
    jobs = load_queue(repo / QUEUE)
    output_root.mkdir(parents=True, exist_ok=True)
    status_path = output_root / "ratanaba_agent_status.json"
    state = json.loads(status_path.read_text(encoding="utf-8")) if status_path.exists() else {}
    state.setdefault("jobs", {})
    state["last_checked_at"] = utc_now()
    state["runtime"] = "existing_colab_only"
    for job in jobs:
        if not job["enabled"]:
            continue
        script = repo / ALLOWED[job["kind"]]
        if not script.is_file():
            raise FileNotFoundError(str(script))
        job_dir = output_root / "jobs" / job["id"]
        fingerprint = hashlib.sha256(
            (job["id"] + "\n" + job["kind"] + "\n" + sha256(script)).encode()
        ).hexdigest()
        old = state["jobs"].get(job["id"], {})
        if old.get("status") == "succeeded" and old.get("fingerprint") == fingerprint:
            print("[agent] Skipping completed job:", job["id"], flush=True)
            continue
        job_dir.mkdir(parents=True, exist_ok=True)
        state["jobs"][job["id"]] = {
            "status": "running", "fingerprint": fingerprint, "started_at": utc_now()
        }
        atomic_json(status_path, state)
        cmd = [str(blender), "-b", "--factory-startup", "--python", str(script),
               "--", "--output-dir", str(job_dir)]
        print("[agent] Executing approved job:", job["id"], flush=True)
        try:
            result = subprocess.run(cmd, capture_output=True, text=True,
                                    timeout=1800, check=False)
            (job_dir / "blender.log").write_text(
                result.stdout[-12000:] + "\n" + result.stderr[-12000:],
                encoding="utf-8"
            )
            if result.returncode:
                raise RuntimeError("Blender exit code " + str(result.returncode))
            report = validate_outputs(job_dir)
            publish_to_gradio(job_dir, output_root)
            state["jobs"][job["id"]].update(
                status="succeeded", finished_at=utc_now(), outputs=report
            )
            print("[agent] SUCCESS:", job["id"], flush=True)
        except Exception as exc:
            state["jobs"][job["id"]].update(
                status="failed", finished_at=utc_now(), error=str(exc)[:500]
            )
            atomic_json(status_path, state)
            raise
        atomic_json(status_path, state)
    atomic_json(status_path, state)
    return state


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--blender", type=Path, default=DEFAULT_BLENDER)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--watch", action="store_true",
                        help="Poll every 120 seconds while this Colab cell stays alive")
    parser.add_argument("--pull", action="store_true",
                        help="Fast-forward only this dedicated Git checkout")
    args = parser.parse_args()
    if args.watch and not args.pull:
        parser.error("--watch requires --pull to receive new tasks")
    print("[agent] Existing Colab runtime only; no GPU or paid provider will be created.",
          flush=True)
    while True:
        try:
            state = process(args.repo.resolve(), args.blender,
                            args.output_dir.resolve(), args.pull)
            print("[agent] Status:", args.output_dir / "ratanaba_agent_status.json",
                  "| jobs:", {k: v["status"] for k, v in state["jobs"].items()},
                  flush=True)
        except Exception as exc:
            print("[agent] ERROR:", type(exc).__name__, str(exc), file=sys.stderr,
                  flush=True)
            if not args.watch:
                raise SystemExit(1)
        if not args.watch:
            break
        time.sleep(120)


if __name__ == "__main__":
    main()
