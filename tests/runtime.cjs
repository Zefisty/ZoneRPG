const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function runtime(){
  const store=new Map(),warnings=[],errors=[],root={innerHTML:'',dataset:{}},body={dataset:{},classList:{add(){},remove(){}}};let clock=0;
  const math=Object.create(Math);math.random=()=>.4;
  const ctx={window:{},document:{getElementById:()=>root,body,documentElement:{style:{setProperty(){}}}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},Math:math,performance:{now:()=>clock+=250},setTimeout:()=>1,clearTimeout(){},console:{warn:(...x)=>warnings.push(x),error:(...x)=>errors.push(x),log(){}}};
  vm.createContext(ctx);for(const file of ['items.js','world.js','content-v7.js','expedition.js','state.js','save.js','engine.js','ui.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),ctx,{filename:file});
  const {ZoneRPGState:S,ZoneRPGEngine:E,ZoneRPGWorld:W,ZoneRPGItems:I,ZoneRPGSave:Save,ZoneRPGUI:UI}=ctx.window;
  E.onChange(()=>UI.render(E.getState()));
  return{ctx,S,E,W,I,Save,root,store,warnings,errors,load(s){store.set(S.KEY,JSON.stringify(s));E.action('load');return E.getState();}};
}
function eventSave(r,id,stageId,origin='explore',destination=null){
  const s=r.S.fresh(),def=r.W.events.find(x=>x.id===id);assert.ok(def,id);const stages=def.stages||[{id:'main',text:def.text,choices:def.choices}],stage=stages.find(x=>x.id===stageId)||stages[0];
  s.mode='event';s.travelTo=destination;s.explorationActive=origin==='explore';s.explores.cordon=4;
  s.event={id,category:def.category,rarity:def.rarity||'common',text:stage.text,choices:stage.choices,flow:{version:1,stageId:stage.id,stageIndex:stages.indexOf(stage),phase:'choices',origin,chain:[id],visitedStages:[stage.id],claimedActions:[],history:[],flags:{},pending:null,resultText:'',lastChoice:''}};return s;
}
function select(r,label){const state=r.E.getState(),idx=state.event.choices.findIndex(x=>x.label===label||(label==='Продолжить'&&x.label==='Следующий этап'));assert.ok(idx>=0,'Missing choice '+label);r.E.action('event',idx);}
function qty(s,id){return s.inventory.filter(x=>x.id===id).reduce((n,x)=>n+x.qty,0);}

module.exports={runtime,eventSave,select,qty};
