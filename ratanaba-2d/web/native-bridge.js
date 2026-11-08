'use strict';
/* Android-only lifecycle adapter. No native JavaScript interface is exposed. */
(()=>{
 if(location.protocol!=='https:'||location.hostname!=='appassets.androidplatform.net')return;
 function suspend(){
  const g=window.Ratanaba;if(!g?.state.running)return;
  g.persist();g.keys.clear();g.pressed.clear();
  if(!g.state.paused&&!g.state.uiBlocked){g.state.paused=true;const panel=document.querySelector('#pauseMenu');if(panel)panel.hidden=false;}
  document.querySelectorAll('audio,video').forEach(media=>media.pause());
  try{if(typeof ambience!=='undefined'&&ambience)ambience.pause();}catch(e){}
  try{if(typeof audio!=='undefined'&&audio)audio.suspend().catch(()=>{});}catch(e){}
 }
 function resumeAudio(){
  const s=window.Ratanaba?.state;if(!s?.running||s.paused||s.uiBlocked||!s.sound)return;
  try{if(typeof audio!=='undefined'&&audio)audio.resume().catch(()=>{});}catch(e){}
  try{if(typeof ambience!=='undefined'&&ambience)ambience.play().catch(()=>{});}catch(e){}
 }
 function handleBack(){
  if(window.RatanabaRPG?.active){window.RatanabaRPG.close();return true;}
  const dialog=[...document.querySelectorAll('.menu-dialog')].find(d=>!d.hidden);
  if(dialog){window.RatanabaMenu?.closeDialogs();return true;}
  if(window.Ratanaba?.state.running){dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true}));return true;}
  return false;
 }
 addEventListener('pagehide',suspend);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
 document.addEventListener('pointerup',()=>queueMicrotask(resumeAudio),true);
 document.addEventListener('keydown',()=>queueMicrotask(resumeAudio),true);
 document.addEventListener('click',()=>queueMicrotask(resumeAudio));
 const exit=document.querySelector('#exitDialog p');if(exit)exit.textContent='A vigília está suspensa. Use o botão Voltar do Android para encerrar o aplicativo, ou retorne ao menu.';
 window.RatanabaNative={suspend,handleBack,resumeAudio};
})();
