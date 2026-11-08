'use strict';
/* The Android adapter is tested independently from the Canvas engine. These
   tests exercise its origin gate, lifecycle calls, UI routing and event order. */
const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'../native-bridge.js'),'utf8');
function fixture(origin={protocol:'https:',hostname:'appassets.androidplatform.net'}){
 const calls={save:0,mediaPause:0,ambiencePause:0,ambiencePlay:0,audioSuspend:0,audioResume:0,rpgClose:0,menuClose:0,events:[]};
 const docListeners=new Map(),winListeners=new Map(),microtasks=[];
 const pause={hidden:true},exit={textContent:'Old browser exit text'},dialogs=[{hidden:true},{hidden:true}];
 const state={running:true,paused:false,uiBlocked:false,sound:true};
 const g={state,keys:new Set(['right']),pressed:new Set(['light']),persist(){calls.save++;}};
 const document={hidden:false,querySelector(s){return s==='#pauseMenu'?pause:s==='#exitDialog p'?exit:null;},querySelectorAll(s){return s==='audio,video'?[{pause(){calls.mediaPause++;}}]:s==='.menu-dialog'?dialogs:[];},addEventListener(type,fn){if(!docListeners.has(type))docListeners.set(type,[]);docListeners.get(type).push(fn);}};
 const window={Ratanaba:g,RatanabaRPG:{active:null,close(){calls.rpgClose++;this.active=null;}},RatanabaMenu:{closeDialogs(){calls.menuClose++;dialogs.forEach(d=>d.hidden=true);}}};
 const context={window,location:origin,document,console,Set,queueMicrotask(fn){microtasks.push(fn);},KeyboardEvent:class{constructor(type,init){this.type=type;Object.assign(this,init);}},addEventListener(type,fn){if(!winListeners.has(type))winListeners.set(type,[]);winListeners.get(type).push(fn);},dispatchEvent(event){calls.events.push(event);return true;},ambience:{pause(){calls.ambiencePause++;},play(){calls.ambiencePlay++;return Promise.resolve();}},audio:{suspend(){calls.audioSuspend++;return Promise.resolve();},resume(){calls.audioResume++;return Promise.resolve();}}};
 vm.createContext(context);vm.runInContext(source,context);
 return {api:window.RatanabaNative,window,document,state,g,calls,pause,exit,dialogs,
  doc(type){for(const fn of docListeners.get(type)||[])fn({type});},
  win(type){for(const fn of winListeners.get(type)||[])fn({type});},
  flush(){while(microtasks.length)microtasks.shift()();},docListeners,winListeners};
}
let count=0;
function pass(label,fn){fn();count++;console.log('PASS '+label);}
pass('ordinary file build has no Android bridge or extra event handlers',()=>{
 const f=fixture({protocol:'file:',hostname:''});assert.equal(f.api,undefined);assert.equal(f.docListeners.size,0);assert.equal(f.winListeners.size,0);assert.equal(f.exit.textContent,'Old browser exit text');
});
pass('HTTP and unrelated HTTPS hosts cannot activate the native adapter',()=>{
 for(const origin of [{protocol:'http:',hostname:'appassets.androidplatform.net'},{protocol:'https:',hostname:'example.com'}])assert.equal(fixture(origin).api,undefined);
});
pass('reserved HTTPS appassets origin exposes only the lifecycle helper',()=>{
 const f=fixture();assert(f.api);assert.deepEqual(Object.keys(f.api).sort(),['handleBack','resumeAudio','suspend']);assert(f.exit.textContent.includes('Android'));
});
pass('suspend saves progress and clears held or buffered controls',()=>{
 const f=fixture();f.api.suspend();assert.equal(f.calls.save,1);assert.equal(f.g.keys.size,0);assert.equal(f.g.pressed.size,0);
});
pass('suspend pauses the active game and opens its normal pause UI',()=>{
 const f=fixture();f.api.suspend();assert.equal(f.state.paused,true);assert.equal(f.pause.hidden,false);
});
pass('suspend stops media, ambience and the WebAudio context',()=>{
 const f=fixture();f.api.suspend();assert.equal(f.calls.mediaPause,1);assert.equal(f.calls.ambiencePause,1);assert.equal(f.calls.audioSuspend,1);
});
pass('backgrounding preserves an already-open modal instead of replacing it',()=>{
 const f=fixture();f.state.paused=true;f.state.uiBlocked=true;f.api.suspend();assert(f.state.paused);assert(f.state.uiBlocked);assert(f.pause.hidden);assert.equal(f.calls.save,1);
});
pass('main menu lifecycle events do not fabricate a game save',()=>{
 const f=fixture();f.state.running=false;f.api.suspend();assert.equal(f.calls.save,0);assert.equal(f.calls.audioSuspend,0);assert(f.pause.hidden);
});
pass('pagehide and hidden-document events invoke the same save/pause path',()=>{
 const f=fixture();f.win('pagehide');assert.equal(f.calls.save,1);f.document.hidden=true;f.doc('visibilitychange');assert.equal(f.calls.save,2);f.document.hidden=false;f.doc('visibilitychange');assert.equal(f.calls.save,2);
});
pass('audio remains suspended while paused, blocked, muted or outside play',()=>{
 for(const patch of [{paused:true},{uiBlocked:true},{sound:false},{running:false}]){const f=fixture();Object.assign(f.state,patch);f.api.resumeAudio();assert.equal(f.calls.audioResume,0);assert.equal(f.calls.ambiencePlay,0);}
});
pass('audio restoration resumes both the context and looping ambience',()=>{
 const f=fixture();f.api.resumeAudio();assert.equal(f.calls.audioResume,1);assert.equal(f.calls.ambiencePlay,1);
});
pass('touch Resume restores audio after click unpauses, not before click',()=>{
 const f=fixture();f.state.paused=true;f.doc('pointerup');f.flush();assert.equal(f.calls.audioResume,0);
 // The game's Resume onclick runs before the document's bubbling click handler.
 f.state.paused=false;f.doc('click');assert.equal(f.calls.audioResume,0);f.flush();assert.equal(f.calls.audioResume,1);assert.equal(f.calls.ambiencePlay,1);
});
pass('keyboard Resume defers audio restoration until the input handler finishes',()=>{
 const f=fixture();f.state.paused=true;f.doc('keydown');f.state.paused=false;f.flush();assert.equal(f.calls.audioResume,1);
});
pass('Android Back closes the backpack before considering a menu or gameplay',()=>{
 const f=fixture();f.window.RatanabaRPG.active='bag';f.dialogs[0].hidden=false;assert.equal(f.api.handleBack(),true);assert.equal(f.calls.rpgClose,1);assert.equal(f.calls.menuClose,0);assert.equal(f.calls.events.length,0);
});
pass('Android Back closes an open settings or extras dialog before pausing',()=>{
 const f=fixture();f.dialogs[1].hidden=false;assert.equal(f.api.handleBack(),true);assert.equal(f.calls.menuClose,1);assert.equal(f.calls.events.length,0);assert(f.dialogs.every(d=>d.hidden));
});
pass('Android Back dispatches the normal Escape route during gameplay',()=>{
 const f=fixture();assert.equal(f.api.handleBack(),true);assert.equal(f.calls.events.length,1);const e=f.calls.events[0];assert.equal(e.type,'keydown');assert.equal(e.code,'Escape');assert.equal(e.key,'Escape');assert.equal(e.bubbles,true);
});
pass('main-menu Back returns false so native code can ask before closing',()=>{
 const f=fixture();f.state.running=false;assert.equal(f.api.handleBack(),false);assert.equal(f.calls.events.length,0);
});
console.log('RESULT '+JSON.stringify({passed:count,errors:[]}));
