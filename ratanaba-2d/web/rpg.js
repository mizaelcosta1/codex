'use strict';
/* RPG rules and UI. The game engine calls the small public hook interface below. */
(()=>{
 const HOST=typeof window!=='undefined'?window:globalThis;
 const RARITIES=[
  {id:'common',name:'Comum',color:'#b8c4b5'},
  {id:'uncommon',name:'Incomum',color:'#77c681'},
  {id:'rare',name:'Raro',color:'#69bdec'},
  {id:'epic',name:'Épico',color:'#be8aeb'},
  {id:'legendary',name:'Lendário',color:'#edb45e'},
  {id:'relic',name:'Relíquia única',color:'#e7ca81'}
 ];
 const ITEMS={
  health_small:{name:'Sangue da Seiva',icon:0,rarity:'common',kind:'health',value:35,description:'Poção de vida. Recupera 35 pontos de vida; só é consumida se houver vida a restaurar.'},
  health_large:{name:'Sangue Primordial',icon:1,rarity:'rare',kind:'health',value:85,description:'Poção de vida concentrada. Recupera até 85 pontos de vida.'},
  mana_small:{name:'Lágrima da Memória',icon:2,rarity:'common',kind:'mana',value:30,description:'Poção de mana. Recupera 30 pontos para conjurar os elementos.'},
  mana_large:{name:'Orvalho Primordial',icon:3,rarity:'rare',kind:'mana',value:75,description:'Poção de mana concentrada. Recupera até 75 pontos de mana.'},
  stamina:{name:'Tônico de Raiz',icon:4,rarity:'uncommon',kind:'stamina',value:50,description:'Recupera 50 de vigor. Útil para manter a sequência de ataques.'},
  antidote:{name:'Cinza Protetora',icon:5,rarity:'uncommon',kind:'antidote',value:0,description:'Consumível de proteção: concede 1,2 s de invulnerabilidade. O Banido ainda não sofre envenenamento persistente nesta versão.'},
  aura_small:{name:'Fragmento de Aura',icon:6,rarity:'rare',kind:'aura',value:8,description:'Ao consumir, vincula 8 de aura à alma. A aura pode evoluir atributos nos altares.'},
  aura_large:{name:'Nexo de Aura',icon:7,rarity:'epic',kind:'aura',value:30,description:'Ao consumir, vincula 30 de aura à alma. Não é perdida ao morrer.'},
  bone:{name:'Osso de Penitente',icon:8,rarity:'common',kind:'material',description:'Material de farm. Pode ser transmutado em 1 aura pela mochila.'},
  leaf:{name:'Folha do Exílio',icon:9,rarity:'uncommon',kind:'material',description:'Material de farm. Pode ser transmutado em 2 aura.'},
  fire_ember:{name:'Brasa da Penitência',icon:10,rarity:'uncommon',kind:'material',description:'Material elemental. Transmutar concede 2 aura e 1 reagente de fogo.',element:0},
  storm_shard:{name:'Estilhaço de Tempestade',icon:11,rarity:'rare',kind:'material',description:'Material elemental. Transmutar concede 4 aura e 1 reagente elétrico.',element:1},
  water_pearl:{name:'Pérola do Lamento',icon:12,rarity:'rare',kind:'material',description:'Material elemental. Transmutar concede 4 aura e 1 reagente de água.',element:2},
  venom_gland:{name:'Seiva Corrompida',icon:13,rarity:'rare',kind:'material',description:'Material elemental. Transmutar concede 4 aura e 1 reagente de veneno.',element:3},
  curse_amulet:{name:'Amuleto da Ferida',icon:14,rarity:'epic',kind:'equipment',bonus:3,description:'Equipamento: +3 de dano físico e mágico. Só um amuleto ou relíquia pode ficar equipado.'},
  legend_mask:{name:'Máscara do Nome Apagado',icon:15,rarity:'legendary',kind:'equipment',bonus:7,description:'Equipamento lendário: +7 de dano físico e mágico.'},
  boitata_scale:{name:'Escama da Memória Ardente',icon:10,rarity:'relic',kind:'equipment',bonus:5,description:'Relíquia única de Boitatá. +5 de dano físico e mágico. Recompensa fixa concedida uma única vez.',quest:true},
  curupira_relic:{name:'Rastro do Curupira',icon:15,rarity:'relic',kind:'equipment',bonus:4,description:'Relíquia única do Guardião. +4 de dano físico. Recompensa fixa, concedida uma única vez; não depende de sorte.',meleeOnly:true,quest:true}
 };
 const ATTRS={strength:{name:'Força',icon:4,description:'+2 de dano físico por ponto.'},vitality:{name:'Vitalidade',icon:5,description:'+12 de vida máxima por ponto.'},magic:{name:'Magia',icon:6,description:'+5 de mana máxima e +2 de dano mágico por ponto.'},luck:{name:'Sorte',icon:7,description:'+2 pontos percentuais de saque por ponto, até 90%; favorece raridades superiores.'}};
 const POOLS=Object.fromEntries(RARITIES.slice(0,5).map(r=>[r.id,Object.keys(ITEMS).filter(id=>ITEMS[id].rarity===r.id)]));
 const ALTERS=HOST.RatanabaWorld?.ALTARS||[{x:170,y:620},{x:2000,y:620},{x:4750,y:620},{x:5480,y:1580}],CAPACITY=24,STACK=99;
 let current=null,modal=null,active=null,previousPause=false,previousFocus=null,heldState=null,selected=0,dirty=false;
 const g=()=>HOST.Ratanaba, getState=()=>g()?.state||current;
 const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
 const integer=(v,min=0,max=9999999)=>Math.max(min,Math.min(max,Math.floor(finite(v,min))));
 const copy=v=>JSON.parse(JSON.stringify(v));
 const rarity=id=>RARITIES.find(r=>r.id===id)||RARITIES[0];
 const random=rng=>Math.max(0,Math.min(1-Number.EPSILON,finite(rng(),0)));
 function lootProfile(luck=0,isBoss=false){
  const L=integer(luck,0,20),chance=isBoss?1:Math.min(.90,.65+.02*L);
  const weights=isBoss?[0,0,70,25,5]:[60/(1+.04*L),25,10*(1+.06*L),4*(1+.08*L),1*(1+.1*L)];
  const sum=weights.reduce((a,b)=>a+b,0);
  return {luck:L,chance,none:1-chance,rarities:RARITIES.slice(0,5).map((r,i)=>({...r,conditional:weights[i]/sum,absolute:chance*weights[i]/sum,items:[...POOLS[r.id]]}))};
 }
 function rollLoot(luck=0,isBoss=false,rng=Math.random){
  const p=lootProfile(luck,isBoss);if(!isBoss&&random(rng)>=p.chance)return null;
  let roll=random(rng),chosen=p.rarities[p.rarities.length-1];
  for(const r of p.rarities){roll-=r.conditional;if(roll<0){chosen=r;break;}}
  const pool=chosen.items;return {id:pool[Math.floor(random(rng)*pool.length)],qty:1,rarity:chosen.id};
 }
 function cleanInventory(input){const out=[],quests=new Set();for(const item of Array.isArray(input)?input:[]){if(out.length>=CAPACITY)break;if(!item||!ITEMS[item.id]||ITEMS[item.id].quest&&quests.has(item.id))continue;if(ITEMS[item.id].quest)quests.add(item.id);const qty=integer(item.qty,0,STACK);if(qty>0)out.push({id:item.id,qty:ITEMS[item.id].quest?1:qty});}return out;}
 function initialize(state,savedRpg=null){
  if(active)close(true);current=state;
  const d=savedRpg&&typeof savedRpg==='object'?savedRpg:null;
  const attrs=Object.fromEntries(Object.keys(ATTRS).map(k=>[k,integer(d?.attrs?.[k],0,20)]));
  const inventory=d?cleanInventory(d.inventory):[{id:'health_small',qty:2},{id:'mana_small',qty:2},{id:'aura_small',qty:1}];
  // Missing RPG data is migrated as a fresh RPG layer; legacy level/essence/seals stay owned by the core.
  state.rpg={version:1,attrs,aura:integer(d?.aura),mana:0,maxMana:80+attrs.magic*5,inventory,equipped:null,bossRewarded:!!d?.bossRewarded,boitataRewarded:!!d?.boitataRewarded,pending:[]};
  state.rpg.mana=d?Math.max(0,Math.min(state.rpg.maxMana,finite(d.mana,state.rpg.maxMana))):state.rpg.maxMana;
  if(d?.equipped&&inventory.some(x=>x.id===d.equipped)&&ITEMS[d.equipped]?.kind==='equipment')state.rpg.equipped=d.equipped;
  if(Array.isArray(d?.pending))state.rpg.pending=d.pending.filter(x=>x&&ITEMS[x.id]&&ITEMS[x.id].quest).map(x=>({id:x.id,qty:1})).slice(0,2);
  state.rpgDrops=(Array.isArray(d?.worldDrops)?d.worldDrops:[]).filter(x=>x&&ITEMS[x.id]&&Number.isFinite(x.x)&&Number.isFinite(x.y)).slice(0,256).map(x=>({id:x.id,qty:integer(x.qty,1,STACK),rarity:ITEMS[x.id].rarity,x:Math.max(0,Math.min(6000,x.x)),y:Math.max(0,Math.min(2300,x.y))}));
  if(state.boss?.state==='dead'&&!d?.bossRewarded){state.rpg.bossRewarded=true;if(!state.rpg.inventory.some(x=>x.id==='curupira_relic'))giveQuestRelic(state);}
  if(state.boitata?.state==='dead'&&!d?.boitataRewarded){state.rpg.boitataRewarded=true;giveQuestRelic(state,'boitata_scale');}
  recompute(state,false);selected=0;dirty=true;return state.rpg;
 }
 function ensure(state=getState()){if(!state)return null;if(!state.rpg)initialize(state);return state.rpg;}
 function recompute(state=getState(),healIncrease=false){const r=ensure(state);if(!r)return;const old=finite(state.maxHp,120);state.maxHp=120+(Math.max(1,integer(state.level,1,100))-1)*12+(state.relic?20:0)+r.attrs.vitality*12;if(healIncrease&&state.maxHp>old)state.hp+=state.maxHp-old;state.hp=Math.max(0,Math.min(state.maxHp,finite(state.hp,state.maxHp)));r.maxMana=80+r.attrs.magic*5;r.mana=Math.max(0,Math.min(r.maxMana,finite(r.mana,r.maxMana)));}
 function serialize(){const s=getState(),r=ensure(s);if(!r)return null;return {...copy(r),worldDrops:(s.rpgDrops||[]).filter(d=>d.qty>0).map(d=>({id:d.id,qty:d.qty,rarity:ITEMS[d.id].rarity,x:d.x,y:d.y}))};}
 function notify(text){const s=getState();if(s){s.toast=text;s.toastUntil=s.t+4;}dirty=true;}
 function save(){g()?.persist?.();}
 function addItem(id,qty=1,state=getState()){
  const r=ensure(state);if(!r||!ITEMS[id])return 0;let left=integer(qty,0,99999),added=0;if(ITEMS[id].quest&&r.inventory.some(i=>i.id===id))return 0;
  for(const item of r.inventory){if(item.id!==id||item.qty>=STACK||ITEMS[id].quest)continue;const n=Math.min(STACK-item.qty,left);item.qty+=n;left-=n;added+=n;if(!left)break;}
  while(left>0&&r.inventory.length<CAPACITY){const n=ITEMS[id].quest?1:Math.min(STACK,left);r.inventory.push({id,qty:n});left-=n;added+=n;if(ITEMS[id].quest)break;}
  dirty=true;return added;
 }
 function giveQuestRelic(state=getState(),id='curupira_relic'){if(!addItem(id,1,state)&&!state.rpg.inventory.some(x=>x.id===id)&&!state.rpg.pending.some(x=>x.id===id))state.rpg.pending.push({id,qty:1});}
 function onKill(enemy,isBoss=false,rng=Math.random){
  const s=getState(),r=ensure(s);if(!s||!enemy||enemy._rpgRewarded)return false;
  const boitata=isBoss&&enemy.kind==='boitata',rewardKey=boitata?'boitataRewarded':'bossRewarded';enemy._rpgRewarded=true;if(isBoss&&r[rewardKey])return false;
  r.aura=Math.min(9999999,r.aura+(boitata?30:isBoss?20:2));
  if(isBoss){r[rewardKey]=true;giveQuestRelic(s,boitata?'boitata_scale':'curupira_relic');}
  const drop=rollLoot(r.attrs.luck,isBoss,rng);
  if(drop){s.rpgDrops.push({...drop,x:Math.max(20,Math.min(5980,enemy.x)),y:Math.min(2210,enemy.y-20)});if(s.rpgDrops.length>256)s.rpgDrops.shift();}
  notify(boitata?'AURA +30 · Escama de Boitatá vinculada à mochila.':isBoss?'AURA +20 · Rastro do Curupira vinculado à mochila.':'AURA +2'+(drop?' · '+rarity(drop.rarity).name+' no chão.':''));save();return drop;
 }
 function collectDrop(drop){const s=getState();if(!drop||!ITEMS[drop.id])return false;const added=addItem(drop.id,drop.qty||1,s);if(!added){if(!drop.warned){notify('Mochila cheia. Use ou transmute itens para abrir espaço.');drop.warned=true;}return false;}drop.qty=(drop.qty||1)-added;if(drop.qty<=0){const index=s.rpgDrops.indexOf(drop);if(index>=0)s.rpgDrops.splice(index,1);}notify(ITEMS[drop.id].name+' ×'+added+' · '+rarity(ITEMS[drop.id].rarity).name);save();return drop.qty<=0;}
 function tick(dt){const s=getState(),r=ensure(s);if(!r||!s.running||s.paused||s.uiBlocked||s.cinematic)return;r.mana=Math.min(r.maxMana,r.mana+Math.max(0,finite(dt))*2);
  if(r.pending.length&&r.inventory.length<CAPACITY){r.pending=r.pending.filter(item=>!addItem(item.id,item.qty,s)&&!r.inventory.some(x=>x.id===item.id));save();}
  for(let i=s.rpgDrops.length-1;i>=0;i--){const d=s.rpgDrops[i];if(Math.hypot(s.p.x-d.x,s.p.y-d.y)<65)collectDrop(d);}
 }
 function canCast(){const r=ensure();return !!r&&r.mana>=18;}
 function spendMana(){const r=ensure();if(!r||r.mana<18)return false;r.mana-=18;dirty=true;return true;}
 function damageBonus(kind){const r=ensure();if(!r)return 0;const item=ITEMS[r.equipped];return (kind==='magic'?r.attrs.magic:r.attrs.strength)*2+(item&&(!item.meleeOnly||kind!=='magic')?item.bonus||0:0);}
 function onRest(){const s=getState(),r=ensure();if(!r)return;recompute(s,false);r.mana=r.maxMana;dirty=true;}
 function onDeath(){const s=getState(),r=ensure();if(!r)return;s.rpgDrops=[];r.mana=r.maxMana;recompute(s,false);dirty=true;}
 function nearAltar(state=getState()){return !!state?.p&&ALTERS.some(a=>Math.abs(state.p.x-a.x)<105&&Math.abs(state.p.y-a.y)<80);}
 function upgradeCost(state=getState()){const r=ensure(state);return 8+4*Object.values(r.attrs).reduce((a,b)=>a+b,0);}
 function upgrade(attr){const s=getState(),r=ensure();if(!ATTRS[attr])return {ok:false,reason:'Atributo inválido.'};if(!nearAltar(s))return {ok:false,reason:'A evolução exige um Altar da Memória.'};if(r.attrs[attr]>=20)return {ok:false,reason:'Este atributo já alcançou o limite de 20.'};const cost=upgradeCost(s);if(r.aura<cost)return {ok:false,reason:'Aura insuficiente: precisas de '+cost+'.'};r.aura-=cost;r.attrs[attr]++;const oldMana=r.maxMana;recompute(s,true);if(attr==='magic')r.mana+=r.maxMana-oldMana;notify(ATTRS[attr].name+' evoluiu · '+cost+' aura vinculada.');save();return {ok:true,cost};}
 function useItem(index){const s=getState(),r=ensure(),slot=r.inventory[index],item=ITEMS[slot?.id];if(!item)return {ok:false};if(item.kind==='equipment')return equip(index);
  if(item.kind==='health'){if(s.hp>=s.maxHp)return {ok:false,reason:'A vida já está completa.'};s.hp=Math.min(s.maxHp,s.hp+item.value);}
  else if(item.kind==='mana'){if(r.mana>=r.maxMana)return {ok:false,reason:'A mana já está completa.'};r.mana=Math.min(r.maxMana,r.mana+item.value);}
  else if(item.kind==='stamina'){if(s.p.stamina>=100)return {ok:false,reason:'O vigor já está completo.'};s.p.stamina=Math.min(100,s.p.stamina+item.value);}
  else if(item.kind==='antidote'){if(s.p.inv>=1.2)return {ok:false,reason:'A proteção ainda está ativa.'};s.p.inv=1.2;}
  else if(item.kind==='aura')r.aura=Math.min(9999999,r.aura+item.value);
  else if(item.kind==='material'){const value=item.rarity==='rare'?4:item.rarity==='uncommon'?2:1;r.aura=Math.min(9999999,r.aura+value);if(item.element!==undefined)s.materials[item.element]++;}
  slot.qty--;if(slot.qty<=0)r.inventory.splice(index,1);selected=Math.min(selected,Math.max(0,r.inventory.length-1));notify(item.name+' utilizado.');save();return {ok:true};
 }
 function equip(index){const r=ensure(),slot=r.inventory[index],item=ITEMS[slot?.id];if(!item||item.kind!=='equipment')return {ok:false};r.equipped=r.equipped===slot.id?null:slot.id;notify(r.equipped?item.name+' equipado.':'Espaço de relíquia liberado.');save();return {ok:true};}
 function discard(index){const r=ensure(),slot=r.inventory[index];if(!slot)return false;if(ITEMS[slot.id].quest){notify('A memória do Guardião não pode ser descartada.');return false;}if(r.equipped===slot.id)r.equipped=null;r.inventory.splice(index,1);selected=Math.min(selected,Math.max(0,r.inventory.length-1));dirty=true;save();return true;}
 let itemImage=null;
 function renderDrops(ctx,cam=0){const s=getState();if(!s?.rpgDrops)return;if(!itemImage&&typeof Image!=='undefined'){itemImage=new Image();itemImage.src='../assets/rpg_v05/items.webp';}for(const d of s.rpgDrops){if(d.x<cam-50||d.x>cam+1330)continue;const rr=rarity(d.rarity),bob=Math.sin(s.t*4+d.x)*3;ctx.save();ctx.fillStyle=rr.color;ctx.shadowColor=rr.color;ctx.shadowBlur=10;ctx.beginPath();ctx.ellipse(d.x-cam,d.y+12,12,3,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;if(itemImage?.complete&&itemImage.naturalWidth){const n=ITEMS[d.id].icon,w=itemImage.naturalWidth/4,h=itemImage.naturalHeight/4;ctx.drawImage(itemImage,(n%4)*w,Math.floor(n/4)*h,w,h,d.x-cam-19,d.y-24+bob,38,38);}else{ctx.beginPath();ctx.arc(d.x-cam,d.y-7+bob,6,0,Math.PI*2);ctx.fill();}ctx.restore();}}
 const percent=v=>(v*100).toLocaleString('pt-BR',{maximumFractionDigits:2})+'%';
 function itemIcon(id,extra=''){const n=ITEMS[id]?.icon||0;return '<span class="rpg-item-icon '+extra+'" style="background-position:'+(n%4)*100/3+'% '+Math.floor(n/4)*100/3+'%" aria-hidden="true"></span>';}
 function uiIcon(n){return '<span class="rpg-ui-icon" style="background-position:'+(n%4)*100/3+'% '+Math.floor(n/4)*100+'%" aria-hidden="true"></span>';}
 function render(){if(!modal||!active)return;const s=getState(),r=ensure(s);modal.querySelector('#rpgTitle').textContent=active==='bag'?'MOCHILA DO EXÍLIO':'AURA DA MEMÓRIA';modal.querySelector('#rpgBalance').textContent='Aura vinculada '+r.aura+' · '+r.inventory.length+'/'+CAPACITY+' espaços';const body=modal.querySelector('#rpgBody');
  modal.querySelectorAll('[data-rpg-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.rpgTab===active)));
  if(active==='bag'){
   const slot=r.inventory[selected],item=ITEMS[slot?.id],rr=rarity(item?.rarity);
   let slots='';for(let i=0;i<CAPACITY;i++){const v=r.inventory[i],it=ITEMS[v?.id],color=rarity(it?.rarity).color;slots+='<button class="rpg-slot '+(i===selected?'selected':'')+'" data-rpg-select="'+i+'" '+(!v?'disabled':'')+' style="--rarity:'+color+'" aria-label="'+(it?it.name+' ×'+v.qty:'Espaço vazio')+'">'+(v?itemIcon(v.id)+'<b>'+v.qty+'</b>'+(r.equipped===v.id?'<i>◆</i>':''):'<span>·</span>')+'</button>';}
   const detail=item?'<div class="rpg-detail-icon" style="--rarity:'+rr.color+'">'+itemIcon(slot.id)+'</div><small style="color:'+rr.color+'">'+rr.name.toUpperCase()+'</small><h3>'+item.name+'</h3><p>'+item.description+'</p><p class="rpg-item-odds">'+itemOdds(slot.id)+'</p><button data-rpg-use="'+selected+'" class="rpg-primary">'+(item.kind==='equipment'?(r.equipped===slot.id?'DESEQUIPAR':'EQUIPAR'):item.kind==='material'?'TRANSMUTAR EM AURA':'USAR ITEM')+'</button>'+(!item.quest?'<button data-rpg-discard="'+selected+'" class="rpg-subtle">DESCARTAR ESTA PILHA</button>':'<small class="rpg-bound">MEMÓRIA VINCULADA · NÃO DESCARTÁVEL</small>'):'<p>A mochila aguarda os rastros dos corrompidos.</p>';
   body.innerHTML='<div class="rpg-bag-layout"><div><div class="rpg-slots">'+slots+'</div><div class="rpg-equipment"><small>RELÍQUIA EQUIPADA</small><strong>'+(ITEMS[r.equipped]?.name||'Nenhuma')+'</strong></div></div><aside class="rpg-detail">'+detail+'</aside></div>'+oddsTable();
  }else{
   let cards='';for(const [key,a] of Object.entries(ATTRS)){const cap=r.attrs[key]>=20,can=nearAltar(s)&&r.aura>=upgradeCost(s)&&!cap;cards+='<article class="rpg-attribute">'+uiIcon(a.icon)+'<div><h3>'+a.name+' <b>'+r.attrs[key]+' / 20</b></h3><p>'+a.description+'</p><button data-rpg-upgrade="'+key+'" '+(!can?'disabled':'')+'>'+(cap?'LIMITE ATINGIDO':'EVOLUIR · '+upgradeCost(s)+' AURA')+'</button></div></article>';}
   body.innerHTML='<p class="rpg-altar-note">'+(nearAltar(s)?'ALTAR DA MEMÓRIA · O vínculo permite a evolução.':'Aproxima-te de um Altar da Memória para investir aura.')+'</p><div class="rpg-attributes">'+cards+'</div><div class="rpg-derived">Vida máxima <b>'+s.maxHp+'</b> · Mana máxima <b>'+r.maxMana+'</b> · Dano físico extra <b>+'+damageBonus('light')+'</b> · Dano mágico extra <b>+'+damageBonus('magic')+'</b></div>'+oddsTable();
  }
  dirty=false;
 }
 function itemOdds(id){const item=ITEMS[id];if(item.quest)return 'Recompensa fixa de '+(id==='boitata_scale'?'Boitatá':'Curupira')+': 100%, uma única vez.';const r=ensure(),p=lootProfile(r.attrs.luck,false),rr=p.rarities.find(v=>v.id===item.rarity);return 'Chance atual por monstro: '+percent(rr.absolute/rr.items.length)+'. Sorteio uniforme entre '+rr.items.length+' itens desta raridade.';}
 function oddsTable(){const r=ensure(),p=lootProfile(r.attrs.luck,false),boss=lootProfile(r.attrs.luck,true);return '<details class="rpg-odds"><summary>CHANCES REAIS DE SAQUE · SORTE '+r.attrs.luck+'</summary><p>Monstro comum: '+percent(p.chance)+' de obter um item; '+percent(p.none)+' de não obter item. Entre os itens que saem, cada raridade tem a distribuição abaixo.</p><table><thead><tr><th>Raridade</th><th>Entre saques</th><th>Por monstro</th><th>Boss</th></tr></thead><tbody>'+p.rarities.map((v,i)=>'<tr><td style="color:'+v.color+'">'+v.name+'</td><td>'+percent(v.conditional)+'</td><td>'+percent(v.absolute)+'</td><td>'+percent(boss.rarities[i].absolute)+'</td></tr>').join('')+'</tbody></table><p>Boss: um item aleatório garantido + a relíquia fixa do respectivo Guardião. Cada Guardião concede sua recompensa fixa uma única vez por vigília salva. Sorte nunca garante um lendário.</p></details>';}
 function open(tab='bag'){
  const s=getState();if(!s?.running||s.cinematic||s.uiBlocked&&!active||!modal)return false;ensure(s);
  if(!active){previousPause=s.paused;previousFocus=document.activeElement;heldState=s;s.paused=true;s.uiBlocked=true;g()?.keys.clear();g()?.pressed.clear();}
  active=tab==='aura'?'aura':'bag';const bagIcon=document.querySelector('#backpackOpen .rpg-ui-icon');if(bagIcon)bagIcon.style.backgroundPosition='33.333333% 0%';modal.hidden=false;document.body.classList.add('rpg-open');dirty=true;render();modal.querySelector('[data-rpg-close]').focus({preventScroll:true});return true;
 }
 function close(skipRestore=false){if(!active)return;const s=getState();active=null;if(modal)modal.hidden=true;const bagIcon=typeof document!=='undefined'?document.querySelector('#backpackOpen .rpg-ui-icon'):null;if(bagIcon)bagIcon.style.backgroundPosition='0% 0%';document.body.classList.remove('rpg-open');if(s&&s===heldState&&!skipRestore){s.paused=previousPause;s.uiBlocked=false;g()?.keys.clear();g()?.pressed.clear();}heldState=null;if(!skipRestore&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
 function mount(){if(typeof document==='undefined'||!document.querySelector('#stage'))return;const stage=document.querySelector('#stage');
  const hud=document.createElement('div');hud.id='rpgHud';hud.innerHTML='<div class="rpg-mana"><span>MANA <b id="rpgManaNumber">80 / 80</b></span><div role="progressbar" aria-label="Mana" aria-valuemin="0" aria-valuemax="80" aria-valuenow="80"><i id="rpgManaFill"></i></div></div><nav class="rpg-toolbar" aria-label="Mochila e aura"><button id="backpackOpen" aria-label="Abrir mochila (B)">'+uiIcon(0)+'<span>B · MOCHILA</span></button><button id="auraOpen" aria-label="Evoluir aura (N)">'+uiIcon(2)+'<span>N · AURA <b id="rpgAuraNumber">0</b></span></button></nav>';
  stage.appendChild(hud);modal=document.createElement('section');modal.id='rpgModal';modal.className='rpg-modal';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','rpgTitle');modal.innerHTML='<article class="rpg-panel"><header><div><small>MEMÓRIAS QUE A PEDRA NÃO GUARDA</small><h2 id="rpgTitle">MOCHILA DO EXÍLIO</h2><p id="rpgBalance"></p></div><button data-rpg-close aria-label="Fechar mochila ou aura">FECHAR ×</button></header><nav class="rpg-tabs" role="tablist"><button data-rpg-tab="bag" role="tab">MOCHILA · B</button><button data-rpg-tab="aura" role="tab">EVOLUIR AURA · N</button></nav><div id="rpgBody"></div><p id="rpgFeedback" aria-live="polite"></p></article>';stage.appendChild(modal);
  document.querySelector('#backpackOpen').onclick=()=>open('bag');document.querySelector('#auraOpen').onclick=()=>open('aura');
  modal.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-rpg-close')){close();return;}if(b.dataset.rpgTab){open(b.dataset.rpgTab);return;}if(b.dataset.rpgSelect!==undefined){selected=Number(b.dataset.rpgSelect);dirty=true;}else if(b.dataset.rpgUse!==undefined){const result=useItem(Number(b.dataset.rpgUse));modal.querySelector('#rpgFeedback').textContent=result.ok?'Item aplicado.':result.reason||'Item indisponível.';}else if(b.dataset.rpgDiscard!==undefined){discard(Number(b.dataset.rpgDiscard));modal.querySelector('#rpgFeedback').textContent='Pilha descartada.';}else if(b.dataset.rpgUpgrade){const result=upgrade(b.dataset.rpgUpgrade);modal.querySelector('#rpgFeedback').textContent=result.ok?'O vínculo tornou-se mais forte.':result.reason;}if(dirty)render();});
  document.addEventListener('keydown',e=>{const s=getState();if(e.code==='KeyB'||e.code==='KeyN'){if(!s?.running||s.cinematic||s.uiBlocked&&!active)return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;const tab=e.code==='KeyB'?'bag':'aura';if(active===tab)close();else open(tab);return;}if(!active)return;if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}if(e.key==='Tab'){const focusable=[...modal.querySelectorAll('button:not([disabled]),summary')].filter(x=>x.getClientRects().length);if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0]?.focus();}}},true);
  const sync=()=>{const s=getState();if(active&&(!s?.running||s!==heldState))close(true);const r=ensure(s);document.body.classList.toggle('boss-fight',!!s&&s.boss.state!=='dormant'&&s.boss.state!=='dead'||!!s&&s.boitata?.state!=='dormant'&&s.boitata?.state!=='dead');if(r){document.querySelector('#rpgManaNumber').textContent=Math.ceil(r.mana)+' / '+r.maxMana;document.querySelector('#rpgManaFill').style.width=100*r.mana/r.maxMana+'%';const bar=document.querySelector('#rpgManaFill').parentElement;bar.setAttribute('aria-valuenow',Math.round(r.mana));bar.setAttribute('aria-valuemax',r.maxMana);document.querySelector('#rpgAuraNumber').textContent=r.aura;if(active&&dirty)render();}requestAnimationFrame(sync);};requestAnimationFrame(sync);
 }
 const API={RARITIES,ITEMS,ATTRS,CAPACITY,STACK,lootProfile,rollLoot,initialize,serialize,tick,onKill,collectDrop,renderDrops,canCast,spendMana,damageBonus,onRest,onDeath,nearAltar,upgradeCost,upgrade,useItem,equip,discard,addItem,recompute,open,close,get active(){return active;}};
 HOST.RatanabaRPG=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
 mount();if(g()?.state&&!g().state.rpg)initialize(g().state);
})();
