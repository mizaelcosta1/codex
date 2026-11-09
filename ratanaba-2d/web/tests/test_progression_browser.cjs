'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const check=(value,label)=>{checks.push({label,passed:!!value});console.log((value?'PASS ':'FAIL ')+label);if(!value)throw Error(label);};
 await page.addInitScript(()=>window.__ratanaba_test_manual=true);
 const step=seconds=>page.evaluate(seconds=>{for(let t=0;t<seconds;t+=1/60)Ratanaba.update(1/60);Ratanaba.render();RatanabaHUD.sync();},seconds);
 const out=path.join(__dirname,'evidence');fs.mkdirSync(out,{recursive:true});
 await page.goto('file://'+path.join(__dirname,'..','index.html'));await page.waitForFunction(()=>window.Ratanaba?.ready&&RatanabaAnimations.loaded);
 await page.click('#start');await page.click('#dialogueSkip');await step(.02);
 await page.evaluate(()=>{Ratanaba.warp(1780);Ratanaba.state.p.inv=100;});
 const before=await page.evaluate(()=>Ratanaba.state.sceneBlend);
 await page.keyboard.down('ArrowRight');await step(.7);await page.keyboard.up('ArrowRight');
 check(await page.evaluate(before=>Ratanaba.state.p.x>1900&&Ratanaba.state.sceneBlend[0]>0&&Ratanaba.state.sceneBlend[1]>0&&Ratanaba.state.sceneBlend[1]>before[1],before),'Walking across an old area boundary blends both backgrounds');
 await page.screenshot({path:path.join(out,'v07_surface_transition.png')});
 // Only the boss setup is seeded; the route below uses keyboard and touch input.
 await page.evaluate(()=>{Ratanaba.warp(5480);Ratanaba.state.seals.fill(true);Ratanaba.state.p.inv=100;Ratanaba.inflict(Ratanaba.state.boss,3000,1,'heavy');});
 check(await page.evaluate(()=>Ratanaba.state.boss.state==='dead'&&!Ratanaba.state.won),'Curupira death unlocks continuing play instead of ending the vigil');
 await page.click('#dialogueSkip');await step(.3);
 await page.keyboard.down('ArrowRight');await step(1.8);await page.keyboard.up('ArrowRight');await step(1.2);
 check(await page.evaluate(()=>Ratanaba.state.p.y>620&&Ratanaba.state.camY>0),'Walking off the opened shaft descends with a vertical camera');
 await page.screenshot({path:path.join(out,'v07_descent.png')});
 async function drop(){await page.keyboard.down('ArrowDown');await page.keyboard.press('Space');await page.keyboard.up('ArrowDown');await step(1.1);}
 for(let i=0;i<8&&await page.evaluate(()=>Ratanaba.state.p.y<1580);i++)await drop();
 check(await page.evaluate(()=>Ratanaba.state.p.ground&&Ratanaba.state.p.y===1580&&!Ratanaba.state.won),'The descent lands on the lower checkpoint terrace');
 // Stop at the altar with ordinary horizontal input.
 await page.keyboard.down('ArrowLeft');await step(1.7);await page.keyboard.up('ArrowLeft');await step(.2);await page.keyboard.press('KeyE');await step(.03);
 check(await page.evaluate(()=>Ratanaba.state.checkpoint.y===1580),'The lower altar can be activated by normal interaction');
 await page.keyboard.press('KeyN');check(await page.locator('#rpgModal').isVisible(),'Aura evolution remains available at the lower altar');await page.keyboard.press('Escape');
 await page.evaluate(()=>{Ratanaba.persist();Ratanaba.start(true);});await step(.05);
 check(await page.evaluate(()=>Ratanaba.state.p.y===1580&&Ratanaba.state.boss.state==='dead'&&Ratanaba.state.camY>0),'Continue restores the lower checkpoint and Curupira progression');
 await page.screenshot({path:path.join(out,'v07_lower_altar.png')});
 await page.keyboard.down('ArrowRight');await step(1.4);await page.keyboard.up('ArrowRight');await step(.2);
 // Hold the real down-pad and press the real jump button to drop a platform.
 const pad=await page.locator('.pad-down').boundingBox();await page.mouse.move(pad.x+pad.width/2,pad.y+pad.height/2);await page.mouse.down();
 await page.keyboard.press('Space');await step(.12);await page.mouse.up();await step(1.1);
 check(await page.evaluate(()=>Ratanaba.state.p.y>1580),'Touch down-pad plus jump drops through the terrace');
 for(let i=0;i<8&&await page.evaluate(()=>Ratanaba.state.p.y<2220);i++)await drop();
 await page.keyboard.down('ArrowLeft');await step(1.3);await page.keyboard.up('ArrowLeft');await step(.1);
 check(await page.evaluate(()=>Ratanaba.state.boitata.state==='watch'&&Ratanaba.state.cinematic?.id==='boitata_intro'),'The lower arena starts the next guardian encounter');
 await page.click('#dialogueSkip');await step(.1);
 check(await page.locator('#bossHud span').textContent()==='BOITATÁ','The boss HUD switches to Boitata');
 await page.screenshot({path:path.join(out,'v07_boitata.png')});
 await page.evaluate(()=>{const g=Ratanaba;g.state.boitata.x=g.state.p.x-65;g.state.boitata.hp=1;g.state.boitata.state='recover';g.state.boitata.timer=2;g.state.p.facing=-1;g.state.p.inv=100;g.state.p.stamina=100;g.state.p.attack=null;g.state.p.hurt=0;g.state.p.dodgeAt=-10;});
 await page.keyboard.press('KeyL');await step(.6);
 check(await page.evaluate(()=>Ratanaba.state.boitata.state==='dead'&&Ratanaba.state.rpg.boitataRewarded&&Ratanaba.state.rpg.inventory.some(i=>i.id==='boitata_scale')),'Combat defeats Boitata and grants its own fixed relic');
 await page.click('#dialogueSkip');await page.evaluate(()=>{Ratanaba.persist();Ratanaba.restore();});
 check(await page.evaluate(()=>Ratanaba.state.boss.state==='dead'&&Ratanaba.state.boitata.state==='dead'&&Ratanaba.state.rpg.inventory.filter(i=>i.id==='boitata_scale').length===1),'Save reload keeps both victories and one Boitata relic');
 check(!errors.length,'No JavaScript exceptions during vertical progression and rendering');
 fs.writeFileSync(path.join(out,'v07_progression_result.json'),JSON.stringify({checks,passed:checks.length,errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
