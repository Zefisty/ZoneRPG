(() => {
  const VERSION = 8;
  const LEGACY_VERSIONS = [2,3,4,5,6,7];
  const KEY = 'zonerpg-pda-save';
  const clamp = (value, min, max, fallback = 0) => Number.isFinite(Number(value))
    ? Math.max(min, Math.min(max, Number(value))) : fallback;
  const unique = values => [...new Set(values)];

  const ATTRIBUTE_INFO={
    strength:{name:'Сила',description:'Каждое очко выше 2 даёт +1,25 кг грузоподъёмности. Усиливает ближний бой и позволяет выполнять силовые действия.'},
    agility:{name:'Ловкость',description:'Каждое очко выше 2 повышает точность и уклонение на 0,6 процентного пункта.'},
    endurance:{name:'Выносливость',description:'Каждое очко выше 2 даёт +2 к максимуму здоровья и выносливости, снижает расход еды и воды на 3,5%.'},
    perception:{name:'Восприятие',description:'Помогает обнаруживать опасность, находить артефакты и замечать дополнительные детали событий.'},
    intelligence:{name:'Интеллект',description:'Открывает технические и аналитические варианты в событиях.'}
  };
  const MASTERY_NAMES={pistols:'Пистолеты',smg:'Пистолеты-пулемёты',rifles:'Винтовки',shotguns:'Дробовики',melee:'Ближний бой'};
  const BACKGROUNDS={
    rookie:{name:'Обычный новичок',description:'Нейтральный старт. Первую дорогу придётся изучить самому.',attributes:{},mastery:{},items:{}},
    soldier:{name:'Бывший военный',description:'+1 Выносливость, владение пистолетами 5/100, 4 дополнительных патрона 9×18.',attributes:{endurance:1},mastery:{pistols:5},items:{ammo918:4}},
    technician:{name:'Технарь',description:'+1 Интеллект и набор инструментов для механизмов и специальных действий.',attributes:{intelligence:1},mastery:{},items:{tools:1}},
    hunter:{name:'Охотник',description:'+1 Восприятие, владение ближним боем 5/100 и кусок хлеба.',attributes:{perception:1},mastery:{melee:5},items:{bread:1}},
    scavenger:{name:'Мародёр',description:'+1 Сила и набор деталей. Отношение одиночек на 3 ниже обычного старта.',attributes:{strength:1},mastery:{},items:{parts:1},reputation:{loners:-3}},
    medic:{name:'Медик',description:'+1 Интеллект и дополнительная аптечка. В Зоне запас лекарств быстро заканчивается.',attributes:{intelligence:1},mastery:{},items:{medkit:1}}
  };
  Object.entries({"rookie":{"startLocation":"cordon","intro":"Ты проходишь через старый КПП с чужими советами и собственным пустым блокнотом. Сидорович обещал объяснить, какие дороги ещё не забрала Зона."},"soldier":{"startLocation":"checkpoint","reputation":{"military":8,"bandits":-3},"intro":"Прожектор блокпоста на мгновение задерживается на твоей старой форме. Сержант узнаёт знакомую выправку, но дальше периметра придётся рассчитывать на себя. Проверь магазин перед дорогой."},"technician":{"startLocation":"railway","reputation":{"ecologists":2},"intro":"Ты ночевал в ремонтном вагоне у старой железной дороги. Инструменты при тебе; Юра «Шпала» говорит, что под насыпью остался груз. Здесь твоим рукам найдётся работа."},"hunter":{"startLocation":"rookie","reputation":{"loners":2,"duty":2},"intro":"Утром ты выходишь из лесополосы к деревне новичков. На влажной земле ещё виден след ночного зверя. Лёха машет от костра: прежде чем идти дальше, стоит спросить о местных тропах."},"scavenger":{"startLocation":"garbage","reputation":{"loners":-3,"bandits":6},"intro":"На Свалке знаком каждый изгиб ржавой насыпи. Старые метки мародёров всё ещё указывают на укрытия, но одиночки помнят не только хорошие дела. Бармен предлагает начать с обычного поручения."},"medic":{"startLocation":"cordon","reputation":{"loners":4,"ecologists":2},"intro":"Мара встречает тебя у полевого перевязочного пункта. Дополнительная аптечка может спасти жизнь — свою или чужую. Сначала осмотрись, затем реши, кому сегодня нужна помощь."}}).forEach(([id,data])=>Object.assign(BACKGROUNDS[id],data));
  function fresh(backgroundId='rookie') {
    const state = {
      version: VERSION, backgroundId:BACKGROUNDS[backgroundId]?backgroundId:'rookie',
      mode: 'menu',
      player: {health:100,maxHealth:100,stamina:100,maxStamina:100,hunger:14,thirst:12,radiation:0,money:620,rank:1,xp:0,kills:0,trips:0,artifacts:0,location:'cordon',time:8},
      attributes:{strength:2,agility:2,endurance:2,perception:2,intelligence:2},attributePoints:0,weaponMastery:{pistols:0,smg:0,rifles:0,shotguns:0,melee:0},
      baseStats:{maxHealth:100,maxStamina:100,maxCarryWeight:25},temporaryModifiers:{},
      inventory: [
        {id:'knife',qty:1,instanceId:'item-1'}, {id:'pm',qty:1,instanceId:'item-2'},
        {id:'jacket',qty:1,instanceId:'item-3'}, {id:'fieldPack',qty:1,instanceId:'item-4'}, {id:'ammo918',qty:28},
        {id:'medkit',qty:1}, {id:'bandage',qty:2}, {id:'canned',qty:2}, {id:'water',qty:2}
      ],
      nextItemInstance: 5,
      equipment: {primary:null,sidearm:'item-2',melee:'item-1',armor:'item-3',head:null,backpack:'item-4',detector:null,activeWeaponSlot:'sidearm',weapon:'pm',artifacts:[]},
      magazines: {pm:8},
      reputation: {loners:5,bandits:-10,duty:0,freedom:0,military:-5,ecologists:0,mercs:0,mutants:-10,monolith:-25},
      quests: {active:[{id:'first_road',step:0,progress:0,acceptedAtLocation:'cordon'}],completed:[]},
      known:['cordon','rookie','checkpoint','garbage'], visited:['cordon'], seenEvents:[], recentEvents:[], takenCaches:[], explores:{},explorationCount:0,explorationActive:false,explorationOriginLocationId:null,explorationSessionDepth:0,eventXPClaims:[],backgroundInteractions:[],knowledge:[],
      worldFlags:{documentsFound:false,stationOpen:false}, travelTo:null, event:null, combat:null,
      log:['Ты входишь в Зону. На Кордоне ещё можно передумать.'], rumors:[], settings:{scale:1,reduceMotion:false,music:true,sfx:true,volume:.35},
      statistics:{earnings:0,artifacts:0,kills:0,quests:0}
    };
    const background=BACKGROUNDS[state.backgroundId];
    state.startingLocation=background.startLocation;state.initialReputationModifiers={...(background.reputation||{})};
    state.player.location=background.startLocation;state.log=['Ты входишь в Зону. Начальный сектор: '+window.ZoneRPGWorld.locations[background.startLocation].name+'.'];state.visited=[background.startLocation];
    state.known=[...new Set([background.startLocation,...window.ZoneRPGWorld.locations[background.startLocation].neighbors])];
    state.quests.active[0].acceptedAtLocation=background.startLocation;
    for(const [key,n] of Object.entries(background.attributes))state.attributes[key]+=n;
    Object.assign(state.weaponMastery,background.mastery);
    for(const [id,qty] of Object.entries(background.items)){const existing=state.inventory.find(row=>row.id===id);if(existing)existing.qty+=qty;else state.inventory.push(window.ZoneRPGItems.items[id].stackable?{id,qty}:{id,qty,instanceId:'item-'+state.nextItemInstance++});}
    for(const [key,n] of Object.entries(background.reputation||{}))state.reputation[key]+=n;
    state.player.health=100+(state.attributes.endurance-2)*2;state.player.stamina=100+(state.attributes.endurance-2)*2;
    return state;
  }

  function sanitizeEvent(raw, world, items, sourceVersion) {
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
      history:(Array.isArray(sourceFlow.history)?sourceFlow.history:[]).filter(x=>x&&typeof x.text==='string').slice(-8).map(x=>({text:x.text.slice(0,500),choice:typeof x.choice==='string'?x.choice.slice(0,100):''})),
      rewards:sourceFlow.rewards&&typeof sourceFlow.rewards==='object'?{xp:clamp(sourceFlow.rewards.xp,0,99999,0),money:clamp(sourceFlow.rewards.money,0,999999,0),items:Array.isArray(sourceFlow.rewards.items)?sourceFlow.rewards.items.filter(x=>x&&typeof x.id==='string'&&items[x.id]).slice(0,20).map(x=>({id:x.id,name:items[x.id].name,qty:clamp(x.qty,1,99,1)})):[]}:null,
      completionXP:clamp(sourceFlow.completionXP,0,99999,0),
      flags:sourceFlow.flags && typeof sourceFlow.flags === 'object' && !Array.isArray(sourceFlow.flags) ? sourceFlow.flags : {},
      pending:{nextStage,nextEvent,finish:pending.finish===true,winText:typeof pending.winText==='string'?pending.winText:'',fleeText:typeof pending.fleeText==='string'?pending.fleeText:''},
      resultText:typeof sourceFlow.resultText === 'string' ? sourceFlow.resultText : '',
      lastChoice:typeof sourceFlow.lastChoice === 'string' ? sourceFlow.lastChoice : ''
    };
    if(sourceVersion<=6&&phase==='result'&&!flow.pending.nextStage&&!flow.pending.nextEvent&&stage){
      const oldChoice=stage.choices.find(c=>c.label===flow.lastChoice);
      if(oldChoice?.nextStage?.startsWith('review_')){flow.pending.nextStage=oldChoice.nextStage;flow.pending.finish=false;flow.completionXP=0;flow.flags['legacyEffects:'+oldChoice.nextStage]=true;}
    }
    if (isArrival) return {id:raw.id,category:typeof raw.category==='string'?raw.category:'Локация',rarity:typeof raw.rarity==='string'?raw.rarity:'common',text:typeof raw.text==='string'?raw.text:'',choices:Array.isArray(raw.choices)?raw.choices.slice(0,4):[],flow};
    if (phase === 'result') return {id:definition.id,category:definition.category,rarity:definition.rarity||'common',text:flow.resultText || 'Ты решаешь продолжить путь.',choices:[{label:'Продолжить',action:'advance'}],flow};
    if (phase === 'combat') return {id:definition.id,category:definition.category,rarity:definition.rarity||'common',text:typeof raw.text==='string'?raw.text:stage.text,choices:[],flow};
    return {id:definition.id,category:definition.category,rarity:definition.rarity||'common',text:stage.text || definition.text || '',choices:Array.isArray(stage.choices)?stage.choices:[],flow};
  }

  function sanitize(input, items, world) {
    const base = fresh();
    if (!input || typeof input !== 'object' || ![...LEGACY_VERSIONS,VERSION].includes(input.version)) return base;
    base.backgroundId=BACKGROUNDS[input.backgroundId]?input.backgroundId:'rookie';
    const p = input.player && typeof input.player === 'object' ? input.player : {};
    const defaults = base.player;
    base.player = {...defaults,...p};
    const attrs=input.attributes&&typeof input.attributes==='object'?input.attributes:{};
    base.attributes={strength:clamp(attrs.strength,1,20,2),agility:clamp(attrs.agility,1,20,2),endurance:clamp(attrs.endurance,1,20,2),perception:clamp(attrs.perception,1,20,2),intelligence:clamp(attrs.intelligence,1,20,2)};
    base.attributePoints=clamp(input.attributePoints,0,999,0);
    const mastery=input.weaponMastery&&typeof input.weaponMastery==='object'?input.weaponMastery:{};
    base.weaponMastery={pistols:clamp(mastery.pistols,0,100,0),smg:clamp(mastery.smg,0,100,0),rifles:clamp(mastery.rifles,0,100,0),shotguns:clamp(mastery.shotguns,0,100,0),melee:clamp(mastery.melee,0,100,0)};
    base.baseStats={maxHealth:clamp(input.baseStats?.maxHealth??p.maxHealth,60,250,defaults.maxHealth),maxStamina:clamp(input.baseStats?.maxStamina??p.maxStamina,50,150,defaults.maxStamina),maxCarryWeight:clamp(input.baseStats?.maxCarryWeight,8,120,25)};
    base.temporaryModifiers=input.temporaryModifiers&&typeof input.temporaryModifiers==='object'&&!Array.isArray(input.temporaryModifiers)?Object.fromEntries(Object.entries(input.temporaryModifiers).filter(([,v])=>Number.isFinite(Number(v)))):{};
    base.player.maxHealth=base.baseStats.maxHealth;
    base.player.maxStamina=base.baseStats.maxStamina;
    base.player.health=clamp(p.health,0,base.baseStats.maxHealth+100,defaults.health);
    base.player.stamina=clamp(p.stamina,0,base.baseStats.maxStamina+100,defaults.stamina);
    for(const key of ['hunger','thirst','radiation'])base.player[key]=clamp(p[key],0,100,defaults[key]);
    base.player.money=clamp(p.money,0,999999,defaults.money);
    for(const key of ['rank','xp','kills','trips','artifacts','time'])base.player[key]=clamp(p[key],key==='rank'?1:0,key==='time'?23:99999,defaults[key]);
    if(!world.locations[base.player.location])base.player.location='cordon';

    let nextId=clamp(input.nextItemInstance,1,999999,5);
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
    base.nextItemInstance=Math.max(nextId,5);
    const sourceEquipment=input.equipment||{};
    if(input.version<4&&!base.inventory.some(row=>row.id==='fieldPack'))base.inventory.push({id:'fieldPack',qty:1,instanceId:`item-${base.nextItemInstance++}`});
    const slotNames=['primary','sidearm','melee','armor','head','backpack','detector'];
    const equipment={...fresh().equipment,activeWeaponSlot:'sidearm'};
    const findGear=(ref,slot)=>{
      let row=base.inventory.find(entry=>entry.instanceId===ref&&items[entry.id]?.slot===slot);
      if(!row&&typeof ref==='string')row=base.inventory.find(entry=>entry.id===ref&&items[entry.id]?.slot===slot);
      return row?row.instanceId||row.id:null;
    };
    if(input.version>=4){for(const slot of slotNames)equipment[slot]=Object.prototype.hasOwnProperty.call(sourceEquipment,slot)?findGear(sourceEquipment[slot],slot):equipment[slot];equipment.activeWeaponSlot=['primary','sidearm','melee'].includes(sourceEquipment.activeWeaponSlot)?sourceEquipment.activeWeaponSlot:'sidearm';}
    else{
      const oldWeapon=sourceEquipment.weapon||'pm',oldSlot=items[oldWeapon]?.slot||'sidearm';equipment[oldSlot]=findGear(oldWeapon,oldSlot)||equipment[oldSlot];equipment.armor=findGear(sourceEquipment.armor||'jacket','armor')||equipment.armor;equipment.melee=findGear('knife','melee')||equipment.melee;equipment.backpack=findGear('fieldPack','backpack')||equipment.backpack;equipment.activeWeaponSlot=oldSlot;
    }
    for(const slot of slotNames){const ref=equipment[slot];if(ref&&!base.inventory.some(row=>(row.instanceId||row.id)===ref))equipment[slot]=null;}
    const artifactRefs=Array.isArray(sourceEquipment.artifacts)?sourceEquipment.artifacts:[];
    const selected=[];
    for(const ref of artifactRefs){let row=base.inventory.find(entry=>entry.instanceId===ref&&items[entry.id]?.type==='artifact'&&!selected.includes(entry.instanceId));if(!row&&items[ref]?.type==='artifact')row=base.inventory.find(entry=>entry.id===ref&&items[entry.id]?.type==='artifact'&&!selected.includes(entry.instanceId));if(row)selected.push(row.instanceId);if(selected.length===4)break;}
    equipment.artifacts=selected;
    const legacyWeapon=sourceEquipment.weapon||'pm';
    if(!equipment[equipment.activeWeaponSlot]||items[base.inventory.find(row=>(row.instanceId||row.id)===equipment[equipment.activeWeaponSlot])?.id]?.type!=='weapon')equipment.activeWeaponSlot=equipment.sidearm?'sidearm':equipment.primary?'primary':'melee';
    const activeRow=base.inventory.find(row=>(row.instanceId||row.id)===equipment[equipment.activeWeaponSlot]);
    equipment.weapon=activeRow?.id||'';
    base.equipment=equipment;
    base.magazines={...base.magazines,...(input.magazines||{})};
    for(const id of Object.keys(base.magazines)){const weapon=window.ZoneRPGItems.weapons[id];if(!weapon)delete base.magazines[id];else base.magazines[id]=clamp(base.magazines[id],0,weapon.magazine||0,0);}
    base.reputation={...base.reputation,...(input.reputation||{})};
    for(const faction of Object.keys(base.reputation))base.reputation[faction]=clamp(base.reputation[faction],-100,100,0);
    base.quests={
      active:Array.isArray(input.quests?.active)?input.quests.active.filter(q=>world.quests.some(def=>def.id===q.id)).map(q=>({id:q.id,step:clamp(q.step,0,5),progress:clamp(q.progress,0,999999),acceptedAtLocation:world.locations[q.acceptedAtLocation]?q.acceptedAtLocation:(Object.keys(world.locations).find(id=>world.locations[id].npcs.includes(world.quests.find(d=>d.id===q.id)?.giver))||null)})):base.quests.active,
      completed:Array.isArray(input.quests?.completed)?unique(input.quests.completed.filter(id=>world.quests.some(q=>q.id===id))):[]
    };
    base.known=Array.isArray(input.known)?unique(input.known.filter(id=>world.locations[id])):base.known;
    base.visited=Array.isArray(input.visited)?unique(input.visited.filter(id=>world.locations[id])):base.visited;
    base.visited=unique([...base.visited,base.player.location]);
    base.known=unique([...base.known,...base.visited,base.player.location]);
    base.startingLocation=world.locations[input.startingLocation]?input.startingLocation:base.player.location;
    base.initialReputationModifiers=input.initialReputationModifiers&&typeof input.initialReputationModifiers==='object'?Object.fromEntries(Object.entries(input.initialReputationModifiers).filter(([id,n])=>world.factions[id]&&Number.isFinite(n)).map(([id,n])=>[id,clamp(n,-20,20,0)])):{};
    base.backgroundInteractions=Array.isArray(input.backgroundInteractions)?unique(input.backgroundInteractions.filter(x=>typeof x==='string'&&x.length<180)).slice(-1000):[];
    base.eventXPClaims=Array.isArray(input.eventXPClaims)?unique(input.eventXPClaims.filter(x=>typeof x==='string'&&x.length<180)).slice(-10000):[];
    base.seenEvents=Array.isArray(input.seenEvents)?unique(input.seenEvents.filter(id=>world.events.some(event=>event.id===id))):[];
    base.recentEvents=Array.isArray(input.recentEvents)?input.recentEvents.filter(id=>typeof id==='string').slice(-8):[];
    base.takenCaches=Array.isArray(input.takenCaches)?unique(input.takenCaches.filter(x=>typeof x==='string'&&x.length<80)):[];
    base.explores={};if(input.explores&&typeof input.explores==='object')for(const [id,n]of Object.entries(input.explores))if(world.locations[id])base.explores[id]=clamp(n,0,999999);
    base.explorationCount=clamp(input.explorationCount,Object.values(base.explores).reduce((sum,n)=>sum+n,0),999999,Object.values(base.explores).reduce((sum,n)=>sum+n,0));
    base.explorationActive=Boolean(input.explorationActive);
    base.knowledge=Array.isArray(input.knowledge)?unique(input.knowledge.filter(x=>typeof x==='string').slice(-80)):[];
    base.rumors=Array.isArray(input.rumors)?input.rumors.filter(x=>x&&typeof x.text==='string').slice(-30):[];
    if(input.worldFlags&&typeof input.worldFlags==='object')for(const key of Object.keys(base.worldFlags))base.worldFlags[key]=Boolean(input.worldFlags[key]);
    if(input.settings&&typeof input.settings==='object'){base.settings.scale=Number(input.settings.scale);base.settings.reduceMotion=Boolean(input.settings.reduceMotion);base.settings.music=input.settings.music!==false;base.settings.sfx=input.settings.sfx!==false;base.settings.volume=clamp(input.settings.volume,0,1,.35);}
    base.settings.scale=[1,1.1].includes(base.settings.scale)?base.settings.scale:1;
    if(input.statistics&&typeof input.statistics==='object')for(const key of Object.keys(base.statistics))base.statistics[key]=clamp(input.statistics[key],0,999999,0);
    base.log=Array.isArray(input.log)?input.log.filter(x=>typeof x==='string').slice(-10).map(text=>text.replace(/\b(strength|agility|endurance|perception|intelligence|pistols|smg|rifles|shotguns|melee|rifleMastery)\b/g,key=>ATTRIBUTE_INFO[key]?.name||MASTERY_NAMES[key]||'Владение винтовками')):base.log;
    base.travelTo=world.locations[input.travelTo]?input.travelTo:null;
    base.event=sanitizeEvent(input.event,world,items,input.version);
    base.explorationActive=!base.travelTo&&(base.explorationActive||base.event?.flow?.origin==='explore');
    base.explorationOriginLocationId=base.explorationActive?(world.locations[input.explorationOriginLocationId]?input.explorationOriginLocationId:base.player.location):null;
    base.explorationSessionDepth=base.explorationActive?clamp(input.explorationSessionDepth,0,999999,base.explores[base.explorationOriginLocationId]||0):0;
    if(base.explorationOriginLocationId){base.visited=unique([...base.visited,base.explorationOriginLocationId]);base.known=unique([...base.known,...base.visited]);}
    const rawCombat=input.combat;
    if(rawCombat&&typeof rawCombat==='object'&&world.enemyTypes[rawCombat.type]){
      const enemy=world.enemyTypes[rawCombat.type],savedEnemy=rawCombat.enemy&&typeof rawCombat.enemy==='object'?rawCombat.enemy:{};
      const maxHp=clamp(savedEnemy.maxHp,1,enemy.hp,enemy.hp);
      base.combat={type:rawCombat.type,enemy:{...enemy,maxHp,hp:clamp(savedEnemy.hp,0,maxHp,enemy.hp)},intro:typeof rawCombat.intro==='string'?rawCombat.intro.slice(0,240):'',aimed:Boolean(rawCombat.aimed),status:typeof rawCombat.status==='string'?rawCombat.status:'В БОЮ',turn:clamp(rawCombat.turn,1,999,1),log:Array.isArray(rawCombat.log)?rawCombat.log.filter(x=>typeof x==='string').slice(-6):[]};
    }
    const modifiers={};for(const ref of slotNames.map(slot=>base.equipment[slot]).concat(base.equipment.artifacts)){const row=base.inventory.find(item=>(item.instanceId||item.id)===ref),fx=items[row?.id]?.effect||{};for(const [key,value]of Object.entries(fx))if(Number.isFinite(Number(value)))modifiers[key]=(modifiers[key]||0)+Number(value);}for(const [key,value]of Object.entries(base.temporaryModifiers))modifiers[key]=(modifiers[key]||0)+Number(value);
    base.player.health=clamp(base.player.health,0,Math.max(1,base.baseStats.maxHealth+(modifiers.maxHealth||0)+(base.attributes.endurance-2)*2),defaults.health);
    base.player.stamina=clamp(base.player.stamina,0,Math.max(1,base.baseStats.maxStamina+(modifiers.maxStamina||0)+(base.attributes.endurance-2)*2),defaults.stamina);
    if(base.combat){base.mode='combat';if(base.event?.flow)base.event.flow.phase='combat';}
    else if(base.event?.flow?.phase==='combat'){base.event.flow.phase='result';base.event.flow.resultText=base.event.flow.pending?.fleeText||base.event.flow.pending?.winText||'Сохранённый бой завершился. Ты возвращаешься к событию.';base.event.text=base.event.flow.resultText;base.event.choices=[{label:'Продолжить',action:'advance'}];base.mode='event';}
    else if(base.event)base.mode='event';
    else base.mode='play';
    base.deathSummary=input.deathSummary&&typeof input.deathSummary==='object'?input.deathSummary:null;
    base.panelReturn=null;
    return base;
  }

  window.ZoneRPGState={VERSION,LEGACY_VERSIONS,KEY,BACKGROUNDS,ATTRIBUTE_INFO,MASTERY_NAMES,fresh,sanitize};
})();
