'use strict';
(()=>{
  const $=s=>document.querySelector(s), game=()=>window.Ratanaba;
  const SETTINGS='ratanaba_settings_v03',SAVE='ratanaba_web_v02';
  const dialogs=[...document.querySelectorAll('.menu-dialog')];
  let opener=null,hadPause=false;
  const defaults={sound:true,gore:true,touch:true,volume:.7,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
  let prefs={...defaults};
  try{prefs={...prefs,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')};}catch(e){}
  function setPrefs(){
    prefs.sound=$('#sound').checked;prefs.gore=$('#gore').checked;prefs.touch=$('#touchToggle').checked;
    prefs.volume=Number($('#volume').value)/100;prefs.reducedMotion=$('#reducedMotion').checked;
    document.body.classList.toggle('touch',prefs.touch);document.body.classList.toggle('reduced-motion',prefs.reducedMotion);
    $('#volumeValue').textContent=Math.round(prefs.volume*100)+'%';
    const g=game();if(g){g.state.sound=prefs.sound;g.state.gore=prefs.gore;g.setVolume?.(prefs.volume);g.setReducedMotion?.(prefs.reducedMotion);}
    try{localStorage.setItem(SETTINGS,JSON.stringify(prefs));}catch(e){}
  }
  $('#sound').checked=!!prefs.sound;$('#gore').checked=!!prefs.gore;$('#touchToggle').checked=!!prefs.touch;
  $('#volume').value=Math.round(Math.max(0,Math.min(1,prefs.volume))*100);$('#reducedMotion').checked=!!prefs.reducedMotion;
  ['sound','gore','touchToggle','reducedMotion'].forEach(id=>$('#'+id).addEventListener('change',setPrefs));
  $('#volume').addEventListener('input',setPrefs);setPrefs();
  function saveStatus(){let d=null;try{d=JSON.parse(localStorage.getItem(SAVE)||'null');}catch(e){}const exists=!!(d&&typeof d==='object'&&Number.isFinite(d.level)&&d.checkpoint&&Number.isFinite(d.checkpoint.x));$('#continue').disabled=!exists;$('#saveStatus').textContent=exists?'Vigília preservada · nível '+d.level:'A primeira vigília ainda aguarda.';}
  function openDialog(id,button){opener=button;hadPause=!!game()?.state.paused;dialogs.forEach(d=>d.hidden=true);const d=$(id);d.hidden=false;if(game()){game().state.uiBlocked=true;game().state.paused=true;game().keys.clear();game().pressed.clear();}d.querySelector('button,input')?.focus();}
  function closeDialogs(){dialogs.forEach(d=>d.hidden=true);if(game()){game().state.uiBlocked=false;game().state.paused=hadPause;}opener?.focus();}
  $('#settingsOpen').onclick=e=>openDialog('#settingsDialog',e.currentTarget);
  $('#pauseSettings').onclick=e=>openDialog('#settingsDialog',e.currentTarget);
  $('#extrasOpen').onclick=e=>openDialog('#extrasDialog',e.currentTarget);
  $('#exitOpen').onclick=e=>{if(game()?.state.running)game().persist();openDialog('#exitDialog',e.currentTarget);};
  document.querySelectorAll('[data-close-dialog]').forEach(b=>b.onclick=closeDialogs);
  $('#returnToMenu').onclick=()=>{const g=game();g.persist();g.state.running=false;g.state.paused=false;g.state.uiBlocked=false;g.keys.clear();g.pressed.clear();$('#pauseMenu').hidden=true;$('#menu').hidden=false;saveStatus();$('#continue').focus();};
  ['start','continue'].forEach(id=>$('#'+id).addEventListener('click',()=>{if(game()?.state.running)setPrefs();}));
  $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#stage').requestFullscreen();$('#fullscreenStatus').textContent=document.fullscreenElement?'Tela cheia ativada. ESC para sair.':'Modo janela ativado.';}catch(e){$('#fullscreenStatus').textContent='Este navegador não oferece tela cheia aqui.';}};
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));document.querySelectorAll('[data-extra]').forEach(s=>s.hidden=s.dataset.extra!==b.dataset.tab);});
  document.addEventListener('keydown',e=>{const d=dialogs.find(d=>!d.hidden);if(!d)return;if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeDialogs();return;}if(e.key==='Tab'){const f=[...d.querySelectorAll('button:not([disabled]),input')].filter(el=>el.getClientRects().length);if(f.length){if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0].focus();}}}},true);
  addEventListener('storage',saveStatus);saveStatus();
  window.RatanabaMenu={openDialog,closeDialogs,saveStatus,get preferences(){return {...prefs};}};
})();
