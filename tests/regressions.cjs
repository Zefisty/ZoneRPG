const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function runtime(){
  const store=new Map(),warnings=[],errors=[],root={innerHTML:'',dataset:{}},body={dataset:{},classList:{add(){},remove(){}}};let clock=0;
  const math=Object.create(Math);math.random=()=>.4;
  const ctx={window:{},document:{getElementById:()=>root,body,documentElement:{style:{setProperty(){}}}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},Math:math,performance:{now:()=>clock+=250},setTimeout:()=>1,clearTimeout(){},console:{warn:(...x)=>warnings.push(x),error:(...x)=>errors.push(x),log(){}}};
  vm.createContext(ctx);for(const file of ['items.js','world.js','state.js','save.js','engine.js','ui.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),ctx,{filename:file});
  const {ZoneRPGState:S,ZoneRPGEngine:E,ZoneRPGWorld:W,ZoneRPGItems:I,ZoneRPGSave:Save,ZoneRPGUI:UI}=ctx.window;
  E.onChange(()=>UI.render(E.getState()));
  return{ctx,S,E,W,I,Save,root,store,warnings,errors,load(s){Save.write(s);E.action('load');return E.getState();}};
}
function eventSave(r,id,stageId,origin='explore',destination=null){
  const s=r.S.fresh(),def=r.W.events.find(x=>x.id===id);assert.ok(def,id);const stages=def.stages||[{id:'main',text:def.text,choices:def.choices}],stage=stages.find(x=>x.id===stageId)||stages[0];
  s.mode='event';s.travelTo=destination;s.explorationActive=origin==='explore';s.explores.cordon=4;
  s.event={id,category:def.category,rarity:def.rarity||'common',text:stage.text,choices:stage.choices,flow:{version:1,stageId:stage.id,stageIndex:stages.indexOf(stage),phase:'choices',origin,chain:[id],visitedStages:[stage.id],claimedActions:[],history:[],flags:{},pending:null,resultText:'',lastChoice:''}};return s;
}
function select(r,label){const state=r.E.getState(),idx=state.event.choices.findIndex(x=>x.label===label);assert.ok(idx>=0,'Missing choice '+label);r.E.action('event',idx);}
function qty(s,id){return s.inventory.filter(x=>x.id===id).reduce((n,x)=>n+x.qty,0);}
let passed=0;function test(name,fn){fn();console.log('PASS '+name);passed++;}
test('All trader stock identifiers and prices; invalid item does not break state/load',()=>{
 const r=runtime();for(const location of Object.keys(r.W.locations)){const s=r.S.fresh();s.player.location=location;const view=r.load(s);if(view.shop)for(const row of view.shop.stock){assert.ok(row.item);assert.ok(Number.isFinite(row.price));}}
 const s=r.S.fresh();s.player.location='warehouses';s.player.money=3210;s.player.rank=4;s.player.xp=33;delete r.I.items.ppVityaz;r.load(s);assert.equal(r.E.getState().player.money,3210);assert.equal(r.E.getState().player.rank,4);assert.ok(!r.E.getState().shop.stock.some(x=>x.id==='ppVityaz'));assert.equal(r.warnings.length,1);r.E.getState();assert.equal(r.warnings.length,1);
});
test('Radio route completion, return and save/load at warehouses',()=>{
 const r=runtime(),s=eventSave(r,'chain_strange_signal','source','travel','warehouses');s.player.location='wild';r.load(s);select(r,'Сменить частоту');r.E.action('save');r.E.action('load');select(r,'Продолжить');let v=r.E.getState();assert.equal(v.player.location,'warehouses');assert.equal(v.travelTo,null);assert.equal(v.event,null);assert.ok(v.shop.stock.length);r.E.action('save');r.E.action('mainMenu');r.E.action('load');assert.equal(r.E.getState().player.location,'warehouses');
 r.load(s);select(r,'Сменить частоту');r.E.action('eventReturn');assert.equal(r.E.getState().player.location,'wild');assert.equal(r.E.getState().travelTo,null);
});
test('Interrupted travel finishes on load without repeating costs',()=>{
 const r=runtime(),s=r.S.fresh();s.player.location='wild';s.player.money=1777;s.travelTo='warehouses';r.load(s);assert.equal(r.E.getState().player.location,'warehouses');assert.equal(r.E.getState().player.money,1777);
});
test('PM, knife, empty slots: display uses same weapon as attack/reload/save',()=>{
 const r=runtime(),s=r.S.fresh();s.combat={type:'dog',enemy:{...r.W.enemyTypes.dog,hp:34,maxHp:34,name:'Wrong stalker',visual:'stalker'},aimed:false,turn:1,log:[]};r.load(s);
 assert.equal(r.E.getState().combat.enemy.visual,'dog');assert.match(r.root.innerHTML,/enemy-dog\.svg/);assert.match(r.root.innerHTML,/ОРУЖИЕ · ПМ · 8\/8 · запас 28/);
 r.E.action('attack');assert.equal(r.E.getState().magazines.pm,7);assert.match(r.root.innerHTML,/ПМ · 7\/8 · запас 28/);r.E.action('reload');assert.equal(r.E.getState().magazines.pm,8);assert.equal(qty(r.E.getState(),'ammo918'),27);assert.match(r.root.innerHTML,/ПМ · 8\/8 · запас 27/);
 r.E.action('equipWeapon','knife');assert.equal(r.E.getState().activeWeapon.id,'knife');assert.match(r.root.innerHTML,/ОРУЖИЕ · Охотничий нож · 0\/—/);r.E.action('save');r.E.action('load');assert.equal(r.E.getState().activeWeapon.id,'knife');
 r.E.action('unequipSlot','melee');r.E.action('unequipSlot','sidearm');r.E.action('unequipSlot','primary');assert.equal(r.E.getState().activeWeapon,null);assert.match(r.root.innerHTML,/Без оружия/);const hp=r.E.getState().player.health;r.E.action('attack');assert.equal(r.E.getState().player.health,hp);
});
test('All saved enemy types keep canonical visuals/stats; local sprites exist',()=>{
 const r=runtime();for(const [type,enemy] of Object.entries(r.W.enemyTypes)){const s=r.S.fresh();s.combat={type,enemy:{hp:12,maxHp:enemy.hp,name:'Wrong',visual:'stalker',damage:999},log:[]};const v=r.load(s);assert.equal(v.combat.enemy.name,enemy.name);assert.equal(v.combat.enemy.visual,enemy.visual);assert.equal(v.combat.enemy.damage,enemy.damage);assert.ok(fs.existsSync(path.join(ROOT,'assets','sprites','enemy-'+enemy.visual+'.svg')));}
});
test('Medicine purchase is medical, charged once, including result reload',()=>{
 const r=runtime(),def=r.W.events.find(e=>e.text?.includes('В полевом лазарете')),stage=(def.stages||[]).find(x=>x.choices.some(c=>c.label.startsWith('Купить припасы')));r.load(eventSave(r,def.id,stage?.id));const before=r.E.getState();select(r,'Купить припасы · 60 ₽');const after=r.E.getState();assert.equal(after.player.money,before.player.money-60);assert.equal(qty(after,'bandage'),qty(before,'bandage')+1);assert.equal(qty(after,'wires'),qty(before,'wires'));r.E.action('save');r.E.action('load');select(r,'Продолжить');assert.equal(r.E.getState().player.money,after.player.money);assert.equal(qty(r.E.getState(),'bandage'),qty(after,'bandage'));
});
test('Full backpack purchase does not charge money or grant partial goods',()=>{
 const r=runtime(),s=eventSave(r,'event_8_5','investigate');s.inventory.push({id:'ammo918',qty:4000});r.load(s);const before=r.E.getState();select(r,'Купить припасы · 60 ₽');assert.equal(r.E.getState().player.money,before.player.money);assert.equal(qty(r.E.getState(),'bandage'),qty(before,'bandage'));
});
test('Water/cans inspection gives information first, then the stated goods once',()=>{
 const r=runtime();r.load(eventSave(r,'event_6_5','main'));const before=r.E.getState();select(r,'Сначала осмотреть следы');assert.equal(qty(r.E.getState(),'water'),qty(before,'water'));select(r,'Продолжить');assert.equal(r.E.getState().event.flow.stageId,'inspect_find');r.E.action('save');r.E.action('load');select(r,'Забрать находку');const after=r.E.getState();assert.equal(qty(after,'water'),qty(before,'water')+1);assert.equal(qty(after,'canned'),qty(before,'canned')+1);assert.equal(qty(after,'wires'),0);r.E.action('save');r.E.action('load');select(r,'Продолжить');assert.equal(qty(r.E.getState(),'water'),qty(after,'water'));
});
test('Tool box yields tools, not medicines/wires',()=>{
 const r=runtime();r.load(eventSave(r,'event_6_3','main'));const before=r.E.getState();select(r,'Забрать находку');const after=r.E.getState();assert.equal(qty(after,'tools'),qty(before,'tools')+1);assert.equal(qty(after,'medkit'),qty(before,'medkit'));assert.equal(qty(after,'wires'),0);
});
test('Save with item reward restores history/progression without ReferenceError',()=>{
 const r=runtime(),s=eventSave(r,'event_6_3','main');s.event.flow.rewards={xp:12,money:20,items:[{id:'tools',qty:1},{id:'missing',qty:1}]};s.player.rank=5;s.player.xp=66;s.attributes.endurance=7;s.player.health=108;s.quests.completed=['field_samples'];s.event.flow.history=[{text:'Found',choice:'Inspect'}];const v=r.load(s);assert.equal(v.event.flow.rewards.items.length,1);assert.equal(v.event.flow.history.length,1);assert.equal(v.player.rank,5);assert.equal(v.player.health,108);assert.equal(v.player.xp,66);assert.ok(v.quests.completed.some(q=>q.id==='field_samples'));
});
test('Old schema saves and corrupted save give clear result without deleting data',()=>{
 const r=runtime();for(const version of [2,3,4,5,6]){const s=r.S.fresh();s.version=version;s.player.money=4321;s.player.location='warehouses';r.store.set(r.S.KEY,JSON.stringify(s));r.E.action('load');assert.equal(r.E.getState().player.money,4321);assert.equal(r.E.getState().player.location,'warehouses');}r.E.action('mainMenu');r.store.set(r.S.KEY,'{invalid');r.E.action('load');assert.match(r.root.innerHTML,/role="alert"/);assert.match(r.root.innerHTML,/Сохранение повреждено/);assert.equal(r.store.get(r.S.KEY),'{invalid');
});
test('Neutral Russian item-use messages',()=>{
 const r=runtime();r.load(r.S.fresh());for(const id of ['water','canned','bandage']){const i=r.E.getState().inventory.findIndex(x=>x.id===id);r.E.action('use',i);assert.ok(r.E.getState().log.some(x=>x==='Использован предмет: '+r.I.items[id].name+'.'));}
});
test('Common loot selects different fitting items instead of always wires',()=>{
 const found=[];for(const roll of [.01,.55,.99]){const r=runtime();r.ctx.Math.random=()=>roll;r.load(eventSave(r,'event_6_1','main'));const before=r.E.getState();select(r,'Забрать находку');const after=r.E.getState();found.push(after.inventory.find(row=>qty(after,row.id)>qty(before,row.id))?.id);}assert.equal(new Set(found).size,3);assert.ok(found.includes('wires'));assert.ok(found.some(id=>id!=='wires'));
});
console.log(passed+' regression checks passed.');
