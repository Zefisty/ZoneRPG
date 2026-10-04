(() => {
  const {KEY,VERSION}=window.ZoneRPGState;
  function read(){try{const raw=localStorage.getItem(KEY);if(!raw)return{ok:false,reason:'empty'};const data=JSON.parse(raw);if(data.version!==VERSION)return{ok:false,reason:'version'};return{ok:true,data};}catch{return{ok:false,reason:'corrupt'};}}
  function write(state){try{localStorage.setItem(KEY,JSON.stringify({...state,version:VERSION,savedAt:new Date().toISOString()}));return{ok:true};}catch(error){return{ok:false,reason:error?.name==='QuotaExceededError'?'quota':'unavailable'};}}
  function remove(){try{localStorage.removeItem(KEY);return true;}catch{return false;}}
  window.ZoneRPGSave={read,write,remove,has:()=>read().ok};
})();
