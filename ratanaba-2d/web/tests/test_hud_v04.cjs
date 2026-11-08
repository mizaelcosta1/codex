const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),checks=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const check=(v,label)=>{checks.push({label,passed:!!v});console.log((v?'PASS ':'FAIL ')+label);if(!v)throw Error(label)};
 await page.addInitScript(()=>{window.__ratanaba_test_manual=true});
 const step=seconds=>page.evaluate(seconds=>{for(let t=0;t<seconds;t+=1/60)Ratanaba.update(1/60);Ratanaba.render();RatanabaHUD.sync(0)},seconds);
 const out=path.join(__dirname,'evidence');fs.mkdirSync(out,{recursive:true});
 await page.goto('file://'+path.join(__dirname,'..','index.html'));await page.waitForFunction(()=>window.Ratanaba?.ready&&window.RatanabaHUD);
 await page.click('#start');
 check(await page.locator('#cutscene').isVisible(),'New Game opens the supplied dialogue panel');
 check(await page.evaluate(()=>Ratanaba.state.cinematic.id==='awakening'),'Opening cut-scene is a real narrative state');
 const x=await page.evaluate(()=>Ratanaba.state.p.x),t=await page.evaluate(()=>Ratanaba.state.t);
 await page.keyboard.down('ArrowRight');await page.keyboard.press('KeyJ');await page.keyboard.press('KeyU');await step(.3);await page.keyboard.up('ArrowRight');
 check(await page.evaluate(({x,t})=>Ratanaba.state.p.x===x&&Ratanaba.state.t===t&&!Ratanaba.state.p.attack&&Ratanaba.state.projectiles.length===0,{x,t}),'Cut-scene suspends movement, combat and world time');
 await page.waitForFunction(()=>document.querySelector('#dialogueText').textContent==='O mundo esqueceu meu nome.\nA floresta ainda reconhece minha ferida.');
 check(await page.locator('#dialogueText').textContent()=== 'O mundo esqueceu meu nome.\nA floresta ainda reconhece minha ferida.','Dialogue progressively reveals the complete current line');
 await page.screenshot({path:path.join(out,'v04_cutscene.png')});
 await page.keyboard.press('Enter');check(await page.locator('#dialogueCount').textContent()==='2 / 3','Enter advances to the next line');
 await page.keyboard.press('Escape');check(await page.locator('#pauseMenu').isVisible(),'Escape pauses during a cut-scene');await page.click('#resume');
 await page.click('#dialogueSkip');await step(.02);
 check(await page.locator('#cutscene').isHidden()&&!await page.evaluate(()=>!!Ratanaba.state.cinematic),'Skip closes dialogue and clears cinematic state');
 check(await page.evaluate(()=>Ratanaba.keys.size===0&&Ratanaba.pressed.size===0),'Cut-scene clears buffered movement and attacks');
 await page.waitForFunction(()=>document.body.classList.contains('playing'));
 check(await page.locator('.vitals-frame').evaluate(i=>i.complete&&i.naturalWidth===730),'Gothic vitals frame is the actual extracted artwork');
 check(await page.locator('#touch').isVisible(),'Reference directional pad and action buttons visible');
 check(await page.locator('#elements button img').count()===4,'Four framed elemental assets are in the functional HUD');
 // Browser hit testing catches misplaced controls and guard/action overlaps.
 for(const viewport of [{width:1280,height:720},{width:844,height:390},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  const geometry=await page.evaluate(()=>{
   const selectors=['.orb-heal','.pad-left','.pad-right','.pad-up','.pad-down','#clubButton','.action-jump','.action-dodge','.action-magic','.action-guard'];
   const buttons=selectors.map(s=>document.querySelector(s));
   const stage=document.querySelector('#stage').getBoundingClientRect();
   const targets=buttons.map((b,i)=>{
    const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return {selector:selectors[i],rect:{x:r.x,y:r.y,width:r.width,height:r.height},hit:hit?.closest('button')?.className||hit?.tagName,
     reachable:r.width>0&&r.height>0&&r.left>=stage.left-.5&&r.right<=stage.right+.5&&r.top>=stage.top-.5&&r.bottom<=stage.bottom+.5&&hit?.closest('button')===b};
   });
   const overlaps=[];buttons.slice(5).forEach((b,i)=>buttons.slice(5+i+1).forEach(other=>{
    const a=b.getBoundingClientRect(),c=other.getBoundingClientRect();
    if(!(a.right<=c.left||c.right<=a.left||a.bottom<=c.top||c.bottom<=a.top))overlaps.push([b.className,other.className]);
   }));
   return {targets,overlaps};
  });
  const reachable=geometry.targets.every(t=>t.reachable)&&!geometry.overlaps.length;
  if(!reachable)console.log('Touch geometry '+JSON.stringify({viewport,...geometry}));
  check(reachable,'Touch targets stay reachable without overlapping at '+viewport.width+'x'+viewport.height);
 }
 await page.setViewportSize({width:1280,height:720});
 await page.evaluate(()=>{Ratanaba.state.hp=60;Ratanaba.state.p.stamina=45;Ratanaba.state.essence=17;RatanabaHUD.sync();});await step(.001);
 check(await page.evaluate(()=>document.querySelector('#life').style.width==='50%'&&document.querySelector('#stamina').style.width.startsWith('45')&&document.querySelector('#orbFill').style.height==='50%'),'Health orb, life and vigor bars track actual resources');
 check(await page.locator('#essence').textContent()==='17','Small orb displays actual essence');
 await page.click('.orb-heal');await step(.02);check(await page.evaluate(()=>Ratanaba.state.hp===110&&Ratanaba.state.potions===2),'Potion orb heals and consumes a real charge');
 await page.click('[data-element="3"]');await step(.01);check(await page.evaluate(()=>Ratanaba.state.element===3)&&await page.locator('#elementName').textContent()==='VENENO','Element buttons select the actual weapon imbue');
 const before=await page.evaluate(()=>Ratanaba.state.p.x);const pad=await page.locator('.pad-right').boundingBox();await page.mouse.move(pad.x+pad.width/2,pad.y+pad.height/2);await page.mouse.down();await step(.25);await page.mouse.up();
 check(await page.evaluate(x=>Ratanaba.state.p.x>x+25,before),'Directional pad moves the physical player');
 // Pointer events with real browser capture are used for the attack modes.
 await page.click('#clubButton');await step(.03);check(await page.evaluate(()=>Ratanaba.state.p.attack?.kind==='light'),'Club tap triggers light attack');await step(.6);
 await page.evaluate(()=>{Ratanaba.state.p.stamina=100;Ratanaba.state.p.attack=null;});const box=await page.locator('#clubButton').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(350);await step(.02);await page.mouse.up();
 check(await page.evaluate(()=>Ratanaba.state.p.attack?.kind==='heavy'),'Holding the club triggers heavy attack');await step(.9);
 await page.evaluate(()=>{Ratanaba.state.p.stamina=100;Ratanaba.state.p.attack=null;});await page.click('.action-magic');await step(.02);check(await page.evaluate(()=>Ratanaba.state.projectiles.length===1),'Round magic button casts an elemental projectile');
 await page.click('#minimap');check(await page.evaluate(()=>Ratanaba.keys.has('map')),'Minimap opens the world map');await page.click('#minimap');
 check(await page.locator('#miniCanvas').evaluate(c=>c.getContext('2d').getImageData(30,100,1,1).data[3]===255),'Minimap renders a live discovered-area map');
 await page.evaluate(()=>{Ratanaba.warp(760);Ratanaba.state.hp=100;Ratanaba.state.p.inv=0;Ratanaba.state.p.attack=null;Ratanaba.state.toastUntil=0;Ratanaba.render();RatanabaHUD.sync();});await step(.001);await page.screenshot({path:path.join(out,'v04_hud.png')});
 await page.setViewportSize({width:844,height:390});await page.screenshot({path:path.join(out,'v04_mobile.png')});check(await page.locator('#minimap').evaluate(e=>e.getBoundingClientRect().right<=innerWidth),'HUD fits the landscape phone viewport');await page.setViewportSize({width:1280,height:720});
 await page.evaluate(()=>{Ratanaba.state.seals=[true,true,true,true];Ratanaba.warp(5050);});await step(.02);check(await page.evaluate(()=>Ratanaba.state.cinematic?.id==='curupira_intro'),'Entering Curupira arena triggers a real boss dialogue');
 await page.click('#dialogueNext');await page.screenshot({path:path.join(out,'v04_curupira_dialogue.png')});await page.click('#dialogueSkip');await step(.1);check(await page.evaluate(()=>Ratanaba.state.boss.state==='watch'&&!Ratanaba.state.cinematic),'Boss battle resumes after dialogue');
 await page.evaluate(()=>{const b=Ratanaba.state.boss;b.hp=5;b.state='recover';b.x=5110;Ratanaba.warp(5050);Ratanaba.state.element=0;Ratanaba.state.p.stamina=100;Ratanaba.state.p.facing=1;Ratanaba.attack('heavy')});await step(.5);
 check(await page.evaluate(()=>Ratanaba.state.boss.state==='dead'&&Ratanaba.state.cinematic?.id==='curupira_farewell'&&Ratanaba.state.airDash),'Boss defeat opens farewell dialogue and grants progression');await page.click('#dialogueSkip');
 check(!errors.length,'No browser JavaScript exceptions');fs.writeFileSync(path.join(out,'hud_v04_result.json'),JSON.stringify({checks,passed:checks.length,errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
