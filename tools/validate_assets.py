"""Check real GLB buffers, isolation, indices and skinned animation clips."""
from pathlib import Path
import json,struct,math
root=Path(__file__).resolve().parents[1];(root/'build').mkdir(exist_ok=True);manifest=json.loads((root/'docs/assets_manifest.json').read_text());results=[]
for asset in manifest:
 p=root/'assets/models'/(asset['name']+'.glb');raw=p.read_bytes();magic,version,total=struct.unpack_from('<4sII',raw)
 assert magic==b'glTF' and version==2 and total==len(raw)
 size,kind=struct.unpack_from('<I4s',raw,12);assert kind==b'JSON';doc=json.loads(raw[20:20+size]);pos=20+size
 length,kind=struct.unpack_from('<I4s',raw,pos);assert kind==b'BIN\0';binary=raw[pos+8:pos+8+length]
 assert len(doc['scenes'])==1 and len(doc['meshes'])==1,p.name
 def values(index):
  a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']];fmt={5126:'f',5123:'H',5125:'I',5121:'B'}[a['componentType']];n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];stride=v.get('byteStride',struct.calcsize('<'+fmt*n));offset=v.get('byteOffset',0)+a.get('byteOffset',0)
  return [struct.unpack_from('<'+fmt*n,binary,offset+i*stride) for i in range(a['count'])]
 triangles=0;vertices=0;weighted=0
 for primitive in doc['meshes'][0]['primitives']:
  attributes=primitive['attributes'];positions=values(attributes['POSITION']);vertices+=len(positions)
  assert 'NORMAL' in attributes and 'TEXCOORD_0' in attributes
  assert all(all(math.isfinite(x) for x in p) for p in positions)
  triangles+=len(values(primitive['indices']))//3
  if 'WEIGHTS_0' in attributes:
   weights=values(attributes['WEIGHTS_0']);assert all(abs(sum(w)-1)<.01 for w in weights);weighted+=len(weights)
 assert triangles==asset['triangles'] and triangles<=asset['budget']
 animated=asset['name'] in ['curupira','saci','cuca','iara'];clips=[a.get('name','') for a in doc.get('animations',[])]
 if animated:
  assert doc.get('skins') and weighted==vertices
  assert len(clips)==3 and all(any(c in name for name in clips) for c in ['Idle','Walk','Attack']),(p.name,clips)
 if asset['name']=='saci':
  joint_names=[doc['nodes'][n].get('name','') for skin in doc['skins'] for n in skin['joints']]
  assert sum(name=='Leg0' for name in joint_names)==1 and not any(name.startswith('Leg-') or name=='Leg1' for name in joint_names)
 results.append({'asset':p.name,'triangles':triangles,'clips':clips,'skin_weights_valid':animated,'passed':True})
(root/'build/assets_validation.json').write_text(json.dumps(results,indent=2)+'\n');print(f'{len(results)}/{len(manifest)} GLB assets passed')
