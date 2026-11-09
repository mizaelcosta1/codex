'use strict';
(()=>{
 const $=s=>document.querySelector(s),game=()=>window.Ratanaba;
 const map=$('#miniCanvas'),mc=map.getContext('2d');
 const SCENES={
  awakening:[
   ['O BANIDO','O mundo esqueceu meu nome.\nA floresta ainda reconhece minha ferida.','banido'],
   ['O BANIDO','Eu tomei a corrupção para mim…\ne deixei meus irmãos guardando um trono vazio.','banido'],
   ['O BANIDO','Se ainda escutam meu rastro, eu os encontrarei.\nMesmo que só reste a misericórdia.','banido']
  ],
  curupira_intro:[
   ['CURUPIRA','Teus passos… Não. Este caminho já aconteceu.\nPor que o ontem não me devolve teu rosto?','curupira'],
   ['CURUPIRA','Se eu apagar teu rastro… talvez o tempo recomece.\nPerdoa-me, meu amigo.','curupira']
  ],
  boitata_intro:[['O BANIDO','As raízes abriram um caminho para baixo.\nBoitatá ainda guarda a memória das cinzas.','banido'],['O BANIDO','A água expõe tua chama.\nEsperarei o fim da investida.','banido']],
  boitata_farewell:[['O BANIDO','A chama se aquieta.\nNem toda memória precisa continuar ardendo.','banido'],['O BANIDO','Curupira abriu o rastro. Tu guardaste as cinzas.\nEu levarei as duas lembranças.','banido']],
  curupira_farewell:[
   ['CURUPIRA','Meus rastros… mentiram para o chão.\nQuerendo o ontem, o amanhã eu… ceguei.','curupira'],
   ['CURUPIRA','O tempo é um laço que o código não desata.\nLeve meu rastro. Não olhe.','curupira'],
   ['O BANIDO','Onde houve busca, que agora haja o Nada.\nDescansa. Eu carregarei a memória.\nSeguirei pelas raízes, até o Vale das Cinzas.','banido']
  ]
 };
 let seen=new Set(),active=null,line=0,shown=0,typeTime=0,last=performance.now(),focusBefore=null;
 function endScene(){const g=game();if(g)g.state.cinematic=null;active=null;$('#cutscene').hidden=true;$('#cinemaBars').hidden=true;document.body.classList.remove('cinematic');if(g){g.keys.clear();g.pressed.clear();}if(focusBefore?.isConnected)focusBefore.focus({preventScroll:true});}
 function showLine(){const [name,text,portrait]=SCENES[active][line];shown=0;typeTime=0;$('#speakerName').textContent=name;$('#speakerPortrait').src='../assets/hud_v04/portrait_'+portrait+'.webp';$('#speakerPortrait').alt='Retrato de '+name;$('#dialogueText').textContent='';$('#dialogueCount').textContent=(line+1)+' / '+SCENES[active].length;$('#dialogueNext').innerHTML='REVELAR <span>↵</span>';const s=game().state;s.cinematic={id:active,line};}
 function playScene(id){const g=game();if(!SCENES[id]||!g?.state.running||seen.has(id)||active)return false;seen.add(id);active=id;line=0;focusBefore=document.activeElement;g.keys.clear();g.pressed.clear();g.state.p.vx=0;g.state.p.attack=null;g.state.p.queue=false;$('#cutscene').hidden=false;$('#cinemaBars').hidden=false;document.body.classList.add('cinematic');showLine();$('#dialogueNext').focus({preventScroll:true});return true;}
 function advance(){if(!active||game().state.paused||game().state.uiBlocked)return;const text=SCENES[active][line][1];if(shown<text.length){shown=text.length;$('#dialogueText').textContent=text;$('#dialogueNext').innerHTML=(line===SCENES[active].length-1?'RETOMAR':'CONTINUAR')+' <span>↵</span>';return;}line++;if(line>=SCENES[active].length)endScene();else showLine();}
 function onStart(fromSave){endScene();seen=new Set();if(!fromSave)playScene('awakening');}
 $('#dialogueNext').onclick=advance;$('#dialogueSkip').onclick=endScene;
 document.addEventListener('keydown',e=>{if(!active||game().state.paused||game().state.uiBlocked)return;if(['Enter','Space','KeyE'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)advance();}},true);
 $('#minimap').onclick=()=>{const g=game();if(!g?.state.running||g.state.cinematic)return;if(g.keys.has('map'))g.keys.delete('map');else g.keys.add('map');g.render();};
 // The club uses an explicit short/long press to keep both attack modes reachable on touch.
 let holdTimer=null,longPress=false,pointer=null;
 const club=$('#clubButton');
 function emit(action){const g=game();if(g?.state.running&&!g.state.paused&&!g.state.uiBlocked&&!g.state.cinematic)g.pressed.add(action);}
 club.onpointerdown=e=>{e.preventDefault();pointer=e.pointerId;club.setPointerCapture(pointer);longPress=false;clearTimeout(holdTimer);holdTimer=setTimeout(()=>{longPress=true;emit('heavy');},300);};
 club.onpointerup=e=>{if(pointer!==e.pointerId)return;clearTimeout(holdTimer);if(!longPress)emit('light');pointer=null;};
 club.onpointercancel=club.onlostpointercapture=()=>{clearTimeout(holdTimer);pointer=null;};
 club.onclick=e=>{if(e.detail===0)emit('light');};
 addEventListener('blur',()=>{clearTimeout(holdTimer);pointer=null;});
 function drawMinimap(s){
  mc.clearRect(0,0,280,280);mc.fillStyle='#0c141b';mc.fillRect(0,0,280,280);
  const rooms=[{x:12,y:55,w:78,h:65},{x:101,y:55,w:78,h:65},{x:190,y:55,w:78,h:65},{x:190,y:155,w:78,h:65}];
  for(let i=0;i<rooms.length;i++){const r=rooms[i];mc.fillStyle=s.visited[i]?'#273d3e':'#101d24';mc.fillRect(r.x,r.y,r.w,r.h);mc.strokeStyle=s.area===i?'#92c7b4':'#556961';mc.lineWidth=2;mc.strokeRect(r.x,r.y,r.w,r.h);mc.font='14px Georgia';mc.fillStyle='#bca77c';mc.textAlign='center';mc.fillText(['I','II','III','IV'][i],r.x+r.w/2,r.y+20);}
  mc.fillStyle='#657d6d';mc.fillRect(90,85,11,7);mc.fillRect(179,85,11,7);mc.fillStyle=s.boss.state==='dead'?'#96c7b4':'#684c35';mc.fillRect(246,120,6,35);
  const area=Math.min(3,s.area),r=rooms[area],local=area===0?s.p.x/1900:area===1?(s.p.x-1900)/2000:area===2?(s.p.x-3900)/2100:(s.p.x-4100)/1900;
  mc.fillStyle='#83ece0';mc.beginPath();mc.arc(r.x+7+Math.max(0,Math.min(1,local))*64,r.y+42-(area<3?Math.min(25,(620-s.p.y)*.1):0),5,0,Math.PI*2);mc.fill();
  mc.fillStyle='#b84c4e';for(const [i,b] of [[2,s.boss],[3,s.boitata]])if(b&&b.state!=='dead'){mc.beginPath();mc.arc(rooms[i].x+38,rooms[i].y+44,5,0,Math.PI*2);mc.fill();}
  mc.font='12px Georgia';mc.fillStyle='#bca77c';mc.textAlign='center';mc.fillText('RATANABÁ · ↓ VALE DAS CINZAS',140,250);
 }
 function sync(dt=0){const g=game();if(!g)return;const s=g.state;document.body.classList.toggle('playing',s.running);if(active&&(!s.running||s.cinematic?.id!==active))endScene();document.body.classList.toggle('cinematic',!!s.cinematic);$('#cutscene').hidden=!active;$('#cinemaBars').hidden=!active;
  $('#orbFill').style.height=Math.max(0,s.hp/s.maxHp)*100+'%';$('#potionCount').textContent=s.potions;$('#elementName').textContent=['FOGO','ELETRICIDADE','ÁGUA','VENENO'][s.element];$('#spellCooldown').textContent=s.p.spellCd>0?s.p.spellCd.toFixed(1):'';
  $('#life').parentElement.setAttribute('role','progressbar');$('#life').parentElement.setAttribute('aria-label','Vida');$('#life').parentElement.setAttribute('aria-valuenow',Math.ceil(s.hp));$('#life').parentElement.setAttribute('aria-valuemax',s.maxHp);$('#stamina').parentElement.setAttribute('role','progressbar');$('#stamina').parentElement.setAttribute('aria-label','Vigor');$('#stamina').parentElement.setAttribute('aria-valuenow',Math.round(s.p.stamina));$('#stamina').parentElement.setAttribute('aria-valuemax','100');
  if(active&&!s.paused&&!s.uiBlocked){const text=SCENES[active][line][1];if(shown<text.length){typeTime+=dt;shown=Math.min(text.length,Math.floor(typeTime*38));$('#dialogueText').textContent=text.slice(0,shown);if(shown===text.length)$('#dialogueNext').innerHTML=(line===SCENES[active].length-1?'RETOMAR':'CONTINUAR')+' <span>↵</span>';}}
  drawMinimap(s);
 }
 function frame(now){sync(Math.min(.05,(now-last)/1000));last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
 window.RatanabaHUD={onStart,playScene,advance,endScene,sync,get active(){return active;},get scenes(){return Object.keys(SCENES);}};
})();
