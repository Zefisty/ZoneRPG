(() => {
  const canvas = document.getElementById('world');
  const mapCanvas = document.getElementById('minimap');
  const ctx = canvas.getContext('2d');
  const mapCtx = mapCanvas.getContext('2d');
  const world = { width: 1800, height: 1200 };
  const player = { x: 900, y: 600, speed: 230, radius: 11 };
  const keys = new Set();
  const camera = { x: 0, y: 0 };
  const points = [
    { x: 1240, y: 365, name: 'Старая вышка', type: 'tower' },
    { x: 420, y: 820, name: 'Брошенный двор', type: 'ruin' },
    { x: 1430, y: 940, name: 'Аномалия', type: 'anomaly' },
  ];
  const obstacles = [
    { x: 360, y: 255, w: 160, h: 95 }, { x: 1270, y: 680, w: 210, h: 115 },
    { x: 690, y: 870, w: 110, h: 75 }, { x: 1510, y: 220, w: 95, h: 145 },
  ];
  let previousTime = 0;

  function drawWorld() {
    camera.x = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width / 2));
    camera.y = Math.max(0, Math.min(world.height - canvas.height, player.y - canvas.height / 2));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#3b4935'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Muted checker texture keeps the world readable without external art assets.
    const tile = 48;
    const startX = Math.floor(camera.x / tile) * tile;
    const startY = Math.floor(camera.y / tile) * tile;
    for (let y = startY; y < camera.y + canvas.height + tile; y += tile) {
      for (let x = startX; x < camera.x + canvas.width + tile; x += tile) {
        const variation = ((Math.floor(x / tile) * 13 + Math.floor(y / tile) * 7) % 5);
        ctx.fillStyle = variation === 0 ? '#414d38' : variation === 1 ? '#394634' : '#3d4936';
        ctx.fillRect(x - camera.x, y - camera.y, tile - 1, tile - 1);
      }
    }
    // Worn paths across the sector.
    ctx.strokeStyle = '#65644d'; ctx.lineWidth = 29; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(80 - camera.x, 1010 - camera.y); ctx.bezierCurveTo(390 - camera.x, 850 - camera.y, 770 - camera.x, 945 - camera.y, 990 - camera.x, 670 - camera.y);
    ctx.bezierCurveTo(1150 - camera.x, 470 - camera.y, 1330 - camera.x, 550 - camera.y, 1730 - camera.x, 255 - camera.y); ctx.stroke();
    ctx.strokeStyle = '#827b5b'; ctx.lineWidth = 2; ctx.setLineDash([8, 11]); ctx.stroke(); ctx.setLineDash([]);
    // Patches of scrub and scattered stones.
    for (let i = 0; i < 80; i++) {
      const x = (i * 197 + 73) % world.width, y = (i * 131 + 39) % world.height;
      if (Math.hypot(x - player.x, y - player.y) < 80) continue;
      const sx = x - camera.x, sy = y - camera.y;
      if (sx < -10 || sy < -10 || sx > canvas.width + 10 || sy > canvas.height + 10) continue;
      ctx.fillStyle = i % 3 === 0 ? '#69704a' : '#303b30';
      ctx.beginPath(); ctx.ellipse(sx, sy, 4 + i % 5, 2 + i % 3, i % 2, 0, Math.PI * 2); ctx.fill();
    }
    obstacles.forEach((item) => {
      const x = item.x - camera.x, y = item.y - camera.y;
      if (x + item.w < 0 || y + item.h < 0 || x > canvas.width || y > canvas.height) return;
      ctx.fillStyle = '#252d27'; ctx.fillRect(x + 5, y + 7, item.w, item.h);
      ctx.fillStyle = '#53604b'; ctx.fillRect(x, y, item.w, item.h);
      ctx.fillStyle = '#68715a'; ctx.fillRect(x + 5, y + 5, item.w - 10, 6);
      ctx.strokeStyle = '#30392f'; ctx.lineWidth = 3; ctx.strokeRect(x + 1, y + 1, item.w - 2, item.h - 2);
      ctx.fillStyle = '#333c32'; ctx.fillRect(x + item.w * .56, y + item.h * .48, 20, item.h * .45);
    });
    points.forEach((point) => {
      const x = point.x - camera.x, y = point.y - camera.y;
      if (x < -30 || y < -30 || x > canvas.width + 30 || y > canvas.height + 30) return;
      ctx.fillStyle = point.type === 'anomaly' ? '#c89b62' : '#d5a16b';
      ctx.beginPath(); ctx.arc(x, y, point.type === 'anomaly' ? 5 : 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e1d6b8'; ctx.font = '10px monospace'; ctx.fillText(point.name, x + 9, y + 3);
      if (point.type === 'tower') {
        ctx.strokeStyle = '#887653'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18, y - 45); ctx.lineTo(x + 32, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 13, y - 31); ctx.lineTo(x + 28, y - 31); ctx.stroke();
      }
    });
    // Player marker and heading.
    const px = player.x - camera.x, py = player.y - camera.y;
    ctx.fillStyle = '#d9e59c'; ctx.beginPath(); ctx.arc(px, py, player.radius + 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#263222'; ctx.beginPath(); ctx.arc(px, py, player.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9e59c'; ctx.beginPath(); ctx.moveTo(px, py - 16); ctx.lineTo(px - 5, py - 7); ctx.lineTo(px + 5, py - 7); ctx.fill();
  }

  function drawMap() {
    mapCtx.fillStyle = '#263426'; mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
    mapCtx.strokeStyle = '#59654d'; mapCtx.lineWidth = 8; mapCtx.beginPath();
    mapCtx.moveTo(8, 112); mapCtx.quadraticCurveTo(52, 83, 83, 79); mapCtx.quadraticCurveTo(123, 71, 173, 17); mapCtx.stroke();
    obstacles.forEach((item) => {
      mapCtx.fillStyle = '#53604b';
      mapCtx.fillRect(item.x / world.width * mapCanvas.width, item.y / world.height * mapCanvas.height, Math.max(4, item.w / world.width * mapCanvas.width), Math.max(4, item.h / world.height * mapCanvas.height));
    });
    points.forEach((point) => {
      mapCtx.fillStyle = '#d58c54'; mapCtx.fillRect(point.x / world.width * mapCanvas.width - 2, point.y / world.height * mapCanvas.height - 2, 5, 5);
    });
    mapCtx.fillStyle = '#d9e59c'; mapCtx.beginPath(); mapCtx.arc(player.x / world.width * mapCanvas.width, player.y / world.height * mapCanvas.height, 4, 0, Math.PI * 2); mapCtx.fill();
  }

  function render() {
    drawWorld(); drawMap();
    document.getElementById('coord-x').textContent = Math.round(player.x);
    document.getElementById('coord-y').textContent = Math.round(player.y);
  }

  function frame(time) {
    const delta = Math.min((time - previousTime) / 1000 || 0, 0.05);
    previousTime = time;
    let dx = 0, dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      const nextX = Math.max(player.radius, Math.min(world.width - player.radius, player.x + dx / length * player.speed * delta));
      const nextY = Math.max(player.radius, Math.min(world.height - player.radius, player.y + dy / length * player.speed * delta));
      const collides = (x, y) => obstacles.some((item) => x + player.radius > item.x && x - player.radius < item.x + item.w && y + player.radius > item.y && y - player.radius < item.y + item.h);
      if (!collides(nextX, player.y)) player.x = nextX;
      if (!collides(player.x, nextY)) player.y = nextY;
    }
    render();
    window.requestAnimationFrame(frame);
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      event.preventDefault(); keys.add(key);
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
  document.getElementById('clock').textContent = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  render();
  window.requestAnimationFrame(frame);
})();
