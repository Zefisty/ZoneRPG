/* Targeted content corrections; the existing world and encounter graph remain authoritative. */
(() => {
  const W=window.ZoneRPGWorld;
  const end=(label,resultText,effects={},when={})=>({label,resultText,effects,when,finish:true});
  const addEvent=(id,category,locations,stages,extra={})=>W.events.push({id,category,locations,stages,kind:'quest',rarity:'common',text:stages[0].text,...extra});

  const pigId='npc_threeLeggedPigBandit';
  W.people[pigId]={name:'Бандит',role:'талисман блокпоста',species:'трёхногая свинья',faction:'military',home:'checkpoint',sprite:'pig-bandit',nonCombatant:true,greeting:'Трёхногая свинья похрюкивает у караульной будки. На ошейнике выбито: «Бандит». Военные пропускают её без документов.'};
  W.locations.checkpoint.npcs.push(pigId);
  addEvent('npc_story_'+pigId,'Блокпост · трёхногий Бандит',['checkpoint'],[{id:'contact',text:W.people[pigId].greeting,choices:[
    end('Погладить Бандита','Бандит подставляет бок и важно стучит тремя копытами. Караульный впервые за утро улыбается.',{pigCare:'pet'}),
    end('Дать кусочек еды','Бандит хрустит хлебом. На блокпосту у тебя появился маленький знакомый.',{itemCost:{bread:1},pigCare:'feed'},{items:{bread:1}}),
    end('Угостить консервами','Бандит вылизывает банку и провожает тебя до шлагбаума.',{itemCost:{canned:1},pigCare:'feed'},{items:{canned:1}}),
    end('Спросить караульного о Бандите','«Подобрали у минного поля. Одну ногу не спасли. Зато Бандит слышит чужие шаги раньше часового». История записана в КПК.',{knowledge:'Бандит — трёхногая свинья, спасённая у минного поля блокпоста.'}),
    end('Уйти','Бандит ложится у тёплого порога. Караульный бережно обходит его.')
  ]}]);

  for(const q of W.quests){
    q.giverLocations=Object.keys(W.locations).filter(id=>W.locations[id].npcs.includes(q.giver));
    q.turnInLocations=q.type==='route'?[q.returnTo]:q.giverLocations;
    q.autoTurnInEligible=['route','visit'].includes(q.type)&&!q.requiresDialogue&&!q.requiredCompletedQuest;
    q.rewardTrigger='turnIn';
  }
  // These objectives describe actual field work, not a count of unrelated encounters.
  for(const [id,target] of [['field_samples','yantar'],['ridge_reading','anomalyRidge']]){
    const q=W.quests.find(q=>q.id===id);q.type='anomaly';q.target=target;
    addEvent('v72_anomaly_'+id,'Полевой замер · '+W.locations[target].name,[target],[{id:'reading',text:'У края поля дозиметр отбивает двойные щелчки. Можно отметить след аномалии и снять контрольный замер.',choices:[
      end('Искать следы аномалий','Ты размечаешь границу болтами, снимаешь замер и заносишь след в полевой журнал.',{anomalyTrace:true,stamina:-3,radiation:2}),
      end('Прекратить замер','Ты убираешь прибор и отходишь от поля.')
    ]}]);
  }
  W.quests.find(q=>q.id==='field_notes').searchLocation='yantar';
  addEvent('v72_document_search','Янтарь · поиск полевых документов',['yantar'],[{id:'search',text:'На схеме учёного отмечена сухая архивная ниша под старой лабораторией. Здесь можно провести направленный поиск.',choices:[
    end('Провести поиск документов','Ты проверяешь архивные ниши по отметкам учёного.',{documentSearch:true,stamina:-4}),
    end('Отложить поиск','Отметка останется в журнале, пока поручение активно.')
  ]}]);
  // Anomalous interactions can also contribute to the relevant field objective.
  for(const event of W.events)for(const stage of event.stages||[])for(const c of stage.choices||[])
    if(c.effects&&(c.effects.artifactRoll||/замер|следы аномал|измерить фон/i.test(c.label)))c.effects.anomalyTrace=true;

  const hatch=W.events.find(e=>e.id==='v61_yard_mechanic').stages.find(s=>s.id==='follow').choices.find(c=>/люк/i.test(c.label));
  hatch.label='[Набор инструментов] Поднять застрявший люк';
  hatch.when={items:{tools:1},notFlag:'hatchOpened'};
  hatch.effects={rep:{loners:2},knowledge:'Механик спасён. Под люком машинного двора был оружейный отсек.',oneTimeFlag:'hatchOpened',add:{aps:1,ammo918:24}};
  hatch.resultText='Механик выбирается из ямы и открывает тайный отсек под настилом. В благодарность он отдаёт АПС и 24 патрона 9×18. Этот отсек теперь пуст.';

  const postChoices=()=>[
    end('Осмотреть тела','Ты проверяешь ремни и карманы поверженного противника.',{postCombat:'body'}),
    end('Осмотреть поле боя','На земле остались гильзы, следы и отметки чужого укрытия.',{postCombat:'clue'}),
    end('Изучить противника','Ты заносишь наблюдения в полевой справочник.',{postCombat:'study'}),
    end('Проверить оружие врага','Ты проверяешь, что ещё можно снять с повреждённого снаряжения.',{postCombat:'salvage'}),
    end('Продолжить путь','Ты покидаешь место стычки, не задерживаясь.',{stamina:2})
  ];
  for(const e of W.events)for(const stage of e.stages||[]){
    if(['after','aftermath','after_battle'].includes(stage.id)&&stage.choices.every(c=>c.finish&&!c.nextStage&&!c.nextEvent))stage.choices=postChoices();
  }
  addEvent('v72_post_combat','После боя',[],[{id:'aftermath',text:'Противник повержен. Можно осмотреть место боя или продолжить путь.',choices:postChoices()}]);
  // Story continuations retain their graph; knowledge-only combat outcomes gain real XP.
  for(const e of W.events)for(const stage of e.stages||[])for(const c of stage.choices||[]){
    if(['after','aftermath','after_battle'].includes(stage.id)&&c.effects?.knowledge&&!c.effects.postCombat)c.effects.postCombat='study';
  }
  const boarText='Секач скребёт землю. Костяные пластины сдвигаются, закрывая голову перед тяжёлым броском.';
  W.enemyTypes.ironBoar.intro=boarText;
  const boar=W.events.find(e=>e.id==='v63_ironBoar');boar.text=boarText;boar.stages[0].text=boarText;

  const intros={
    rookie:['Совет у первого шлагбаума','Сидорович кладёт на стол карту и чистый лист. «Чужих привычек ещё нет — выбирай свой путь».','Выбрать, чему учиться','Ты сохраняешь два свободных очка развития на будущее.',{knowledge:'Первый совет: свободные очки развития можно вложить в любую характеристику.'}],
    soldier:['Старый позывной','Караульный узнаёт твою выправку. Он даёт последнюю сводку патруля перед выходом за периметр.','Уточнить безопасный коридор','Сержант отмечает смену дозора и советует не задерживаться у дороги.',{knowledge:'Военный старт: дозор меняется у блокпоста на рассвете.'}],
    technician:['Ремонтный вагон','Юра показывает старую защёлку. Ты раскрываешь её своим набором инструментов; внутри лежит схема подземного груза.','Прочитать схему','На схеме отмечен старый груз под железнодорожной насыпью.',{knowledge:'Схема технаря: у железнодорожной насыпи есть старый груз.'}],
    hunter:['След у деревни','Лёха показывает след за колодцем. Ты отличаешь отпечаток пса от примятой травы и запоминаешь обратный путь.','Отметить тропу','Утренний ветер скрывает запах. Двигайся по краю деревни.',{knowledge:'Охотничья заметка: следы у колодца идут к лесополосе.'}],
    scavenger:['Метки на ржавом кузове','На Свалке остались знакомые метки. Под двойной чертой нельзя шуметь: рядом чужой караул.','Расшифровать метку','Ты сохраняешь знак осторожного обхода в своём КПК.',{knowledge:'Метка мародёра: двойная черта предупреждает о чужом карауле.'}],
    medic:['У перевязочного стола','Мара просит взглянуть на повязку дозорного. Ты проверяешь кровообращение и показываешь, как ослабить тугой узел.','Помочь дозорному','Рука теплеет. Мара благодарит за спокойную работу.',{knowledge:'Медицинская заметка: после перевязки проверяй пальцы и кровообращение.'}]
  };
  for(const [id,[title,text,label,result,effects]] of Object.entries(intros))addEvent('v72_intro_'+id,title,[],[{id:'intro',text,choices:[end(label,result,effects),end('Выйти к дороге','Ты проверяешь вещи и выходишь к дороге.')]}],{kind:'intro'});
})();
