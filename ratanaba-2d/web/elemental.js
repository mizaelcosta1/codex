'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.RatanabaElemental=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const TYPES=Object.freeze({FIRE:'fire',WATER:'water',LIGHTNING:'lightning',EARTH:'earth',NATURE:'nature',ICE:'ice',DARK:'dark',LIGHT:'light',POISON:'poison'});
 const WEAK={fire:'water',water:'lightning',earth:'nature',nature:'fire',ice:'fire',dark:'light',light:'dark',lightning:'earth',poison:'light'};
 const MONSTERS=Object.freeze({curupira:'fire',boitata:'fire',mula_sem_cabeca:'fire',iara:'water',yara:'water',guardiao_pedra:'earth',espirito_floresta:'nature',espectro_sombrio:'dark'});
 const CONFIG=Object.freeze({weak:1.75,resist:.5,neutral:1,wetDuration:5,stunDuration:1.5,parryWindow:.15,blockMultiplier:.35,dashDuration:.18,coyote:.12,jumpBuffer:.15});
 function multiplier(attack,defense){if(!attack||!defense)return 1;if(WEAK[defense]===attack)return CONFIG.weak;if(attack===defense)return CONFIG.resist;return 1;}
 function damage(base,attack,defense,wet=false){if(!Number.isFinite(base)||base<0)throw new RangeError('invalid base damage');let factor=multiplier(attack,defense);if(wet&&attack==='lightning')factor*=1.25;return Math.round(base*factor);}
 function applyHit(target,hit){if(!target||!hit)throw new TypeError('target and hit required');const element=target.element||MONSTERS[target.kind]||null;const amount=damage(hit.base,hit.element,element,!!target.wet);target.hp=Math.max(0,target.hp-amount);if(hit.element==='water')target.wet=CONFIG.wetDuration;if(hit.element==='lightning'&&target.wet>0){target.stun=Math.max(target.stun||0,.65);target.wet=0;}if(hit.element==='ice')target.slow=Math.max(target.slow||0,2);if(hit.element==='fire')target.burn=Math.max(target.burn||0,3);return {amount,weak:multiplier(hit.element,element)>1,dead:target.hp===0};}
 function defend(player,hit,now){const age=now-(player.guardStarted??-Infinity);if(!player.guarding||age<0)return {blocked:false,parry:false,damage:hit.damage};if(age<=CONFIG.parryWindow){if(hit.attacker)hit.attacker.stun=Math.max(hit.attacker.stun||0,CONFIG.stunDuration);return {blocked:true,parry:true,damage:0};}return {blocked:true,parry:false,damage:Math.ceil(hit.damage*CONFIG.blockMultiplier)};}
 function tickStatus(target,dt){if(dt<0||!Number.isFinite(dt))throw new RangeError('invalid dt');for(const k of ['wet','stun','slow','burn'])target[k]=Math.max(0,(target[k]||0)-dt);return target;}
 return Object.freeze({TYPES,WEAK,MONSTERS,CONFIG,multiplier,damage,applyHit,defend,tickStatus});
});
