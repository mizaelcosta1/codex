# Ratanaba Guardians v0.2 — Tripo art upgrade (preproduction; zero credits spent)

## Status
This is a production specification, not a generation receipt. Five procedural animated GLBs are already committed in assets/guardians and are **not** replaced by this document.

The user requested Tripo 3D realistic-stylized versions based on the existing character designs. Through the connected Higgsfield Tripo backend, quoted prices on 2026-11-07 were:
- tripo_3d: 7.5 provider credits per generation, 37.5 credits for five drafts.
- tripo_h3_1_image_to_3d: 12 credits per generation, 60 credits for five image-reference drafts.
- No 3D free-generation allowance appeared on this connection.
- Rigging/retargeting may incur additional charges not included here.
Do not submit paid Tripo jobs until a specific spend ceiling is agreed; prior project guidance requires a 100% free workflow.

## Production contract
Target engine: Godot 4.6.3 (GL Compatibility), Android ARM64.
Preferred pipeline: one clean individual front / side / rear reference per character -> Tripo H3.1 textured GLB -> inspect/retopologize UV/PBR -> add and verify bone rig/animations -> validate in Godot headless -> device review.
Each character is a different job. Never feed a single poster of all characters into an individual image-to-3D job.
Output names must match the existing catalog paths precisely; maintain provenance, source image license, generation job ID, model license, and hashes. Keep the old procedural model in Git history for rollback; replace only after validation.

### Characters and image-to-3D prompts

| Asset ID | Design direction | Triangle budget | Rig |
| --- | --- | ---: | --- |
| espirito_da_mata | Ancient humanoid tree protector, aged bark and root limbs, hanging moss, glowing ember fissures, branch antlers and bright green eyes, mystical rainforest guardian, anatomically coherent realistic-stylized fantasy PBR material, isolated full body in neutral A pose, no backdrop | 18000 | Humanoid |
| bruto_do_exilio | Towering broad-shouldered scarred exile ogre, leather harness, dark red cloth headwrap and loincloth, bead charms, smoke pipe held at mouth, detailed skin microtexture, realistic-stylized game creature, isolated full-body neutral A pose | 20000 | Humanoid |
| serpente_de_fogo | Massive obsidian-scaled volcanic snake, glowing molten cracks, red-orange mouth and blazing amber eyes, fierce triangular head and tapered segmented body, isolated full-body in extended S curve for rigging, realistic-stylized PBR | 16000 | Custom segmented serpent |
| ceifador | Hooded supernatural shadow reaper, ragged layered charcoal feathers/cloth, ornate dark metal accents, subtle plague-bird beak mask, long skeletal hands, spectral orange eyes, isolated full-body neutral A pose, stylized-realistic fabric PBR | 18000 | Humanoid |
| guardiao_reptil | Anthropomorphic ancient armored crocodilian guardian, sculpted scales and long tail, ceremonial gold-bronze engraved plate armor, muscular upright proportions, realistic-stylized game character, isolated full-body neutral A pose | 20000 | Humanoid with tail bones |

Suggested negative prompt (all jobs): extra heads, duplicate limbs, multiple characters, floating weapon, floor base, watermark, letters, baked studio lighting, mesh holes, multiple tails, low-detail flat toy plastic, non-manifold geometry.

## Approval gates before replacing any GLB

1. Confirm Tripo generation price and user's explicit maximum credits; never silently use paid balance.
2. Verify all resulting GLBs exist with job IDs and licensing/provenance documented.
3. Run read-only first-stage check:
   python3 tools/check_tripo_candidate.py --character espirito_da_mata --file candidate.glb
4. Add rig, skin weights, and six named animations (rigging is NOT guaranteed by Tripo geometry generation alone). Run --game-ready on each file; the serpent requires segmented motion instead of Mixamo humanoid motion.
5. Import with Godot 4.6.3 and pass guardian catalog, showcase, original 41 gameplay tests, plus visual inspection on physical Android.
6. Only then replace the five assets/guardians/*.glb and create the replacement commit.

The .github/workflows/free-asset-pipeline.yml workflow is validation-only for committed guardian GLBs and **must not regenerate or push old procedural assets over Tripo imports**. Original procedural Blender scripts remain available for manual fallback but are no longer automatic on push.
