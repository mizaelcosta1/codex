'use strict';
/* Shared world geometry and presentation. No engine state is hidden in this module. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.RatanabaWorld=api;if(root.window)root.window.RatanabaWorld=api;})(globalThis,function(){
 const NAMES=['Cripta do Nome Apagado','Claustro das Águas Mortas','Floresta Invertida','Vale das Cinzas'];
 const ALTARS=[{x:170,y:620},{x:2000,y:620},{x:4750,y:620},{x:5480,y:1580}];
 const SURFACE=[{x:0,y:620,w:2400,h:100},{x:2560,y:620,w:3190,h:100},{x:400,y:495,w:170,h:22},{x:740,y:405,w:180,h:22},{x:1080,y:345,w:240,h:22},{x:1480,y:490,w:220,h:22},{x:2100,y:485,w:180,h:22},{x:2440,y:550,w:85,h:22},{x:2850,y:480,w:210,h:22},{x:3210,y:390,w:210,h:22},{x:3550,y:490,w:150,h:22},{x:4150,y:500,w:200,h:22},{x:4570,y:435,w:220,h:22},{x:5050,y:495,w:190,h:22},{x:5550,y:480,w:200,h:22}];
 // Every upward step is <= 140 px; the existing jump reaches about 168 px.
 const DEPTH=[...Array.from({length:6},(_,i)=>({x:i%2?5770:5660,y:760+i*140,w:220,h:22})),{x:5350,y:1580,w:650,h:22},...Array.from({length:4},(_,i)=>({x:i%2?5660:5500,y:1720+i*140,w:250,h:22})),{x:4100,y:2220,w:1900,h:100}];
 const CLOSED={x:5750,y:620,w:250,h:100};
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
 const platforms=s=>s.boss.state==='dead'?[...SURFACE,...DEPTH]:[...SURFACE,CLOSED];
 const areaAt=p=>p.y>1050?3:p.x<1900?0:p.x<3900?1:2;
 const cameraY=y=>clamp((y-620)*1.3,0,1600);
 function backgroundAt(p){const a=smooth(1640,2160,p.x),b=smooth(3640,4160,p.x),depth=smooth(740,1640,p.y);return [(1-a)*(1-depth),(a-b)*(1-depth),b*(1-depth),depth];}
 function blend(weights,target,dt){const k=1-Math.exp(-3.5*Math.max(0,Math.min(dt,.1)));return target.map((v,i)=>(weights[i]||0)+(v-(weights[i]||0))*k);}
 function checkpoint(saved,unlocked){return ALTARS.find(a=>a.x===saved?.x&&a.y===saved?.y&&(a.y===620||unlocked))||ALTARS[0];}
 function floorBelow(x,y,s){const rows=platforms(s).filter(f=>x>=f.x-30&&x<=f.x+f.w+30&&f.y>=y-3);return rows.length?Math.min(...rows.map(f=>f.y)):2220;}
 function drawBackground(ctx,img,s){
  const weights=s.sceneBlend||backgroundAt(s.p);
  ctx.save();ctx.fillStyle='#081114';ctx.fillRect(0,0,1280,720);
  // Composite each base layer using its share of accumulated weight so the
  // final mixture sums to 1 rather than darkening the base images halfway through a dissolve.
  let accumulated=0;
  for(let row=0;row<4;row++){const weight=weights[row]||0;if(weight<.00001)continue;accumulated+=weight;ctx.globalAlpha=clamp(weight/accumulated);
   if(row<3){if(img){const h=img.naturalHeight/3;for(let i=-1;i<2;i++)ctx.drawImage(img,0,row*h,img.naturalWidth,h,-(s.cam*.18%1600)+i*1600,-10,1600,740);}}
   else drawAsh(ctx,s);
  }
  ctx.restore();
 }
 function drawAsh(ctx,s){
  const gradient=ctx.createLinearGradient(0,0,0,720);gradient.addColorStop(0,'#0c151b');gradient.addColorStop(.65,'#241922');gradient.addColorStop(1,'#583022');ctx.fillStyle=gradient;ctx.fillRect(0,0,1280,720);
  for(let i=-1;i<10;i++){const x=i*175-(s.cam*.12%175),y=80+Math.sin(i*7)*40-s.camY*.08;ctx.fillStyle=i%2?'#0b1119':'#111a21';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+110,0);ctx.lineTo(x+85,440+y);ctx.lineTo(x+40,510+y);ctx.closePath();ctx.fill();ctx.strokeStyle='#af694733';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+43,150);ctx.lineTo(x+66,260+y);ctx.lineTo(x+38,410+y);ctx.stroke();}
  for(let i=0;i<34;i++){const x=(i*137-s.cam*.18+s.t*7+2560)%1280,y=720-((i*71+s.t*(12+i%6))%720);ctx.fillStyle=i%3?'#ffb56b55':'#9acdd533';ctx.fillRect(x,y,2,3);}
 }
 function drawRoute(ctx,s){
  if(s.boss.state!=='dead')return;
  ctx.save();ctx.translate(-s.cam,0);ctx.font='bold 17px Georgia';ctx.textAlign='center';ctx.fillStyle='#c8e4be';
  ctx.fillText('↓ VALE DAS CINZAS · BOITATÁ',5750,390);
  ctx.font='13px sans-serif';ctx.fillText('↓ + PULO: descer · PULO: retornar',5750,420);
  ctx.strokeStyle='#96c7b4';ctx.lineWidth=3;ctx.setLineDash([8,9]);ctx.beginPath();ctx.moveTo(5915,530);ctx.lineTo(5915,1480);ctx.stroke();ctx.setLineDash([]);
  for(const f of DEPTH.filter(f=>f.h===22)){ctx.fillStyle='#ffca7b';ctx.fillRect(f.x+8,f.y-8,12,5);ctx.fillRect(f.x+f.w-20,f.y-8,12,5);}
  ctx.fillStyle='#d2c299';ctx.fillText('ALTAR · DESCANSE ANTES DE CONTINUAR',5480,1480);
  if(s.boitata.state!=='dormant'&&s.boitata.state!=='dead'){ctx.fillStyle='#e8844266';ctx.fillRect(5700,1960,12,260);}
  if(s.boitata.state==='dead'){ctx.strokeStyle='#f6bf75';ctx.lineWidth=7;ctx.beginPath();ctx.arc(4210,2220,75,Math.PI,0);ctx.stroke();ctx.fillStyle='#f6d69d';ctx.fillText('MEMÓRIA DAS CINZAS',4270,2090);}
  ctx.restore();
 }
 function drawBoitata(ctx,b,s,reducedMotion=false){
  if(b.state==='dormant'||b.state==='dead')return;
  ctx.save();ctx.translate(b.x-s.cam,b.y-50);ctx.scale(b.dir||-1,1);
  const color=b.state==='windup'?'#fff4bb':b.hp<b.max/2?'#ffb754':'#de793c';
  ctx.lineCap='round';ctx.shadowColor='#ff7934';ctx.shadowBlur=reducedMotion?0:22;
  for(const [width,stroke] of [[48,'#4b2630'],[33,'#b95732'],[16,color]]){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.beginPath();for(let i=0;i<=18;i++){const x=-i*13,y=Math.sin(i*.57+(reducedMotion?0:s.t*4))*23-i*1.8;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  ctx.fillStyle='#d98445';ctx.beginPath();ctx.ellipse(16,-7,40,26,-.15,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#f9f0b4';ctx.beginPath();ctx.ellipse(29,-17,9,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#16111b';ctx.fillRect(30,-22,3,10);
  if(b.state==='windup'){ctx.strokeStyle='#ffe7a2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(45,18);ctx.lineTo(350,18);ctx.stroke();}
  ctx.restore();
 }
 return {NAMES,ALTARS,DEPTH,platforms,areaAt,cameraY,backgroundAt,blend,checkpoint,floorBelow,drawBackground,drawRoute,drawBoitata};
});
