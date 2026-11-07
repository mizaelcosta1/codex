"""Original deterministic production blockouts, metres, Blender -Y forward.
Creates only FOL_* scenes and overwrites its own outputs. Preserve manual edits.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];O=R/'assets/models';O.mkdir(parents=True,exist_ok=True)
random.seed(1842)
for old in list(bpy.data.scenes):
 if old.name.startswith('FOL_'):
  for ob in list(old.objects):bpy.data.objects.remove(ob,do_unlink=True)
  bpy.data.scenes.remove(old)
report=[];mats={}
def mat(n,c,rough=.8,glow=0):
 m=bpy.data.materials.new('MAT_'+n);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough
 if glow:p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=glow
 mats[n]=m;return m
skin=mat('Pele',(.30,.13,.065),.6);dark=mat('Pele_Saci',(.13,.05,.025),.6)
scale=mat('Escamas',(.12,.22,.07));wood=mat('Madeira',(.17,.09,.04));leaf=mat('Folhas',(.08,.22,.05));red=mat('Cabelo',(.45,.06,.015));cap=mat('Gorro',(.6,.02,.01));purple=mat('Xale',(.08,.035,.16));black=mat('Cabelo_preto',(.012,.008,.006));stone=mat('Pedra',(.15,.20,.16));water=mat('Agua',(.025,.22,.28),.25);gold=mat('Ouro',(.6,.28,.035),.4);fire=mat('Fogo',(1,.25,.01),.5,2);ivory=mat('Marfim',(.65,.57,.39));eye=mat('Olho',(.9,.5,.04),.3,.4)
objects=[]
def begin(n):
 global scene,col,objects
 scene=bpy.data.scenes.new('FOL_'+n);bpy.context.window.scene=scene;scene.unit_settings.system='METRIC';col=bpy.data.collections.new('COL_'+n);scene.collection.children.link(col);objects=[]
def own(o,n,m,bone='Root'):
 o.name='SM_'+n
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.materials.append(m);o['bone']=bone;objects.append(o);return o
def ell(n,p,s,m,bone='Root',segments=16):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=10,location=p);o=bpy.context.object;o.scale=s;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for f in o.data.polygons:f.use_smooth=True
 return own(o,n,m,bone)
def box(n,p,s,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.scale=s;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return own(o,n,m)
def tube(n,points,rs,m,bone='Root',sides=12):
 vs=[];fs=[]
 for i,p in enumerate(points):
  tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)]);tangent.normalize();ref=Vector((0,0,1))
  if abs(tangent.dot(ref))>.95:ref=Vector((0,1,0))
  a=tangent.cross(ref).normalized();b=tangent.cross(a).normalized();r=rs[i];rx,ry=(r,r) if isinstance(r,(int,float)) else r
  for j in range(sides):vs.append(tuple(Vector(p)+a*math.cos(j*math.tau/sides)*rx+b*math.sin(j*math.tau/sides)*ry))
  if i:
   for j in range(sides):fs.append(((i-1)*sides+j,(i-1)*sides+(j+1)%sides,i*sides+(j+1)%sides,i*sides+j))
 fs+=[tuple(range(sides-1,-1,-1)),tuple((len(points)-1)*sides+j for j in range(sides))]
 me=bpy.data.meshes.new(n);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(n,me);col.objects.link(o)
 uv=me.uv_layers.new(name='UVMap')
 for f in me.polygons:
  f.use_smooth=True
  for li in f.loop_indices:
   vi=me.loops[li].vertex_index;uv.data[li].uv=((vi%sides)/sides,(vi//sides)/(len(points)-1))
 return own(o,n,m,bone)
def rig(n,H,one=False,fish=False):
 data=bpy.data.armatures.new('ARM_'+n);arm=bpy.data.objects.new('ARM_'+n,data);col.objects.link(arm);bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
 specs={'Root':((0,0,0),(0,0,H*.45),None),'Spine':((0,0,H*.45),(0,0,H*.76),'Root'),'Head':((0,0,H*.76),(0,0,H*1.03),'Spine')}
 for s in [-1,1]:
  specs['Arm'+str(s)]=((s*.25,0,H*.72),(s*.37,0,H*.58),'Spine');specs['Forearm'+str(s)]=((s*.37,0,H*.58),(s*.4,0,H*.4),'Arm'+str(s))
 if fish:specs['Tail']=((0,0,.74),(0,.8,.1),'Root')
 else:
  for s in ([0] if one else [-1,1]):
   specs['Leg'+str(s)]=((s*.12,0,H*.45),(s*.12,0,H*.26),'Root');specs['Shin'+str(s)]=((s*.12,0,H*.26),(s*.12,0,.06),'Leg'+str(s))
 for k,(a,b,parent) in specs.items():
  bone=data.edit_bones.new(k);bone.head=a;bone.tail=b
  if parent:bone.parent=data.edit_bones[parent]
 bpy.ops.object.mode_set(mode='OBJECT')
 for o in objects:
  g=o.vertex_groups.new(name=o.get('bone','Root'));g.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('Rig','ARMATURE');mod.object=arm;o.parent=arm
 for clip in ['Idle','Walk','Attack']:
  arm.animation_data_create();arm.animation_data.action=None
  for frame in [1,9,17,25,33]:
   t=(frame-1)/32*math.tau
   for b in arm.pose.bones:
    b.rotation_mode='XYZ';b.rotation_euler=(0,0,0)
    if clip=='Idle' and b.name=='Spine':b.rotation_euler.x=.035*math.sin(t)
    if clip=='Walk' and b.name.startswith(('Leg','Arm')):b.rotation_euler.x=.35*math.sin(t+(math.pi if '-1' in b.name else 0))
    if clip=='Walk' and b.name=='Tail':b.rotation_euler.z=.15*math.sin(t)
    if clip=='Attack' and b.name=='Arm1':b.rotation_euler.x=-math.sin(t/2)**2
    b.keyframe_insert('rotation_euler',frame=frame,group=b.name)
  action=arm.animation_data.action;action.name=n+'_'+clip;track=arm.animation_data.nla_tracks.new();track.name=action.name;track.strips.new(action.name,1,action);arm.animation_data.action=None
 scene.frame_set(1);scene.render.fps=24

def finish(n):
 bpy.ops.object.select_all(action='DESELECT')
 for ob in objects:ob.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 if len(objects)>1:bpy.ops.object.join()
 ob=bpy.context.object;ob.name='SM_'+n;ob.data.calc_loop_triangles();tris=len(ob.data.loop_triangles);assert tris<20000
 bpy.ops.object.select_all(action='DESELECT')
 for ob in col.objects:ob.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(O/(n+'.glb')),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_draco_mesh_compression_enable=False)
 report.append({'name':n,'triangles':tris,'meshes':1,'budget':20000,'bytes':(O/(n+'.glb')).stat().st_size})
def humanoid(n):
 begin(n);c=n=='cuca';s=n=='saci';fish=n=='iara';H=2.15 if c else 1.65;sm=scale if c else dark if s else skin
 tube('Tronco',[(0,0,H*z) for z in [.42,.48,.56,.64,.72,.77]],[(.18,.14),(.21,.15),(.16,.12),(.23,.16),(.29,.14),(.19,.11)],sm,'Spine',16)
 tube('Pescoco',[(0,0,H*.75),(0,0,H*.84)],[.095,.08],sm,'Head');ell('Cabeca',(0,-.015,H*.88),(.145,.13,.19),sm,'Head',20);ell('Queixo',(0,-.07,H*.815),(.105,.095,.07),sm,'Head')
 if c:
  ell('Focinho',(0,-.23,H*.865),(.14,.27,.085),scale,'Head');ell('Mandibula',(0,-.23,H*.83),(.13,.25,.04),scale,'Head')
  tube('Cauda',[(0,.08,H*.48),(0,.35,.7),(.15,.72,.35),(.4,1.02,.13),(.72,1.12,.08)],[.18,.14,.1,.06,.01],scale)
  for side in [-1,1]:
   for y in [-.13,-.22,-.31,-.4]:tube('Dente',[(side*.12,y,H*.85),(side*.12,y,H*.81)],[.018,.002],ivory,'Head',6)
 else:
  ell('Nariz',(0,-.15,H*.87),(.034,.045,.055),sm,'Head');tube('Boca',[(-.05,-.137,H*.832),(0,-.149,H*.825),(.05,-.137,H*.832)],[.01,.014,.01],black,'Head',8)
 for side in [-1,1]:
  x=side*(.095 if c else .064)
  ell('Olho',(x,-.115,H*.9),(.034,.025,.023),ivory,'Head',12);ell('Iris',(x,-.137,H*.9),(.013,.009,.016),eye,'Head',10)
  ell('Pupila',(x,-.144,H*.9),(.005,.004,.012),black,'Head',8);ell('Orelha',(side*.145,0,H*.88),(.025,.04,.055),sm,'Head',10)
  shoulder=(side*.255,0,H*.72);elbow=(side*.37,-.015,H*.58);wrist=(side*.40,-.04,H*.46)
  tube('Braco',[shoulder,(side*.32,0,H*.67),elbow],[.095,.085,.065],sm,'Arm'+str(side));tube('Antebraco',[elbow,(side*.405,-.02,H*.52),wrist],[.065,.07,.045],sm,'Forearm'+str(side));ell('Mao',(side*.4,-.04,H*.435),(.06,.045,.085),sm,'Forearm'+str(side))
  for j in range(4):
   x=side*(.365+j*.023);tube('Dedo',[(x,-.05,H*.415),(x,-.065,H*.365+j*.006)],[.012,.009],sm,'Forearm'+str(side),6)
   if c:tube('Garra',[(x,-.065,H*.365+j*.006),(x,-.10,H*.34+j*.006)],[.011,.001],ivory,'Forearm'+str(side),6)
 if not fish:
  for side in ([0] if s else [-1,1]):
   x=side*.12;tube('Coxa',[(x,0,H*.46),(x,-.01,H*.34),(x,0,H*.26)],[.115,.1,.065],sm,'Leg'+str(side));tube('Canela',[(x,0,H*.26),(x,.025,H*.18),(x,0,.12)],[.065,.07,.04],sm,'Shin'+str(side));fy=.085 if n=='curupira' else -.07
   ell('Pe',(x,fy,.065),(.07,.15,.065),sm,'Shin'+str(side))
   for j in range(4):ell('Dedo_pe',(x-.043+j*.028,fy+(.12 if n=='curupira' else -.12),.045),(.017,.035,.025),sm,'Shin'+str(side),8)
 else:
  tube('Cauda',[(0,0,.74),(.04,.06,.53),(.12,.18,.30),(.16,.42,.16),(.07,.69,.1),(-.05,.94,.11)],[(.2,.17),(.22,.17),(.18,.14),(.12,.09),(.07,.05),(.03,.03)],water,'Tail',20)
  for side in [-1,1]:
   tube('Nadadeira',[(-.05,.92,.11),(side*.22,1.05,.15),(side*.4,1.13,.21)],[(.04,.03),(.15,.025),(.01,.005)],water,'Tail',14);ell('Top',(side*.1,-.125,H*.68),(.12,.06,.08),leaf,'Spine')
 if s:
  tube('Short',[(0,0,H*.47),(0,0,H*.4)],[(.22,.17),(.18,.15)],cap);tube('Gorro',[(0,0,H*.98),(0,0,H*1.06),(.05,0,H*1.15),(.16,-.01,H*1.17)],[(.15,.14),(.12,.1),(.07,.06),(.005,.005)],cap,'Head',16)
 elif n=='curupira':
  tube('Tanga',[(0,0,H*.49),(0,0,H*.38)],[(.23,.18),(.26,.2)],leaf)
  for j in range(25):
   a=j*math.tau/25;x=.13*math.cos(a);y=.12*math.sin(a);tube('Cabelo',[(x,y,H*.94),(x*1.25,y*1.25,H*1.02),(x*1.15,y*1.7+.06,H*1.1+random.random()*.05)],[.045,.035,.002],red,'Head',8)
 elif c:
  tube('Saia',[(0,0,H*.49),(0,0,H*.28),(0,0,.055)],[(.24,.2),(.35,.29),(.43,.34)],wood,sides=24)
  for side in [-1,1]:tube('Xale',[(side*.06,.03,H*.78),(side*.25,.02,H*.73),(side*.36,.055,H*.6)],[(.16,.14),(.18,.15),(.09,.06)],purple,'Spine')
 if c or fish:
  for j in range(20):
   a=j*math.pi/19;tube('Cabelo_longo',[(.13*math.cos(a),.11*math.sin(a),H*.975),(.17*math.cos(a),.15*math.sin(a),H*.88),(.22*math.cos(a),.20*math.sin(a)+.04,H*.62)],[.028,.025,.004],ivory if c else black,'Head',8)
 rig(n,H,s,fish);finish(n)
for n in ['curupira','saci','cuca','iara']:humanoid(n)
begin('boitata');points=[];rs=[]
for i in range(65):
 t=i/64;points.append((math.sin(t*math.tau)*.65,t*3.8,.24+math.sin(t*math.pi)*.25));rs.append(.025+.19*math.sin(t*math.pi*.85))
tube('Corpo',points,rs,scale,sides=16);p=points[-1];ell('Cabeca',p,(.28,.38,.19),scale)
for s in [-1,1]:ell('Olho',(p[0]+s*.18,p[1]+.18,p[2]+.08),(.065,.08,.06),fire)
for i in range(4,63,3):
 x,y,z=points[i];r=rs[i];tube('Chama',[(x,y,z+r*.7),(x+.05,y,z+r+.15),(x-.04,y+.08,z+r+.32)],[.07,.05,.001],fire,sides=7)
finish('boitata')
begin('arvore');tube('Tronco',[(0,0,0),(.05,0,1.5),(-.1,.03,3),(0,.06,4.5)],[.38,.28,.2,.1],wood)
for j in range(7):
 a=j*math.tau/7;tube('Raiz',[(0,0,.5),(.5*math.cos(a),.5*math.sin(a),.12),(math.cos(a),math.sin(a),.02)],[.16,.12,.015],wood,sides=8);tube('Galho',[(0,0,2.8),(.8*math.cos(a),.8*math.sin(a),3.5),(1.2*math.cos(a),1.2*math.sin(a),4.1)],[.13,.075,.015],wood,sides=8);ell('Copa',(math.cos(a),math.sin(a),4.1+random.random()*.5),(1.1,.9,.65),leaf,segments=12)
ell('Copa_topo',(0,0,4.9),(1.2,1,.75),leaf,segments=12);finish('arvore')
begin('pedra');ell('Rocha',(0,0,.35),(.8,.65,.65),stone,segments=12)
for v in objects[0].data.vertices:v.co*=random.uniform(.85,1.15)
finish('pedra')
begin('samambaia')
for j in range(9):
 a=j*math.tau/9
 for i in range(1,5):
  t=i/5;p=(math.cos(a)*t*.7,math.sin(a)*t*.7,math.sin(t*math.pi)*.5);o=ell('Fronda',p,(.22*(1-t*.7),.045,.015),leaf,segments=8);o.rotation_euler.z=a+math.pi/2
finish('samambaia')
begin('altar')
for z,r in [(.12,.8),(.3,.65),(.52,.45)]:
 bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=.24,location=(0,0,z));own(bpy.context.object,'Pedra',stone)
ell('Cristal',(0,0,1.05),(.18,.18,.42),gold,segments=8);finish('altar')
begin('ponte')
for i in range(14):box('Tabua',(-1.95+i*.3,0,.15),(.28,1.4,.12),wood)
for x in [-2,2]:
 for y in [-.68,.68]:tube('Poste',[(x,y,0),(x,y,1.1)],[.07,.06],wood,sides=8)
for y in [-.68,.68]:tube('Corrimao',[(-2,y,1.),(0,y,.85),(2,y,1.)],[.045,.045,.045],wood,sides=8)
finish('ponte')
begin('cabana');box('Piso',(0,0,.12),(3,2.6,.24),wood)
for x in [-1.35,1.35]:
 for y in [-1.1,1.1]:box('Pilar',(x,y,1.2),(.16,.16,2.4),wood)
for x in [-1.4,1.4]:
 for z in [.45,.75,1.05,1.35]:box('Parede',(x,0,z),(.12,2.4,.26),wood)
for side in [-1,1]:o=box('Telhado',(side*.8,0,2.6),(1.9,3.1,.16),wood);o.rotation_euler.y=side*.38
finish('cabana')
begin('orbe');ell('Semente',(0,0,.3),(.19,.19,.28),gold,segments=12);finish('orbe')
bpy.context.window.scene=bpy.data.scenes['FOL_curupira'];bpy.ops.wm.save_as_mainfile(filepath=str(R/'art_source/folclore_assets.blend'));(R/'docs/assets_manifest.json').write_text(json.dumps(report,indent=2)+'\n');print('ALL_ASSETS_COMPLETE',len(report))
