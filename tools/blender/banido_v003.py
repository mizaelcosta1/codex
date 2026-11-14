"""O Banido v003: procedural cinematic blockout, no paid generation.

Outputs an editable .blend, character-only glTF 2.0 GLB, and a render PNG.
This is a sculptural prototype, not a photorealistic production mesh or rig.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument("--output-dir", required=True)
opts = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
out = Path(opts.output_dir)
out.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 28
scene.render.resolution_x = 720
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(out / "preview.png")
scene.render.film_transparent = False
scene.view_settings.view_transform = "AgX"

# Prefer OptiX/CUDA only if supported by the Blender build and runtime.
device_name = "CPU"
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for backend in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = backend
            prefs.get_devices()
            active = 0
            for device in prefs.devices:
                device.use = device.type == backend
                active += int(device.use)
            if active:
                scene.cycles.device = "GPU"
                device_name = backend
                break
        except Exception:
            continue
except Exception:
    pass
print("RATANABA_RENDER_DEVICE:", device_name, flush=True)


def material(name, color, rough=.65, metal=0, emission=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = 4.0
    return m


skin = material("01_Skin_weathered_bronze", (.26, .145, .085), .7)
scar = material("02_Scars_luminous_cyan", (.03, .55, .65), .25,
                emission=(.01, .75, .92))
hair = material("03_Dreadlocks_charcoal", (.025, .018, .016), .89)
cloth = material("04_Woven_blackened_fabric", (.075, .045, .037), .92)
leather = material("05_Aged_leather", (.135, .07, .035), .85)
bone = material("06_Ritual_bone", (.78, .7, .5), .6)
wood = material("07_Carved_wood", (.25, .105, .044), .76)
brass = material("08_Worn_brass", (.43, .27, .07), .4, .75)
stone = material("09_Stone_background", (.036, .046, .05), .93)

bpy.ops.object.empty_add(type="PLAIN_AXES")
root = bpy.context.object
root.name = "O_Banido_v003"
character_objects = []


def register(obj, mat, character=True):
    obj.data.materials.append(mat)
    if character:
        obj.parent = root
        character_objects.append(obj)
    if obj.type == "MESH":
        for p in obj.data.polygons:
            p.use_smooth = True
    return obj


def ellipsoid(name, at, dimensions, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=at)
    obj = bpy.context.object
    obj.name = name
    obj.scale = dimensions
    return register(obj, mat)


def segment(name, a, b, radius, mat, vertices=20):
    a, b = Vector(a), Vector(b)
    direction = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,
                                        radius=radius, depth=direction.length,
                                        location=(a + b) / 2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return register(obj, mat)


def plate(name, pos, scale, mat, bevel=.03):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new("Soft forged edge", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return register(obj, mat)


def chain(name, pts, radius, mat):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 12
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    path = curve.splines.new("BEZIER")
    path.bezier_points.add(len(pts) - 1)
    for p, co in zip(path.bezier_points, pts):
        p.co = co
        p.handle_left_type = "AUTO"
        p.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    return register(bpy.context.object, mat)


# Proportions: 2.75 m stylized heroic scale. Front faces -Y.
ellipsoid("Muscular_chest", (0, 0, 1.76), (.41, .245, .48), skin)
ellipsoid("Ribcage", (0, 0, 1.47), (.33, .215, .30), skin)
ellipsoid("Waist", (0, 0, 1.18), (.265, .18, .19), cloth)
ellipsoid("Trapezius", (0, .04, 2.04), (.43, .23, .14), skin)
segment("Neck", (0, 0, 2.02), (0, 0, 2.25), .115, skin)
ellipsoid("Skull", (0, -.01, 2.43), (.20, .165, .245), skin)
ellipsoid("Jaw", (0, -.083, 2.32), (.17, .125, .11), skin)
ellipsoid("Nose", (0, -.19, 2.405), (.047, .076, .072), skin)
for side in (-1, 1):
    side_name = "L" if side < 0 else "R"
    ellipsoid("Ear_"+side_name, (side*.205, -.008, 2.422), (.038, .05, .075), skin)
    ellipsoid("Dark_eye_"+side_name, (side*.092, -.160, 2.448),
              (.046, .019, .023), hair)
    chain("Brow_"+side_name, [(side*.045,-.170,2.485),
          (side*.105,-.176,2.482),(side*.151,-.147,2.475)], .014, hair)
    ellipsoid("Shoulder_"+side_name, (side*.44, 0, 1.97), (.20,.21,.23), skin)
    segment("Upper_arm_"+side_name, (side*.46,0,1.91),
            (side*.70,-.02,1.48), .143, skin)
    ellipsoid("Elbow_"+side_name, (side*.70,-.02,1.48), (.125,.12,.13), skin)
    segment("Forearm_"+side_name, (side*.70,-.02,1.48),
            (side*.85,-.13,1.11), .114, skin)
    ellipsoid("Hand_"+side_name, (side*.85,-.13,1.08), (.105,.09,.145), skin)
    ellipsoid("Thigh_"+side_name, (side*.20,.00,.86), (.18,.18,.41), cloth)
    segment("Shin_"+side_name,(side*.20,0,.59),(side*.21,-.02,.18),.128,skin)
    ellipsoid("Boot_"+side_name,(side*.21,-.105,.14),(.145,.25,.15),leather)
    plate("Knee_armor_"+side_name,(side*.21,-.155,.62),(.23,.08,.22),brass)
    segment("Wrist_wrap_"+side_name,(side*.83,-.12,1.16),
            (side*.88,-.14,1.28), .124, leather)
    segment("Ankle_wrap_"+side_name,(side*.21,-.02,.23),
            (side*.21,-.02,.36), .145, leather)

# Tribal garments, straps, beads and incised luminous runes.
plate("Ritual_waist_cloth",(0,-.19,.96),(.33,.065,.52),cloth)
plate("Asymmetric_shoulder_hide",(-.30,-.17,1.94),(.33,.10,.26),leather)
chain("Diagonal_chest_strap",[(-.35,-.21,2.00),(-.17,-.272,1.72),
      (.05,-.26,1.49),(.24,-.19,1.24)],.038,leather)
segment("Belt",(0,-.16,1.20),(0,-.16,1.26),.27,leather)
plate("Belt_buckle",(0,-.244,1.23),(.17,.047,.115),brass)
for i,x in enumerate((-.20,-.11,-.03,.05,.13,.21)):
    segment("Necklace_bone_%02d"%i,(x,-.20,2.065),
            (x*.9,-.234,1.97),.017,bone,10)
for i,(x,z) in enumerate(((-.19,1.85),(-.09,1.70),(.07,1.62),
                         (.20,1.77),(.28,1.90))):
    chain("Cyan_chest_scar_%02d"%i,[(x,-.252,z+.10),
          (x+.018,-.274,z),(x-.014,-.254,z-.07)],.012,scar)
for side in (-1,1):
    for i in range(3):
        x=side*(.64+.060*i)
        chain("Arm_rune_%d_%d"%(side,i),[(x,-.145,1.81-i*.11),
              (x+side*.045,-.156,1.74-i*.11)], .013,scar)

# Hand-laid dreadlocks: converted from curves into exportable polygonal tubes.
for i in range(22):
    t=2*math.pi*i/22
    x=.158*math.cos(t)
    y=.13*math.sin(t)
    z=2.58 + .045*math.cos(t*2)
    length=.34+.28*(.5+.5*math.sin(i*2.17))
    chain("Dread_%02d"%i,[(x,y,z),
          (x*1.2,y+.015,z-.15),
          (x*1.5,y+.025,z-length*.65),
          (x*1.6,y+.05,z-length)],.017+(i%3)*.003,hair)
    if i%4==0:
        ellipsoid("Dread_bead_%02d"%i,(x*1.5,y+.05,z-length*.65),
                  (.027,.027,.031),brass)

# Carved war-club in left hand, with obsidian studs and emissive inlays.
shaft_top=(-1.26,-.13,2.52)
shaft_low=(-.76,-.12,.27)
segment("Club_carved_handle",shaft_low,shaft_top,.063,wood,24)
ellipsoid("Club_weighted_head",(-1.23,-.13,2.27),(.20,.17,.35),wood)
for i in range(8):
    angle=2*math.pi*i/8
    x=-1.23+.19*math.cos(angle)
    y=-.13+.17*math.sin(angle)
    z=2.28+.09*math.sin(angle*3)
    segment("Club_bone_spike_%d"%i,(x,y,z),
            (x+.11*math.cos(angle),y+.11*math.sin(angle),z+.05),
            .032,bone,10)
for i in range(5):
    a=2*math.pi*i/5
    chain("Club_cyan_glyph_%d"%i,[(-1.23+.185*math.cos(a),
          -.13+.162*math.sin(a),2.37),(-1.23+.185*math.cos(a+.2),
          -.13+.162*math.sin(a+.2),2.25)],.013,scar)

# Set stage separately so only the character is exported to GLB.
bpy.ops.mesh.primitive_plane_add(size=100, location=(0,0,-.015))
floor = bpy.context.object
floor.name = "Stage_NotExported"
floor.data.materials.append(stone)
for poly in floor.data.polygons:
    poly.use_smooth = True

world = bpy.data.worlds.new("Ratanaba_Night") if not bpy.data.worlds else bpy.data.worlds[0]
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value=(.025,.037,.052,1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value=.5

def aim(obj, target):
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()

bpy.ops.object.camera_add(location=(4.0,-6.6,3.25))
camera=bpy.context.object
camera.name="Cinematic_3quarter"
aim(camera,(0,0,1.45))
scene.camera=camera
camera.data.type="ORTHO"
camera.data.ortho_scale=3.55

def area(name,pos,power,color,size,target):
    bpy.ops.object.light_add(type="AREA",location=pos)
    o=bpy.context.object
    o.name=name
    o.data.energy=power
    o.data.color=color
    o.data.shape="DISK"
    o.data.size=size
    aim(o,target)

area("Warm_key",(2.3,-4,5),800,(1,.77,.52),4,(0,0,1.5))
area("Cyan_rim",(-3,1,4),1200,(.12,.77,1),3,(0,0,1.5))
area("Soft_fill",(0,-4,2),350,(.8,.9,1),5,(0,0,1.7))

# Never export the floor, camera or lights in the game asset.
bpy.ops.object.select_all(action="DESELECT")
root.select_set(True)
for obj in character_objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=str(out/"banido_v003.glb"),
        export_format="GLB", use_selection=True,
        export_apply=True, export_animations=False)
bpy.ops.wm.save_as_mainfile(filepath=str(out/"banido_v003.blend"))
bpy.ops.render.render(write_still=True)
print("BANIDO_V003_OK", len(character_objects), "meshes", flush=True)
