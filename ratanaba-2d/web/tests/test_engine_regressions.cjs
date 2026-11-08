'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
async function fixture(){
 const calls=[],gradient={addColorStop(){}},ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,drawImage(...args){calls.push(args);}},{get:(o,k)=>o[k]||(()=>{})});
 const nodes=new Map(),node=s=>{if(!nodes.has(s))nodes.set(s,{getContext:()=>ctx,style:{},classList:{toggle(){},add(){}},checked:false,hidden:false});return nodes.get(s);};
 const local=new Map(),context={console,Math,JSON,Map,Set,Promise,Error,document:{querySelector:node,querySelectorAll:()=>[],body:node('body')},matchMedia:()=>({matches:false}),addEventListener(){},requestAnimationFrame(){},localStorage:{getItem:k=>local.get(k),setItem:(k,v)=>local.set(k,v)},Image:class{constructor(){this.naturalWidth=800;this.naturalHeight=800;this.complete=true;}set src(s){this._src=s;Promise.resolve().then(()=>this.onload?.());}},Audio:class{play(){return Promise.resolve();}pause(){}},window:{}};
 vm.createContext(context);for(const file of ['elemental.js','game.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));const g=context.window.Ratanaba;g.start();return {g,local,calls};
}
const tests={
 'lethal boss charge ends the old encounter before recovery':async({g})=>{
  g.warp(5480);g.state.seals.fill(true);Object.assign(g.state.boss,{state:'charge',timer:.001,dir:1,cycle:5});g.state.hp=1;
  g.update(1/60);assert.equal(g.state.p.x,g.state.checkpoint.x);assert.equal(g.state.boss.state,'dormant');assert.equal(g.state.boss.cycle,0);
 },
 'lethal enemy attack cannot reward another enemy from the old life':async({g})=>{
  g.warp(650);g.state.hp=1;Object.assign(g.state.enemies[0],{state:'windup',timer:0});Object.assign(g.state.enemies[1],{hp:.01,poison:1});
  g.update(1/60);assert.equal(g.state.p.x,g.state.checkpoint.x);assert.equal(g.state.drops.length,0);assert(g.state.enemies.every(e=>e.hp===e.max));
 },
 'each elemental seal survives an immediate save reload':async({g})=>{
  g.warp(2200);g.state.element=0;g.hitAttack({kind:'light',stage:1});assert.equal(g.state.seals[0],true);assert.equal(g.restore(),true);assert.equal(g.state.seals[0],true);
 },
 'death clears loose essence drops before monsters respawn':async({g})=>{
  g.inflict(g.state.enemies[0],1000,1,'heavy');assert.equal(g.state.drops.length,1);g.die();assert.equal(g.state.drops.length,0);
 },
 'lethal boss roots do not crash the hazard iteration':async({g})=>{
  g.warp(5200);g.state.seals.fill(true);Object.assign(g.state.boss,{state:'roots',timer:1.2});g.state.hp=1;g.state.hazards=[0,1,2].map(()=>({x:5200,t:0,damage:999}));
  assert.doesNotThrow(()=>g.update(1/60));assert.equal(g.state.p.x,g.state.checkpoint.x);assert.equal(g.state.hazards.length,0);
 },
 'altar chests use the same camera coordinates as the world':async({g,calls})=>{
  g.warp(4750);calls.length=0;g.render();const chest=calls.find(a=>a[0]._src?.endsWith('chest_rarities.svg')&&a[1]===256);assert(chest);assert.equal(chest[5],4750-42-g.state.cam);
 }
};
(async()=>{let failed=0;for(const [label,test] of Object.entries(tests)){try{await test(await fixture());console.log('PASS '+label);}catch(e){failed++;console.error('FAIL '+label+'\n'+e.stack);}}if(failed)process.exitCode=1;else console.log('RESULT '+JSON.stringify({passed:Object.keys(tests).length}));})();
