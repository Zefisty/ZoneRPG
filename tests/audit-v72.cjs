const fs=require('node:fs'),path=require('node:path');
const {runtime}=require('./runtime.cjs');
const r=runtime();
const rows=r.W.quests.map(q=>`| ${q.id} | ${q.title} | ${q.type} | ${r.W.people[q.giver].name} | ${q.turnInLocations.map(id=>r.W.locations[id].name).join(', ')} | ${q.autoTurnInEligible?'Да':'Нет'} | ${q.reward} |`);
fs.writeFileSync(path.join(__dirname,'QUEST_AUDIT_V72.md'),[
 '# Аудит квестов ZoneRPG v7.2','',
 'Проверены все 55 определений: заказчик и сектор сдачи, готовность, ручная награда ровно один раз. Готовность сама по себе не выдаёт награду. Автоматическая сдача выключена по умолчанию и допускается только для простых маршрутов и посещений у заказчика.','',
 '| ID | Задание | Тип | Заказчик | Где сдать | Авто допускается | Награда, ₽ |',
 '| --- | --- | --- | --- | --- | --- | --- |',...rows,'',
 'Автоматический аудит: tests/quality-v72.cjs. Реальные многоэтапные маршруты проверены также регрессионными тестами. Браузерная проверка текущей сборки пока не проведена.',''
].join('\n'));
console.log('Generated audit for '+rows.length+' quests.');
