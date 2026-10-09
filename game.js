(() => {
  const engine=window.ZoneRPGEngine,root=document.getElementById('app');
  const render=()=>window.ZoneRPGUI.render(engine.getState());
  function run(name,value,extra){engine.action(name,value,extra);}
  function activate(el){const a=el.dataset.action,v=el.dataset.value,x=el.dataset.extra;
    if(a==='home'){run('mainMenu');return;}
    if(a==='panel'){if(v==='menu'){run('openPanel','pause');return;}run('openPanel',v);return;}
    if(a==='travelPanel'){run('openPanel','map');return;}
    if(a==='close'){run('closePanel');return;}
    if(a==='save'){run('save');return;}if(a==='notebook'||a==='news'){run(a,v,x);return;}
    if(a==='joinFaction'||a==='leaveFaction'||a==='researchQuest'){run(a,v,x);return;}
    if(a==='attack'||a==='aim'||a==='reload'||a==='flee'||a==='newGame'||a==='startGame'||a==='breath'||a==='load'||a==='deleteSave'||a==='deletePrompt'||a==='acceptQuest'||a==='turnIn'||a==='event'||a==='eventReturn'||a==='travel'||a==='explore'||a==='use'||a==='equipGear'||a==='equipSlot'||a==='equipWeapon'||a==='equipArmor'||a==='unequipSlot'||a==='switchWeapon'||a==='artifact'||a==='drop'||a==='buy'||a==='sell'||a==='rest'||a==='mainMenu'||a==='resume'||a==='npcAction'||a==='investAttribute'){run(a,v,x);return;}
    if(a==='combat'){if(v==='items')run('openPanel','combatItems');else if(v==='weapons')run('openPanel','combatWeapons');else if(v.startsWith('use:')){run('combatUse',v.slice(4));if(engine.getState().mode!=='dead')run('openPanel','combat');}else if(v.startsWith('weapon:')){run('equipWeapon',v.slice(7));run('openPanel','combat');}else run(v);return;}
    if(a==='saveInfo'){run('save');return;}
  }
  root.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;e.preventDefault();window.ZoneRPGAudio?.unlock();if(!['attack','aim','reload','flee'].includes(el.dataset.action))window.ZoneRPGAudio?.play('ui');if(['attack','reload','buy','sell','turnIn','acceptQuest'].includes(el.dataset.action)){el.disabled=true;setTimeout(()=>{if(el.isConnected)el.disabled=false;},180);}activate(el);});
  root.addEventListener('change',e=>{const name=e.target.dataset.setting;if(!name)return;let value=e.target.value;if(value==='true')value=true;else if(value==='false')value=false;else if(name==='scale')value=Number(value);run('setSetting',{key:name,value});});
  window.addEventListener('keydown',e=>{const target=e.target;if(target?.matches('input,select,textarea,[contenteditable="true"]'))return;const k=e.key.toLowerCase();if(k==='escape'){const s=engine.getState();if(s.mode==='menu'||s.mode==='dead')return;if(s.mode==='play'){run('openPanel','pause');}else if(s.mode==='combatItems'||s.mode==='combatWeapons')run('openPanel','combat');else run('closePanel');e.preventDefault();return;}if(['i','m','j','c'].includes(k)){const s=engine.getState();if(!['play','event'].includes(s.mode)||s.combat)return;run('openPanel',({i:'inventory',m:'map',j:'quests',c:'character'})[k]);e.preventDefault();}});
  engine.onChange(render);render();
})();
