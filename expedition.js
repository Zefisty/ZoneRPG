/* Canonical expedition state; legacy fields are read-only projections for old UI integrations. */
(() => {
 const finite=(v,f=0)=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):f;
 const empty=()=>({active:false,originLocationId:null,depth:0,currentEncounterId:null,flags:{},history:[],summary:{xp:0,money:0,kills:0,hours:0,items:{}}});
 function normalize(raw,state,world){
   const e=empty(),old=Boolean(state.explorationActive||state.event?.flow?.origin==='explore');
   e.active=!state.travelTo&&Boolean(raw?.active||old);
   if(!e.active)return e;
   e.originLocationId=world.locations[raw?.originLocationId]?raw.originLocationId:world.locations[state.explorationOriginLocationId]?state.explorationOriginLocationId:state.player.location;
   e.depth=raw?.active?finite(raw.depth):finite(state.explorationSessionDepth);
   e.currentEncounterId=state.event?.id||null;
   e.history=Array.isArray(raw?.history)?raw.history.filter(x=>typeof x==='string').slice(-32):[];
   e.flags=raw?.flags&&typeof raw.flags==='object'?Object.fromEntries(Object.entries(raw.flags).filter(([k,v])=>k.length<100&&typeof v==='boolean')):{};
   for(const k of ['xp','money','kills','hours'])e.summary[k]=finite(raw?.summary?.[k]);
   if(raw?.summary?.items)for(const [id,n]of Object.entries(raw.summary.items))if(window.ZoneRPGItems.items[id])e.summary.items[id]=finite(n);
   return e;
 }
 const tier=d=>d<3?0:d<6?1:d<10?2:3;
 const cost=d=>12+tier(d);
 function project(s){s.explorationActive=s.expedition.active;s.explorationOriginLocationId=s.expedition.originLocationId;s.explorationSessionDepth=s.expedition.depth;}
 window.ZoneRPGExpedition={empty,normalize,tier,cost,project};
})();