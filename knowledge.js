(() => {
  const W=window.ZoneRPGWorld, I=window.ZoneRPGItems;
  const definitions=new Map(), aliases=new Map(), pools={}, notes=new Map(), warned=new Set();
  const common=[
    ['Мутанты на северной дороге','На северной дороге видели мутантов. Держи магазин полным.'],
    ['Обмен на Кордоне','Торговец на Кордоне меняет медикаменты на детали.'],
    ['Сигнал старой вышки','У старой вышки снова слышали аварийный сигнал.'],
    ['Бандиты после заката','После заката у промзоны чаще встречаются бандиты.'],
    ['Тихий обход','Разведчик заметил тихий обход к ближайшему сектору.'],
    ['Заказ учёных','Учёные ищут образцы аномалий и платят за целые находки.'],
    ['Тайник под бетонным кольцом','Кто-то оставил записку о тайнике под бетонным кольцом.'],
    ['Дозиметры у воды','Патруль предупреждает: дозиметры у воды часто врут.']
  ];
  const add=(id,title,text)=>{definitions.set(id,{id,title,text});aliases.set(id.toLowerCase(),id);return id;};
  const shared=common.map(([title,text],i)=>add('rumor_zone_'+String(i+1).padStart(2,'0'),title,text));
  for(const [loc,data] of Object.entries(W.locations)){
    const local=(W.rumors[loc]||[]).map((text,i)=>add('rumor_'+loc+'_'+String(i+9).padStart(2,'0'),(i===0?'Запас у измерительного поста':'Новый сигнал')+' · '+data.name,text));
    pools[loc]=[...local,...shared];
    shared.forEach((id,i)=>aliases.set(('rumor_'+loc+'_'+String(i+1).padStart(2,'0')).toLowerCase(),id));
    for(const key of ['rumor:'+loc,'camp news '+loc])notes.set(key,{title:'Дорожные новости · '+data.name,text:'Разговоры в этом секторе записаны в разделе «Слухи». '});
  }
  // Derive display records from the same content definitions that write knowledge keys.
  // The keys remain unchanged for event conditions and old saves.
  for(const event of W.events){
    notes.set(event.id,{title:event.category||'Полевое наблюдение',text:event.text||'Ориентир отмечен в КПК.'});
    for(const [suffix,text] of Object.entries({approach:'Ты проверил свежие следы.',watched:'Ты наблюдал за участком из укрытия.',aftermath:'Ты осмотрел место боя.',reviewed:'Ты записал ориентир и выбрал безопасный обход.'}))notes.set(event.id+' '+suffix,{title:event.category||'Полевое наблюдение',text});
    const stages=event.stages||[{text:event.text,choices:event.choices}];
    for(const stage of stages)for(const choice of stage.choices||[]){
      for(const key of [].concat(choice.effects?.knowledge||[]))notes.set(key,{title:event.category||'Полевое наблюдение',text:choice.resultText||stage.text||event.text||'Ориентир отмечен в КПК.'});
    }
  }
  for(const [id,npc] of Object.entries(W.people))for(const [prefix,text] of Object.entries({'npc-met:':'Ты познакомился с этим человеком.','npc-work:':'Вы обсудили доступные поручения.','npc-news:':'Вы поговорили о дорожных новостях.','npc-advice:':'Собеседник поделился советом.'}))notes.set(prefix+id,{title:npc.name,text});
  for(const [id,d] of Object.entries(W.enemyTypes)){
    notes.set(id,{title:d.name,text:d.description});
    notes.set('enemy '+id,{title:d.name,text:d.description});
    notes.set('v63 '+id+' observed',{title:'Наблюдение · '+d.name,text:d.description});
  }
  for(const q of W.quests)notes.set(q.id,{title:q.title,text:q.description||'Поручение записано в журнале заданий.'});
  for(const [id,d] of Object.entries(W.locations))notes.set(id,{title:d.name,text:d.description});
  for(const [id,d] of Object.entries(W.factions))notes.set(id,{title:d.name,text:'Сведения об отношениях доступны в разделе «Фракции».'});
  for(const [id,d] of Object.entries(I.items))notes.set(id,{title:d.name,text:d.description||'Предмет отмечен в КПК.'});
  function canonical(id){return typeof id==='string'?(aliases.get(id.toLowerCase())||id):null;}
  function unknown(id){if(!warned.has(id)){warned.add(id);console.warn('[ZoneRPG] Нет определения записи КПК:',id);}return {title:'Неизвестная запись',text:'Описание этой записи пока недоступно.'};}
  function readable(text){return typeof text==='string'&&/[А-Яа-яЁё]/.test(text)&&!/[a-z]/.test(text);}
  function display(value){
    const id=canonical(typeof value==='string'?value:value?.id||value?.rumorId);
    const def=definitions.get(id)||notes.get(id);if(def)return def;
    if(typeof value==='object'&&id)return unknown(id);
    const text=typeof value==='string'?value:value?.text;
    if(readable(text))return {title:readable(value?.title)?value.title:'Полевые заметки',text};
    return unknown(id||text||'пустая запись');
  }
  function record(value){
    const raw=typeof value==='string'?{id:value}:value;
    if(!raw||typeof raw!=='object')return null;
    const candidate=canonical(raw.id||raw.rumorId||(typeof raw.text==='string'&&!readable(raw.text)?raw.text:null)),def=definitions.get(candidate)||[...definitions.values()].find(d=>d.text===raw.text);
    if(!def&&!candidate&&typeof raw.text!=='string')return null;
    return {...raw,id:def?.id||candidate||null,title:def?.title||raw.title,text:def?.text||raw.text};
  }
  function heard(input,records,knowledge){return [...new Set([...(Array.isArray(input)?input:[]),...records.map(r=>r.id),...knowledge.filter(k=>/^rumor_/i.test(k))].filter(id=>typeof id==='string').map(canonical))];}
  window.ZoneRPGKnowledge={display,record,heard,canonical,pool:loc=>(pools[loc]||[]).map(id=>definitions.get(id)),rumor:id=>definitions.get(canonical(id))};
})();
