"""Original, no-cost Blender blockout of Espirito da Mata for Godot 4.
Creates a rigged textured-by-material GLB plus 6 NLA animation clips.
Not a final photoreal character. Blender 4.3.x. License: CC0-1.0.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1]
OUT=R/"assets/guardians/espirito_da_mata.glb"
REPORT=R/"build/guardian_spirit_build.json"
OUT.parent.mkdir(parents=True,exist_ok=True)
REPORT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.name="GUARDIAN_EspiritoDaMata"
scene.unit_settings.system='METRIC'
scene.render.fps=24
scene.frame_end=33
def mat(name,rgb,em=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*rgb,1)
    p.inputs['Roughness'].default_value=.78
    if em:
        p.inputs['Emission Color'].default_value=(*rgb,1)
        p.inputs['Emission Strength'].default_value=em
    return m
wood=mat('PBR_Bark',(0.10,.06,.032))
ridge=mat('PBR_Ridges',(.22,.12,.058))
moss=mat('PBR_Moss',(.07,.22,.065))
leaves=mat('PBR_Leaves',(.15,.34,.075))
fire=mat('PBR_Ember',(1,.23,.015),3)
eyes=mat('PBR_Eyes',(.6,1,.44),2)
meshes=[]
def register(obj,material,bone):
    obj.data.materials.append(material)
    for f in obj.data.polygons:f.use_smooth=True
    obj['bind_bone']=bone
    obj.name='GEO_'+obj.name
    meshes.append(obj)
def ball(name,xyz,s,material,bone,segments=14):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=8,location=xyz)
    o=bpy.context.object;o.name=name;o.scale=s
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    register(o,material,bone)
def branch(name,a,b,r1,r2,material,bone):
    v=Vector(b)-Vector(a)
    bpy.ops.mesh.primitive_cone_add(vertices=10,radius1=r1,radius2=r2,depth=v.length,location=(Vector(a)+Vector(b))*.5)
    o=bpy.context.object;o.name=name
    o.rotation_euler=v.to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    register(o,material,bone)

# Silhouette: weathered trunk, ember heart, root limbs, moss, flame eyes and antlers.
ball('Hip',(0,0,1.02),(.29,.23,.26),wood,'Root')
ball('Torso',(0,0,1.55),(.36,.26,.55),wood,'Spine')
ball('ChestBark',(0,-.16,1.73),(.34,.12,.22),ridge,'Spine')
ball('EmberHeart',(0,-.27,1.53),(.12,.055,.24),fire,'Spine')
branch('FlameCrackL',(-.08,-.27,1.33),(-.06,-.29,1.8),.023,.009,fire,'Spine')
branch('FlameCrackR',(.08,-.27,1.33),(.06,-.29,1.8),.023,.009,fire,'Spine')
for side,sgn in [('L',-1),('R',1)]:
    upper='Arm.'+side;lower='Forearm.'+side
    thigh='Leg.'+side;shin='Shin.'+side
    ball('Shoulder'+side,(sgn*.38,0,1.87),(.19,.18,.2),ridge,upper)
    branch('Arm'+side,(sgn*.41,0,1.88),(sgn*.61,0,1.47),.15,.095,wood,upper)
    branch('Forearm'+side,(sgn*.61,0,1.48),(sgn*.77,-.06,1.12),.12,.075,ridge,lower)
    ball('Hand'+side,(sgn*.77,-.055,1.08),(.11,.1,.12),wood,lower)
    for i in range(3):
        x=sgn*(.71+i*.062)
        branch('Claw'+side+str(i),(x,-.07,1.03),(x+sgn*.02,-.13,.87+i*.013),.035,.005,ridge,lower)
    branch('Thigh'+side,(sgn*.17,0,1.03),(sgn*.2,.03,.55),.17,.12,wood,thigh)
    branch('Shin'+side,(sgn*.2,.03,.55),(sgn*.21,-.04,.14),.12,.077,ridge,shin)
    ball('RootFoot'+side,(sgn*.21,-.13,.09),(.13,.24,.08),wood,shin)
    for i in range(3):
        x=sgn*.21+(i-1)*.07
        branch('Toe'+side+str(i),(x,-.21,.08),(x+(i-1)*.025,-.43,.035),.039,.003,wood,shin)
    ball('Moss'+side,(sgn*.33,.04,1.99),(.19,.18,.095),moss,'Spine')
    for i in range(3):
        ball('Leaf'+side+str(i),(sgn*(.31+i*.055),.06,2.02+i*.07),(.055,.12,.035),leaves,'Spine',10)
ball('Skull',(0,-.025,2.18),(.23,.19,.29),wood,'Head')
ball('Brow',(0,-.17,2.24),(.22,.095,.085),ridge,'Head')
for side,sgn in [('L',-1),('R',1)]:
    ball('Eye'+side,(sgn*.09,-.205,2.17),(.037,.024,.044),eyes,'Head',10)
    branch('Antler'+side,(sgn*.12,.03,2.4),(sgn*.24,.08,2.73),.077,.039,wood,'Head')
    branch('AntlerTip'+side,(sgn*.24,.08,2.73),(sgn*.39,.12,2.92),.042,.002,ridge,'Head')
    branch('AntlerFork'+side,(sgn*.25,.09,2.68),(sgn*.41,.17,2.74),.031,.003,wood,'Head')
branch('CrownTwig',(0,.05,2.44),(0,.09,2.72),.042,.003,wood,'Head')

armdata=bpy.data.armatures.new('ARM_Spirit')
arm=bpy.data.objects.new('ARM_Spirit',armdata);scene.collection.objects.link(arm)
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True);bpy.context.view_layer.objects.active=arm
bpy.ops.object.mode_set(mode='EDIT')
bones={
 'Root':((0,0,0),(0,0,1.04),None),
 'Spine':((0,0,1.04),(0,0,1.99),'Root'),
 'Head':((0,0,1.99),(0,0,2.46),'Spine')
}
for s,side in [(-1,'L'),(1,'R')]:
    bones['Arm.'+side]=((s*.37,0,1.9),(s*.60,0,1.49),'Spine')
    bones['Forearm.'+side]=((s*.6,0,1.49),(s*.77,-.06,1.10),'Arm.'+side)
    bones['Leg.'+side]=((s*.17,0,1.02),(s*.2,.03,.54),'Root')
    bones['Shin.'+side]=((s*.2,.03,.54),(s*.21,-.04,.1),'Leg.'+side)
for n,(a,b,p) in bones.items():
    e=armdata.edit_bones.new(n);e.head=a;e.tail=b
for n,(a,b,p) in bones.items():
    if p:armdata.edit_bones[n].parent=armdata.edit_bones[p]
bpy.ops.object.mode_set(mode='OBJECT')
for o in meshes:
    vg=o.vertex_groups.new(name=o['bind_bone'])
    vg.add(list(range(len(o.data.vertices))),1,'REPLACE')
    mod=o.modifiers.new('Skin','ARMATURE');mod.object=arm
    o.parent=arm

arm.animation_data_create()
clips=['Idle','Walk','Run','Attack','Hurt','Death']
for clip in clips:
    act=bpy.data.actions.new('espirito_da_mata_'+clip)
    arm.animation_data.action=act
    for frame in [1,9,17,25,33]:
        t=(frame-1)*math.tau/32
        wave=math.sin(t)
        impact=math.sin((frame-1)*math.pi/32)**2
        for b in arm.pose.bones:
            b.rotation_mode='XYZ';x=y=z=0
            if clip=='Idle':
                if b.name=='Spine':x=.045*wave
                if b.name=='Head':z=.03*wave
            if clip in ('Walk','Run'):
                amplitude=.36 if clip=='Walk' else .62
                if b.name.startswith('Leg.'):x=amplitude*wave*(1 if b.name.endswith('L') else -1)
                if b.name.startswith('Arm.'):x=-.65*amplitude*wave*(1 if b.name.endswith('L') else -1)
                if b.name=='Spine':z=.04*wave
            if clip=='Attack':
                if b.name=='Arm.R':x=-1.45*impact
                if b.name=='Forearm.R':x=-.65*impact
                if b.name=='Spine':z=-.22*impact
            if clip=='Hurt':
                if b.name=='Spine':x=-.35*impact
                if b.name=='Head':x=.14*impact
            if clip=='Death':
                progress=(frame-1)/32
                if b.name=='Spine':x=-1.1*progress
                if b.name=='Head':x=.35*progress
            b.rotation_euler=(x,y,z)
            b.keyframe_insert('rotation_euler',frame=frame,group=b.name)
    track=arm.animation_data.nla_tracks.new()
    track.name=act.name
    track.strips.new(act.name,1,act)
    arm.animation_data.action=None
scene.frame_set(1)
triangles=0
for o in meshes:
    o.data.calc_loop_triangles()
    triangles+=len(o.data.loop_triangles)
assert 100<triangles<=18000,triangles
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_draco_mesh_compression_enable=False)
assert OUT.exists() and OUT.stat().st_size>1024
receipt={'name':'espirito_da_mata','original_procedural':True,'quality':'stylized_blockout','triangles':triangles,'budget':18000,'bones':len(bones),'clips':clips,'bytes':OUT.stat().st_size}
REPORT.write_text(json.dumps(receipt,indent=2)+'\n')
print('BUILT_SPIRIT',json.dumps(receipt))
