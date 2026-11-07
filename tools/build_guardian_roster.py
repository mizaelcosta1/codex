"""Free procedural enemy blockouts, not photorealistic meshes.
Generates Bruto, Ceifador, Guardiao Reptil and Serpente de Fogo as
rigged GLB assets with six animation clips each, without paid services.
Blender 4.3.x; original generated geometry. SPDX-License-Identifier: CC0-1.0
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'assets/guardians'
DEST.mkdir(parents=True,exist_ok=True)
REPORT=ROOT/'build/guardian_roster_build.json'
REPORT.parent.mkdir(exist_ok=True)
receipts=[]

def reset(identifier):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.context.scene.name='GUARDIAN_'+identifier
    bpy.context.scene.unit_settings.system='METRIC'
    bpy.context.scene.render.fps=24
    bpy.context.scene.frame_end=33
    return []

def mat(name,color,metal=0.0,rough=.75,emission=0.0):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    node=m.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value=(*color,1)
    node.inputs['Metallic'].default_value=metal
    node.inputs['Roughness'].default_value=rough
    if emission:
        node.inputs['Emission Color'].default_value=(*color,1)
        node.inputs['Emission Strength'].default_value=emission
    return m

def sphere(parts,name,position,scale,m,bone,segments=14):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=8,location=position)
    ob=bpy.context.object;ob.name='GEO_'+name
    ob.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    ob.data.materials.append(m)
    for face in ob.data.polygons:face.use_smooth=True
    parts.append((ob,bone))
    return ob

def rod(parts,name,a,b,ra,rb,m,bone):
    direction=Vector(b)-Vector(a)
    bpy.ops.mesh.primitive_cone_add(vertices=10,radius1=ra,radius2=rb,depth=direction.length,location=(Vector(a)+Vector(b))/2)
    ob=bpy.context.object;ob.name='GEO_'+name
    ob.rotation_euler=direction.to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    ob.data.materials.append(m)
    for face in ob.data.polygons:face.use_smooth=True
    parts.append((ob,bone))
    return ob

def skeleton(parts,identifier,definitions,clips,kind):
    data=bpy.data.armatures.new('ARM_'+identifier)
    arm=bpy.data.objects.new('ARM_'+identifier,data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True);bpy.context.view_layer.objects.active=arm
    bpy.ops.object.mode_set(mode='EDIT')
    for name,(a,b,parent) in definitions.items():
        bone=data.edit_bones.new(name);bone.head=a;bone.tail=b
    for name,(a,b,parent) in definitions.items():
        if parent:data.edit_bones[name].parent=data.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    for ob,bone in parts:
        group=ob.vertex_groups.new(name=bone)
        group.add(list(range(len(ob.data.vertices))),1,'REPLACE')
        modifier=ob.modifiers.new('Skin','ARMATURE');modifier.object=arm
        ob.parent=arm
    arm.animation_data_create()
    for clip in clips:
        action=bpy.data.actions.new(identifier+'_'+clip)
        arm.animation_data.action=action
        for frame in [1,9,17,25,33]:
            t=(frame-1)*math.tau/32
            wave=math.sin(t)
            intensity=math.sin((frame-1)*math.pi/32)**2
            progress=(frame-1)/32
            for pose in arm.pose.bones:
                pose.rotation_mode='XYZ'
                x=y=z=0
                name=pose.name
                if kind=='serpent':
                    idx=int(name[3:]) if name.startswith('Seg') else 0
                    if clip in ('Idle','Move'):z=math.sin(t+idx*.4)*(.08 if clip=='Idle' else .22)
                    if clip=='Bite' and name=='Head':x=-.9*intensity
                    if clip=='Fire' and name=='Head':x=-.4*intensity
                    if clip=='Hurt':z=.27*intensity
                    if clip=='Death':x=-.7*progress
                else:
                    if clip=='Idle' and name=='Spine':x=.03*wave
                    if clip in ('Walk','Run'):
                        speed=.4 if clip=='Walk' else .68
                        if name.startswith('Leg.'):x=speed*wave*(1 if name.endswith('L') else -1)
                        if name.startswith('Arm.'):x=-.65*speed*wave*(1 if name.endswith('L') else -1)
                        if name=='Spine':z=.045*wave
                        if name.startswith('Tail'):z=.15*wave
                    if clip=='Attack':
                        if name=='Arm.R':x=-1.2*intensity
                        if name=='Forearm.R':x=-.5*intensity
                        if name=='Spine':z=-.2*intensity
                    if clip=='Cast':
                        if name.startswith('Arm.'):x=-.9*intensity
                        if name=='Head':x=.15*intensity
                    if clip=='Hurt':
                        if name=='Spine':x=-.25*intensity
                    if clip=='Death' and name=='Spine':x=-1.2*progress
                pose.rotation_euler=(x,y,z)
                pose.keyframe_insert('rotation_euler',frame=frame,group=name)
        track=arm.animation_data.nla_tracks.new()
        track.name=action.name
        track.strips.new(action.name,1,action)
        arm.animation_data.action=None
    bpy.context.scene.frame_set(1)
    triangles=0
    for ob,_ in parts:
        ob.data.calc_loop_triangles()
        triangles+=len(ob.data.loop_triangles)
    limit=16000 if kind=='serpent' else 20000
    assert 100<triangles<=limit,(identifier,triangles)
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    for ob,_ in parts:ob.select_set(True)
    bpy.context.view_layer.objects.active=arm
    output=DEST/(identifier+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',
        use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS')
    assert output.exists() and output.stat().st_size>1024
    record={'name':identifier,'triangles':triangles,'bones':len(definitions),
      'clips':clips,'bytes':output.stat().st_size,'quality':'procedural_blockout'}
    receipts.append(record)
    print('GUARDIAN_BUILT',json.dumps(record))

def humanoid(identifier,H,style):
    parts=reset(identifier)
    skin=mat(identifier+'_skin',(.35,.18,.12) if style=='brute' else (.11,.17,.12) if style=='reptile' else (.04,.045,.055))
    dark=mat(identifier+'_shadow',(.09,.065,.05) if style=='brute' else (.08,.11,.065) if style=='reptile' else (.015,.014,.022))
    cloth=mat(identifier+'_cloth',(.31,.045,.038) if style=='brute' else (.08,.07,.085) if style=='reaper' else (.25,.19,.075))
    metal=mat(identifier+'_metal',(.36,.25,.12),.7,.35)
    eyes=mat(identifier+'_eyes',(1,.35,.04) if style=='reptile' else (.25,.9,.15),emission=2)
    defs={'Root':((0,0,0),(0,0,H*.43),None),
          'Spine':((0,0,H*.43),(0,0,H*.77),'Root'),
          'Head':((0,0,H*.77),(0,0,H*1.02),'Spine')}
    for s,side in [(-1,'L'),(1,'R')]:
        defs['Arm.'+side]=((s*.21,0,H*.73),(s*.38,0,H*.53),'Spine')
        defs['Forearm.'+side]=((s*.38,0,H*.53),(s*.43,-.03,H*.35),'Arm.'+side)
        defs['Leg.'+side]=((s*.12,0,H*.43),(s*.14,0,H*.23),'Root')
        defs['Shin.'+side]=((s*.14,0,H*.23),(s*.15,-.03,.08),'Leg.'+side)
    sphere(parts,'Pelvis',(0,0,H*.43),(.26,.2,H*.13),skin,'Root')
    sphere(parts,'Torso',(0,0,H*.65),(.38 if style=='brute' else .27,.24,H*.23),skin,'Spine')
    sphere(parts,'Head',(0,-.025,H*.89),(.20,.18,.15 if style=='brute' else .21),skin,'Head')
    if style=='brute':
        sphere(parts,'RedHeadWrap',(0,.02,H*.967),(.23,.20,.06),cloth,'Head')
        sphere(parts,'Scar',(0,-.19,H*.86),(.12,.02,.012),dark,'Head')
        sphere(parts,'Belt',(0,-.04,H*.44),(.31,.22,.08),cloth,'Root')
        sphere(parts,'TatteredCloth',(0,-.16,H*.34),(.16,.045,.23),cloth,'Root')
        rod(parts,'SmokingPipe',(.11,-.18,H*.85),(.21,-.34,H*.81),.026,.02,dark,'Head')
    elif style=='reaper':
        sphere(parts,'Hood',(0,.07,H*.93),(.29,.24,.30),cloth,'Head')
        sphere(parts,'HiddenFace',(0,-.21,H*.88),(.12,.032,.15),dark,'Head')
        rod(parts,'BirdMask',(0,-.19,H*.88),(0,-.40,H*.80),.10,.005,metal,'Head')
        sphere(parts,'Cloak',(0,.11,H*.54),(.34,.19,H*.34),cloth,'Spine')
        for side in [-1,1]:
            for i in range(3):
                rod(parts,'Feather'+str(side)+str(i),(side*.25,.11,H*.71),(side*(.39+i*.025),.1,H*(.35-i*.035)),.07,.005,cloth,'Spine')
    else:
        sphere(parts,'ArmorChest',(0,-.21,H*.66),(.29,.12,H*.19),metal,'Spine')
        sphere(parts,'Jaw',(0,-.16,H*.85),(.17,.22,.066),skin,'Head')
        for i in range(4):
            rod(parts,'DorsalSpike'+str(i),(0,.21,H*(.52+i*.12)),(0,.36,H*(.55+i*.12)),.063,.004,dark,'Spine')
        defs['Tail1']=((0,.1,H*.43),(0,.52,H*.34),'Root')
        defs['Tail2']=((0,.52,H*.34),(0,1.02,.19),'Tail1')
        rod(parts,'TailBase',(0,.12,H*.43),(0,.53,H*.34),.18,.11,skin,'Tail1')
        rod(parts,'TailTip',(0,.53,H*.34),(0,1.04,.19),.11,.004,skin,'Tail2')
    for s,side in [(-1,'L'),(1,'R')]:
        sphere(parts,'Eye'+side,(s*.09,-.176,H*.91),(.03,.014,.026),eyes,'Head',10)
        rod(parts,'UpperArm'+side,(s*.23,0,H*.71),(s*.38,0,H*.53),
            .18 if style=='brute' else .11,.10,skin,'Arm.'+side)
        rod(parts,'LowerArm'+side,(s*.38,0,H*.53),(s*.43,-.03,H*.35),.11,.075,skin,'Forearm.'+side)
        sphere(parts,'Hand'+side,(s*.43,-.04,H*.34),(.10,.075,.085),skin,'Forearm.'+side)
        rod(parts,'Thigh'+side,(s*.12,0,H*.43),(s*.14,0,H*.23),.16,.105,skin,'Leg.'+side)
        rod(parts,'Calf'+side,(s*.14,0,H*.23),(s*.15,-.03,.11),.11,.07,skin,'Shin.'+side)
        sphere(parts,'Foot'+side,(s*.15,-.13,.07),(.12,.21,.07),skin,'Shin.'+side)
        if style=='reptile':
            sphere(parts,'ShoulderGuard'+side,(s*.27,0,H*.72),(.17,.14,.13),metal,'Arm.'+side)
            sphere(parts,'Bracer'+side,(s*.4,-.03,H*.44),(.11,.12,.12),metal,'Forearm.'+side)
        if style=='reaper':
            rod(parts,'Sleeve'+side,(s*.23,0,H*.72),(s*.41,-.02,H*.42),.17,.12,cloth,'Arm.'+side)
    clips=['Idle','Walk','Run','Attack','Hurt','Death'] if style!='reaper' else ['Idle','Walk','Attack','Cast','Hurt','Death']
    skeleton(parts,identifier,defs,clips,'humanoid')

def serpent():
    identifier='serpente_de_fogo'
    parts=reset(identifier)
    scales=mat('Serpent_Obsidian',(.025,.026,.035),.55,.4)
    lava=mat('Serpent_Magma',(1,.16,.025),emission=3.5)
    armor=mat('Serpent_DarkScale',(.15,.095,.06),.35,.5)
    eye=mat('Serpent_Eyes',(1,.58,.035),emission=3)
    points=[]
    for i in range(12):
        if i<6:
            ang=i*.97
            points.append((math.sin(ang)*.72, math.cos(ang)*.72,.38+i*.018))
        else:
            j=i-6
            points.append((.12*math.sin(j*.55),-.12-j*.035,.52+j*.31))
    defs={'Root':((0,0,0),points[0],None)}
    for i in range(len(points)-1):
        defs['Seg'+str(i)]=(points[i],points[i+1],'Root' if i==0 else 'Seg'+str(i-1))
        center=(Vector(points[i])+Vector(points[i+1]))*.5
        sphere(parts,'MagmaCore'+str(i),center,(.25,.26,.31),lava,'Seg'+str(i))
        sphere(parts,'StoneScale'+str(i),center,(.30,.30,.34),scales,'Seg'+str(i))
        sphere(parts,'ArmorRidge'+str(i),center+Vector((0,.20,.06)),(.22,.10,.18),armor,'Seg'+str(i))
    defs['Head']=(points[-1],(points[-1][0],points[-1][1]-.2,points[-1][2]+.3),'Seg'+str(len(points)-2))
    head=Vector(points[-1])
    sphere(parts,'Head',head,(.37,.32,.24),scales,'Head')
    sphere(parts,'OpenJaw',head+Vector((0,-.24,-.11)),(.32,.27,.1),armor,'Head')
    for s,side in [(-1,'L'),(1,'R')]:
        sphere(parts,'Eye'+side,head+Vector((s*.23,-.20,.10)),(.073,.027,.05),eye,'Head',10)
        for n in range(3):
            pos=head+Vector((s*(.09+n*.09),-.47,.02))
            rod(parts,'Fang'+side+str(n),pos,pos+Vector((0,-.08,-.17)),.033,.002,lava,'Head')
    skeleton(parts,identifier,defs,['Idle','Move','Bite','Fire','Hurt','Death'],'serpent')

humanoid('bruto_do_exilio',2.7,'brute')
humanoid('ceifador',2.3,'reaper')
humanoid('guardiao_reptil',2.2,'reptile')
serpent()
REPORT.write_text(json.dumps(receipts,indent=2)+'\n')
print('GUARDIAN_ROSTER_BUILT',len(receipts))
