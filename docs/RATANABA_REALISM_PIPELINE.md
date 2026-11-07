# Ratanaba Guardians - Free Blender and Godot cast pipeline

## What this production milestone actually delivers

Six original 3D character **prototypes** based on the supplied art direction:
O Banido (hero), Curupira, Boto, Matinta Pereira, Mula sem Cabeça, and Boitatá.
Generated with open Blender Python; PBR base color textures are embedded in glTF;
a skeleton, skinned geometry and six NLA clips are exported in each GLB.

This is more anatomically structured than sphere blockouts (continuous limb tubes,
faces, garment layers, scaled serpentine and equine bodies), but is **not a verified
photorealistic sculpt, muscle simulation, or finished AAA topology**. Textures are
deterministic procedural 256 px previews, not 2K photographic baked maps.
All character designs/images in chat remain reference materials; no protected
third-party scan, Tripo job or paid rigging is used.

## Blender

Run from repository root:
    blender -b --factory-startup --python tools/build_ratanaba_cast.py
    python3 tools/validate_ratanaba_cast.py

Outputs:
- assets/ratanaba/{o_banido,curupira,boto,matinta_pereira,mula_sem_cabeca,boitata}.glb
- build/ratanaba_cast_report.json
- build/ratanaba_cast_validation.json

New GLBs are generated in GitHub Actions before Godot import and Android export.
The build exports those generated outputs into the APK; it does not replace the
older assets/models and assets/guardians GLBs. The generated GLBs remain build
artifacts until verified/published.

## Godot

- scripts/ratanaba_cast_catalog.gd: resource paths and clip expectations
- scripts/ratanaba_cast_showcase.gd: instances the optional cast
- tests/test_ratanaba_cast.gd: independently checks six imports, rigs and clips
- Existing play loop and saved user settings remain unchanged.
- Mobile performance, visual quality and device installation require independent checks.

## Next production gates

1. Review actual Blender rendered front/side/back views, correct proportions and clothing.
2. Paint source-aware PBR 1K/2K normal, roughness, ORM and emissive maps.
3. Skin smooth weights, remove clipping, retopologize and produce genuine LOD1/LOD2.
4. Test animation motion and frame time on actual Android phone.
5. Only then promote model revisions into the main game character roles.
