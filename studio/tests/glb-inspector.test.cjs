const t=require("node:test"),a=require("node:assert/strict"),m=require("../glb-inspector.js");
function f(doc){const d=Buffer.from(JSON.stringify(doc)),n=(d.length+3)&~3,b=Buffer.alloc(20+n,32);b.writeUInt32LE(0x46546c67,0);b.writeUInt32LE(2,4);b.writeUInt32LE(b.length,8);b.writeUInt32LE(n,12);b.writeUInt32LE(0x4e4f534a,16);d.copy(b,20);return b}
function example(){return{asset:{version:"2.0"},accessors:[{count:12}],meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:0,TEXCOORD_0:0,JOINTS_0:0,WEIGHTS_0:0},indices:0}]}],materials:[{pbrMetallicRoughness:{}}],images:[{bufferView:0}],skins:[{joints:[0,1,2,3,4,5,6,7,8]}],animations:["Idle","Walk","Run","Attack","Hurt","Death"].map(n=>({name:n}))}}
t("6 personagens",()=>a.equal(Object.keys(m.CHARACTERS).length,6));
t("GLB positivo é só candidato",()=>{const r=m.inspect(f(example()),"banido");a.equal(r.triangles,4);a.equal(r.candidate_for_engine_review,true);a.equal(r.godot_import,"NAO_TESTADO")});
t("assinatura incorreta",()=>a.throws(()=>m.inspect(Buffer.alloc(20),"banido"),/Assinatura/));
t("tamanho declarado incorreto",()=>{const b=f(example());b.writeUInt32LE(10,8);a.throws(()=>m.inspect(b,"banido"),/Tamanho/)});
t("malha ausente",()=>{let x=example();x.meshes=[];a.throws(()=>m.inspect(f(x),"banido"),/malha/)});
t("animacoes ausentes",()=>{let x=example();x.animations=[];a.equal(m.inspect(f(x),"banido").candidate_for_engine_review,false)});
t("limite de poligonos",()=>{let x=example();x.accessors[0].count=150003;a.ok(m.inspect(f(x),"banido").warnings.some(w=>w.includes("orcamento")))});
t("personagem desconhecido",()=>a.throws(()=>m.inspect(f(example()),"x"),/desconhecido/));
