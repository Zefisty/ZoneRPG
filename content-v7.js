/* v7 extensions: existing IDs and definitions remain intact. */
(() => {
 const W=window.ZoneRPGWorld,I=window.ZoneRPGItems;
 const sectors=[
 ['floodplain','Затопленная пойма','swamp',3,18,'Вода скрывает старую дамбу; над тростником дрожат сигнальные огни.','swamp'],
 ['quarry','Каменоломня','garbage',4,24,'Обрушенный карьер. Тросы звенят над шахтными колодцами.','industrial'],
 ['radioHill','Радиовысота','railway',3,14,'Сломанная антенна ловит чужие переговоры.','road'],
 ['greenhouse','Заброшенные теплицы','deadVillage',3,20,'Стёкла укрыты мхом. Под землёй работают старые насосы.','village'],
 ['researchCamp','Полевой институт','yantar',4,28,'Учёные установили защищённые палатки вокруг измерительной станции.','camp'],
 ['dutyFort','Форт Долга','militaryDepot',5,20,'Бетонный периметр прикрывает дорогу в северные сектора.','industrial'],
 ['freeCamp','Вольный лагерь','warehouses',5,22,'Старый санаторий стал базой Свободы. Дежурные слушают лес.','village'],
 ['mirrorLake','Зеркальное озеро','anomalyRidge',8,50,'Отражение движется позже человека. Берег закрыт следами пропавших.','swamp']
 ];
 for(const [id,name,parent,danger,rad,description,scene]of sectors){
   W.locations[id]={name,description,neighbors:[parent],danger,rad,mutants:20+danger,bandits:8,stalkers:14,npcs:[],trader:null,tags:[scene,'v7'],layout:description};
   W.locations[parent].neighbors.push(id);
 }
 const factionData={
 loners:['Одиночки','cordon','Взаимовыручка и свободные дороги.',['bandits'],5,1],
 duty:['Долг','dutyFort','Сдержать угрозу Зоны и защитить периметр.',['freedom','bandits'],10,2],
 freedom:['Свобода','freeCamp','Исследовать Зону без военного контроля.',['duty','military'],10,2],
 ecologists:['Учёные','researchCamp','Сохранить данные, жизнь и редкие образцы.',['monolith'],8,2],
 military:['Военные','checkpoint','Охранять периметр и контролировать проходы.',['bandits','freedom'],15,3],
 bandits:['Бандиты','darkvalley','Долги, контрабанда и власть над дорогами.',['loners','duty','military'],12,2],
 mercs:['Наёмники','wild','Контракты важнее чужих лозунгов.',['loners'],15,3],
 monolith:['Монолит','chNpp','Голоса за северным периметром.',['loners','ecologists','duty'],50,8]
 };
 for(const [id,[name,base,description,enemies,minRep,minRank]]of Object.entries(factionData))
   Object.assign(W.factions[id],{name,base,description,enemies,minRep,minRank,joinable:id!=='monolith',discount:.08,benefit:'Скидка 8% у своих торговцев, доступ к контрактам базы.'});
 Object.assign(W.factions.mutants,{description:'Обитатели Зоны. Не ведут переговоров.',joinable:false,enemies:[],base:null});
 const cast=[
 ['guide7','Лис','проводник','loners','radioHill','Сначала слушай эфир, потом выбирай дорогу.'],
 ['damMedic','Зоя','медик','loners','floodplain','Через воду идут с перевязкой и запасом чистой воды.'],
 ['quarryTech','Резец','техник','loners','quarry','Кран ещё можно запустить. Но проводка мокрая.'],
 ['glassHunter','Мох','охотник','loners','greenhouse','Здесь зверь слышит каждое стекло.'],
 ['prof7','Савельев','учёный','ecologists','researchCamp','Нам нужны повторяемые измерения, не красивые рассказы.'],
 ['guard7','Шток','ветеран','duty','dutyFort','Сначала докажи, что умеешь возвращаться.'],
 ['freedom7','Ветер','разведчик','freedom','freeCamp','Отмечай обходы: завтра главную дорогу займут.'],
 ['mirror7','Немой','сталкер','loners','mirrorLake','Не отвечай своему отражению.'],
 ['quarter7','Складов','торговец','duty','dutyFort','Купи патроны до выхода, не после.'],
 ['dealer7','Липа','торговец','freedom','freeCamp','За отчёт о дороге могу дать хорошую цену.'],
 ['labShop7','Нина','торговец','ecologists','researchCamp','Пробы отдельно от еды. Всегда.'],
 ['rookie7','Юла','новичок','loners','rookie','Я собираюсь идти к антенне. Покажешь, как?'],
 ['bandit7','Крюк','старший','bandits','darkvalley','Работа простая: принеси груз без вопросов.'],
 ['army7','Лазарев','офицер','military','checkpoint','Сектор проверяется по маршруту, а не по слухам.'],
 ['merc7','Скоба','контрактник','mercs','wild','Нужен человек, который умеет молчать.'],
 ['tracker7','Седой','охотник','loners','redforest','След в лесу живёт меньше часа.']
 ];
 for(const [id,name,role,faction,home,greeting]of cast){
   W.people[id]={name,role,faction,greeting,home,possibleLocations:[home],character:greeting};
   W.locations[home].npcs.push(id);
   if(role==='торговец')W.locations[home].trader=id;
 }
 const artifactSpecs=[
 ['reed','Тростник','common',{maxStamina:8,radResist:-.03},700,'artifact-medusa'],
 ['anchor','Якорь','uncommon',{maxWeight:4,maxStamina:-8},1500,'artifact-gravi'],
 ['lens','Линза','rare',{accuracy:.06,maxHealth:-8},2600,'artifact-flash'],
 ['dew','Роса','uncommon',{healthRegen:1,maxWeight:-2},1800,'artifact-soul'],
 ['scar','Рубец','rare',{protection:.07,radPerTrip:1},3200,'artifact-shell'],
 ['echoHeart','Сердце эха','very_rare',{maxHealth:14,evasion:-.025},5400,'artifact-soul'],
 ['mirrorSeed','Зеркальное семя','special',{radResist:.25,maxHealth:-12,accuracy:.03},8200,'artifact-nightstar'],
 ['compass7','Компас поймы','special',{maxStamina:18,maxWeight:2,maxHealth:-8},7600,'artifact-gravi']
 ];
 for(const [id,name,rarity,effect,price,icon]of artifactSpecs)I.items[id]={name,type:'artifact',rarity,effect,price,icon,weight:.45,stackable:false,description:Object.entries(effect).map(([k,v])=>({maxHealth:'Максимум HP',maxStamina:'Выносливость',maxWeight:'Переносимый вес',accuracy:'Точность',evasion:'Уклонение',radResist:'Защита от радиации',protection:'Защита',healthRegen:'Восстановление HP',radPerTrip:'Радиация за переход'})[k]+': '+v).join(' · '),uniqueSource:['mirrorSeed','compass7'].includes(id)};
 const goods=[
 ['electrolyte','Солевой раствор','drink',140,.4,{thirst:-30,stamina:14},'water'],
 ['ration7','Экспедиционный паёк','food',210,.6,{hunger:-40,stamina:10},'ration'],
 ['fieldSerum','Полевой антидот','medicine',350,.2,{radiation:-28,health:5},'antirad'],
 ['probe7','Пакет болтов','loot',80,.2,{},'parts'],
 ['sealedSample','Опечатанная проба','quest',180,.3,{},'quest-document'],
 ['radioBattery','Батарея рации','loot',120,.3,{},'electronics'],
 ['routeReport','Маршрутный отчёт','quest',0,0,{},'quest-document'],
 ['pumpFuse','Предохранитель насоса','quest',0,.1,{},'electronics']
 ];
 for(const [id,name,type,price,weight,effect,icon]of goods)I.items[id]={name,type,price,weight,effect,icon,stackable:true,description:name+' — запас для полевой работы.'};
 I.items.surveyPack={name:'Рюкзак геодезиста',type:'backpack',slot:'backpack',rarity:'uncommon',price:2400,weight:1.8,stackable:false,icon:'backpack',effect:{maxWeight:12,maxStamina:-3},description:'Крепления для образцов и расходников.'};
 I.items.surveyMask={name:'Полевой респиратор',type:'headgear',slot:'head',rarity:'uncommon',price:1800,weight:.8,stackable:false,icon:'gas-mask',effect:{radResist:.18},description:'Фильтр для длительной экспедиции.'};
 for(const [id,name,base,damage,accuracy,price]of [['carbine7','Карабин разведчика','huntingRifle',33,.8,4200],['smg7','ПП патрульный','ppVityaz',25,.7,3600]]){
   I.weapons[id]={...I.weapons[base],name,damage,accuracy,price};
   I.items[id]={...I.items[base],name,weaponId:id,price,description:'Подготовлен для патрульных выходов.'};
 }
 const enemies=[
 ['quarryDog','Карьерный пёс','dog',54,14,'quarry'],
 ['reedCrawler','Камышовый ползун','marshLeech',86,18,'floodplain'],
 ['mirrorStalker','Зеркальный двойник','ashWalker',145,23,'mirrorLake'],
 ['banditScout','Бандит-разведчик','bandit',80,18,'quarry'],
 ['mercMarksman','Наёмник-стрелок','merc',125,25,'radioHill'],
 ['dutyDeserter','Дезертир','duty',100,21,'dutyFort'],
 ['electroSnork','Искровой снорк','snork',112,22,'greenhouse']
 ];
 for(const [id,name,base,hp,damage,home]of enemies){
   W.enemyTypes[id]={...W.enemyTypes[base],name,hp,damage,visual:id,description:name+' · контакт в секторе '+W.locations[home].name,intro:name+' замечает тебя у укрытия.',xp:Math.round(hp/3),loot:[...W.enemyTypes[base].loot],home};
 }
 const event=(id,category,locations,stages,extra={})=>W.events.push({id,category,locations,kind:'explore',rarity:'uncommon',text:stages[0].text,choices:stages[0].choices,stages,...extra});
 const end=(label,resultText,effects={})=>({label,resultText,effects,finish:true});
 for(const [id,name,parent,danger,rad,description,scene]of sectors){
   event('v7_'+id+'_survey','Полевое наблюдение',[id],[
     {id:'approach',text:description+' На КПК осталась отметка измерительного поста.',choices:[{label:'Найти пост',nextStage:'measure',effects:{stamina:-2},resultText:'Ты выбираешь подход по старым меткам.'},end('Не рисковать','Ты отмечаешь опасный участок, не заходя в него.',{knowledge:name+': опасный подход'})]},
     {id:'measure',text:'Прибор пищит у закрытого контейнера. Можно снять показания или взять пробу.',choices:[end('Снять показания','Показания занесены в маршрутный журнал.',{knowledge:name+': измерения',add:{routeReport:1}}),end('Использовать болты для проверки','Болты обозначили границу. Ты достал опечатанную пробу.',{itemCost:{probe7:1},add:{sealedSample:1},radiation:2})]}],{art:scene==='swamp'?'swamp':'tower'});
   event('v7_'+id+'_supply','Оставленный груз',[id],[
     {id:'contact',text:'Укреплённый ящик помечен знаком сектора «'+name+'». Рядом обрывки грузовой накладной.',choices:[{label:'Проверить маршрут груза',nextStage:'crate',resultText:'Накладная указывает на аварийную доставку.'},end('Оставить груз','Ты сообщаешь по рации координаты груза.',{rep:{loners:1},knowledge:name+': груз на дороге'})]},
     {id:'crate',text:'Замок держится на ржавой скобе. За ящиком заметен след волочения.',choices:[{...end('Вскрыть инструментами','В аварийном отсеке сохранились вода и перевязочный материал.',{add:{water:1,bandage:1}}),when:{items:{tools:1}}},end('Взять открытую пачку','Ты забираешь полевой паёк, проверив целостность упаковки.',{add:{ration7:1},stamina:-3})]}],{art:'container'});
 }

 // Artifact availability is contextual; unique specimens never enter random loot tables.
 for(const a of artifactSpecs.filter(x=>!['mirrorSeed','compass7'].includes(x[0]))){
   const id=a[0],home=id==='reed'?'floodplain':id==='anchor'?'quarry':id==='dew'?'greenhouse':id==='scar'?'anomalyRidge':id==='lens'?'researchCamp':'redforest';
   event('v7_artifact_'+id,'Аномальный карман',[home],[{id:'edge',text:'Детектор различает слабый отклик. На краю поля виден необычный объект.',choices:[{...end('Проверить поле детектором','Ты вынес образец: '+a[1]+'.',{add:{[id]:1},radiation:4,stamina:-4}),when:{items:{echoDetector:1}}},end('Зондировать болтами','Болты обозначили только опасную границу. Артефакт остался внутри.',{itemCost:{probe7:1},knowledge:a[1]+': отклик',radiation:1}),end('Отступить','Ты оставил аномалию нетронутой.')]}],{rarity:a[2],minDepth:a[2]==='very_rare'?10:3,art:'anomaly'});
 }
 // Local atmosphere uses specific geography, consequences and choices, not globally shuffled duplicates.
 const observations=[
 ['cordon','Обрыв связи','В эфире Кордона пропала группа у внешнего забора.','radioBattery'],
 ['rookie','Первый след','Новичок путает собачий след с человеческим у деревенского колодца.','bandage'],
 ['checkpoint','Проверка пропуска','Дозорный проверяет выцветшую печать на пропуске.','ammo918'],
 ['garbage','Звон металла','Сборщик ломает ногу среди прессованных кузовов.','parts'],
 ['agro','Запах топлива','Под насосом института видна свежая лужа солярки.','tools'],
 ['darkvalley','Чужой груз','Крюк ищет пропавшую сумку у бетонного стока.','ammo919'],
 ['swamp','Огни над водой','Фонари на дамбе загораются против ветра.','probe7'],
 ['yantar','Показания датчика','Учёные просят сравнить два показания у берега.','sealedSample'],
 ['wild','Договор на стене','На кирпичной стене написан номер старого контракта.','radioBattery'],
 ['warehouses','Забытый дозор','Разведчик оставил записку в башне склада.','ration7'],
 ['redforest','Свежая тропа','Лесная тропа кончается слишком ровным кругом земли.','probe7'],
 ['pripyat','Окно на площади','За стеклом квартиры дважды вспыхивает фонарь.','bandage'],
 ['chNpp','Гул опоры','Опора линии передачи дрожит без ветра.','sealedSample'],
 ['railway','Сигнал вагона','В ремонтном вагоне щёлкает аварийный передатчик.','electronics'],
 ['deadVillage','Записка на двери','Старая дверь прижата запиской с датой сегодняшнего дня.','water'],
 ['machineYard','Заклинивший кран','Кран во дворе держит опасно накренившийся контейнер.','parts'],
 ['underground','Свет за решёткой','За решёткой слышны три коротких удара.','bandage'],
 ['militaryDepot','Спор у караула','Караульные потеряли запись последней смены.','ammo545'],
 ['anomalyRidge','Двойное эхо','Дозиметр отвечает двум сигналам с разной задержкой.','probe7'],
 ['southTunnel','След в пыли','В тоннеле различимы следы носилок.','water'],
 ['northOutpost','Пустая частота','На заставе работает радио, но все голоса слишком тихие.','radioBattery']
 ];
 for(const [loc,title,text,item]of observations)
   event('v7_local_'+loc,title,[loc],[{id:'contact',text,choices:[end('Разобраться',text+' Ты оставил проверенную запись в КПК и забрал отмеченный запас.',{add:{[item]:1},stamina:-3,knowledge:title+': '+W.locations[loc].name}),end('Передать координаты','Дозор подтверждает получение сообщения. Сам ты остаёшься у дороги.',{rep:{loners:1},knowledge:title+': координаты'})]}],{rarity:'common',art:'road'});
 for(const [id,name,base,hp,damage,home]of enemies)
   event('v7_enemy_'+id,'Опасный контакт',[home],[
     {id:'track',text:'На дороге замечен '+name.toLowerCase()+'. Можно выбрать дистанцию или уйти.',choices:[{label:'Занять позицию',nextStage:'fight',effects:{stamina:-3},resultText:'Ты выбираешь укрытие до контакта.'},end('Отойти по следам','Ты избежал боя, потратив время.',{time:1,stamina:-4})]},
     {id:'fight',text:name+' выходит на линию огня.',choices:[{label:'Вступить в бой',combat:id,enemyId:id,nextStage:'after',resultText:'Контакт начинается.'}]},
     {id:'after',text:'Дорога снова свободна. На месте боя остались отметки других следопытов.',choices:[end('Записать контакт','Результат боя отмечен в КПК.',{knowledge:'enemy '+id})]}],{rarity:home==='mirrorLake'?'very_rare':'uncommon',minDepth:2});
 for(const [id,name,role,faction,home,greeting]of cast){
   event('npc_story_'+id,'Встреча · '+name,[home],[{id:'greet',text:greeting,choices:[end('Спросить о секторе',W.locations[home].description,{newsRoll:true,knowledge:'met '+id}),end('Предложить помощь','Поручения доступны в разделе заданий КПК.',{knowledge:'help '+id})]}],{kind:'both'});
   W.quests.push({id:'v7_job_'+id,title:name+': полевой заказ',text:'Проверь сектор '+W.locations[home].name+' трижды и вернись к заказчику.',type:'explore',target:home,objectiveLocation:home,count:3,reward:300+W.locations[home].danger*45,rep:faction,repGain:4,giver:id,giverLocations:[home]});
 }
 const lines=[['loners','guide7','radioHill'],['duty','guard7','dutyFort'],['freedom','freedom7','freeCamp'],['ecologists','prof7','researchCamp']];
 for(const [f,giver,home]of lines)for(let n=1;n<=4;n++){
   const id='v7_'+f+'_line_'+n,target=n%2?home:W.locations[home].neighbors[0];
   W.quests.push({id,title:W.factions[f].name+' · контракт '+n,text:'Исследуй '+W.locations[target].name+' '+(n+1)+' раз. Отчёт сдаётся представителю базы.',type:'explore',target,objectiveLocation:target,count:n+1,reward:450+n*180,rep:f,repGain:5+n,giver,giverLocations:[home],requiredFaction:f,requiredCompletedQuest:n>1?'v7_'+f+'_line_'+(n-1):null});
 }


 // Local professions ask for different work; objectives stay deterministic and reachable.
 const jobs={
 glassHunter:{type:'kill',target:'mutants',objectiveLocation:'greenhouse',count:2,text:'Уничтожь двух мутантов у теплиц и вернись к Мху.'},
 mirror7:{type:'deliverType',itemType:'artifact',count:1,text:'Принеси любой артефакт Немому у Зеркального озера.'},
 quarter7:{type:'deliver',item:'ammo545',count:20,text:'Принеси Складову 20 патронов 5,45.'},
 dealer7:{type:'deliver',item:'parts',count:2,text:'Липе нужны два набора деталей для радиостанции.'},
 labShop7:{type:'deliver',item:'water',count:3,text:'Принеси Нине три фляги чистой воды.'},
 rookie7:{type:'route',target:'radioHill',returnTo:'rookie',text:'Проведи маршрут к Радиовысоте, затем вернись в деревню новичков.'},
 bandit7:{type:'deliver',item:'radioBattery',count:2,text:'Крюк ждёт две батареи рации в Тёмной Долине.'},
 army7:{type:'route',target:'quarry',returnTo:'checkpoint',text:'Проверь дорогу к Каменоломне, затем вернись на блокпост.'},
 merc7:{type:'kill',target:'hostiles',objectiveLocation:'wild',count:2,text:'Устрани два враждебных контакта на Дикой территории.'},
 tracker7:{type:'kill',target:'mutants',objectiveLocation:'redforest',count:2,text:'Седому нужны две победы над мутантами в Рыжем лесу.'}
 };
 for(const [id,job]of Object.entries(jobs))Object.assign(W.quests.find(x=>x.id==='v7_job_'+id),job);
 // Four contracts per faction combine patrol, delivery, combat and a final deep survey.
 for(const q of W.quests.filter(x=>x.requiredFaction)){
   const n=Number(q.id.slice(-1));
   if(n===2){q.type='deliver';q.item=q.rep==='ecologists'?'sealedSample':'radioBattery';q.count=2;q.title=W.factions[q.rep].name+' · снабжение';q.text='Доставь '+I.items[q.item].name+' ×2 представителю базы.';}
   if(n===3){q.type='kill';q.target='mutants';q.count=2;q.objectiveLocation=W.factions[q.rep].base;q.title=W.factions[q.rep].name+' · зачистка';q.text='Уничтожь двух мутантов в секторе '+W.locations[q.objectiveLocation].name+'.';}
   if(n===4){q.count=6;q.title=W.factions[q.rep].name+' · дальний дозор';}
 }
 event('v7_compass_chain','Насосная дамбы',['floodplain'],[
 {id:'pump',text:'Зоя отмечает насосную на карте: без предохранителя дамба останется затопленной.',choices:[{label:'Проверить щиток',nextStage:'fuse',resultText:'На щитке видны следы перегрева.'},end('Передать предупреждение','Ты передал сообщение о дамбе.',{knowledge:'dam problem'})]},
 {id:'fuse',text:'Предохранитель лежит в ящике, но рычаг заело.',choices:[{...{label:'Освободить рычаг инструментами',nextStage:'drain',resultText:'Механизм снова движется.',effects:{add:{pumpFuse:1}}},when:{items:{tools:1}}},end('Отложить ремонт','Ты сохранил координаты щитка.') ]},
 {id:'drain',text:'Вода уходит из нижнего отсека. Между лопастями пульсирует свет.',choices:[{label:'Заменить предохранитель',nextStage:'reward',effects:{itemCost:{pumpFuse:1},stamina:-4},resultText:'Подача воды восстановлена. Свет больше не движется.'}]},
 {id:'reward',text:'У опоры обнаружен необычный артефакт, который не сдвигается течением.',choices:[end('Забрать Компас поймы','Артефакт вынесен. Насосная отмечена как восстановленная.',{add:{compass7:1},rep:{loners:5},knowledge:'dam restored'})]}
 ],{rarity:'very_rare',unique:true,minDepth:6,art:'swamp'});

 // Directed field work is available from the journal; no lucky random encounter is required.
 for(const npc of ['prof7','quarryTech','damMedic','guide7']){
   const q=W.quests.find(x=>x.id==='v7_job_'+npc);q.type='research';q.count=3;q.title=W.people[npc].name+': специальное исследование';q.text='В секторе '+W.locations[q.target].name+' запусти полевое исследование из журнала, затем сдай отчёт.';
   event('v7_research_'+npc,'Специальное исследование',[q.target],[
     {id:'setup',text:'Установи приборы на участке, указанном заказчиком.',choices:[{label:'Разметить участок',nextStage:'sample',effects:{researchQuest:q.id,stamina:-2},resultText:'Контрольные точки отмечены.'}]},
     {id:'sample',text:'Нужно выбрать метод отбора. Пробы весят больше, записи безопаснее.',choices:[{label:'Снять показания',nextStage:'report',effects:{researchQuest:q.id},resultText:'Прибор сохранил серию показаний.'},{label:'Собрать материал',nextStage:'report',effects:{researchQuest:q.id,add:{sealedSample:1},radiation:2},resultText:'Проба опечатана.'}]},
     {id:'report',text:'Объедини наблюдения в отчёт для заказчика.',choices:[end('Составить отчёт','Полевая работа завершена. Вернись к заказчику.',{researchQuest:q.id,knowledge:'survey '+q.target})]}
   ],{kind:'directed',rarity:'uncommon',requiredQuest:q.id,art:'tower'});
 }

 const backgroundActions=[
 ['rookie','npc_story_guide7','Попросить объяснить ориентиры',{knowledge:'rookie radio markers'},'Лис показывает безопасные ориентиры между антеннами.'],
 ['soldier','npc_story_guard7','Обсудить дисциплину дозора',{rep:{duty:1},knowledge:'soldier duty patrol'},'Шток доверяет тебе карту смены караула.'],
 ['technician','v7_quarry_survey','Проверить экранирование прибора',{knowledge:'technician quarry shielding'},'Ты обнаружил ложный сигнал от повреждённого кабеля.'],
 ['hunter','v7_greenhouse_survey','Различить следы у теплицы',{knowledge:'hunter greenhouse spoor'},'След принадлежит снорку. Ты отмечаешь безопасную сторону подхода.'],
 ['scavenger','v7_quarry_supply','Прочитать клеймо контейнера',{add:{parts:1},knowledge:'scavenger quarry cargo'},'Клеймо указывает на отделение с запасными деталями.'],
 ['medic','npc_story_damMedic','Сверить полевые симптомы',{rep:{loners:1},knowledge:'medic dam symptoms'},'Зоя записывает твои наблюдения и отмечает чистую воду.']
 ];
 for(const [background,id,label,effects,resultText]of backgroundActions){
   const e=W.events.find(x=>x.id===id),stage=e.stages[0];stage.choices.push({label:'['+({rookie:'Новичок',soldier:'Бывший военный',technician:'Технарь',hunter:'Охотник',scavenger:'Мародёр',medic:'Медик'})[background]+'] '+label,when:{background},effects,resultText,finish:true});
 }

 event('v7_road_ambush','Два заслона',['quarry','darkvalley','wild'],[
 {id:'scout',text:'Разведчик перекрыл тропу. За ним виден второй заслон. Можно обойти их до боя.',choices:[{label:'Сбить первый заслон',combat:'banditScout',nextStage:'reserve'},end('Обойти через насыпь','Ты обходишь обе позиции, потеряв время и силы.',{stamina:-6,time:1})]},
 {id:'reserve',text:'За первым заслоном слышен затвор. Наёмник контролирует выход.',choices:[{label:'Переговорить по рации',nextStage:'deal',resultText:'Контрактник готов принять выкуп за свободную дорогу.'},{label:'Прорваться',combat:'mercMarksman',nextStage:'cache'}]},
 {id:'deal',text:'Наёмник требует 180 рублей. Платёж откроет путь, но останется в памяти одиночек.',choices:[{label:'Заплатить за проход',nextStage:'cache',effects:{money:-180,rep:{loners:-2}},resultText:'Оружие опущено. Дорога свободна.'},{label:'Отказаться и вступить в бой',combat:'mercMarksman',nextStage:'cache'}]},
 {id:'cache',text:'За заслоном склад патронов. Можно забрать груз или сообщить дозору.',choices:[end('Забрать патроны','Ты выносишь оставшийся запас.',{add:{ammo919:8,bandage:1}}),end('Передать склад дозору','Груз остаётся патрулю; твоё имя записано в сводку.',{rep:{duty:6},knowledge:'ambush store reported'})]}
 ],{rarity:'rare',minDepth:6,art:'road'});

 W.rumors={};
 for(const [id,name,parent]of sectors)W.rumors[id]=['В секторе '+name+' у измерительного поста оставили запас. Проверь его после разговора у костра.','В секторе '+name+' отмечен новый сигнал. На глубине следы становятся опаснее.'];
 for(const [id,name,parent]of sectors)
   event('v7_rumor_stash_'+id,'Тайник по наводке',[id],[{id:'find',text:'Ты нашёл метку из разговоров у костра. Запас спрятан выше уровня воды.',choices:[end('Забрать аварийный запас','В тайнике сохранились перевязка и чистая вода.',{add:{bandage:1,water:1},knowledge:'stash '+id}),end('Оставить для следующего','Ты оставил запас и отметил его координаты.',{rep:{loners:2}})]}],{rarity:'uncommon',unique:true,requiredKnowledge:'rumor:'+id,art:'container'});
 for(const [id,name,role,faction,home]of cast){
   const f=W.factions[faction],stage=W.events.find(e=>e.id==='npc_story_'+id).stages[0];
   stage.choices.push({label:'Открыть поручения',action:'questPanel'});
   if(f.base===home&&f.joinable)stage.choices.push({label:'Вступить: '+f.name,action:'joinFaction',factionId:faction,when:{factionMissing:true,rep:{[faction]:f.minRep},minRank:f.minRank}});
   stage.choices.push(end('Обсудить дела своих','Собеседник делится частотой дозора и подтверждает доступ к контрактам базы.',{knowledge:'faction contact '+id,newsRoll:true}));
   stage.choices[stage.choices.length-1].when={faction};
 }
 W.worldEvents=[
 {id:'migration',name:'Миграция мутантов',locations:['redforest','greenhouse','swamp'],duration:8,description:'Дозоры заметили перемещение стай.',danger:1},
 {id:'radiationSurge',name:'Радиационный фронт',locations:['anomalyRidge','mirrorLake','pripyat'],duration:5,description:'На севере вырос фон. Проверь фильтры.',radiation:2},
 {id:'caravan',name:'Караван снабжения',locations:['garbage','cordon','railway'],duration:6,description:'Торговцы временно снизили цены.',discount:.1},
 {id:'roadClosure',name:'Проверка тоннеля',locations:['southTunnel','rookie'],duration:4,description:'Дорога от тоннеля к деревне новичков временно закрыта. Доступен обход через Кордон.',blockedRoads:[['southTunnel','rookie']]},
 {id:'patrol',name:'Операция Долга',locations:['militaryDepot','dutyFort','redforest'],duration:8,description:'Патрули держат дороги под наблюдением.',danger:-1}
 ];
 event('v7_mirror_chain','Неопределённый сигнал',['mirrorLake'],[
 {id:'signal',text:'Рация повторяет твоё имя. На воде стоит неподвижная фигура.',choices:[{label:'Проследить за фигурой',nextStage:'shore',effects:{stamina:-4},resultText:'Ты отмечаешь обратный путь болтами.'},end('Выключить рацию','Ты прекращаешь контакт, сохранив запись.',{knowledge:'mirror signal'})]},
 {id:'shore',text:'На берегу лежит второй КПК с тем же временем, но чужой датой.',choices:[{label:'Сверить журнал',nextStage:'record',resultText:'В журнале есть предупреждение: не повторять шаги отражения.'}]},
 {id:'record',text:'Запись приводит к камню, который не отражается в воде.',choices:[{label:'Проверить болтами',nextStage:'choice',effects:{itemCost:{probe7:1}},resultText:'Болт остаётся на поверхности невидимой границы.'}]},
 {id:'choice',text:'Под камнем растёт кристалл. Можно взять его или передать координаты учёным.',choices:[end('Забрать Зеркальное семя','Ты выносишь единственный кристалл, и сигнал прекращается.',{add:{mirrorSeed:1},radiation:6}),end('Оставить образец учёным','Координаты ушли в институт. Учёные подтверждают передачу.',{rep:{ecologists:12},money:800,knowledge:'mirror sample preserved'})]}
 ],{rarity:'special',unique:true,minDepth:10,art:'anomaly'});
})();