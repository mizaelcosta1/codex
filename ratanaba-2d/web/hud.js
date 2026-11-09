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
  tutorial_controls:[
   ['O BANIDO','MOVIMENTO — use o analógico à esquerda para caminhar em qualquer direção. No teclado, use A/D ou as setas.','banido'],
   ['O BANIDO','TRAVESSIA — toque em PULO para saltar. Durante o salto, use ESQUIVA para executar um dash aéreo e alcançar plataformas distantes.','banido'],
   ['O BANIDO','COMBATE — toque em GOLPE para atacar; segure para o golpe pesado. Use MAGIA e escolha um elemento que explore a fraqueza do inimigo.','banido'],
   ['O BANIDO','DEFESA — mantenha DEFESA para reduzir o dano. Pressione no instante do impacto para executar um PARRY e atordoar o atacante. Agora, siga os rastros.','banido']
  ],
  curupira_intro:[
   ['CURUPIRA','Teus passos… Não. Este caminho já aconteceu.\nPor que o ontem não me devolve teu rosto?','curupira'],
   ['CURUPIRA','Se eu apagar teu rastro… talvez o tempo recomece.\nPerdoa-me, meu amigo.','curupira']
  ],
  curupira_farewell:[
   ['CURUPIRA','Meus rastros… mentiram para o chão.\nQuerendo o ontem, o amanhã eu… ceguei.','curupira'],
   ['CURUPIRA','O tempo é um laço que o código não desata.\nLeve meu rastro. Não olhe.','curupira'],
   ['O BANIDO','Onde houve busca, que agora haja o Nada.\nDescansa. Eu carregarei a memória.','banido']
  ]
 };
 let seen=new Set(),active=null,line=0,shown=0,typeTime=0,last=performance.now(),focusBefore=null;
 function endScene(){const g=game(),ended=active;if(g)g.state.cinematic=null;active=null;$('#cutscene').hidden=true;$('#cinemaBars').hidden=true;document.body.classList.remove('cinematic');if(g){g.keys.clear();g.pressed.clear();}if(focusBefore?.isConnected)focusBefore.focus({preventScroll:true});if(ended==='awakening'&&g?.state.running)playScene('tutorial_controls');}
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
 function drawMinimap(s){mc.clearRect(0,0,280,280);mc.fillStyle='#0c141b';mc.fillRect(0,0,280,280);mc.strokeStyle='#1e2d32';mc.lineWidth=1;for(let x=0;x<280;x+=20){mc.beginPath();mc.moveTo(x,0);mc.lineTo(x,280);mc.stroke();}for(let y=0;y<280;y+=20){mc.beginPath();mc.moveTo(0,y);mc.lineTo(280,y);mc.stroke();}
  for(let i=0;i<3;i++){const x=12+i*89;mc.fillStyle=s.visited[i]?'#273d3e':'#101d24';mc.fillRect(x,85,78,95);mc.lineWidth=2;mc.strokeStyle=s.area===i?'#92c7b4':s.visited[i]?'#556961':'#293c42';mc.strokeRect(x,85,78,95);mc.fillStyle='#b4a789';mc.font='16px Georgia';mc.textAlign='center';mc.fillText(['I','II','III'][i],x+39,113);if(i<2){mc.fillStyle=i===1&&!s.seals.every(Boolean)?'#ad7b4d':'#657d6d';mc.fillRect(x+78,128,11,9);}}
  mc.strokeStyle='#9f8a58';mc.lineWidth=2;for(const x of [20,99,223]){mc.beginPath();mc.moveTo(x,170);mc.lineTo(x+8,170);mc.stroke();}
  if(s.boss.state!=='dead'){mc.fillStyle='#b84c4e';mc.beginPath();mc.arc(250,142,6,0,Math.PI*2);mc.fill();}
  const area=Math.min(2,s.area),roomX=12+area*89,local=area===0?s.p.x/1900:area===1?(s.p.x-1900)/2000:(s.p.x-3900)/2100;
  mc.fillStyle='#83ece0';mc.shadowColor='#5ccdc5';mc.shadowBlur=8;mc.beginPath();mc.arc(roomX+7+Math.max(0,Math.min(1,local))*63,155-(620-s.p.y)*.10,5,0,Math.PI*2);mc.fill();mc.shadowBlur=0;
  mc.fillStyle='#bca77c';mc.font='14px Georgia';mc.textAlign='center';mc.fillText('RATANABÁ',140,221);mc.fillStyle='#7ca69a';mc.font='12px sans-serif';mc.fillText('✦ Banido    ♦ Guardião',140,244);
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
