"""Pure Python structural validation for six Blender-built glTF 2.0 GLBs."""
import json
import struct
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/"assets/ratanaba"
NAMES=["o_banido","curupira","boto","matinta_pereira",
       "mula_sem_cabeca","boitata"]
expected={
 "o_banido":["Idle","Walk","Run","Attack","Dodge","Hurt"],
 "curupira":["Idle","Walk","Run","Attack","Dodge","Hurt"],
 "boto":["Idle","Walk","Run","Attack","Transform","Hurt"],
 "matinta_pereira":["Idle","Walk","Cast","Attack","Dodge","Hurt"],
 "mula_sem_cabeca":["Idle","Trot","Gallop","Charge","Kick","Hurt"],
 "boitata":["Idle","Slither","Bite","Fire","Coil","Hurt"]
}
results=[]
for name in NAMES:
    file=DIR/(name+".glb")
    with file.open("rb") as f:
        header=f.read(20)
        assert len(header)==20,(name,"header")
        magic,version,length,json_len,json_tag=struct.unpack("<4sIIII",header)
        assert magic==b"glTF" and version==2 and length==file.stat().st_size
        assert json_tag==0x4e4f534a,(name,"JSON chunk")
        data=json.loads(f.read(json_len).rstrip(b"\0 "))
    assert data["asset"]["version"]=="2.0"
    assert data.get("meshes") and data.get("skins"),(name,"meshes and skeleton")
    assert len(data.get("animations",[]))>=6,(name,"animations")
    animation_names=[a.get("name","") for a in data["animations"]]
    for c in expected[name]:
        assert any(a.lower().endswith(c.lower()) for a in animation_names),(
            name,c,animation_names)
    assert any(m.get("pbrMetallicRoughness") for m in data.get("materials",[])),(
        name,"PBR material")
    assert data.get("images") and data.get("textures"),(name,"embedded textures")
    triangles=0
    for m in data["meshes"]:
        for p in m["primitives"]:
            assert "JOINTS_0" in p["attributes"],(name,"unskinned mesh")
            if "indices" in p:
                a=data["accessors"][p["indices"]]
                triangles+=a["count"]//3
    assert 1500<triangles<250000,(name,triangles)
    item={"id":name,"triangles":triangles,"skeletons":len(data["skins"]),
          "animations":len(data["animations"]),"bytes":length}
    results.append(item)
    print("RATANABA_CAST_VALID",json.dumps(item))
out=ROOT/"build/ratanaba_cast_validation.json"
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(results,indent=2)+"\n")
print("RATANABA_CAST_PASS",len(results))
