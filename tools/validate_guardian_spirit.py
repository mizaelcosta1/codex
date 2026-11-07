"""Read-only GLB structural validation, independent of Blender or a paid API."""
import json,struct,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/'assets/guardians/espirito_da_mata.glb'
REPORT=ROOT/'build/guardian_spirit_validation.json'
EXPECTED={'Idle','Walk','Run','Attack','Hurt','Death'}
def validate():
    raw=PATH.read_bytes()
    magic,version,total=struct.unpack_from('<4sII',raw)
    assert magic==b'glTF' and version==2 and total==len(raw),'Invalid GLB header'
    chunks={};pos=12
    while pos<total:
        length,kind=struct.unpack_from('<I4s',raw,pos);pos+=8
        chunks[kind]=raw[pos:pos+length];pos+=length
    assert pos==total and b'JSON' in chunks and b'BIN\x00' in chunks,'Invalid chunks'
    data=json.loads(chunks[b'JSON'])
    assert data.get('meshes') and data.get('skins') and data.get('animations'),'Missing mesh, rig or animations'
    assert data.get('materials') and all('pbrMetallicRoughness' in m for m in data['materials']),'Missing PBR'
    tris=0;has_uv=False;has_skin=False
    for mesh in data['meshes']:
        for p in mesh['primitives']:
            a=p['attributes']
            assert 'POSITION' in a and 'NORMAL' in a,'Missing mesh attributes'
            assert p.get('mode',4)==4,'Not triangle geometry'
            has_uv|='TEXCOORD_0' in a
            has_skin|=('WEIGHTS_0' in a and 'JOINTS_0' in a)
            count=data['accessors'][p['indices']]['count'] if 'indices' in p else data['accessors'][a['POSITION']]['count']
            tris+=count//3
    assert 100<tris<=18000,f'Triangle budget failed: {tris}'
    assert has_uv and has_skin,'Missing UV or skin weights'
    names={a.get('name','').split('_')[-1] for a in data['animations']}
    assert EXPECTED<=names,f'Missing clips: {sorted(EXPECTED-names)}'
    assert len(data['skins'][0].get('joints',[]))>=11,'Incomplete skeleton'
    return {'passed':True,'asset':PATH.name,'triangles':tris,'clips':sorted(names),'skins':len(data['skins']),'materials':len(data['materials']),'bytes':len(raw)}
if __name__=='__main__':
    try:
        result=validate()
        REPORT.parent.mkdir(exist_ok=True)
        REPORT.write_text(json.dumps(result,indent=2)+'\n')
        print('GUARDIAN_SPIRIT_PASS',json.dumps(result))
    except Exception as error:
        print('GUARDIAN_SPIRIT_FAIL',repr(error),file=sys.stderr)
        raise
