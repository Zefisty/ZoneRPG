(() => {
  const VERSION = 3;
  const LEGACY_VERSION = 2;
  const KEY = 'zonerpg-pda-save';
  const clamp = (value, min, max, fallback = 0) => Number.isFinite(Number(value))
    ? Math.max(min, Math.min(max, Number(value))) : fallback;
  const unique = values => [...new Set(values)];

  function fresh() {
    return {
      version: VERSION,
      mode: 'menu',
      player: {health:100,maxHealth:100,stamina:100,maxStamina:100,hunger:14,thirst:12,radiation:0,money:620,rank:1,xp:0,kills:0,trips:0,artifacts:0,location:'cordon',time:8},
      inventory: [
        {id:'knife',qty:1,instanceId:'item-1'}, {id:'pm',qty:1,instanceId:'item-2'},
        {id:'jacket',qty:1,instanceId:'item-3'}, {id:'ammo918',qty:28},
        {id:'medkit',qty:1}, {id:'bandage',qty:2}, {id:'canned',qty:2}, {id:'water',qty:2}
      ],
      nextItemInstance: 4,
      equipment: {weapon:'pm',armor:'jacket',artifacts:[]},
      magazines: {pm:8},
      reputation: {loners:5,bandits:-10,duty:0,freedom:0,military:-5,ecologists:0,mercs:0,mutants:-10,monolith:-25},
      quests: {active:[{id:'first_road',step:0,progress:0}],completed:[]},
      known:['cordon','rookie','checkpoint','garbage'], visited:['cordon'], seenEvents:[], takenCaches:[], explores:{},
      worldFlags:{documentsFound:false,stationOpen:false}, travelTo:null, event:null, combat:null,
      log:['Ты входишь в Зону. На Кордоне ещё можно передумать.'], settings:{scale:1,reduceMotion:false},
      statistics:{earnings:0,artifacts:0,kills:0,quests:0}
    };
  }

  function sanitizeEvent(raw, world) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') return null;
    const isArrival = raw.id.startsWith('arrival_');
    const definition = isArrival ? null : world.events.find(event => event.id === raw.id);
    if (!isArrival && !definition) return null;
    const stages = definition?.stages || [{id:'main',text:definition?.text,choices:definition?.choices}];
    const sourceFlow = raw.flow && typeof raw.flow === 'object' ? raw.flow : {};
    const stageId = typeof sourceFlow.stageId === 'string' && stages.some(stage => stage.id === sourceFlow.stageId)
      ? sourceFlow.stageId : (isArrival ? 'arrival' : stages[0].id);
    const stage = isArrival ? null : stages.find(item => item.id === stageId);
    const phase = ['choices','result','combat'].includes(sourceFlow.phase) ? sourceFlow.phase : 'choices';
    const origin = ['travel','explore','arrival','event'].includes(sourceFlow.origin) ? sourceFlow.origin : (isArrival ? 'arrival' : 'travel');
    const pending = sourceFlow.pending && typeof sourceFlow.pending === 'object' ? sourceFlow.pending : {};
    const nextStage = stages.some(item => item.id === pending.nextStage) ? pending.nextStage : null;
    const nextEvent = typeof pending.nextEvent === 'string' && world.events.some(item => item.id === pending.nextEvent) ? pending.nextEvent : null;
    const flow = {
      version:1, stageId, stageIndex:clamp(sourceFlow.stageIndex,0,stages.length-1,stages.findIndex(item => item.id === stageId)),
      phase, origin, chain:[...(Array.isArray(sourceFlow.chain) ? sourceFlow.chain : [raw.id])].filter(id => typeof id === 'string' && (world.events.some(item => item.id === id) || id.startsWith('arrival_'))).slice(-8),
      visitedStages:unique((Array.isArray(sourceFlow.visitedStages) ? sourceFlow.visitedStages : [stageId]).filter(id => typeof id === 'string' && stages.some(item => item.id === id))).slice(-24),
      claimedActions:unique((Array.isArray(sourceFlow.claimedActions) ? sourceFlow.claimedActions : []).filter(id => typeof id === 'string' && id.length < 120)).slice(-40),
      flags:sourceFlow.flags && typeof sourceFlow.flags === 'object' && !Array.isArray(sourceFlow.flags) ? sourceFlow.flags : {},
      pending:{nextStage,nextEvent,finish:pending.finish===true,winText:typeof pending.winText==='string'?pending.winText:'',fleeText:typeof pending.fleeText==='string'?pending.fleeText:''},
      resultText:typeof sourceFlow.resultText === 'string' ? sourceFlow.resultText : '',
      lastChoice:typeof sourceFlow.lastChoice === 'string' ? sourceFlow.lastChoice : ''
    };
    if (isArrival) return {id:raw.id,category:typeof raw.category==='string'?raw.category:'Локация',text:typeof raw.text==='string'?raw.text:'',choices:Array.isArray(raw.choices)?raw.choices.slice(0,4):[],flow};
    if (phase === 'result') return {id:definition.id,category:definition.category,text:flow.resultText || 'Ты решаешь продолжить путь.',choices:[{label:'Далее',action:'advance'}],flow};
    if (phase === 'combat') return {id:definition.id,category:definition.category,text:typeof raw.text==='string'?raw.text:stage.text,choices:[],flow};
    return {id:definition.id,category:definition.category,text:stage.text || definition.text || '',choices:Array.isArray(stage.choices)?stage.choices:[],flow};
  }

  function sanitize(input, items, world) {
    const base = fresh();
    if (!input || typeof input !== 'object' || ![LEGACY_VERSION,VERSION].includes(input.version)) return base;
    const p = input.player && typeof input.player === 'object' ? input.player : {};
    const defaults = base.player;
    base.player = {...defaults,...p};
    base.player.maxHealth=clamp(p.maxHealth,60,250,defaults.maxHealth);
    base.player.maxStamina=clamp(p.maxStamina,50,150,defaults.maxStamina);
    base.player.health=clamp(p.health,0,base.player.maxHealth+25,defaults.health);
    base.player.stamina=clamp(p.stamina,0,base.player.maxStamina,defaults.stamina);
    for(const key of ['hunger','thirst','radiation'])base.player[key]=clamp(p[key],0,100,defaults[key]);
    base.player.money=clamp(p.money,0,999999,defaults.money);
    for(const key of ['rank','xp','kills','trips','artifacts','time'])base.player[key]=clamp(p[key],key==='rank'?1:0,key==='time'?23:99999,defaults[key]);
    if(!world.locations[base.player.location])base.player.location='cordon';

    let nextId=clamp(input.nextItemInstance,1,999999,4);
    const usedIds=new Set();
    const makeInstance=()=>{let id;do{id=`item-${nextId++}`;}while(usedIds.has(id));usedIds.add(id);return id;};
    if(Array.isArray(input.inventory)){
      const inventory=[];
      for(const row of input.inventory){
        if(!row||!items[row.id]||Number(row.qty)<=0)continue;
        const item=items[row.id],qty=item.stackable?clamp(row.qty,1,9999,1):Math.min(999,Math.floor(Number(row.qty)||1));
        if(item.stackable){const existing=inventory.find(entry=>entry.id===row.id);if(existing)existing.qty=Math.min(9999,existing.qty+qty);else inventory.push({id:row.id,qty});continue;}
        for(let n=0;n<qty;n++){const saved=n===0&&typeof row.instanceId==='string'&&row.instanceId.length<80&&!usedIds.has(row.instanceId)?row.instanceId:makeInstance();usedIds.add(saved);inventory.push({id:row.id,qty:1,instanceId:saved});}
      }
      base.inventory=inventory;
    }
    base.nextItemInstance=Math.max(nextId,4);
    base.equipment={...base.equipment,...(input.equipment||{})};
    if(!items[base.equipment.weapon]?.weaponId)base.equipment.weapon='pm';
    if(items[base.equipment.armor]?.type!=='armor')base.equipment.armor='jacket';
    for(const id of [base.equipment.weapon,base.equipment.armor])if(!base.inventory.some(row=>row.id===id)){const row={id,qty:1,instanceId:`item-${base.nextItemInstance++}`};base.inventory.push(row);}
    const artifactRefs=Array.isArray(input.equipment?.artifacts)?input.equipment.artifacts:[];
    const selected=[];
    for(const ref of artifactRefs){
      let row=base.inventory.find(entry=>entry.instanceId===ref&&items[entry.id]?.type==='artifact'&&!selected.includes(entry.instanceId));
      if(!row&&items[ref]?.type==='artifact')row=base.inventory.find(entry=>entry.id===ref&&items[entry.id]?.type==='artifact'&&!selected.includes(entry.instanceId));
      if(row)selected.push(row.instanceId);
      if(selected.length===2)break;
    }
    base.equipment.artifacts=selected;
    base.magazines={...base.magazines,...(input.magazines||{})};
    for(const id of Object.keys(base.magazines)){const weapon=window.ZoneRPGItems.weapons[id];if(!weapon)delete base.magazines[id];else base.magazines[id]=clamp(base.magazines[id],0,weapon.magazine||0,0);}
    base.reputation={...base.reputation,...(input.reputation||{})};
    for(const faction of Object.keys(base.reputation))base.reputation[faction]=clamp(base.reputation[faction],-100,100,0);
    base.quests={
      active:Array.isArray(input.quests?.active)?input.quests.active.filter(q=>world.quests.some(def=>def.id===q.id)).map(q=>({id:q.id,step:clamp(q.step,0,5),progress:clamp(q.progress,0,99)})):base.quests.active,
      completed:Array.isArray(input.quests?.completed)?unique(input.quests.completed.filter(id=>world.quests.some(q=>q.id===id))):[]
    };
    base.known=Array.isArray(input.known)?unique(input.known.filter(id=>world.locations[id])):base.known;
    base.visited=Array.isArray(input.visited)?unique(input.visited.filter(id=>world.locations[id])):base.visited;
    base.seenEvents=Array.isArray(input.seenEvents)?unique(input.seenEvents.filter(id=>world.events.some(event=>event.id===id))):[];
    base.takenCaches=Array.isArray(input.takenCaches)?unique(input.takenCaches.filter(x=>typeof x==='string'&&x.length<80)):[];
    base.explores={};if(input.explores&&typeof input.explores==='object')for(const [id,n]of Object.entries(input.explores))if(world.locations[id])base.explores[id]=clamp(n,0,3);
    if(input.worldFlags&&typeof input.worldFlags==='object')for(const key of Object.keys(base.worldFlags))base.worldFlags[key]=Boolean(input.worldFlags[key]);
    if(input.settings&&typeof input.settings==='object'){base.settings.scale=Number(input.settings.scale);base.settings.reduceMotion=Boolean(input.settings.reduceMotion);}
    base.settings.scale=[1,1.1].includes(base.settings.scale)?base.settings.scale:1;
    if(input.statistics&&typeof input.statistics==='object')for(const key of Object.keys(base.statistics))base.statistics[key]=clamp(input.statistics[key],0,999999,0);
    base.log=Array.isArray(input.log)?input.log.filter(x=>typeof x==='string').slice(-10):base.log;
    base.travelTo=world.locations[input.travelTo]?input.travelTo:null;
    base.event=sanitizeEvent(input.event,world);
    const rawCombat=input.combat;
    if(rawCombat&&typeof rawCombat==='object'&&world.enemyTypes[rawCombat.type]){
      const enemy=world.enemyTypes[rawCombat.type],savedEnemy=rawCombat.enemy&&typeof rawCombat.enemy==='object'?rawCombat.enemy:{};
      const maxHp=clamp(savedEnemy.maxHp,1,enemy.hp,enemy.hp);
      base.combat={type:rawCombat.type,enemy:{...enemy,...savedEnemy,maxHp,hp:clamp(savedEnemy.hp,0,maxHp,enemy.hp)},aimed:Boolean(rawCombat.aimed),turn:clamp(rawCombat.turn,1,999,1),log:Array.isArray(rawCombat.log)?rawCombat.log.filter(x=>typeof x==='string').slice(-6):[]};
    }
    if(base.combat){base.mode='combat';if(base.event?.flow)base.event.flow.phase='combat';}
    else if(base.event?.flow?.phase==='combat'){base.event.flow.phase='result';base.event.flow.resultText=base.event.flow.pending?.fleeText||base.event.flow.pending?.winText||'Сохранённый бой завершился. Ты возвращаешься к событию.';base.event.text=base.event.flow.resultText;base.event.choices=[{label:'Далее',action:'advance'}];base.mode='event';}
    else if(base.event)base.mode='event';
    else base.mode='play';
    base.deathSummary=input.deathSummary&&typeof input.deathSummary==='object'?input.deathSummary:null;
    base.panelReturn=null;
    return base;
  }

  window.ZoneRPGState={VERSION,LEGACY_VERSION,KEY,fresh,sanitize};
})();
