'use strict';
/* Ratanabá 0.5. Pose selection follows each entity's combat phase.
   Rendering is read-only; tick() owns the small per-entity animation clock. */
(()=>{
  const SOURCES={
    curupira:{src:'../assets/animations_v05/curupira.webp',columns:6,rows:8,size:260,anchorX:.5,anchorY:305/320},
    penitent:{src:'../assets/animations_v05/penitent.webp',columns:6,rows:4,size:175,anchorX:.5,anchorY:305/320},
    root_hound:{src:'../assets/animations_v05/root_hound.webp',columns:6,rows:4,size:155,anchorX:.5,anchorY:305/320},
    sentinel:{src:'../assets/animations_v05/sentinel.webp',columns:6,rows:4,size:175,anchorX:.5,anchorY:305/320}
  };
  const images={},loadState={},clocks=new WeakMap();
  const finite=(n,f=0)=>Number.isFinite(n)?n:f;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const species=(e,boss)=>boss?'curupira':['penitent','root_hound','sentinel'][e.type];
  const isBoss=e=>e.type===undefined&&Number.isFinite(e.max)&&e.max>=400;
  function phase(e,boss){
    if(e.state==='dead'||finite(e.hp,1)<=0)return 'death';
    if(finite(e.flinch)>0||finite(e.stun)>0)return 'hurt';
    if(boss)return ({dormant:'idle',watch:'idle',walk:'run',run:'run',approach:'run',stalk:'run',windup:'windup',charge:'sweep',attack:'sweep',roots:'roots',echo:'echo',recover:'recover'})[e.state]||'idle';
    return ({walk:'walk',run:'walk',idle:'idle',windup:'windup',attack:'attack',recover:'recover'})[e.state]||'idle';
  }
  function defaultDuration(e,key,boss){
    if(key==='death')return .75;
    if(key==='hurt')return Math.max(.12,finite(e.flinch)||finite(e.stun)||.28);
    if(boss)return ({idle:1.2,run:.6,windup:e.hp<240?.67:1.05,sweep:.7,roots:1.4,echo:1.2,recover:1.2})[key]||1;
    return ({idle:1.05,walk:e.type===1?.48:.72,windup:e.type===1?.42:.7,attack:.18,recover:.75})[key]||1;
  }
  function tick(e,dt,options={}){
    if(!e||typeof e!=='object')return;
    dt=clamp(finite(dt),0,.1);
    const boss=options.boss===undefined?isBoss(e):!!options.boss,key=phase(e,boss);
    let c=clocks.get(e);
    if(!c||c.key!==key||(key==='hurt'&&finite(e.flinch)>finite(c.lastFlinch)+.04)){
      const previous=c?.key||null;
      let duration=defaultDuration(e,key,boss);
      if(!['idle','walk','run','death','hurt'].includes(key)&&finite(e.timer)>0)duration=Math.max(.05,e.timer);
      c={key,age:0,duration,previous};clocks.set(e,c);
    }
    c.age+=dt;c.lastFlinch=finite(e.flinch);
  }
  function sample(e,options={}){
    const boss=options.boss===undefined?isBoss(e):!!options.boss,key=phase(e,boss),c=clocks.get(e);
    const matched=c?.key===key;
    let age=matched?c.age:0,duration=matched?c.duration:defaultDuration(e,key,boss);
    if(key==='death'&&Number.isFinite(e.deathAge))age=Math.max(age,e.deathAge);
    const loop=['idle','walk','run'].includes(key);
    if(!matched&&!c&&loop)age=Math.max(0,finite(options.time));
    let progress=clamp(age/Math.max(.05,duration)),row=0,frame=0;
    if(boss){
      row=({idle:0,run:1,windup:2,sweep:3,roots:4,echo:5,hurt:6,recover:6,death:7})[key]??0;
      frame=loop?Math.floor((age%duration)/duration*6):Math.min(5,Math.floor(progress*6));
    }else{
      if(key==='idle'||key==='walk'){row=0;frame=Math.floor((age%duration)/duration*6);}
      else if(key==='windup'){row=1;frame=Math.min(3,Math.floor(progress*4));}
      else if(key==='attack'){row=1;frame=4+Math.min(1,Math.floor(progress*2));}
      else if(key==='recover'&&matched&&['windup','attack'].includes(c.previous)&&age<.16){row=1;frame=4+Math.min(1,Math.floor(age/.08));}
      else if(key==='death'){row=3;frame=Math.min(5,Math.floor(progress*6));}
      else{row=2;frame=Math.min(5,Math.floor(progress*6));}
    }
    // All six death poses play once; a short fade follows, never loops.
    const alpha=key==='death'?clamp((.95-age)/.2):1;
    return {species:species(e,boss),boss,key,row,frame,age,duration,progress,loop,alpha,finished:key==='death'&&age>=.95};
  }
  function drawEntity(ctx,e,options={}){
    if(!ctx||!e)return false;
    const a=sample(e,options),config=SOURCES[a.species],img=images[a.species];
    if(!config||!img||loadState[a.species]!=='loaded')return false;
    const size=Math.max(1,finite(options.size,config.size)),cameraX=finite(options.cameraX),width=finite(options.viewportWidth,1280);
    const x=finite(e.x)-cameraX,y=finite(e.y);
    if(a.finished||x< -size||x>width+size)return true;
    const cw=img.naturalWidth/config.columns,ch=img.naturalHeight/config.rows;
    if(!cw||!ch)return false;
    let scaleX=1,scaleY=1;
    if(!options.reducedMotion){
      // Secondary breathing/recoil is intentionally subtle. The frame itself
      // supplies the pose; no crossfade or synthetic in-between is presented
      // as an additional authored frame.
      if(a.key==='idle'){const breath=Math.sin(a.age*Math.PI*2/a.duration);scaleY+=breath*.006;scaleX-=breath*.002;}
      if(a.key==='hurt'){const response=Math.sin(Math.PI*a.progress);scaleX-=response*.025;scaleY+=response*.012;}
    }
    ctx.save();
    try{
      ctx.translate(x,y);
      ctx.scale((e.dir>0?-1:1)*scaleX,scaleY);
      ctx.globalAlpha=finite(ctx.globalAlpha,1)*a.alpha;
      ctx.imageSmoothingEnabled=true;
      if(options.brightness!==false)ctx.filter='brightness(1.10)';
      ctx.drawImage(img,a.frame*cw,a.row*ch,cw,ch,-size*config.anchorX,-size*config.anchorY,size,size);
    }finally{ctx.restore();}
    return true;
  }
  function configure(name,patch){
    if(!SOURCES[name]||!patch)return false;
    // Only geometry/pivot tuning is mutable; URLs stay project-owned.
    for(const key of ['columns','rows','size'])if(Number.isFinite(patch[key])&&patch[key]>0)SOURCES[name][key]=key==='size'?patch[key]:Math.floor(patch[key]);
    for(const key of ['anchorX','anchorY'])if(Number.isFinite(patch[key]))SOURCES[name][key]=clamp(patch[key]);
    return true;
  }
  const ready=Promise.all(Object.entries(SOURCES).map(([name,config])=>new Promise(resolve=>{
    loadState[name]='loading';const img=new Image();
    img.onload=()=>{images[name]=img;loadState[name]='loaded';resolve({name,loaded:true});};
    img.onerror=()=>{loadState[name]='unavailable';resolve({name,loaded:false});};
    img.src=config.src;
  })));
  window.RatanabaAnimations={tick,sample,drawEntity,configure,ready,get status(){return {...loadState};},get loaded(){return Object.values(loadState).every(v=>v==='loaded');}};
})();
