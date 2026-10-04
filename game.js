(() => {
  const canvas = document.getElementById('world');
  const mapCanvas = document.getElementById('minimap');
  const ctx = canvas.getContext('2d');
  const mapCtx = mapCanvas.getContext('2d');
  const world = { width: 1800, height: 1200 };
  const player = { x: 900, y: 600, speed: 230, radius: 11, health: 100, radiation: 0, money: 1200 };
  const keys = new Set();
  const camera = { x: 0, y: 0 };
  const points = [
    { x: 1255, y: 340, name: 'Заброшенное здание', type: 'building', radius: 72, message: 'Внутри пусто. На стене осталась выцветшая карта старого периметра.' },
    { x: 510, y: 515, name: 'Лагерь у дороги', type: 'camp', radius: 68, message: 'У костра можно перевести дух. Здоровье восстановлено, дозиметр очищен.' },
    { x: 1450, y: 930, name: 'Полевая аномалия', type: 'anomaly', radius: 170, message: 'Воздух дрожит от жара. Дозиметр трещит — не задерживайся.' },
    { x: 865, y: 865, name: 'Тайник под плитой', type: 'stash', radius: 62, message: 'В тайнике нашлись аптечка и несколько мятых купюр.' },
  ];
  const objective = { x: 1544, y: 267.5, radius: 100, complete: false };
  const obstacles = [
    { x: 355, y: 250, w: 170, h: 110, kind: 'building' },
    { x: 1220, y: 290, w: 132, h: 106, kind: 'building' },
    { x: 1265, y: 680, w: 215, h: 120, kind: 'ruin' },
    { x: 680, y: 850, w: 115, h: 82, kind: 'ruin' },
    { x: 1500, y: 190, w: 88, h: 155, kind: 'tower' },
    { x: 270, y: 690, w: 105, h: 76, kind: 'boulder' },
    { x: 1025, y: 275, w: 120, h: 42, kind: 'fence' },
    { x: 1030, y: 315, w: 38, h: 92, kind: 'fence' },
    { x: 580, y: 970, w: 180, h: 34, kind: 'fence' },
    { x: 1620, y: 730, w: 84, h: 84, kind: 'boulder' },
  ];
  let previousTime = 0;
  let messageTime = 0;
  let stashFound = false;
  let collapsed = false;

  function worldToScreen(x, y) { return { x: x - camera.x, y: y - camera.y }; }

  function drawTerrain() {
    ctx.fillStyle = '#394833'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const tile = 48;
    const startX = Math.floor(camera.x / tile) * tile;
    const startY = Math.floor(camera.y / tile) * tile;
    for (let y = startY; y < camera.y + canvas.height + tile; y += tile) {
      for (let x = startX; x < camera.x + canvas.width + tile; x += tile) {
        const variation = (Math.floor(x / tile) * 13 + Math.floor(y / tile) * 7) % 5;
        ctx.fillStyle = variation === 0 ? '#414d38' : variation === 1 ? '#354232' : '#3d4936';
        ctx.fillRect(x - camera.x, y - camera.y, tile - 1, tile - 1);
      }
    }
    // Worn dirt tracks connect the camps and old structures.
    ctx.beginPath(); ctx.moveTo(35 - camera.x, 1000 - camera.y);
    ctx.bezierCurveTo(310 - camera.x, 820 - camera.y, 615 - camera.x, 930 - camera.y, 850 - camera.x, 710 - camera.y);
    ctx.bezierCurveTo(1050 - camera.x, 525 - camera.y, 1250 - camera.x, 620 - camera.y, 1760 - camera.x, 215 - camera.y);
    ctx.strokeStyle = '#625f48'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = '#827958'; ctx.lineWidth = 2; ctx.setLineDash([10, 13]); ctx.stroke(); ctx.setLineDash([]);
    // Secondary path to the anomaly field.
    ctx.beginPath(); ctx.moveTo(1110 - camera.x, 510 - camera.y); ctx.quadraticCurveTo(1340 - camera.x, 660 - camera.y, 1450 - camera.x, 930 - camera.y);
    ctx.strokeStyle = '#625f48'; ctx.lineWidth = 22; ctx.stroke();
    ctx.strokeStyle = '#827958'; ctx.lineWidth = 1; ctx.setLineDash([7, 12]); ctx.stroke(); ctx.setLineDash([]);
    // Fixed grass and stones make the scene stable while the camera moves.
    for (let i = 0; i < 190; i++) {
      const x = (i * 197 + 73) % world.width, y = (i * 131 + 39) % world.height;
      const sx = x - camera.x, sy = y - camera.y;
      if (sx < -10 || sy < -10 || sx > canvas.width + 10 || sy > canvas.height + 10) continue;
      ctx.fillStyle = i % 4 === 0 ? '#69734b' : i % 3 === 0 ? '#303b30' : '#515e3c';
      ctx.beginPath(); ctx.ellipse(sx, sy, 3 + i % 5, 2 + i % 3, i % 2, 0, Math.PI * 2); ctx.fill();
      if (i % 3 === 0) {
        ctx.strokeStyle = '#768052'; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(sx, sy); ctx.lineTo(sx + (i % 2 ? 3 : -3), sy - 5 - i % 4); ctx.stroke();
      }
    }
  }

  function drawObstacle(item) {
    const { x, y } = worldToScreen(item.x, item.y);
    if (x + item.w < 0 || y + item.h < 0 || x > canvas.width || y > canvas.height) return;
    if (item.kind === 'fence') {
      ctx.fillStyle = '#796b4d'; ctx.fillRect(x, y, item.w, item.h);
      ctx.strokeStyle = '#a18c5b'; ctx.lineWidth = 2;
      if (item.w > item.h) {
        for (let px = 0; px <= item.w; px += 18) { ctx.beginPath(); ctx.moveTo(x + px, y - 4); ctx.lineTo(x + px, y + item.h + 4); ctx.stroke(); }
      } else {
        for (let py = 0; py <= item.h; py += 18) { ctx.beginPath(); ctx.moveTo(x - 4, y + py); ctx.lineTo(x + item.w + 4, y + py); ctx.stroke(); }
      }
      return;
    }
    if (item.kind === 'boulder') {
      ctx.fillStyle = '#262e28'; ctx.beginPath(); ctx.ellipse(x + item.w / 2 + 4, y + item.h / 2 + 7, item.w / 2, item.h / 2, -.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#69705b'; ctx.beginPath(); ctx.ellipse(x + item.w / 2, y + item.h / 2, item.w / 2, item.h / 2, -.15, 0, Math.PI * 2); ctx.fill(); return;
    }
    if (item.kind === 'tower') {
      const cx = x + item.w / 2, top = y + 16, base = y + item.h - 7;
      ctx.fillStyle = '#222a24'; ctx.fillRect(cx - 5, top + 5, 10, base - top);
      ctx.strokeStyle = '#887653'; ctx.lineWidth = 4; ctx.beginPath();
      ctx.moveTo(cx - 34, base); ctx.lineTo(cx - 15, top); ctx.lineTo(cx + 15, top); ctx.lineTo(cx + 34, base);
      ctx.moveTo(cx - 25, base - 34); ctx.lineTo(cx + 25, base - 34); ctx.moveTo(cx - 19, base - 65); ctx.lineTo(cx + 19, base - 65);
      ctx.moveTo(cx - 15, top); ctx.lineTo(cx + 15, base); ctx.moveTo(cx + 15, top); ctx.lineTo(cx - 15, base); ctx.stroke();
      ctx.fillStyle = '#e1d6b8'; ctx.font = '10px monospace'; ctx.fillText('СТАРАЯ ВЫШКА', x - 5, base + 17);
      return;
    }
    ctx.fillStyle = '#222a24'; ctx.fillRect(x + 7, y + 9, item.w, item.h);
    ctx.fillStyle = item.kind === 'ruin' ? '#59604e' : '#53604b'; ctx.fillRect(x, y, item.w, item.h);
    ctx.fillStyle = '#70745a'; ctx.fillRect(x + 5, y + 5, item.w - 10, 7);
    ctx.strokeStyle = '#30382f'; ctx.lineWidth = 3; ctx.strokeRect(x + 1, y + 1, item.w - 2, item.h - 2);
    ctx.fillStyle = '#303a32'; ctx.fillRect(x + item.w * .57, y + item.h * .48, 19, item.h * .45);
    if (item.kind === 'ruin') {
      ctx.strokeStyle = '#30382f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + item.w * .25, y); ctx.lineTo(x + item.w * .31, y + item.h * .35); ctx.lineTo(x + item.w * .23, y + item.h * .58); ctx.stroke();
    }
  }

  function drawPoint(point, time) {
    const { x, y } = worldToScreen(point.x, point.y);
    if (x < -95 || y < -95 || x > canvas.width + 95 || y > canvas.height + 95) return;
    if (point.type === 'anomaly') {
      const pulse = 0.72 + Math.sin(time / 280) * .12;
      ctx.fillStyle = `rgba(198, 151, 87, ${0.09 * pulse})`; ctx.beginPath(); ctx.arc(x, y, point.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(210, 163, 94, ${0.25 * pulse})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 22 + Math.sin(time / 200) * 4, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#e0ad68'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    } else if (point.type === 'camp') {
      ctx.fillStyle = '#b87846'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d5a16b'; ctx.beginPath(); ctx.arc(x, y - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#817451'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 14, y + 8); ctx.lineTo(x + 14, y + 8); ctx.moveTo(x - 10, y + 4); ctx.lineTo(x + 10, y + 11); ctx.stroke();
    } else if (point.type === 'stash') {
      ctx.fillStyle = stashFound ? '#59604c' : '#c29a5e'; ctx.fillRect(x - 7, y - 5, 14, 11);
      ctx.strokeStyle = '#252c24'; ctx.lineWidth = 2; ctx.strokeRect(x - 7, y - 5, 14, 11); ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 6); ctx.stroke();
    } else {
      ctx.strokeStyle = '#887653'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 21, y + 24); ctx.lineTo(x, y - 35); ctx.lineTo(x + 21, y + 24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 12, y - 10); ctx.lineTo(x + 12, y - 10); ctx.moveTo(x - 16, y + 7); ctx.lineTo(x + 16, y + 7); ctx.stroke();
      ctx.fillStyle = '#746b50'; ctx.fillRect(x - 24, y + 22, 48, 5);
    }
    ctx.fillStyle = '#e1d6b8'; ctx.font = '10px monospace'; ctx.fillText(point.name, x + 11, y - 9);
  }

  function drawBoundary() {
    ctx.strokeStyle = '#b0a071'; ctx.lineWidth = 5;
    ctx.strokeRect(-camera.x + 2, -camera.y + 2, world.width - 4, world.height - 4);
    ctx.strokeStyle = '#343d32'; ctx.lineWidth = 2;
    for (let x = 22; x < world.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x - camera.x, -camera.y); ctx.lineTo(x - camera.x, 14 - camera.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - camera.x, world.height - 14 - camera.y); ctx.lineTo(x - camera.x, world.height - camera.y); ctx.stroke();
    }
    for (let y = 22; y < world.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(-camera.x, y - camera.y); ctx.lineTo(14 - camera.x, y - camera.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(world.width - 14 - camera.x, y - camera.y); ctx.lineTo(world.width - camera.x, y - camera.y); ctx.stroke();
    }
  }

  function drawPlayer() {
    const { x, y } = worldToScreen(player.x, player.y);
    ctx.fillStyle = 'rgba(10, 14, 10, .42)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 7, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9e59c'; ctx.beginPath(); ctx.arc(x, y, player.radius + 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#263222'; ctx.beginPath(); ctx.arc(x, y, player.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9e59c'; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x - 5, y - 7); ctx.lineTo(x + 5, y - 7); ctx.fill();
  }

  function drawWorld(time) {
    camera.x = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width / 2));
    camera.y = Math.max(0, Math.min(world.height - canvas.height, player.y - canvas.height / 2));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTerrain();
    obstacles.forEach(drawObstacle);
    points.forEach((point) => drawPoint(point, time));
    drawBoundary();
    drawPlayer();
  }

  function drawMap() {
    const sx = mapCanvas.width / world.width, sy = mapCanvas.height / world.height;
    mapCtx.fillStyle = '#263426'; mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
    mapCtx.strokeStyle = '#625f48'; mapCtx.lineWidth = 6; mapCtx.beginPath();
    mapCtx.moveTo(3, 108); mapCtx.bezierCurveTo(38, 88, 58, 101, 85, 77); mapCtx.bezierCurveTo(111, 51, 130, 65, 177, 16); mapCtx.stroke();
    mapCtx.beginPath(); mapCtx.moveTo(112, 55); mapCtx.quadraticCurveTo(139, 72, 145, 101); mapCtx.stroke();
    obstacles.forEach((item) => {
      mapCtx.fillStyle = item.kind === 'fence' ? '#8b7953' : '#59604e';
      mapCtx.fillRect(item.x * sx, item.y * sy, Math.max(3, item.w * sx), Math.max(3, item.h * sy));
    });
    points.forEach((point) => {
      mapCtx.fillStyle = point.type === 'anomaly' ? '#e0ad68' : point.type === 'camp' ? '#85a77b' : '#d58c54';
      mapCtx.beginPath(); mapCtx.arc(point.x * sx, point.y * sy, point.type === 'anomaly' ? 4 : 3, 0, Math.PI * 2); mapCtx.fill();
    });
    mapCtx.fillStyle = objective.complete ? '#d9e59c' : '#e4c577';
    mapCtx.beginPath(); mapCtx.arc(objective.x * sx, objective.y * sy, 4, 0, Math.PI * 2); mapCtx.fill();
    mapCtx.strokeStyle = 'rgba(217, 229, 156, .55)'; mapCtx.lineWidth = 1;
    mapCtx.strokeRect(camera.x * sx, camera.y * sy, canvas.width * sx, canvas.height * sy);
    mapCtx.fillStyle = '#d9e59c'; mapCtx.beginPath(); mapCtx.arc(player.x * sx, player.y * sy, 3.5, 0, Math.PI * 2); mapCtx.fill();
  }

  function getNearbyPoint() {
    let nearest = null, nearestDistance = Infinity;
    points.forEach((point) => {
      const distance = Math.hypot(point.x - player.x, point.y - player.y);
      if (distance < point.radius && distance < nearestDistance) { nearest = point; nearestDistance = distance; }
    });
    return nearest;
  }

  function getLocation() {
    const camp = points[1], building = points[0], anomaly = points[2];
    if (Math.hypot(player.x - camp.x, player.y - camp.y) < 150) return 'Лагерь у дороги';
    if (Math.hypot(player.x - anomaly.x, player.y - anomaly.y) < 205) return 'Полевая аномалия';
    if (Math.hypot(player.x - building.x, player.y - building.y) < 170) return 'Старое здание';
    if (Math.hypot(player.x - objective.x, player.y - objective.y) < objective.radius * 1.5) return 'Старая вышка';
    if (player.x < 600) return 'Западный тракт';
    if (player.x > 1250) return 'Восточный перелесок';
    return 'Серая долина';
  }

  function showMessage(text) {
    messageTime = 5;
    const element = document.getElementById('game-message');
    element.textContent = text; element.classList.add('visible');
  }

  function interact() {
    const point = getNearbyPoint();
    if (!point) return;
    if (point.type === 'stash') {
      if (stashFound) { showMessage('Тайник пуст. Здесь больше ничего нет.'); return; }
      stashFound = true; player.money += 450; player.health = Math.min(100, player.health + 25);
      showMessage(point.message + ' +450 ₽'); return;
    }
    if (point.type === 'camp') {
      player.health = Math.min(100, player.health + 30);
      player.radiation = Math.max(0, player.radiation - 35);
    }
    showMessage(point.message);
  }

  function updateObjective() {
    const distance = Math.hypot(objective.x - player.x, objective.y - player.y);
    if (!objective.complete && distance <= objective.radius) {
      objective.complete = true;
      showMessage('Цель выполнена: ты подошёл к старой вышке.');
    }
    document.getElementById('objective-title').textContent = objective.complete ? 'Вышка осмотрена' : 'Подойти к старой вышке';
    document.getElementById('objective-description').textContent = objective.complete ? 'Вы достигли восточного периметра' : 'Ориентир на востоке сектора';
    document.getElementById('objective-progress-bar').style.width = objective.complete ? '100%' : '8%';
    document.getElementById('objective-status').textContent = objective.complete ? 'ЦЕЛЬ ВЫПОЛНЕНА' : 'ЦЕЛЬ АКТИВНА';
  }

  function updateHud() {
    document.getElementById('coord-x').textContent = Math.round(player.x);
    document.getElementById('coord-y').textContent = Math.round(player.y);
    const location = getLocation();
    document.getElementById('location-name').textContent = location;
    document.getElementById('sector-name').textContent = location.toLocaleUpperCase('ru-RU');
    document.getElementById('health-value').textContent = `${Math.round(player.health)}%`;
    document.getElementById('health-bar').style.width = `${player.health}%`;
    document.getElementById('radiation-value').textContent = `${Math.round(player.radiation)}%`;
    document.getElementById('radiation-bar').style.width = `${player.radiation}%`;
    document.getElementById('radiation-bar').classList.toggle('danger', player.radiation >= 65);
    document.getElementById('cash-value').textContent = `${player.money.toLocaleString('ru-RU')} ₽`;
    updateObjective();
    const nearby = getNearbyPoint();
    const prompt = document.getElementById('interaction-prompt');
    prompt.hidden = !nearby;
    if (nearby) document.getElementById('interaction-label').textContent = nearby.type === 'stash' ? (stashFound ? 'Проверить тайник' : 'Открыть тайник') : `Осмотреть: ${nearby.name}`;
  }

  function isBlocked(x, y) {
    return obstacles.some((item) => {
      const closestX = Math.max(item.x, Math.min(x, item.x + item.w));
      const closestY = Math.max(item.y, Math.min(y, item.y + item.h));
      return Math.hypot(x - closestX, y - closestY) < player.radius;
    });
  }

  function frame(time) {
    const delta = Math.min((time - previousTime) / 1000 || 0, 0.05);
    previousTime = time;
    const anomaly = points[2];
    const distanceToAnomaly = Math.hypot(anomaly.x - player.x, anomaly.y - player.y);
    player.radiation = Math.max(0, Math.min(100, player.radiation + (distanceToAnomaly < anomaly.radius ? 13 : -4.5) * delta));
    if (player.radiation > 68 && player.health > 0) player.health = Math.max(0, player.health - (player.radiation - 68) * .035 * delta);
    if (player.health <= 0 && !collapsed) { collapsed = true; showMessage('Ты потерял сознание. Доберись до лагеря, чтобы прийти в себя.'); }
    if (player.health > 0) {
      let dx = 0, dy = 0;
      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;
      if (dx || dy) {
        const length = Math.hypot(dx, dy);
        const nextX = Math.max(player.radius, Math.min(world.width - player.radius, player.x + dx / length * player.speed * delta));
        const nextY = Math.max(player.radius, Math.min(world.height - player.radius, player.y + dy / length * player.speed * delta));
        if (!isBlocked(nextX, player.y)) player.x = nextX;
        if (!isBlocked(player.x, nextY)) player.y = nextY;
      }
    }
    if (messageTime > 0) {
      messageTime -= delta;
      if (messageTime <= 0) document.getElementById('game-message').classList.remove('visible');
    }
    drawWorld(time); drawMap(); updateHud();
    window.requestAnimationFrame(frame);
  }

  function normalizeKey(event) {
    const physicalKeys = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyE: 'e' };
    return physicalKeys[event.code] || event.key.toLowerCase();
  }

  window.addEventListener('keydown', (event) => {
    const key = normalizeKey(event);
    if (key === 'e') { event.preventDefault(); if (!event.repeat) interact(); return; }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      event.preventDefault(); keys.add(key);
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(normalizeKey(event)));
  window.addEventListener('blur', () => keys.clear());
  document.getElementById('clock').textContent = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  drawWorld(0); drawMap(); updateHud();
  window.requestAnimationFrame(frame);
})();
