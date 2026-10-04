(() => {
  const items = {
    pm:{name:'ПМ',type:'weapon',weight:0.9,value:900,description:'Надёжный служебный пистолет.'}, ammo9:{name:'Патроны 9×18',type:'ammo',weight:.02,value:8,description:'Боеприпасы для ПМ.'},
    shotgun:{name:'Обрез',type:'weapon',weight:2.8,value:1500,description:'Дробовик для ближнего боя.'}, shells:{name:'Патроны 12×70',type:'ammo',weight:.05,value:16,description:'Дробовые патроны.'}, rifle:{name:'АКС-74У',type:'weapon',weight:3.1,value:3800,description:'Компактная автоматическая винтовка.'}, ammo545:{name:'Патроны 5.45',type:'ammo',weight:.03,value:14,description:'Боеприпасы для автомата.'},
    medkit:{name:'Аптечка',type:'consumable',weight:.4,value:180,description:'Восстанавливает 45 здоровья.'}, antirad:{name:'Антирад',type:'consumable',weight:.2,value:240,description:'Снижает радиацию на 55.'}, bread:{name:'Хлеб',type:'consumable',weight:.3,value:35,description:'Немного восстанавливает силы.'}, water:{name:'Вода',type:'consumable',weight:.5,value:45,description:'Запас питьевой воды.'}, scrap:{name:'Электронный лом',type:'loot',weight:1.2,value:130,description:'Детали для поручения торговца.'}, bandage:{name:'Бинт',type:'consumable',weight:.1,value:75,description:'Восстанавливает 18 здоровья.'},
    artifact_spark:{name:'Искра',type:'artifact',weight:.4,value:850,radResist:.12,description:'Слабое защитное поле снижает накопление радиации.'}, artifact_medusa:{name:'Медуза',type:'artifact',weight:.7,value:1200,radResist:.18,description:'Редкий артефакт с защитными свойствами.'}, artifact_crystal:{name:'Кристалл',type:'artifact',weight:.5,value:1600,radResist:.08,description:'Тёплый на ощупь артефакт.'}
  };
  const weapons = {pm:{name:'ПМ',damage:24,range:380,rate:.32,mag:8,ammo:'ammo9',reload:1.2},shotgun:{name:'Обрез',damage:58,range:210,rate:.8,mag:2,ammo:'shells',reload:1.6},rifle:{name:'АКС-74У',damage:20,range:480,rate:.12,mag:24,ammo:'ammo545',reload:1.8}};
  const enemies = {bandit:{name:'Бандит',health:70,speed:72,damage:8,reach:30,detect:270,attack:1.1,color:'#a78a61',loot:[['ammo9',5],['scrap',1],['bread',1]]},mutant:{name:'Плоти',health:100,speed:94,damage:13,reach:27,detect:240,attack:1.25,color:'#947052',loot:[['artifact_spark',1],['bread',1]]},guard:{name:'Наёмник',health:125,speed:58,damage:15,reach:32,detect:330,attack:1,color:'#78826b',loot:[['ammo545',12],['scrap',1],['medkit',1]]}};
  const quests = [
    {id:'tower',title:'Подойти к старой вышке',description:'Ориентир на востоке сектора',reward:220,goal:1},
    {id:'building',title:'Осмотреть старое здание',description:'Проверь заброшенное здание',reward:180,goal:1},
    {id:'stash',title:'Найти тайник',description:'Обыщи тайник под плитой',reward:250,goal:1},
    {id:'hunters',title:'Очистить тракт',description:'Останови двух враждебных сталкеров',reward:320,goal:2},
    {id:'parts',title:'Детали для торговца',description:'Принеси торговцу три электронных блока',reward:500,goal:3}
  ];
  window.ZoneRPGItems = {items,weapons,enemies,quests};
})();
