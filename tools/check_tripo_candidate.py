#!/usr/bin/env python3
"""Read-only Tripo GLB admission preflight for Godot; never overwrites an asset.
Examples:
  python3 tools/check_tripo_candidate.py --character espirito_da_mata --file incoming.glb
  python3 tools/check_tripo_candidate.py --character espirito_da_mata --file rigged.glb --game-ready
No license or engine-performance approval is implied by a passing structural check.
"""
import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path

SPECS = {
    "espirito_da_mata": (18000, {"Idle", "Walk", "Run", "Attack", "Hurt", "Death"}),
    "bruto_do_exilio": (20000, {"Idle", "Walk", "Run", "Attack", "Hurt", "Death"}),
    "serpente_de_fogo": (16000, {"Idle", "Move", "Bite", "Fire", "Hurt", "Death"}),
    "ceifador": (18000, {"Idle", "Walk", "Attack", "Cast", "Hurt", "Death"}),
    "guardiao_reptil": (20000, {"Idle", "Walk", "Run", "Attack", "Hurt", "Death"}),
}


def check(path: Path, char_id: str, game_ready: bool) -> dict:
    budget, clips = SPECS[char_id]
    if not path.is_file() or path.stat().st_size > 100_000_000:
        raise ValueError("Missing file or exceeds 100 MB input safety limit")
    raw = path.read_bytes()
    if len(raw) < 28:
        raise ValueError("GLB file is too short")
    magic, version, total = struct.unpack_from("<4sII", raw, 0)
    if magic != b"glTF" or version != 2 or total != len(raw):
        raise ValueError("Invalid GLB 2.0 header or byte count")
    position = 12
    chunks = []
    while position < total:
        if position + 8 > total:
            raise ValueError("Incomplete GLB chunk header")
        length, kind = struct.unpack_from("<I4s", raw, position)
        position += 8
        if length % 4 or position + length > total:
            raise ValueError("Incorrect GLB chunk alignment or bounds")
        chunks.append((kind, raw[position:position + length]))
        position += length
    if position != total or not chunks or chunks[0][0] != b"JSON":
        raise ValueError("GLB JSON chunk is missing")
    data = json.loads(chunks[0][1].decode("utf-8"))
    if not data.get("meshes") or not data.get("materials"):
        raise ValueError("GLB has no geometry or materials")
    if not data.get("images") or not data.get("textures"):
        raise ValueError("GLB needs real image textures (PBR stage)")
    if not any("pbrMetallicRoughness" in material for material in data["materials"]):
        raise ValueError("No PBR-compatible material")
    total_triangles = 0
    rigged_primitives = 0
    primitives = 0
    for mesh in data["meshes"]:
        for primitive in mesh["primitives"]:
            primitives += 1
            attributes = primitive["attributes"]
            if "POSITION" not in attributes or "NORMAL" not in attributes:
                raise ValueError("Mesh primitive lacks position/normal")
            if "TEXCOORD_0" not in attributes:
                raise ValueError("Mesh primitive lacks UV0")
            if primitive.get("mode", 4) != 4:
                raise ValueError("Only triangle primitives are accepted")
            accessor = primitive.get("indices", attributes["POSITION"])
            count = data["accessors"][accessor]["count"]
            total_triangles += count // 3
            if {"JOINTS_0", "WEIGHTS_0"}.issubset(attributes):
                rigged_primitives += 1
    if total_triangles < 1 or total_triangles > budget:
        raise ValueError(f"Triangle count {total_triangles} exceeds budget {budget}")
    animation_names = [str(x.get("name", "")) for x in data.get("animations", [])]
    bones = sum(len(s.get("joints", [])) for s in data.get("skins", []))
    if game_ready:
        if not data.get("skins") or rigged_primitives != primitives or bones < 9:
            raise ValueError("Model must be fully skinned with a valid skeleton")
        for clip in clips:
            if not any(name.lower().endswith(clip.lower()) for name in animation_names):
                raise ValueError(f"Missing expected animation clip: {clip}")
    return {
        "status": "structural_pass_game_ready" if game_ready else "structural_pass_geometry_only",
        "character": char_id,
        "file": str(path),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "bytes": len(raw),
        "triangles": total_triangles,
        "budget": budget,
        "materials": len(data["materials"]),
        "image_textures": len(data["images"]),
        "skin_joint_count": bones,
        "animation_names": animation_names,
        "license_review": "required",
        "godot_import": "not_tested",
        "visual_review": "not_tested",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--character", required=True, choices=sorted(SPECS))
    parser.add_argument("--file", required=True, type=Path)
    parser.add_argument("--game-ready", action="store_true")
    args = parser.parse_args()
    try:
        result = check(args.file, args.character, args.game_ready)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (ValueError, KeyError, IndexError, OSError, struct.error, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "failed", "character": args.character, "reason": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
