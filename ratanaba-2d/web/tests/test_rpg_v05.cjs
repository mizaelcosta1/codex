const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),checks=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const check=(ok,label)=>{checks.push({label,passed:!!ok});console.log((ok?'PASS ':'FAIL ')+label);if(!ok)throw Error(label)};
 await page.addInitScript(()=>{window.__ratanaba_test_manual=true});
 const step=t=>page.evaluate(t=>{for(let n=0;n<t;n+=1/60)Ratanaba.update(1/60);Ratanaba.render();RatanabaHUD.sync()},t);
 await page.goto('file://'+path.join(__dirname,'..','index.html'));await page.waitForFunction(()=>window.Ratanaba?.ready&&window.RatanabaRPG&&window.RatanabaAnimations?.loaded);
 await page.click('#start');await page.click('#dialogueSkip');await page.click('#dialogueSkip');await step(.02);
 check(await page.evaluate(()=>Object.keys(RatanabaAnimations.status).length===4&&RatanabaAnimations.loaded),'All four new animation atlases loaded');
 check(await page.evaluate(()=>Ratanaba.state.rpg.inventory.length===3&&Ratanaba.state.rpg.maxMana===80),'New character starts with real backpack resources and 80 mana');
 await page.keyboard.press('KeyB');check(await page.locator('#rpgModal').isVisible()&&await page.evaluate(()=>Ratanaba.state.paused&&Ratanaba.state.uiBlocked),'B opens backpack and suspends combat');
 check(await page.locator('.rpg-slot').count()===24,'Backpack has 24 actual slots');
 await page.evaluate(()=>{Ratanaba.state.hp=70;Ratanaba.state.rpg.mana=20});
 await page.click('[data-rpg-select="1"]');await page.click('[data-rpg-use="1"]');
 check(await page.evaluate(()=>Ratanaba.state.rpg.mana===50&&Ratanaba.state.rpg.inventory.find(i=>i.id==='mana_small').qty===1),'Mana potion restores resource and consumes one inventory unit');
 await page.click('[data-rpg-select="0"]');await page.click('[data-rpg-use="0"]');check(await page.evaluate(()=>Ratanaba.state.hp===105),'Inventory health potion heals actual HP');
 await page.click('[data-rpg-select="2"]');await page.click('[data-rpg-use="2"]');check(await page.evaluate(()=>Ratanaba.state.rpg.aura===8&&!Ratanaba.state.rpg.inventory.some(i=>i.id==='aura_small')),'Aura crystal binds 8 spendable aura');
 await page.click('[data-rpg-tab="aura"]');await page.click('[data-rpg-upgrade="strength"]');check(await page.evaluate(()=>Ratanaba.state.rpg.attrs.strength===1&&Ratanaba.state.rpg.aura===0&&RatanabaRPG.damageBonus('light')===2),'Aura buys strength at the altar and increases real damage');
 await page.keyboard.press('Escape');check(await page.evaluate(()=>!Ratanaba.state.paused&&!Ratanaba.state.uiBlocked),'Closing RPG modal resumes simulation');
 await page.evaluate(()=>{Ratanaba.warp(700);Ratanaba.state.rpg.aura=100;});await page.keyboard.press('KeyN');check(await page.locator('[data-rpg-upgrade="vitality"]').isDisabled(),'Attribute purchase is locked away from an altar');await page.keyboard.press('Escape');
 await page.evaluate(()=>Ratanaba.warp(170));await page.keyboard.press('KeyN');await page.click('[data-rpg-upgrade="vitality"]');await page.click('[data-rpg-upgrade="magic"]');await page.click('[data-rpg-upgrade="luck"]');
 check(await page.evaluate(()=>Ratanaba.state.maxHp===132&&Ratanaba.state.rpg.maxMana===85&&Ratanaba.state.rpg.attrs.luck===1),'Vitality, magic and luck investments update character capacities');
 await page.locator('.rpg-odds summary').click();check(await page.locator('.rpg-odds table').isVisible(),'Aura panel exposes live normalized loot probabilities');
 const out=path.join(__dirname,'evidence');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'v05_aura.png')});await page.keyboard.press('Escape');
 await page.evaluate(()=>{Ratanaba.state.rpg.mana=40;Ratanaba.state.p.stamina=100;Ratanaba.state.p.attack=null;Ratanaba.state.p.hurt=0;Ratanaba.state.p.spellCd=0;});await page.keyboard.press('KeyU');await step(.02);
 check(await page.evaluate(()=>Ratanaba.state.rpg.mana>22&&Ratanaba.state.rpg.mana<23&&Ratanaba.state.projectiles.length===1),'Actual magic cast spends 18 mana and creates a projectile');
 await page.evaluate(()=>{Ratanaba.state.rpg.mana=0;Ratanaba.state.p.spellCd=0;Ratanaba.state.projectiles=[]});await page.keyboard.press('KeyU');await step(.02);check(await page.evaluate(()=>Ratanaba.state.projectiles.length===0),'Insufficient mana prevents a cast without negative resource');
 await page.evaluate(()=>{Ratanaba.warp(560);const e=Ratanaba.state.enemies[0];e.hp=5;const old=Math.random;Math.random=()=>0;Ratanaba.inflict(e,100,1,'light');Math.random=old;});
 check(await page.evaluate(()=>Ratanaba.state.rpg.aura===54&&Ratanaba.state.rpgDrops.length===1),'Killing a mob adds aura once and creates a real randomized world item');
 await page.evaluate(()=>Ratanaba.warp(650));await step(.12);check(await page.evaluate(()=>Ratanaba.state.rpgDrops.length===0&&Ratanaba.state.rpg.inventory.find(i=>i.id==='health_small').qty===2),'Walking over a dropped item transfers it into backpack');
 await page.evaluate(()=>{RatanabaRPG.addItem('legend_mask',1);RatanabaRPG.equip(Ratanaba.state.rpg.inventory.findIndex(i=>i.id==='legend_mask'));Ratanaba.persist();Ratanaba.restore();});
 check(await page.evaluate(()=>Ratanaba.state.rpg.attrs.strength===1&&Ratanaba.state.rpg.equipped==='legend_mask'&&RatanabaRPG.damageBonus('light')===9),'Save restores attributes, owned equipment and actual bonuses');
 await page.evaluate(()=>{Ratanaba.state.running=true;Ratanaba.warp(900);Ratanaba.state.essence=19;Ratanaba.state.p.inv=0;Ratanaba.damage(999,1);Ratanaba.restore();});check(await page.evaluate(()=>Ratanaba.state.essence===0&&Ratanaba.state.stain?.value===19&&Ratanaba.state.rpg.equipped==='legend_mask'&&Ratanaba.state.rpgDrops.length===0),'Death save preserves bound inventory and recoverable essence while clearing loose loot');
 // Continue/restart resets UI through the real game start path.
 await page.evaluate(()=>Ratanaba.start(true));await step(.02);await page.keyboard.press('KeyB');
 await page.evaluate(()=>{for(const id of ['health_large','mana_large','stamina','antidote','aura_large','bone','leaf','fire_ember','storm_shard','water_pearl','venom_gland','curse_amulet'])RatanabaRPG.addItem(id,1);});
 // Select refreshes the actual inventory UI; only loot seeding is a reproducible QA setup.
 await page.click('[data-rpg-tab="bag"]');await page.screenshot({path:path.join(out,'v05_backpack.png')});await page.keyboard.press('Escape');
 await page.evaluate(()=>{const s=Ratanaba.state;s.seals=[true,true,true,true];s.boss.state='watch';s.boss.x=5530;s.boss.timer=2;Ratanaba.warp(5200);s.p.inv=0;Ratanaba.render();});
 const rows=[];for(const phase of ['watch','stalk','windup','charge','roots','echo','recover']){rows.push(await page.evaluate(phase=>{const b=Ratanaba.state.boss;b.state=phase;b.timer=1;RatanabaAnimations.tick(b,.1,{boss:true});return RatanabaAnimations.sample(b,{boss:true}).row},phase));}
 check(new Set(rows).size===7,'Boss selects seven distinct living-action animation rows');
 await page.evaluate(()=>{const b=Ratanaba.state.boss;b.state='roots';b.timer=1.2;RatanabaAnimations.tick(b,.1,{boss:true});RatanabaAnimations.tick(b,.1,{boss:true});Ratanaba.render();});await page.screenshot({path:path.join(out,'v05_boss.png')});
 await page.evaluate(()=>{const b=Ratanaba.state.boss;b.state='recover';b.timer=1;b.hp=1;b.x=5260;Ratanaba.warp(5200);Ratanaba.state.p.facing=1;Ratanaba.state.p.inv=100;Ratanaba.state.p.attack=null;Ratanaba.state.p.stamina=100;Ratanaba.attack('heavy')});await step(.6);
 check(await page.evaluate(()=>Ratanaba.state.boss.state==='dead'&&Ratanaba.state.rpg.bossRewarded&&Ratanaba.state.rpg.inventory.filter(i=>i.id==='curupira_relic').length===1),'Boss death awards exactly one fixed relic alongside randomized loot');
 await page.click('#dialogueSkip');await page.evaluate(()=>{Ratanaba.persist();Ratanaba.restore();});check(await page.evaluate(()=>Ratanaba.state.boss.hp===0&&Ratanaba.state.boss.deathAge===1),'Restoring a defeated boss does not replay its death animation');
 check(!errors.length,'No browser JavaScript exceptions');fs.writeFileSync(path.join(out,'rpg_v05_result.json'),JSON.stringify({checks,passed:checks.length,errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
