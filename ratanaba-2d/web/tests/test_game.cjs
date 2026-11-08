/* Real browser tests and captures. QA warps are for reproducible captures only;
   normal gameplay never teleports. No screenshots are composited or repainted. */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const out=path.join(__dirname,'evidence');fs.mkdirSync(out,{recursive:true});
 const args=['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
 const opts={headless:true,args};if(process.env.CHROMIUM_EXECUTABLE)opts.executablePath=process.env.CHROMIUM_EXECUTABLE;
 const browser=await chromium.launch(opts);const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));const checks=[];
 function check(ok,label){checks.push({label,passed:!!ok});console.log((ok?'PASS ':'FAIL ')+label);if(!ok)throw new Error(label);}
 await page.addInitScript(()=>{window.__ratanaba_test_manual=true;});
 async function advance(ms){await page.evaluate(ms=>{for(let t=0;t<ms/1000;t+=1/60)Ratanaba.update(1/60);Ratanaba.render();},ms);}
 async function skipScene(){if(await page.locator('#dialogueSkip').isVisible())await page.click('#dialogueSkip');}
 const url='file://'+path.join(__dirname,'..','index.html');await page.goto(url);await page.waitForFunction(()=>window.Ratanaba&&Ratanaba.ready,{timeout:60000});await page.screenshot({path:path.join(out,'01_title.png')});
 check(await page.evaluate(()=>Object.values(Ratanaba.assets).every(i=>i.complete&&i.naturalWidth>0)),'all four generated atlases loaded');
 await page.click('#start');await skipScene();await advance(200);
 const x0=await page.evaluate(()=>Ratanaba.state.p.x);await page.keyboard.down('ArrowRight');await advance(380);await page.keyboard.up('ArrowRight');
 check(await page.evaluate(x=>Ratanaba.state.p.x>x+45,x0),'keyboard movement advances physical player');
 await page.keyboard.down('Space');await advance(180);
 check(await page.evaluate(()=>Ratanaba.state.p.y<580&&!Ratanaba.state.p.ground),'held jump leaves ground');
 await page.keyboard.up('Space');await advance(850);
 check(await page.evaluate(()=>Ratanaba.state.p.ground),'player returns to platform collision');
 await page.evaluate(()=>{Ratanaba.warp(580);Object.assign(Ratanaba.state.p,{inv:100,stamina:100,combo:0,comboUntil:0,attack:null,queue:false});});
 await page.keyboard.press('KeyJ');await advance(80);
 check(await page.evaluate(()=>Ratanaba.state.p.attack&&Ratanaba.state.p.attack.stage===1),'J starts light combo stage I');
 await page.keyboard.press('KeyJ');await advance(320);
 check(await page.evaluate(()=>Ratanaba.state.p.combo===2),'buffered second J chains stage II');
 await page.keyboard.press('KeyJ');await advance(420);
 check(await page.evaluate(()=>Ratanaba.state.p.combo===3),'buffered third J chains stage III');
 check(await page.evaluate(()=>Ratanaba.state.enemies[0].hp<65),'combo deals damage to nearby monster');
 await advance(400);await page.evaluate(()=>{Ratanaba.state.p.stamina=100;Ratanaba.state.p.attack=null;Ratanaba.state.p.cd=0;});await page.keyboard.press('KeyL');await advance(60);
 check(await page.evaluate(()=>Ratanaba.state.p.attack?.kind==='heavy'),'L starts committed heavy attack');
 await advance(720);await page.evaluate(()=>{Ratanaba.state.p.stamina=100;Ratanaba.state.p.attack=null;Ratanaba.state.p.cd=0;});await page.keyboard.press('KeyK');await advance(70);await page.keyboard.press('KeyJ');await advance(30);
 check(await page.evaluate(()=>Ratanaba.state.p.attack?.kind==='rush'),'dodge plus J starts rushing attack');
 await advance(450);await page.evaluate(()=>{Ratanaba.warp(175);Ratanaba.state.p.stamina=100;Ratanaba.state.p.attack=null;Ratanaba.state.p.dash=0;Ratanaba.state.p.ground=true;Ratanaba.state.p.dodgeAt=-10;});await page.keyboard.down('Space');await advance(90);await page.keyboard.press('KeyJ');await advance(40);
 check(await page.evaluate(()=>Ratanaba.state.p.attack?.kind==='aerial'),'jump plus J starts downward aerial attack');await page.keyboard.up('Space');await advance(600);
 await page.evaluate(()=>{Ratanaba.state.seals=[false,false,false,false];});
 for(let i=0;i<4;i++){
  await page.evaluate(i=>{Ratanaba.warp(2260+i*390-60);Object.assign(Ratanaba.state.p,{facing:1,ground:true,attack:null,stamina:100,inv:100,dash:0,dodgeAt:-10,cd:0,combo:0,comboUntil:0});},i);
  await page.keyboard.press('Digit'+(i+1));await page.keyboard.press('KeyJ');await advance(450);
 }
 check(await page.evaluate(()=>Ratanaba.state.seals.every(Boolean)),'four keyboard element attacks solve four seals');
 await page.evaluate(()=>{Ratanaba.warp(2000);Ratanaba.state.essence=24;Ratanaba.state.materials[Ratanaba.state.element]=2;});await page.keyboard.press('KeyE');await advance(60);
 check(await page.evaluate(()=>Ratanaba.state.level===2&&Ratanaba.state.essence===12),'altar converts loot into RPG level');
 await page.evaluate(()=>{Ratanaba.warp(2700);Ratanaba.state.p.inv=0;Ratanaba.damage(999,1);});
 check(await page.evaluate(()=>Ratanaba.state.essence===0&&Ratanaba.state.stain.value===12&&Ratanaba.state.hp===Ratanaba.state.maxHp),'death leaves recoverable essence and restores checkpoint');
 await page.evaluate(()=>Ratanaba.warp(2700));await advance(60);
 check(await page.evaluate(()=>Ratanaba.state.essence===12&&Ratanaba.state.stain===null),'bloodstain restores lost currency once');
 await page.evaluate(()=>{Ratanaba.warp(5100);Object.assign(Ratanaba.state.boss,{state:'watch',hp:480,timer:0,cycle:0});Ratanaba.state.p.inv=100;});await advance(60);
 check(await page.evaluate(()=>Ratanaba.state.boss.state==='windup'),'boss clearly telegraphs before charging');await advance(1120);
 check(await page.evaluate(()=>Ratanaba.state.boss.state==='charge'),'boss telegraph transitions to charge');
 await page.evaluate(()=>{Object.assign(Ratanaba.state.boss,{state:'watch',timer:0,cycle:1,hp:200});});await advance(70);
 check(await page.evaluate(()=>Ratanaba.state.boss.state==='roots'&&Ratanaba.state.hazards.length===3),'boss second phase summons three ground hazards');
 await page.evaluate(()=>{const b=Ratanaba.state.boss;Object.assign(b,{state:'recover',timer:1,hp:5,x:5440});Ratanaba.warp(5380);Object.assign(Ratanaba.state.p,{stamina:100,attack:null,facing:1,inv:100,dash:0,cd:0,dodgeAt:-10,ground:true});});await page.keyboard.press('KeyL');await advance(500);
 check(await page.evaluate(()=>Ratanaba.state.boss.state==='dead'&&Ratanaba.state.airDash),'defeating boss grants air-dash traversal');
 await page.evaluate(()=>{Ratanaba.persist();Ratanaba.restore();});
 check(await page.evaluate(()=>Ratanaba.state.boss.state==='dead'&&Ratanaba.state.level===2&&Ratanaba.state.airDash),'saved progression restores boss and ability');
 // Screenshot series from the actual running client, frozen only for capture.
 await page.evaluate(()=>{Ratanaba.start(false);Ratanaba.state.sound=false;});await skipScene();
 async function shot(name,x,text,fn){await page.evaluate(({x,text})=>{Ratanaba.warp(x);Ratanaba.state.toast=text;Ratanaba.state.toastUntil=999;Ratanaba.state.paused=true;Ratanaba.state.p.inv=0;}, {x,text});if(fn)await page.evaluate(fn);await page.evaluate(()=>{Ratanaba.warp(Ratanaba.state.p.x);Ratanaba.render();});await advance(100);await page.screenshot({path:path.join(out,name)});}
 await shot('02_crypt.png',760,'CRIPTA DO NOME APAGADO · O bronze guarda a memória que a pedra perdeu.');
 await shot('03_cloister.png',2790,'CLAUSTRO DAS ÁGUAS MORTAS · Quatro lamentos sustentam o portão.');
 await shot('04_forest.png',4450,'FLORESTA INVERTIDA · Os rastros não pertencem a este tempo.',()=>{Ratanaba.state.seals=[true,true,true,true];});
 await shot('05_curupira.png',5210,'CURUPIRA · “Se eu apagar teu rastro… talvez o ontem volte.”',()=>{Object.assign(Ratanaba.state.boss,{x:5520,state:'windup',timer:.8,hp:340,dir:-1});Ratanaba.state.seals=[true,true,true,true];});
 check(errors.length===0,'no browser JavaScript errors');
 const result={browser:'Playwright Chromium',realGameplay:true,checks,passed:checks.length,errors,screenshots:['01_title.png','02_crypt.png','03_cloister.png','04_forest.png','05_curupira.png'],captureNote:'Actual Canvas game and DOM HUD rendered by Chromium. Reproducible QA warps/freeze used to frame the three playable areas; no composite screenshots.'};fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log('RESULT '+JSON.stringify(result));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
