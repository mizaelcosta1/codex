'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
async function fixture(){
 const calls=[],gradient={addColorStop(){}};
 const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,drawImage(...args){calls.push(args);}},
  {get:(o,k)=>o[k]||(()=>{})});
 const nodes=new Map(),node=s=>{if(!nodes.has(s))nodes.set(s,{getContext:()=>ctx,style:{},classList:{toggle(){},add(){}},checked:false,hidden:false});return nodes.get(s);};
 const local=new Map();
 const context={console,Math,JSON,Map,Set,Promise,Error,document:{querySelector:node,querySelectorAll:()=>[],body:node('body')},
  matchMedia:()=>({matches:false}),addEventListener(){},requestAnimationFrame(){},
  localStorage:{getItem:k=>local.get(k),setItem:(k,v)=>local.set(k,v)},
  Image:class{constructor(){this.naturalWidth=800;this.naturalHeight=800;this.complete=true;}set src(s){this._src=s;Promise.resolve().then(()=>this.onload?.());}},
  Audio:class{play(){return Promise.resolve();}pause(){}},window:{}};
 vm.createContext(context);
 for(const file of ['elemental.js','game.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 const g=context.window.Ratanaba;g.start(false);g.state.sound=false;return {g,local,calls};
}
const tests={
 'Curupira defeat opens a descending path to a fourth region without ending the game':async({g})=>{
  Object.assign(g.state.boss,{state:'dead',hp:0});g.warp(5900);g.keys.add('right');
  for(let i=0;i<250;i++)g.update(1/60);
  g.keys.delete('right');
  assert.equal(g.state.area,3);assert(g.state.p.x>6500);assert(g.state.p.y>700);assert.equal(g.state.won,false);
 },
 'the Vale has both original fire enemy types and a dormant background boss':async({g})=>{
  assert(g.state.enemies.some(e=>e.type===3&&e.home>6300),'Cães de Cinza');
  assert(g.state.enemies.some(e=>e.type===4&&e.home>6300),'Fogos-Fátuos');
  assert.equal(g.state.boitata.state,'dormant');
 },
 'Boi-Tatá awakens after entering its arena and announces an attack':async({g})=>{
  Object.assign(g.state.boss,{state:'dead',hp:0});g.warp(7750,990);g.update(1/60);
  assert.equal(g.state.boitata.state,'watch');
  g.state.boitata.timer=0;g.update(1/60);
  assert(g.state.hazards.some(h=>h.kind==='fang'||h.kind==='fire'||h.kind==='sweep'));
 },
 'club hits the exposed head during the recovery window':async({g})=>{
  Object.assign(g.state.boss,{state:'dead',hp:0});
  g.warp(7850,990);g.state.p.facing=1;
  Object.assign(g.state.boitata,{state:'recover',x:7930,y:990,hp:200,timer:1});
  g.hitAttack({kind:'heavy',stage:0});
  assert(g.state.boitata.hp<200);
 },
 'defeating Boi-Tatá saves the next victory without duplicating the Curupira reward':async({g})=>{
  Object.assign(g.state.boss,{state:'dead',hp:0});g.warp(7850,990);
  Object.assign(g.state.boitata,{state:'recover',x:7930,y:990,hp:1,timer:1});
  g.hitAttack({kind:'heavy',stage:0});assert.equal(g.state.boitata.state,'dead');assert.equal(g.state.won,true);
  g.state.checkpoint={x:6630,y:990};g.persist();assert.equal(g.restore(),true);
  assert.equal(g.state.boss.state,'dead');assert.equal(g.state.boitata.state,'dead');
  assert.equal(g.state.checkpoint.y,990);
 },
 'the background crossfades at the pre-existing area boundary':async({g,calls})=>{
  g.warp(1900);calls.length=0;g.render();
  const slices=new Set(calls.filter(a=>a[0]?._src?.includes('environments.webp')).map(a=>a[2]));
  assert(slices.size>=2,'two neighboring backgrounds should be blended');
 }
};
(async()=>{let failed=0;for(const [name,test] of Object.entries(tests)){try{await test(await fixture());console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}if(failed)process.exitCode=1;else console.log('RESULT '+JSON.stringify({passed:Object.keys(tests).length}));})();
