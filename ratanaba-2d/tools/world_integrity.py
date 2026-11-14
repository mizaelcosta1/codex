#!/usr/bin/env python3
"""Enforce world-content parity in the offline Android runtime and final APK."""
from pathlib import Path
import re
import zipfile

PREFIX = 'assets/ratanaba/'
EXPECTED_AREAS = (
    'Cripta do Nome Apagado',
    'Claustro das Águas Mortas',
    'Floresta Invertida',
    'Vale das Brasas',
)
REQUIRED_FILES = (
    'web/index.html', 'web/game.js', 'web/animations.js', 'web/rpg.js',
    'web/hud.js', 'web/menu.js', 'web/elemental.js',
    'assets/pack/environments.webp', 'assets/pack/monsters.webp',
    'assets/pack/hero.webp', 'assets/animations_v05/curupira.webp',
    'assets/hud_v04/minimap.webp', 'assets/ui_v03/throne_menu.webp',
)
REQUIRED_LOGIC = (
    'function spawnMobs()', 'function bossUpdate(dt)',
    'function boitataUpdate(dt)', 'function defeatBoss()',
    'function defeatBoitata()', 'function drawValeEnemy',
    'state.cameraY', 'boitataDead:', 'bossDead:',
    "e.type===3", "e.type===4",
    'function drawValeAtmosphere(',
)

def verify_world(read_bytes, names):
    """Raise an actionable exception if a three-area/Curupira-only build was packed."""
    missing_files = sorted(set(REQUIRED_FILES) - set(names))
    if missing_files:
        raise ValueError('APK missing runtime assets: ' + ', '.join(missing_files))
    game = read_bytes('web/game.js').decode('utf-8')
    index = read_bytes('web/index.html').decode('utf-8')
    areas_match = re.search(r'\bNAMES\s*=\s*\[([^\]]+)\]', game)
    areas = re.findall(r"'([^']+)'", areas_match.group(1)) if areas_match else []
    if areas != list(EXPECTED_AREAS):
        raise ValueError(f'Unexpected area roster {areas!r}; expected {list(EXPECTED_AREAS)!r}')
    missing_logic = [marker for marker in REQUIRED_LOGIC if marker not in game]
    if missing_logic:
        raise ValueError('Missing world / boss gameplay code: ' + ', '.join(missing_logic))
    if '4 ÁREAS · 2 GUARDIÕES' not in index:
        raise ValueError('Android menu does not advertise the current 4-area build')
    if "6800,7250,7580" not in game:
        raise ValueError('Missing Vale das Brasas enemy spawn wave')
    return {'areas': areas, 'bosses': ['Curupira', 'Boi-Tatá'],
            'required_runtime_files': len(REQUIRED_FILES),
            'enemy_slots': 11, 'world_validation': 'passed'}

def verify_staging(bundle_root):
    def reader(name):
        return (Path(bundle_root) / name).read_bytes()
    return verify_world(reader, [str(p.relative_to(bundle_root)) for p in Path(bundle_root).rglob('*') if p.is_file()])

def verify_apk(apk_path):
    with zipfile.ZipFile(apk_path) as archive:
        names = [n[len(PREFIX):] for n in archive.namelist() if n.startswith(PREFIX)]
        return verify_world(lambda name: archive.read(PREFIX + name), names)

if __name__ == '__main__':
    import argparse, json
    p = argparse.ArgumentParser()
    p.add_argument('apk', type=Path)
    args = p.parse_args()
    print(json.dumps(verify_apk(args.apk), ensure_ascii=False, indent=2))
