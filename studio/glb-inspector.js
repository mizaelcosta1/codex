(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.RatanabaGLB=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const CHARACTERS={banido:45000,curupira:35000,boitata:45000,mula_sem_cabeca:45000,boto:35000,matinta_pereira:40000};
const CLIPS=["Idle","Walk","Run","Attack","Hurt","Death"],SERPENT=["Idle","Move","Bite","Fire","Hurt","Death"];
const MAX_BYTES=104857600;
function inspect(input,character){
if(!Object.hasOwn(CHARACTERS,character))throw Error("Personagem desconhecido");
const b=input instanceof ArrayBuffer?new Uint8Array(input):ArrayBuffer.isView(input)?new Uint8Array(input.buffer,input.byteOffset,input.byteLength):null;
if(!b||b.length<20||b.length>MAX_BYTES)throw Error("Arquivo GLB invalido ou maior que 100 MiB");
const v=new DataView(b.buffer,b.byteOffset,b.length);
if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2)throw Error("Assinatura ou versao GLB invalida");
if(v.getUint32(8,true)!==b.length)throw Error("Tamanho declarado invalido");
let p=12,json=null,chunks=0;
while(p<b.length){
if(p+8>b.length)throw Error("Cabecalho de bloco truncado");
const n=v.getUint32(p,true),kind=v.getUint32(p+4,true);p+=8;
if(n%4||n>b.length-p)throw Error("Bloco truncado ou desalinhado");
if(chunks===0){if(kind!==0x4e4f534a||n>16777216)throw Error("Bloco JSON invalido");json=b.subarray(p,p+n);}
else if(chunks>1||kind!==0x004e4942)throw Error("Blocos extras invalidos");
p+=n;chunks++;
}
let d;try{d=JSON.parse(new TextDecoder().decode(json));}catch(e){throw Error("JSON glTF invalido");}
if(d.asset?.version!=="2.0"||!Array.isArray(d.meshes)||!d.meshes.length)throw Error("glTF 2.0 sem malha");
const accessors=d.accessors||[];let tri=0,count=0,uv=0,normal=0,weighted=0;
for(const m of d.meshes){for(const primitive of m.primitives||[]){
const a=primitive.attributes||{};if(!Number.isInteger(a.POSITION)||!accessors[a.POSITION])throw Error("POSITION ausente");
if((primitive.mode??4)!==4)throw Error("Primitiva nao triangular");
const idx=primitive.indices??a.POSITION,acc=accessors[idx];
if(!acc||!Number.isSafeInteger(acc.count)||acc.count<3||acc.count%3)throw Error("Accessor invalido");
tri+=acc.count/3;count++;if(a.TEXCOORD_0!==undefined)uv++;if(a.NORMAL!==undefined)normal++;
if(a.JOINTS_0!==undefined&&a.WEIGHTS_0!==undefined)weighted++;
}}
if(!count)throw Error("Sem primitivas");
const mats=d.materials||[],imgs=d.images||[],skins=d.skins||[],anims=d.animations||[];
const names=anims.map(x=>String(x.name||"")),missing=(character==="boitata"?SERPENT:CLIPS).filter(c=>!names.some(n=>n.toLowerCase().endsWith(c.toLowerCase())));
const warnings=[];
if(!mats.length||!mats.some(m=>m.pbrMetallicRoughness))warnings.push("Materiais PBR incompletos");
if(!imgs.length)warnings.push("Texturas de imagem ausentes");
if(imgs.some(i=>i.uri&&!i.uri.startsWith("data:")))warnings.push("Texturas externas");
if(uv!==count||normal!==count)warnings.push("UV0 ou normais incompletas");
if(!skins.length||weighted!==count)warnings.push("Rig/skinning incompleto");
if(missing.length)warnings.push("Animações pendentes: "+missing.join(", "));
if(tri>CHARACTERS[character])warnings.push("Acima do orcamento de triangulos Android");
return {schema:"ratanaba-glb-preflight-v1",character,bytes:b.length,meshes:d.meshes.length,triangles:tri,android_budget:CHARACTERS[character],materials:mats.length,textures:imgs.length,skins:skins.length,animations:names,warnings,structural_pass:true,candidate_for_engine_review:warnings.length===0,godot_import:"NAO_TESTADO",visual_review:"PENDENTE",device_fps:"NAO_TESTADO",license:"PENDENTE"};
}
return{CHARACTERS,MAX_BYTES,inspect};
});