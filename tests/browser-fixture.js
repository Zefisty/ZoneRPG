(() => {
  const scenario=new URLSearchParams(location.search).get('scenario')||'route',key='zonerpg-test-'+scenario;
  const errors=[],warnings=[];
  window.ZoneRPGTest={scenario,errors,warnings};
  const update=()=>{const el=document.getElementById('test-status');if(!el)return;let state={};try{const s=window.ZoneRPGEngine?.getState();if(s)state={location:s.player.location,travelTo:s.travelTo,event:s.event?.id,stage:s.event?.flow?.stageId,phase:s.event?.flow?.phase,weapon:s.activeWeapon?.item.name,magazine:s.activeWeapon?.magazine,reserve:s.activeWeapon?.reserve,enemy:s.combat?.type,money:s.player.money,inventory:s.inventory.map(x=>x.id+':'+x.qty)};}catch(error){errors.push(String(error));}el.textContent=JSON.stringify({scenario,errors,warnings,...state},null,2);};
  addEventListener('error',e=>{errors.push(e.message||'Resource error: '+(e.target?.src||e.target?.href||'unknown'));update();},true);
  addEventListener('unhandledrejection',e=>{errors.push(String(e.reason));update();});
  const warn=console.warn.bind(console);console.warn=(...args)=>{warnings.push(args.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' '));warn(...args);update();};
  window.ZoneRPGSave={read(){const raw=sessionStorage.getItem(key);if(!raw)return{ok:false,reason:'empty'};try{return{ok:true,data:JSON.parse(raw)}}catch{return{ok:false,reason:'corrupt'}}},write(s){sessionStorage.setItem(key,JSON.stringify({...s,version:ZoneRPGState.VERSION}));return{ok:true}},remove(){sessionStorage.removeItem(key);return true},has(){return this.read().ok}};
  if(scenario==='route'){
    for(const event of ZoneRPGWorld.events)if(['both','travel'].includes(event.kind)&&event.id!=='chain_strange_signal')event.kind='explore';
    Math.random=()=>window.ZoneRPGEngine?.getState().player.location==='wild'?0:.99;
  }else{
    Math.random=()=>.4;
    if(!ZoneRPGSave.has()){
      const s=ZoneRPGState.fresh();
      if(scenario==='combat'){s.combat={type:'dog',enemy:{...ZoneRPGWorld.enemyTypes.dog,visual:'stalker',name:'Wrong old visual',hp:34,maxHp:34},aimed:false,turn:1,log:[]};}
      else{
        const id={medicine:'event_8_5',food:'event_6_5',tools:'event_6_3'}[scenario],def=ZoneRPGWorld.events.find(x=>x.id===id),stages=def.stages||[{id:'main',text:def.text,choices:def.choices}],stage=scenario==='medicine'?stages.find(x=>x.choices.some(c=>c.label.startsWith('Купить припасы'))):stages[0];
        s.event={id,category:def.category,text:stage.text,choices:stage.choices,flow:{version:1,stageId:stage.id,stageIndex:stages.indexOf(stage),phase:'choices',origin:'explore',chain:[id],visitedStages:[stage.id],claimedActions:[],history:[],flags:{},pending:null,resultText:'',lastChoice:''}};
      }
      ZoneRPGSave.write(s);
    }
  }
  window.ZoneRPGTest.update=update;
  addEventListener('DOMContentLoaded',()=>{ZoneRPGEngine.onChange(update);update();document.getElementById('reset-test').onclick=()=>{sessionStorage.removeItem(key);location.reload();};});
})();
