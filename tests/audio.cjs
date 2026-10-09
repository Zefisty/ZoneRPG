const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let oscillators=0,stops=0,intervals=0,clears=0;const handlers={};
class AudioContext {constructor(){this.state='suspended';this.currentTime=0;this.destination={};}resume(){this.state='running';return Promise.resolve();}createOscillator(){oscillators++;return{type:'',frequency:{value:0,setValueAtTime(){}},connect(){},start(){},stop(){stops++;},onended:null};}createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}},connect(){}};}}
const ctx={window:{AudioContext,addEventListener:(name,fn)=>handlers[name]=fn},document:{hidden:false},Math,setInterval(){intervals++;return intervals;},clearInterval(){clears++;}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../audio.js'),'utf8'),ctx);
const a=ctx.window.ZoneRPGAudio;a.unlock();
for(const mode of ['play','event','combat','combatItems','combatWeapons'])a.sync(mode,{music:true,sfx:true,volume:.2},{combat:mode.startsWith('combat'),expedition:mode==='event',depth:12,factionBase:mode==='play'});
for(const kind of ['ui','shot','hit','miss','reload','damage','rare','victory','loot','alert'])a.play(kind);
assert.ok(oscillators>20);assert.ok(clears>=3);assert.doesNotThrow(()=>handlers.pagehide());assert.ok(stops>=oscillators);
a.setMusic(false);a.setSfx(false);assert.doesNotThrow(()=>handlers.pagehide());console.log('PASS Audio contexts, feedback, atmosphere, combat panels and pagehide cleanup (mock Web Audio).');
