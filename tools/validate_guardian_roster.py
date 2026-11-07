"""Portable static GLB structure checker for the four procedural guardians."""
from pathlib import Path
import json,struct
ROOT=Path(__file__).resolve().parents[1]
NAMES={
 'bruto_do_exilio':({'Idle','Walk','Run','Attack','Hurt','Death'},20000),
 'ceifador':({'Idle','Walk','Attack','Cast','Hurt','Death'},18000),
 'guardiao_reptil':({'Idle','Walk','Run','Attack','Hurt','Death'},20000),
 'serpente_de_fogo':({'Idle','Move','Bite','Fire','Hurt','Death'},16000),
}
report=[]
for name,(clips,budget) in NAMES.items():
 path=ROOT/'assets/guardians'/(name+'.glb')
 raw=path.read_bytes()
 magic,version,total=struct.unpack_from('<4sII',raw)
 assert magic==b'glTF' and version==2 and total==len(raw),name
 length,kind=struct.unpack_from('<I4s',raw,12)
 assert kind==b'JSON',name
 doc=json.loads(raw[20:20+length])
 assert doc.get('meshes') and doc.get('skins') and doc.get('animations'),name
 assert doc.get('materials'),name
 tris=0;weighted=False;uv=False
 for mesh in doc['meshes']:
  for prim in mesh['primitives']:
   attrs=prim['attributes']
   assert 'NORMAL' in attrs and 'POSITION' in attrs,name
   weighted|=('JOINTS_0' in attrs and 'WEIGHTS_0' in attrs)
   uv|='TEXCOORD_0' in attrs
   index=prim.get('indices')
   count=doc['accessors'][index]['count'] if index is not None else doc['accessors'][attrs['POSITION']]['count']
   tris+=count//3
 assert weighted and uv,(name,'skinning or uv missing')
 assert 0<tris<=budget,(name,tris,budget)
 actual={a.get('name','').split('_')[-1] for a in doc['animations']}
 assert clips<=actual,(name,sorted(clips-actual))
 assert len(doc['skins'][0]['joints'])>=9,name
 rec={'name':name,'triangles':tris,'clips':sorted(actual),'bytes':len(raw),'passed':True}
 report.append(rec);print('GUARDIAN_ROSTER_PASS',json.dumps(rec))
path=ROOT/'build/guardian_roster_validation.json'
path.parent.mkdir(exist_ok=True)
path.write_text(json.dumps(report,indent=2)+'\n')
print('GUARDIAN_ROSTER_VALIDATED',len(report))
