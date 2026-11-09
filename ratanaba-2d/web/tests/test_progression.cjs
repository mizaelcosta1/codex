'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {fixture}=require('./test_engine_regressions.cjs'),W=require('../world.js');
const step=(g,n)=>{for(let i=0;i<n;i++)g.update(1/60);};
function defeatCurupira(g){g.warp(5480);g.state.p.inv=100;g.inflict(g.state.boss,2000,1,'heavy');step(g,10);}
function move(g,x,frames=300){for(let i=0;i<frames;i++){const d=x-g.state.p.x;g.keys.delete('left');g.keys.delete('right');if(Math.abs(d)<4){step(g,20);return;}g.keys.add(d>0?'right':'left');step(g,1);}throw Error('cannot reach x='+x+' at '+JSON.stringify(g.state.p));}
function drop(g){g.keys.add('down');g.pressed.add('jump');step(g,1);g.keys.delete('down');for(let i=0;i<150;i++){step(g,1);if(g.state.p.ground)return;}throw Error('drop never landed');}
const tests={
 'old Curupira-complete saves open the descent without ending play':async({g,local})=>{
  local.set('ratanaba_web_v02',JSON.stringify({level:4,bossDead:true,seals:[true,true,true,true],checkpoint:{x:4750,y:620},materials:[3,2,1,0],essence:37}));
  assert(g.restore());assert.equal(g.state.won,false);assert.equal(g.state.boss.state,'dead');assert.equal(g.state.level,4);assert.equal(g.state.essence,37);assert(!W.platforms(g.state).some(f=>f.x===5750&&f.y===620));
 },
 'living Curupira keeps the shaft closed':async({g})=>{g.warp(5900);g.state.p.inv=100;step(g,90);assert.equal(g.state.p.y,620);assert.equal(g.state.camY,0);},
 'walk and drop from Curupira to the lower altar and Boitata arena':async({g})=>{
  defeatCurupira(g);move(g,5940);step(g,120);assert(g.state.p.y>620);assert(g.state.camY>0);assert.equal(g.state.won,false);
  for(let i=0;i<10&&g.state.p.y<1580;i++)drop(g);
  assert.equal(g.state.p.y,1580);move(g,5480);g.interact();assert.equal(g.state.checkpoint.y,1580);
  g.keys.clear();g.persist();g.start(true);assert.equal(g.state.p.y,1580);assert.equal(g.state.area,3);assert(g.state.camY>0);
  g.state.p.inv=100;move(g,5850);for(let i=0;i<10&&g.state.p.y<2220;i++)drop(g);assert.equal(g.state.p.y,2220);move(g,5510);assert.notEqual(g.state.boitata.state,'dormant');
 },
 'Boitata has distinct telegraphed attacks and a repeatable death restart':async({g})=>{
  defeatCurupira(g);g.warp(5500,2220);g.state.p.inv=100;step(g,1);assert.equal(g.state.boitata.state,'watch');step(g,90);assert.equal(g.state.boitata.state,'windup');step(g,75);assert.equal(g.state.boitata.state,'charge');
  Object.assign(g.state.boitata,{state:'watch',timer:0,cycle:1});step(g,1);step(g,75);assert.equal(g.state.boitata.state,'embers');assert(g.state.hazards.some(h=>h.owner==='boitata'&&h.y===2220));
  g.state.checkpoint={x:5480,y:1580};g.state.p.inv=0;g.damage(9999);assert.equal(g.state.p.y,1580);assert.equal(g.state.boitata.state,'dormant');assert.equal(g.state.boitata.hp,620);assert.equal(g.state.boss.state,'dead');
 },
 'the descent is climbable using existing jump physics':async({g})=>{
  defeatCurupira(g);g.state.boitata.state='dead';g.state.boitata.hp=0;g.warp(5830,2220);
  const targets=[...W.DEPTH.filter(f=>f.h<30)].reverse().concat([{x:5610,y:620,w:140,h:100}]);
  for(const f of targets){g.keys.clear();g.pressed.add('jump');let landed=false;
   for(let i=0;i<150;i++){const targetX=f.x+f.w/2,d=targetX-g.state.p.x;g.keys.delete('left');g.keys.delete('right');if(Math.abs(d)>10)g.keys.add(d>0?'right':'left');step(g,1);if(g.state.p.ground&&Math.abs(g.state.p.y-f.y)<2){landed=true;break;}}
   assert(landed,'unclimbable step at y='+f.y+' player='+JSON.stringify(g.state.p));
  }
  assert.equal(g.state.p.y,620);
 },
 'background mixtures stay normalized and continuous in both directions':async()=>{
  for(const boundary of [1900,3900]){const a=W.backgroundAt({x:boundary-.1,y:620}),b=W.backgroundAt({x:boundary+.1,y:620});assert(Math.max(...a.map((v,i)=>Math.abs(v-b[i])))<.001);}
  let weights=W.backgroundAt({x:5480,y:620}),previous=weights;
  for(const y of [...Array.from({length:160},(_,i)=>620+i*10),...Array.from({length:160},(_,i)=>2220-i*10)]){weights=W.blend(weights,W.backgroundAt({x:5850,y}),1/60);assert(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-8);assert(weights.every(v=>v>=0&&v<=1));assert(Math.max(...weights.map((v,i)=>Math.abs(v-previous[i])))<.06);previous=weights;}
 },
 'both guardians have independent unique rewards even when the bag is full':async({g,context})=>{
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../rpg.js'),'utf8'),context);const r=context.window.RatanabaRPG;
  g.state.rpg.inventory=Array.from({length:24},()=>({id:'bone',qty:99}));defeatCurupira(g);g.inflict(g.state.boitata,3000,1,'heavy');
  assert.equal(g.state.rpg.aura,50);assert.equal(g.state.rpg.pending.length,2);g.persist();g.restore();assert.equal(g.state.rpg.pending.length,2);
  g.state.rpg.inventory.pop();g.state.running=true;r.tick(.02);assert.equal(g.state.rpg.pending.length,1);g.state.rpg.inventory.splice(0,1);r.tick(.02);assert.equal(g.state.rpg.pending.length,0);assert(g.state.rpg.inventory.some(i=>i.id==='curupira_relic'));assert(g.state.rpg.inventory.some(i=>i.id==='boitata_scale'));
  const aura=g.state.rpg.aura;g.inflict(g.state.boitata,3000,1,'heavy');assert.equal(g.state.rpg.aura,aura);
 },
 'deep loot and essence retain their vertical location after save reload':async({g,context})=>{
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../rpg.js'),'utf8'),context);defeatCurupira(g);g.warp(5850,2220);g.state.checkpoint={x:5480,y:1580};g.state.essence=19;g.die();g.persist();g.restore();assert.equal(g.state.stain.y,2220);assert.equal(g.state.stain.value,19);assert.equal(g.state.p.y,1580);
 }
};
(async()=>{let failed=0;for(const [name,test] of Object.entries(tests))try{await test(await fixture());console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}if(failed)process.exitCode=1;else console.log('RESULT '+JSON.stringify({passed:Object.keys(tests).length}));})();
