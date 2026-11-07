"""Free Blender 4.3+ Ratanaba cast: 6 original PBR rigged game prototypes.

No Tripo, commercial models, credentials, external textures, or generation API.
The references are art direction; these parametric sculpts are not scans/high-poly AAA.
"""
import bpy
import json
import math
import random
import struct
import zlib
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets" / "ratanaba"
BUILD = ROOT / "build"
TEX = BUILD / "ratanaba_texture_cache"
for p in (DEST, BUILD, TEX):
    p.mkdir(parents=True, exist_ok=True)
random.seed(7442)
REPORT = []
CAST = {
    "o_banido": {"height": 1.88, "kind": "warrior", "skin": (.34,.16,.085)},
    "curupira": {"height": 1.76, "kind": "forest", "skin": (.42,.20,.12)},
    "boto": {"height": 1.82, "kind": "river", "skin": (.36,.22,.14)},
    "matinta_pereira": {"height": 1.74, "kind": "shaman", "skin": (.29,.17,.12)},
    "mula_sem_cabeca": {"height": 2.30, "kind": "horse", "skin": (.09,.095,.105)},
    "boitata": {"height": 3.65, "kind": "serpent", "skin": (.045,.06,.08)},
}

def png(path, rgba_rows, w, h):
    payload = b"".join(b"\x00"+rgba_rows[i*w*4:(i+1)*w*4] for i in range(h))
    def chunk(tag, data):
        return struct.pack(">I",len(data))+tag+data+struct.pack(">I",zlib.crc32(tag+data)&0xffffffff)
    path.write_bytes(b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",
        struct.pack(">IIBBBBB",w,h,8,6,0,0,0))+chunk(b"IDAT",zlib.compress(payload,6))+chunk(b"IEND",b""))

texture_cache = {}
def material(name, rgb, rough=.7, metal=0, glow=0, fiber=0):
    cache_key=(name,tuple(rgb),rough,metal,glow,fiber)
    if cache_key in texture_cache:
        return texture_cache[cache_key]
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    p=m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value=(*rgb,1)
    p.inputs["Roughness"].default_value=rough
    p.inputs["Metallic"].default_value=metal
    if glow:
        p.inputs["Emission Color"].default_value=(*rgb,1)
        p.inputs["Emission Strength"].default_value=glow
    # Baked, reproducible base-color PBR microvariation; fully embedded in GLB.
    w=h=256
    pixels=bytearray()
    seed=sum(ord(c) for c in name)
    for y in range(h):
        for x in range(w):
            coarse=math.sin(x*.095+seed)*math.cos(y*.08+seed*.12)
            detail=math.sin(x*.75+y*.42+seed)*math.cos(y*.84-x*.16)
            threads=math.sin(x*.93)*math.cos(y*.41) if fiber else 0
            v=max(.65,min(1.28,1+.12*coarse+.055*detail+fiber*.11*threads))
            pixels.extend([min(255,int(255*c*v)) for c in rgb]+[255])
    path=TEX/(name+".png")
    png(path,bytes(pixels),w,h)
    img=bpy.data.images.load(str(path),check_existing=False)
    img.pack()
    node=m.node_tree.nodes.new("ShaderNodeTexImage")
    node.image=img
    m.node_tree.links.new(node.outputs["Color"],p.inputs["Base Color"])
    texture_cache[cache_key]=m
    return m

def reset(name):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    sc=bpy.context.scene
    sc.name="CAST_"+name
    sc.unit_settings.system="METRIC"
    sc.render.fps=30
    sc.frame_end=33
    return []

def attach(ob, mat, bones, assigned, weights=None):
    ob.data.materials.append(mat)
    for poly in ob.data.polygons:
        poly.use_smooth=True
    assigned.append((ob,bones,weights))
    return ob

def oval(assigned,name,point,size,mat,bone,detail=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=detail,ring_count=max(12,detail//2),
                                         location=point)
    ob=bpy.context.object
    ob.name="GEO_"+name
    ob.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return attach(ob,mat,[bone],assigned)

def rod(assigned,name,a,b,r1,r2,mat,bone,sides=20):
    a,b=Vector(a),Vector(b)
    v=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=sides,
        radius1=r1,radius2=r2,depth=v.length,location=(a+b)*.5)
    ob=bpy.context.object
    ob.name="GEO_"+name
    ob.rotation_euler=v.to_track_quat("Z","Y").to_euler()
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    return attach(ob,mat,[bone],assigned)

def organic_tube(assigned,name,coords,radii,mat,first_bone,last_bone=None,
                 sides=28):
    # Smooth continuous anatomical muscle envelope, unlike stacked cylinders.
    pts=[Vector(p) for p in coords]
    verts=[]
    faces=[]
    uvs=[]
    weights=[]
    for i,p in enumerate(pts):
        direction=(pts[min(len(pts)-1,i+1)]-pts[max(0,i-1)]).normalized()
        if direction.length<.1:
            direction=Vector((0,0,1))
        normal=direction.cross(Vector((0,1,0))).normalized()
        if normal.length<.1:
            normal=direction.cross(Vector((1,0,0))).normalized()
        tangent=direction.cross(normal).normalized()
        for j in range(sides):
            angle=2*math.pi*j/sides
            warp=1+.028*math.sin(i*1.71+j*.43)
            q=p+(normal*math.cos(angle)+tangent*math.sin(angle))*(radii[i]*warp)
            verts.append(tuple(q))
            if last_bone:
                w=max(0,min(1,(i/(len(pts)-1)-.35)/.3))
                weights.append((1-w,w))
    for i in range(len(pts)-1):
        for j in range(sides):
            a=i*sides+j
            b=i*sides+(j+1)%sides
            c=(i+1)*sides+(j+1)%sides
            d=(i+1)*sides+j
            faces.append((a,b,c,d))
    faces.append(tuple(reversed(tuple(range(sides)))))
    faces.append(tuple((len(pts)-1)*sides+j for j in range(sides)))
    mesh=bpy.data.meshes.new("Sculpt_"+name)
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    ob=bpy.data.objects.new("GEO_"+name,mesh)
    bpy.context.collection.objects.link(ob)
    uv=mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            vid=mesh.loops[li].vertex_index
            uv.data[li].uv=(vid%sides/sides,vid//sides/max(1,len(pts)-1))
    return attach(ob,mat,[first_bone,last_bone] if last_bone else [first_bone],
                  assigned,weights if last_bone else None)

def sheet(assigned,name,z_start,z_end,r_start,r_end,mat,bone,phase=0):
    # Layered cloth with folds and ragged lower hems, real thickness from solidify.
    steps=32
    rings=9
    verts=[]
    faces=[]
    for k in range(rings):
        t=k/(rings-1)
        z=z_start+(z_end-z_start)*t
        for j in range(steps):
            a=2*math.pi*j/steps
            fold=1+.075*math.cos(a*9+phase)*(t+.2)
            ragged=.055*math.sin(a*13+phase) if k==rings-1 else 0
            verts.append(((r_start+(r_end-r_start)*t)*math.cos(a)*fold,
                         (r_start+(r_end-r_start)*t)*math.sin(a)*fold,
                         z+ragged))
    for k in range(rings-1):
        for j in range(steps):
            a=k*steps+j
            b=k*steps+(j+1)%steps
            faces.append((a,b,b+steps,a+steps))
    mesh=bpy.data.meshes.new("Cloth_"+name)
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    ob=bpy.data.objects.new("GEO_"+name,mesh)
    bpy.context.collection.objects.link(ob)
    uv=mesh.uv_layers.new(name="UVMap")
    for f in mesh.polygons:
        for idx in f.loop_indices:
            vid=mesh.loops[idx].vertex_index
            uv.data[idx].uv=(vid%steps/steps,vid//steps/(rings-1))
    solid=ob.modifiers.new("FabricThickness","SOLIDIFY")
    solid.thickness=.007
    return attach(ob,mat,[bone],assigned)

def hair_tube(assigned,name,pts,bevel,mat,bone):
    curve=bpy.data.curves.new(name,"CURVE")
    curve.dimensions="3D"
    curve.bevel_depth=bevel
    curve.bevel_resolution=2
    curve.resolution_u=8
    spline=curve.splines.new("BEZIER")
    spline.bezier_points.add(len(pts)-1)
    for p,q in zip(spline.bezier_points,pts):
        p.co=q
        p.handle_left_type="AUTO"
        p.handle_right_type="AUTO"
    ob=bpy.data.objects.new("GEO_"+name,curve)
    bpy.context.collection.objects.link(ob)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active=ob
    bpy.ops.object.convert(target="MESH")
    return attach(bpy.context.object,mat,[bone],assigned)

def rig(name,bones,parts,kind,clips):
    arm_data=bpy.data.armatures.new("ARM_"+name)
    arm=bpy.data.objects.new("ARM_"+name,arm_data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    bpy.context.view_layer.objects.active=arm
    bpy.ops.object.mode_set(mode="EDIT")
    for bone_name,(head,tail,parent) in bones.items():
        bone=arm_data.edit_bones.new(bone_name)
        bone.head=head
        bone.tail=tail
    for bone_name,(head,tail,parent) in bones.items():
        if parent:
            arm_data.edit_bones[bone_name].parent=arm_data.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    tris=0
    for ob,bindings,weights in parts:
        if not ob.data.uv_layers and ob.type=="MESH":
            ob.data.uv_layers.new(name="UVMap")
        groups={b:ob.vertex_groups.new(name=b) for b in bindings}
        for vertex in ob.data.vertices:
            if weights:
                w=weights[vertex.index]
                for bone,amount in zip(bindings,w):
                    if amount>.0001:
                        groups[bone].add([vertex.index],amount,"REPLACE")
            else:
                groups[bindings[0]].add([vertex.index],1,"REPLACE")
        mod=ob.modifiers.new("Skin","ARMATURE")
        mod.object=arm
        ob.parent=arm
        ob.data.calc_loop_triangles()
        tris+=len(ob.data.loop_triangles)
    arm.animation_data_create()
    for clip in clips:
        action=bpy.data.actions.new(name+"_"+clip)
        arm.animation_data.action=action
        for frame in (1,9,17,25,33):
            t=math.tau*(frame-1)/32
            wave=math.sin(t)
            accent=math.sin(math.pi*(frame-1)/32)**2
            for pose in arm.pose.bones:
                bone=pose.name
                rot=[0.,0.,0.]
                if kind=="serpent":
                    idx=int(bone.split("_")[-1]) if bone.startswith("Seg_") else 0
                    if bone.startswith("Seg_"):
                        rot[1]=(.07 if clip=="Idle" else .18)*math.sin(t+idx*.5)
                    if bone=="Head" and clip in ("Bite","Fire"):
                        rot[0]=-.60*accent
                    if clip=="Coil" and bone.startswith("Seg_"):
                        rot[2]=.25*accent
                elif kind=="horse":
                    if clip in ("Trot","Gallop","Charge") and bone.startswith("Leg"):
                        rot[0]=(.40 if clip=="Trot" else .65)*wave*(1 if ".L" in bone else -1)
                    if clip=="Kick" and bone.startswith("Leg.H"):
                        rot[0]=-.8*accent
                    if bone=="Neck" and clip=="Idle":
                        rot[0]=.025*wave
                else:
                    if bone=="Spine" and clip=="Idle":
                        rot[0]=.025*wave
                    if clip in ("Walk","Run"):
                        strength=.35 if clip=="Walk" else .58
                        if bone.startswith("Thigh."):
                            rot[0]=strength*wave*(1 if bone.endswith(".L") else -1)
                        if bone.startswith("UpperArm."):
                            rot[0]=-.55*strength*wave*(1 if bone.endswith(".L") else -1)
                    if clip in ("Attack","Cast") and bone=="UpperArm.R":
                        rot[0]=-1.05*accent
                    if clip=="Dodge" and bone=="Spine":
                        rot[2]=.22*accent
                    if clip=="Transform" and bone=="Spine":
                        rot[0]=-.30*accent
                if clip=="Hurt" and bone in ("Spine","Neck"):
                    rot[0]=-.25*accent
                pose.rotation_mode="XYZ"
                pose.rotation_euler=rot
                pose.keyframe_insert(data_path="rotation_euler",frame=frame,group=bone)
        track=arm.animation_data.nla_tracks.new()
        track.name=action.name
        track.strips.new(action.name,1,action)
        arm.animation_data.action=None
    bpy.context.scene.frame_set(1)
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    for ob,*_ in parts:
        ob.select_set(True)
    bpy.context.view_layer.objects.active=arm
    path=DEST/(name+".glb")
    bpy.ops.export_scene.gltf(filepath=str(path),export_format="GLB",
        use_selection=True,export_animations=True,export_animation_mode="NLA_TRACKS")
    if not path.is_file() or path.stat().st_size<4096:
        raise RuntimeError("GLB missing: "+str(path))
    record={"id":name,"triangles":tris,"bones":len(bones),"clips":clips,
            "bytes":path.stat().st_size,"quality":"procedural_PBR_sculpt_prototype",
            "rig":"skinned_glTF_2","textures":"embedded_256px"}
    REPORT.append(record)
    print("RATANABA_CAST_BUILT",json.dumps(record),flush=True)

def humanoid(name,spec):
    parts=reset(name)
    H=spec["height"]
    mode=spec["kind"]
    skin=material(name+"_skin",spec["skin"],.69)
    tattoo=material(name+"_runes",(.055,.72,.77) if mode=="warrior" else
        (.04,.45,.19),.3,glow=2 if mode=="warrior" else 0)
    wrap=material(name+"_leather",(.18,.09,.05),.82,fiber=1)
    cloth=material(name+"_fabric",(.18,.07,.06) if mode in ("warrior","shaman")
        else (.87,.81,.68) if mode=="river" else (.18,.24,.07),.93,fiber=1)
    brass=material(name+"_aged_bronze",(.38,.25,.08),.4,metal=.78)
    dark=material(name+"_hair",(.025,.018,.013) if mode!="shaman"
        else (.37,.33,.29),.91,fiber=1)
    bone=material(name+"_bone",(.67,.59,.39),.66)
    red=material(name+"_red",(.48,.045,.038),.88,fiber=1)
    leaf=material(name+"_foliage",(.13,.30,.067),.85,fiber=1)
    hair=material(name+"_hair_red",(.64,.07,.025),.71)
    bones={
      "Root":((0,0,.01),(0,0,H*.49),None),
      "Pelvis":((0,0,H*.47),(0,0,H*.58),"Root"),
      "Spine":((0,0,H*.58),(0,0,H*.82),"Pelvis"),
      "Neck":((0,0,H*.82),(0,0,H*.89),"Spine"),
      "Head":((0,0,H*.89),(0,0,H*1.03),"Neck")
    }
    for s,side in ((-1,"L"),(1,"R")):
        bones["UpperArm."+side]=((s*H*.235,0,H*.78),(s*H*.34,0,H*.62),"Spine")
        bones["Forearm."+side]=((s*H*.34,0,H*.62),(s*H*.42,-.03,H*.46),"UpperArm."+side)
        bones["Hand."+side]=((s*H*.42,-.03,H*.46),(s*H*.44,-.03,H*.40),"Forearm."+side)
        bones["Thigh."+side]=((s*H*.095,0,H*.49),(s*H*.10,0,H*.27),"Pelvis")
        bones["Shin."+side]=((s*H*.10,0,H*.27),(s*H*.11,-.02,H*.06),"Thigh."+side)
        bones["Foot."+side]=((s*H*.11,-.02,H*.06),(s*H*.11,-.14,H*.03),"Shin."+side)
    # Anatomical body sculpted as continuous varying oval cross-sections.
    core=[(.48,.22,.19),(.54,.25,.18),(.62,.28,.20),(.70,.34,.22),
          (.77,.35,.22),(.82,.25,.18),(.85,.14,.13)]
    if mode=="shaman":
        core=[(z,r*.80,d*.84) for z,r,d in core]
    organic_tube(parts,"Torso",[(0,0,H*z) for z,_,_ in core],
                 [H*r for _,r,_ in core],skin,"Pelvis","Spine",36)
    oval(parts,"Pectoral_L",(-.12,-.17,H*.745),(.16,.07,.11),skin,"Spine")
    oval(parts,"Pectoral_R",(.12,-.17,H*.745),(.16,.07,.11),skin,"Spine")
    oval(parts,"Skull",(0,-.02,H*.96),(.105,.095,.135),skin,"Head",40)
    oval(parts,"LowerJaw",(0,-.075,H*.91),(.091,.067,.066),skin,"Head",32)
    oval(parts,"Nose",(0,-.113,H*.965),(.027,.05,.045),skin,"Head",24)
    oval(parts,"Lips",(0,-.120,H*.922),(.060,.011,.016),skin,"Head",24)
    for s,side in ((-1,"L"),(1,"R")):
        oval(parts,"Cheek"+side,(s*.071,-.088,H*.94),(.055,.024,.048),skin,"Head",20)
        oval(parts,"Eye"+side,(s*.045,-.10,H*.980),(.024,.014,.014),dark,"Head",16)
        oval(parts,"Brow"+side,(s*.05,-.113,H*1.00),(.050,.016,.016),dark,"Head",20)
        oval(parts,"Ear"+side,(s*.108,0,H*.967),(.025,.023,.039),skin,"Head",20)
        shoulder=(s*H*.23,0,H*.78)
        elbow=(s*H*.34,-.015,H*.62)
        wrist=(s*H*.42,-.03,H*.46)
        points=[]
        radii=[]
        for i in range(13):
            t=i/12
            if t<.5:
                q=Vector(shoulder).lerp(Vector(elbow),t*2)
                radius=.095-.019*(t*2)
            else:
                q=Vector(elbow).lerp(Vector(wrist),(t-.5)*2)
                radius=.077-.020*((t-.5)*2)
            points.append(q)
            radii.append(radius*(1.04 if mode=="warrior" else .87 if mode=="shaman" else 1))
        organic_tube(parts,"Full_Arm_"+side,points,radii,skin,
                     "UpperArm."+side,"Forearm."+side,32)
        oval(parts,"Palm"+side,(s*H*.43,-.035,H*.425),(.05,.042,.07),
             skin,"Hand."+side,24)
        for i in range(5):
            fx=s*H*.43+(i-2)*.019
            rod(parts,"Finger_"+side+str(i),(fx,-.068,H*.41),
                (fx,-.087,H*(.371+abs(i-2)*.004)),.012,.007,skin,
                "Hand."+side,10)
        hip=(s*H*.095,0,H*.49)
        knee=(s*H*.105,0,H*.265)
        ankle=(s*H*.11,-.025,H*.07)
        leg_pts=[]
        leg_rad=[]
        for i in range(15):
            t=i/14
            if t<.5:
                leg_pts.append(Vector(hip).lerp(Vector(knee),2*t))
                leg_rad.append((.105-.022*(t*2))*(1 if mode!="shaman" else .85))
            else:
                leg_pts.append(Vector(knee).lerp(Vector(ankle),2*(t-.5)))
                leg_rad.append(.083-.027*2*(t-.5))
        organic_tube(parts,"Full_Leg_"+side,leg_pts,leg_rad,skin,
                     "Thigh."+side,"Shin."+side,36)
        foot_y=.115 if mode=="forest" else -.115  # Curupira reversed feet.
        oval(parts,"Foot_"+side,(s*H*.11,foot_y,H*.028),
             (.068,.13,.039),skin if mode=="forest" else wrap,
             "Foot."+side,28)
        rod(parts,"Leather_Bracer_"+side,(s*H*.36,-.022,H*.57),
            (s*H*.40,-.028,H*.49),.084,.077,wrap,"Forearm."+side,24)
        if mode in ("warrior","forest"):
            for j in range(3):
                rod(parts,"Rune_Line_"+side+str(j),
                    (s*(H*.30+j*.014),-.08,H*(.70-j*.055)),
                    (s*(H*.34+j*.013),-.08,H*(.67-j*.055)),
                    .007,.005,tattoo,"UpperArm."+side,8)
        if mode=="forest":
            for j in range(4):
                rod(parts,"Vine_"+side+str(j),
                    (s*.11,.02,H*(.17+j*.04)),(s*.12,-.09,H*(.16+j*.045)),
                    .012,.009,leaf,"Shin."+side,8)
    if mode=="river":
        oval(parts,"Linen_Shirt",(0,.008,H*.69),(.30,.235,.34),cloth,"Spine")
        sheet(parts,"Loose_Trousers",H*.50,H*.29,.18,.24,cloth,"Pelvis")
        rod(parts,"Wide_Red_Sash",(0,0,H*.54),(0,0,H*.60),.22,.22,red,"Pelvis",32)
        rod(parts,"Hat_Brim",(0,0,H*1.07),(0,0,H*1.075),.24,.24,cloth,"Head",36)
        rod(parts,"Hat_Crown",(0,0,H*1.075),(0,0,H*1.20),.14,.12,cloth,"Head",36)
        rod(parts,"Hat_Band",(0,0,H*1.086),(0,0,H*1.103),.147,.147,wrap,"Head",32)
        for side in (-1,1):
            rod(parts,"Linen_Embroidery_"+str(side),(side*.13,-.237,H*.77),
                (side*.08,-.243,H*.59),.006,.006,red,"Spine",8)
    elif mode=="shaman":
        sheet(parts,"Tattered_Cloak",H*.92,H*.10,.28,.56,cloth,"Spine")
        sheet(parts,"Linen_Inner_Robe",H*.62,H*.10,.19,.26,wrap,"Pelvis")
        rod(parts,"Carved_Staff",(-.40,-.10,H*.10),(-.40,-.10,H*1.45),
            .035,.036,wrap,"Hand.L",16)
        oval(parts,"Crystal_Head",(-.40,-.10,H*1.48),
             (.07,.07,.095),tattoo,"Hand.L")
        oval(parts,"Raven_Body",(.31,-.02,H*.90),(.11,.09,.17),dark,"Spine",24)
        rod(parts,"Raven_Beak",(.31,-.11,H*.96),(.31,-.20,H*.93),
            .033,.003,brass,"Spine",10)
    else:
        sheet(parts,"Layered_Leather_Skirt",H*.52,H*.25,.24,.39,wrap,"Pelvis")
        sheet(parts,"Frayed_Outer_Tunic",H*.52,H*.33,.25,.34,
              leaf if mode=="forest" else red,"Pelvis",phase=2)
        rod(parts,"Embossed_Belt",(0,0,H*.50),(0,0,H*.545),.23,.23,brass,"Pelvis",32)
        oval(parts,"Ritual_Medallion",(0,-.242,H*.77),(.067,.025,.080),
             brass,"Spine",32)
        if mode=="warrior":
            for s in (-1,1):
                for j in range(4):
                    rod(parts,"Cyan_Scar_"+str(s)+"_"+str(j),
                        (s*(.035+.042*j),-.197,H*(.70-.014*j)),
                        (s*(.060+.045*j),-.204,H*(.63-.012*j)),
                        .006,.004,tattoo,"Spine",8)
            # Club is held in the left hand, not fused into the body mesh.
            rod(parts,"Ritual_Club_Shaft",(-.48,-.06,H*.32),
                (-.61,-.08,H*1.27),.038,.051,wrap,"Hand.L",16)
            oval(parts,"Club_Head",(-.61,-.08,H*1.24),(.13,.12,.18),
                 brass,"Hand.L",32)
            for j in range(5):
                a=j*math.tau/5
                rod(parts,"Club_Bone_Spike_"+str(j),
                    (-.61+.12*math.cos(a),-.08+.12*math.sin(a),H*1.24),
                    (-.61+.21*math.cos(a),-.08+.21*math.sin(a),H*1.27),
                    .032,.003,bone,"Hand.L",12)
    # Individual real tube hair, not cones. Parent to head for basic animation.
    count=32 if mode in ("warrior","forest") else 18
    hair_mat=hair if mode=="forest" else dark
    for i in range(count):
        a=i*math.tau/count
        x=math.cos(a)*.10
        y=math.sin(a)*.08
        z=H*1.045
        length=.40 if mode=="warrior" else .33 if mode=="forest" else .48
        if mode=="river":
            length=.24
        if mode=="shaman":
            length=.64
        s=1+(.30*math.sin(i*1.7))
        hair_tube(parts,"Hair_"+str(i),[
            (x,y,z),(x*1.4,y+.014,z-.09),
            (x*1.8+.035*math.sin(i*2),y+.02,z-length*.65*s),
            (x*2.0,y+.024,z-length*s)],.011 if mode!="forest" else .019,
            hair_mat,"Head")
    if mode=="warrior":
        oval(parts,"Beard",(0,-.104,H*.915),(.082,.045,.065),dark,"Head")
    clips=["Idle","Walk","Run","Attack","Dodge","Hurt"]
    if mode=="river":
        clips=["Idle","Walk","Run","Attack","Transform","Hurt"]
    if mode=="shaman":
        clips=["Idle","Walk","Cast","Attack","Dodge","Hurt"]
    rig(name,bones,parts,"humanoid",clips)

def horse(name,spec):
    parts=reset(name)
    skin=material(name+"_charcoal_horse",(.075,.08,.09),.76,fiber=1)
    metal=material(name+"_burnished_armor",(.20,.17,.16),.39,.85)
    gold=material(name+"_engraved_gold",(.42,.23,.075),.42,.78)
    cloth=material(name+"_tattered_red",(.29,.045,.045),.89,fiber=1)
    flame=material(name+"_blue_flame",(.09,.65,1),.2,glow=3.8)
    bones={"Root":((0,0,.15),(0,0,1.25),None),
           "Spine":((0,0,1.25),(0,.60,1.29),"Root"),
           "Neck":((0,-.57,1.36),(0,-.85,1.82),"Spine"),
           "Tail":((0,.68,1.30),(0,1.2,.95),"Spine")}
    oval(parts,"Equine_Torso",(0,0,1.21),(.40,.83,.44),skin,"Spine",40)
    oval(parts,"Equine_Haunch",(0,.52,1.23),(.38,.45,.46),skin,"Spine",32)
    organic_tube(parts,"Headless_Neck",[(0,-.44,1.3),(0,-.58,1.46),
        (0,-.66,1.65),(0,-.72,1.82)], [.32,.28,.24,.21],skin,"Neck",None,32)
    rod(parts,"Cauterized_Neck_Ring",(0,-.72,1.80),(0,-.75,1.87),
        .27,.27,gold,"Neck",36)
    for i in range(11):
        a=2*math.pi*i/11
        rod(parts,"Flame_Tongue_"+str(i),
            (.16*math.cos(a),-.75+.16*math.sin(a),1.85),
            (.19*math.cos(a),-.75+.19*math.sin(a),2.10+.25*(i%3)/3),
            .045,.001,flame,"Neck",8)
    for front,y in (("F",-.55),("H",.56)):
        for s,side in ((-1,"L"),(1,"R")):
            upper="Leg."+front+"."+side
            lower="Shin."+front+"."+side
            top=(s*.30,y,1.10)
            joint=(s*.33,y-.05,.62)
            ankle=(s*.35,y-.12,.15)
            bones[upper]=(top,joint,"Spine")
            bones[lower]=(joint,ankle,upper)
            organic_tube(parts,"HorseLeg_"+front+side,
                [top,tuple(Vector(top).lerp(Vector(joint),.3)),
                 tuple(Vector(top).lerp(Vector(joint),.6)),joint,
                 tuple(Vector(joint).lerp(Vector(ankle),.32)),
                 tuple(Vector(joint).lerp(Vector(ankle),.65)),ankle],
                [.135,.15,.124,.12,.105,.077,.075],skin,upper,lower,24)
            oval(parts,"Hoof_"+front+side,(s*.35,y-.17,.10),(.15,.19,.10),
                metal,lower,24)
            oval(parts,"KneeArmor_"+front+side,joint,(.14,.14,.14),gold,lower,20)
    for i in range(16):
        y=-.65+i*.083
        for s in (-1,1):
            oval(parts,"ArmorScale_"+str(i)+"_"+str(s),
                 (s*.34,y,1.52-.025*math.cos(i*.4)),
                 (.18,.09,.08),metal,"Spine",16)
    for i in range(7):
        rod(parts,"TrailingFlame_"+str(i),(0,.66,1.30-i*.01),
            (.10*math.sin(i),1.15+i*.055,1.10-i*.09),
            .057,.001,flame,"Tail",10)
    rig(name,bones,parts,"horse",
        ["Idle","Trot","Gallop","Charge","Kick","Hurt"])

def serpent(name,spec):
    parts=reset(name)
    scales=material(name+"_obsidian_scales",(.035,.048,.068),.49,.45)
    armor=material(name+"_old_gold_scales",(.28,.17,.07),.42,.75)
    blue=material(name+"_arcane_blue_fire",(.035,.61,1.0),.22,glow=4)
    teeth=material(name+"_ivory_fangs",(.88,.79,.60),.67)
    eye=material(name+"_cyan_eyes",(.10,.90,1),.20,glow=3)
    points=[]
    for i in range(17):
        t=i/16
        a=t*math.tau*1.4
        points.append((1.0*math.sin(a)*(1-t*.35),
                      .95*math.cos(a)*(1-t*.35),
                      .34+t*2.60))
    bones={"Root":((0,0,0),points[0],None)}
    for i in range(16):
        bones["Seg_"+str(i)]=(points[i],points[i+1],
                 "Root" if i==0 else "Seg_"+str(i-1))
        a=Vector(points[i]);b=Vector(points[i+1])
        middle=(a+b)*.5
        rod(parts,"Scaled_Body_"+str(i),a,b,.30-i*.006,.30-i*.005,
            scales,"Seg_"+str(i),28)
        for j in range(12):
            ang=2*math.pi*j/12
            offset=Vector((math.cos(ang)*.28,math.sin(ang)*.28,0))
            oval(parts,"Gilded_Scale_"+str(i)+"_"+str(j),middle+offset,
                 (.105,.05,.16),armor,"Seg_"+str(i),12)
        rod(parts,"Arcane_Spine_"+str(i),
            middle+Vector((0,.20,.09)),middle+Vector((0,.37,.17)),
            .075,.002,blue,"Seg_"+str(i),10)
    head=Vector(points[-1])
    bones["Head"]=(points[-1],tuple(head+Vector((0,-.35,.18))),"Seg_15")
    oval(parts,"Serpent_Head",head,(.38,.43,.27),scales,"Head",36)
    oval(parts,"Upper_Snout",head+Vector((0,-.34,-.02)),(.33,.32,.16),
         armor,"Head",32)
    oval(parts,"Lower_Jaw",head+Vector((0,-.24,-.18)),(.30,.36,.09),
         scales,"Head",32)
    for s in (-1,1):
        oval(parts,"Eye_"+str(s),head+Vector((s*.23,-.24,.12)),
             (.09,.045,.06),eye,"Head",20)
        for i in range(3):
            rod(parts,"Fang_"+str(s)+"_"+str(i),
                head+Vector((s*(.11+i*.075),-.45,-.08)),
                head+Vector((s*(.11+i*.075),-.46,-.25)),
                .04,.002,teeth,"Head",10)
    rig(name,bones,parts,"serpent",
        ["Idle","Slither","Bite","Fire","Coil","Hurt"])

for identifier,definition in CAST.items():
    if definition["kind"]=="horse":
        horse(identifier,definition)
    elif definition["kind"]=="serpent":
        serpent(identifier,definition)
    else:
        humanoid(identifier,definition)
BUILD.joinpath("ratanaba_cast_report.json").write_text(
    json.dumps(REPORT,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("RATANABA_CAST_DONE",len(REPORT),flush=True)
