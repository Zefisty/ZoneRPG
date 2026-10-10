(() => {
  const scenario=new URLSearchParams(location.search).get('scenario')||'route',key='zonerpg-test-'+scenario;
  const errors=[],warnings=[];
  window.ZoneRPGTest={scenario,errors,warnings};
  const update=()=>{const el=document.getElementById('test-status');if(!el)return;let state={};try{const s=window.ZoneRPGEngine?.getState();if(s)state={location:s.player.location,origin:s.explorationOriginLocationId,sessionDepth:s.explorationSessionDepth,xp:s.player.xp,claims:s.eventXPClaims,known:s.known,travelTo:s.travelTo,event:s.event?.id,stage:s.event?.flow?.stageId,phase:s.event?.flow?.phase,weapon:s.activeWeapon?.item.name,magazine:s.activeWeapon?.magazine,reserve:s.activeWeapon?.reserve,enemy:s.combat?.type,money:s.player.money,background:s.backgroundId,story:s.personalStory,stamina:s.player.stamina,quests:s.quests.active.map(q=>({id:q.id,progress:q.progress,acceptedAtLocation:q.acceptedAtLocation,ready:q.ready})),inventory:s.inventory.map(x=>x.id+':'+x.qty)};}catch(error){errors.push(String(error));}el.textContent=JSON.stringify({scenario,errors,warnings,...state},null,2);};
  addEventListener('error',e=>{errors.push(e.message||'Resource error: '+(e.target?.src||e.target?.href||'unknown'));update();},true);
  addEventListener('unhandledrejection',e=>{errors.push(String(e.reason));update();});
  const warn=console.warn.bind(console);console.warn=(...args)=>{warnings.push(args.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' '));warn(...args);update();};
  window.ZoneRPGSave={read(){const raw=sessionStorage.getItem(key);if(!raw)return{ok:false,reason:'empty'};try{return{ok:true,data:JSON.parse(raw)}}catch{return{ok:false,reason:'corrupt'}}},write(s){sessionStorage.setItem(key,JSON.stringify({...s,version:ZoneRPGState.VERSION}));return{ok:true}},remove(){sessionStorage.removeItem(key);return true},has(){return this.read().ok}};
  if(scenario==='route'){
    for(const event of ZoneRPGWorld.events)if(['both','travel'].includes(event.kind)&&event.id!=='chain_strange_signal')event.kind='explore';
    Math.random=()=>window.ZoneRPGEngine?.getState().player.location==='wild'?0:.99;
  }else if(scenario==='polish'){
    Math.random=()=>.4;
  }else{
    Math.random=()=>.4;
    if(!ZoneRPGSave.has()){
      const s=ZoneRPGState.fresh();
      if(scenario.startsWith('v8-')){
        const bg=scenario.split('-').at(-1);Object.assign(s,ZoneRPGState.fresh(ZoneRPGState.BACKGROUNDS[bg]?bg:'soldier'));s.known=Object.keys(ZoneRPGWorld.locations);
        if(scenario==='v8-old'){s.version=10;delete s.personalStory;s.player.location='warehouses';s.player.rank=4;s.player.money=4500;s.quests.completed=['first_road'];}
        else{const a=window.ZoneRPGStories.arcs[s.backgroundId];if(scenario.includes('middle')){s.quests.completed=a.quests.slice(0,3);s.personalStory.completedSteps=[...s.quests.completed];s.personalStory.currentChapter=3;s.personalStory.currentQuest=a.quests[3];for(const id of s.quests.completed)s.personalStory.importantChoices[id]='a';s.personalStory.rewards=['personal_'+s.backgroundId+'_memo'];s.inventory.push({id:'personal_'+s.backgroundId+'_memo',qty:1});}s.player.location=a.chapters[s.personalStory.currentChapter][1];s.inventory.push({id:'energy',qty:4},{id:'medkit',qty:3},{id:'ammo918',qty:40},{id:'tools',qty:1});}
      }else if(scenario.startsWith('v72-')){
        s.known=Object.keys(ZoneRPGWorld.locations);
        if(scenario==='v72-pig'){Object.assign(s,ZoneRPGState.fresh('soldier'));s.player.stamina=40;}
        else if(scenario==='v72-quests'){s.player.location='yantar';s.player.money=0;s.quests.active=[{id:'field_samples',progress:0,step:0},{id:'field_notes',progress:0,step:0,searchAttempts:0}];Math.random=()=>.99;}
        else if(scenario==='v72-turnin'){s.player.location='cordon';s.quests.active=[{id:'first_road',progress:0,step:1}];}
        else if(scenario==='v72-knife'){s.equipment.activeWeaponSlot='melee';s.combat={type:'boar',enemy:{...ZoneRPGWorld.enemyTypes.boar,hp:25,maxHp:ZoneRPGWorld.enemyTypes.boar.hp},aimed:false,turn:1,log:[]};Math.random=()=>0;}
        else if(scenario==='v72-hatch'){s.player.location='machineYard';s.inventory.push({id:'tools',qty:1});const def=ZoneRPGWorld.events.find(e=>e.id==='v61_yard_mechanic'),stage=def.stages.find(x=>x.id==='follow');s.event={id:def.id,category:def.category,text:stage.text,choices:stage.choices,flow:{version:1,stageId:stage.id,stageIndex:1,phase:'choices',origin:'event',chain:[def.id],visitedStages:[stage.id],claimedActions:[],history:[],flags:{},pending:null,resultText:'',lastChoice:''}};}
      }else if(scenario.startsWith('v7-')){
        const loc=scenario==='v7-factions'?'dutyFort':scenario==='v7-research'?'researchCamp':'garbage';
        s.player.location=loc;s.player.rank=3;s.reputation.duty=20;s.reputation.ecologists=20;s.known=Object.keys(ZoneRPGWorld.locations);
        s.inventory.push({id:'energy',qty:12},{id:'water',qty:4},{id:'ration7',qty:3},{id:'probe7',qty:4});
        if(scenario==='v7-expedition'){Math.random=()=>.99;}
      }else if(scenario==='stamina'){s.player.location='wild';s.player.stamina=0;s.player.money=0;}
      else if(scenario==='atlas'){s.known=Object.keys(ZoneRPGWorld.locations);s.visited=[...s.known];}
      else if(scenario==='tunnel'){s.player.location='southTunnel';}
      else if(scenario==='checkpoint'){s.player.location='checkpoint';}
      else if(scenario==='background63'){Object.assign(s,ZoneRPGState.fresh('soldier'));const def=ZoneRPGWorld.events.find(e=>e.id==='npc_story_military'),stage=def.stages[0];s.event={id:def.id,category:def.category,text:stage.text,choices:stage.choices,flow:{version:1,stageId:stage.id,stageIndex:0,phase:'choices',origin:'event',chain:[def.id],visitedStages:[stage.id],claimedActions:[],history:[],flags:{},pending:null,resultText:'',lastChoice:''}};}
      else if(scenario==='news63'){s.player.location='warehouses';}
      else if(scenario==='quests63'){s.quests.active=ZoneRPGWorld.quests.map(q=>({id:q.id,step:0,progress:0}));}
      else if(scenario.startsWith('session63-')){s.player.location=scenario.slice(10);s.explorationOriginLocationId=s.player.location;s.explorationSessionDepth=0;Math.random=()=>.99;}

      else if(scenario==='combat'){s.combat={type:'dog',enemy:{...ZoneRPGWorld.enemyTypes.dog,visual:'stalker',name:'Wrong old visual',hp:34,maxHp:34},aimed:false,turn:1,log:[]};}
      else{
        const id={tool63a:'garbage_tagged_crate',tool63b:'agro_generator',tool63c:'valley_captive',mutant63:'v63_marshLeech',medicine:'event_8_5',food:'event_6_5',tools:'event_6_3',boar:'event_5_4',bandit:'event_4_2',tracks:'site_railway_2'}[scenario],def=ZoneRPGWorld.events.find(x=>x.id===id),stages=def.stages||[{id:'main',text:def.text,choices:def.choices}],stage=scenario==='medicine'?stages.find(x=>x.choices.some(c=>c.label.startsWith('Купить припасы'))):stages[0];
        if(scenario.startsWith('tool63')){s.player.location=({tool63a:'garbage',tool63b:'agro',tool63c:'darkvalley'})[scenario];s.inventory.push({id:'tools',qty:1});s.attributes={strength:10,agility:10,endurance:10,perception:10,intelligence:10};}if(scenario==='tracks')s.player.location='railway';if(scenario==='bandit')s.player.location='checkpoint';s.event={id,category:def.category,text:stage.text,choices:stage.choices,flow:{version:1,stageId:stage.id,stageIndex:stages.indexOf(stage),phase:'choices',origin:'explore',chain:[id],visitedStages:[stage.id],claimedActions:[],history:[],flags:{},pending:null,resultText:'',lastChoice:''}};
      }
      if(scenario==='v8-old')sessionStorage.setItem(key,JSON.stringify(s));else ZoneRPGSave.write(s);
    }
  }
  if(scenario.startsWith('session63-'))Math.random=()=>.99;
  window.ZoneRPGTest.update=update;
  addEventListener('DOMContentLoaded',()=>{ZoneRPGEngine.onChange(update);update();document.getElementById('reset-test').onclick=()=>{sessionStorage.removeItem(key);location.reload();};});
})();
