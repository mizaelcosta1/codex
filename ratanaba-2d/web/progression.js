'use strict';
/* Contextual onboarding and real, persistent chest interactions. Kept outside the
   simulation core so the 60 Hz fixed-step loop and combat timings stay untouched. */
(()=> {
 const $=s=>document.querySelector(s), storageKey='ratanaba_world_interactions_v1';
 const CHESTS=[
  {id:'crypt-common',x:458,y:495,rarity:0,label:'Baú da Cripta',item:'health_small'},
  {id:'crypt-uncommon',x:740,y:405,rarity:1,label:'Baú do Claustro',item:'mana_small'},
  {id:'crypt-rare',x:1080,y:345,rarity:2,label:'Baú do Relicário',item:'aura_small'},
  {id:'forest-epic',x:2850,y:480,rarity:3,label:'Baú das Águas',item:'stamina'},
  {id:'vale-legendary',x:4150,y:500,rarity:4,label:'Baú da Floresta',item:'curse_amulet'}
 ];
 const TOTEMS=[2260,2650,3040,3430];
 const HINTS={
  move:'MOVIMENTO · Use o analógico à esquerda para caminhar. Incline para cima para saltar e para baixo sobre plataformas finas para descer.',
  combat:'COMBATE · Toque em GOLPE para iniciar combos. Segure para o ataque pesado; use ESQUIVA para escapar e abrir espaço para contra-atacar.',
  totem:'TOTENS ELEMENTAIS · Cada totem guarda um selo. Equipe o elemento correspondente e acerte o totem para resolver o puzzle. Os quatro selos abrem o caminho.',
  chest:'BAÚS · Aproxime-se e toque em ABRIR BAÚ. Eles guardam poções, aura, materiais e equipamentos. Cada baú só pode ser aberto uma vez.',
  boss:'GUARDIÃO · Observe a preparação do golpe, esquive da investida e ataque durante a recuperação. Não ataque às cegas.'
 };
 let opened=new Set(),seen=new Set(),activeChest=null,lastHint='',lastShown=0,ui=null;
 const game=()=>window.Ratanaba, state=()=>game()?.state;
 function read(){try{const d=JSON.parse(localStorage.getItem(storageKey)||'{}');opened=new Set(Array.isArray(d.opened)?d.opened:[]);seen=new Set(Array.isArray(d.seen)?d.seen:[]);}catch{opened=new Set();seen=new Set();}}
 function save(){try{localStorage.setItem(storageKey,JSON.stringify({opened:[...opened],seen:[...seen]}));}catch{}}
 function ensureUI(){
  if(ui)return;
  ui=document.createElement('aside');ui.id='worldInteraction';ui.innerHTML='<div class="world-hint-copy"><small id="worldHintKicker">RASTRO DESCOBERTO</small><p id="worldHintText"></p></div><button id="worldHintAction" type="button" hidden></button>';
  $('#stage').appendChild(ui);
  $('#worldHintAction').addEventListener('click',openNearbyChest);
 }
 function showHint(key,text,action){
  if(!ui)ensureUI();
  const kicker=$('#worldHintKicker'),copy=$('#worldHintText'),button=$('#worldHintAction');
  if(key!==lastHint||text!==copy.textContent){lastHint=key;lastShown=state()?.t||0;kicker.textContent=key==='chest'?'TESOURO PRÓXIMO':key==='totem'?'PUZZLE DESCOBERTO':'DICA DE JOGO';copy.textContent=text;ui.classList.add('visible');}
  if(action){button.hidden=false;button.textContent=action;}else button.hidden=true;
 }
 function hideHint(){if(ui)ui.classList.remove('visible');lastHint='';activeChest=null;}
 function nearestChest(s){let best=null,dist=Infinity;for(const c of CHESTS){if(opened.has(c.id))continue;const dx=Math.abs(s.p.x-c.x),dy=Math.abs(s.p.y-c.y);if(dx>100||dy>260)continue;const d=dx+Math.max(0,dy-150)*.25;if(d<dist){dist=d;best=c;}}return best;}
 function openNearbyChest(){
  const s=state(),c=activeChest;if(!s?.running||s.paused||s.cinematic||!c||opened.has(c.id))return false;
  const added=window.RatanabaRPG?.addItem(c.item,1,s)||0;
  if(!added){showHint('chest','MOCHILA CHEIA · Libere um espaço antes de abrir este baú.','VOLTAR');return false;}
  opened.add(c.id);save();game().persist?.();
  const item=window.RatanabaRPG?.ITEMS?.[c.item];s.toast='BAÚ ABERTO · '+(item?.name||'Item')+' adicionado à mochila.';s.toastUntil=s.t+4;
  hideHint();return true;
 }
 function update(){
  const s=state();if(!s?.running||s.paused||s.uiBlocked||s.cinematic){hideHint();return;}
  const chest=nearestChest(s);
  if(chest){activeChest=chest;showHint('chest',HINTS.chest,'ABRIR BAÚ · E');return;}
  activeChest=null;
  const totemIndex=TOTEMS.findIndex(x=>Math.abs(s.p.x-x)<115&&Math.abs(s.p.y-555)<125);
  if(totemIndex>=0&&!seen.has('totem-'+totemIndex)){seen.add('totem-'+totemIndex);save();showHint('totem',HINTS.totem);return;}
  if(Math.abs(s.p.x-650)<145&&!seen.has('combat')){seen.add('combat');save();showHint('combat',HINTS.combat);return;}
  if(s.p.x>4900&&s.p.x<5050&&!seen.has('boss')){seen.add('boss');save();showHint('boss',HINTS.boss);return;}
  if(s.p.x<360&&!seen.has('move')){seen.add('move');save();showHint('move',HINTS.move);return;}
  if(ui?.classList.contains('visible')&&s.t-lastShown>5)hideHint();
 }
 document.addEventListener('keydown',e=>{
  if(e.code!=='KeyE'||e.repeat||!activeChest)return;
  e.preventDefault();e.stopImmediatePropagation();openNearbyChest();
 },true);
 const install=()=>{
  ensureUI();read();
  const g=game();if(!g)return;
  const start=g.start;
  if(typeof start==='function')g.start=function(fromSave=false){if(!fromSave){opened.clear();seen.clear();save();}return start(fromSave);};
  const frame=()=>{update();requestAnimationFrame(frame);};requestAnimationFrame(frame);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 window.RatanabaWorldInteractions={openNearbyChest,get opened(){return [...opened];},get seen(){return [...seen];}};
})();