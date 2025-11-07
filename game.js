// Top-Down Shooter prototype: implements requested mechanics.
// Author: generated prototype
(() => {
  // Canvas + context
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // UI elements
  const menu = document.getElementById('menu');
  const startBtn = document.getElementById('startBtn');
  const menuHigh = document.getElementById('menu-highscore');
  const gameOver = document.getElementById('gameOver');
  const finalScore = document.getElementById('finalScore');
  const finalHigh = document.getElementById('finalHigh');
  const replayBtn = document.getElementById('replayBtn');
  const homeBtn = document.getElementById('homeBtn');

  const scoreEl = document.getElementById('score');
  const ammoEl = document.getElementById('ammo');
  const reloadEl = document.getElementById('reload');
  const heartsEl = document.getElementById('hearts');

  const STORAGE_KEY = 'topdown_shooter_highscore_v1';

  // Game constants
  const CANVAS_W = canvas.width;
  const CANVAS_H = canvas.height;

  // Player
  const PLAYER_SIZE = 28;
  const PLAYER_SPEED = 3.2;
  const MAX_HEALTH = 10;

  // Weapon
  const MAG_SIZE = 20;             // bullets per mag
  const FIRE_RATE_MS = 140;       // ms between shots
  const RELOAD_TIME_MS = 900;     // reload duration

  // Enemy
  const ENEMY_MIN_SIZE = 18;
  const ENEMY_MAX_SIZE = 36;
  const ENEMY_BASE_SPEED = 1.2;
  const ENEMY_SPAWN_CHANCE = 0.018; // per frame chance; adjust to control difficulty

  // Game state
  let running = false;
  let score = 0;
  let highScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  menuHigh.textContent = 'High Score: ' + highScore;

  let keys = {};
  let bullets = [];
  let enemies = [];

  // Player state object
  let player = {
    x: CANVAS_W - 80,
    y: CANVAS_H / 2,
    size: PLAYER_SIZE,
    speed: PLAYER_SPEED,
    health: MAX_HEALTH,
    lastShot: 0,
    ammo: MAG_SIZE,
    reloading: false,
    reloadStartedAt: 0
  };

  // Input handlers
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') e.preventDefault(); // prevent page scroll
    keys[e.code] = true;
    // If in menu/gameOver don't let inputs accidentally act until started
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Buttons
  startBtn.addEventListener('click', startGame);
  replayBtn.addEventListener('click', () => {
    showGameOver(false);
    startGame();
  });
  homeBtn.addEventListener('click', () => {
    showHome();
  });

  // Helpers
  function resetGameState() {
    score = 0;
    bullets = [];
    enemies = [];
    player.x = CANVAS_W - 80;
    player.y = CANVAS_H / 2;
    player.health = MAX_HEALTH;
    player.lastShot = 0;
    player.ammo = MAG_SIZE;
    player.reloading = false;
    player.reloadStartedAt = 0;
    updateHUD();
  }

  function startGame() {
    resetGameState();
    running = true;
    menu.classList.add('hidden');
    gameOver.classList.add('hidden');
    loop();
  }

  function showHome() {
    running = false;
    gameOver.classList.add('hidden');
    menu.classList.remove('hidden');
    menuHigh.textContent = 'High Score: ' + highScore;
  }

  function showGameOver(fromDeath=true) {
    running = false;
    finalScore.textContent = 'Score: ' + score;
    finalHigh.textContent = 'High Score: ' + highScore;
    gameOver.classList.remove('hidden');
  }

  function saveHighScoreIfNeeded() {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(STORAGE_KEY, String(highScore));
    }
  }

  // HUD update
  function updateHUD() {
    scoreEl.textContent = 'Score: ' + score;
    ammoEl.textContent = `Ammo: ${player.ammo} / ${MAG_SIZE}`;
    if (player.reloading) reloadEl.classList.remove('hidden');
    else reloadEl.classList.add('hidden');

    // hearts
    heartsEl.innerHTML = '';
    for (let i = 0; i < MAX_HEALTH; i++) {
      const d = document.createElement('div');
      d.className = 'heart' + (i < player.health ? '' : ' empty');
      heartsEl.appendChild(d);
    }
  }

  // Shooting
  function tryShoot() {
    const now = Date.now();
    if (player.reloading) return;
    if (player.ammo <= 0) return;
    if (now - player.lastShot < FIRE_RATE_MS) return;

    player.lastShot = now;
    player.ammo--;
    // Add bullet traveling leftwards (player faces left, enemies from left)
    bullets.push({
      x: player.x - player.size / 2,
      y: player.y,
      dx: -8,
      dy: 0,
      r: 4
    });
    updateHUD();
  }

  function startReload() {
    if (player.reloading) return;
    if (player.ammo === MAG_SIZE) return;
    player.reloading = true;
    player.reloadStartedAt = Date.now();
    updateHUD();
    setTimeout(() => {
      player.ammo = MAG_SIZE;
      player.reloading = false;
      updateHUD();
    }, RELOAD_TIME_MS);
  }

  // Enemy spawn
  function spawnEnemy() {
    const size = ENEMY_MIN_SIZE + Math.random() * (ENEMY_MAX_SIZE - ENEMY_MIN_SIZE);
    const y = 20 + Math.random() * (CANVAS_H - 40);
    const speed = ENEMY_BASE_SPEED + Math.random() * 1.6;
    enemies.push({
      x: -size - 6,
      y,
      size,
      speed,
      hp: 1
    });
  }

  // Update loop
  function update() {
    if (!running) return;

    // Player movement (WASD)
    if (keys['KeyW'] && player.y - player.size / 2 > 0) player.y -= player.speed;
    if (keys['KeyS'] && player.y + player.size / 2 < CANVAS_H) player.y += player.speed;
    if (keys['KeyA'] && player.x - player.size / 2 > 0) player.x -= player.speed;
    if (keys['KeyD'] && player.x + player.size / 2 < CANVAS_W) player.x += player.speed;

    // Shooting space
    if (keys['Space']) {
      tryShoot();
    }
    // Reload key
    if (keys['KeyR']) {
      // Only trigger reload once per press: clear the key to avoid repeats
      if (!player.reloading && player.ammo < MAG_SIZE) {
        startReload();
      }
      keys['KeyR'] = false;
    }

    // spawn enemies randomly
    if (Math.random() < ENEMY_SPAWN_CHANCE) spawnEnemy();

    // move bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx;
      b.y += b.dy;
      if (b.x < -10 || b.x > CANVAS_W + 10 || b.y < -10 || b.y > CANVAS_H + 10) bullets.splice(i, 1);
    }

    // move enemies and check collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.x += e.speed;

      // enemy reaches right edge (got through)
      if (e.x - e.size/2 > CANVAS_W) {
        // damage player
        damagePlayer(1);
        enemies.splice(i, 1);
        continue;
      }

      // collision with player (circle vs rectangle approximated)
      const px = player.x;
      const py = player.y;
      const dx = e.x - px;
      const dy = e.y - py;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < e.size/2 + player.size/2 - 2) {
        // enemy hits player
        damagePlayer(1);
        enemies.splice(i, 1);
        continue;
      }

      // collision with bullets
      let hit = false;
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const dx2 = b.x - e.x;
        const dy2 = b.y - e.y;
        const dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
        if (dist2 < e.size/2 + b.r) {
          // hit
          bullets.splice(j,1);
          hit = true;
          break;
        }
      }
      if (hit) {
        // remove enemy, increase score
        enemies.splice(i,1);
        score += 1;
        updateHUD();
      }
    }

    // Update reload indicator timing (in case reload time passed)
    if (player.reloading && Date.now() - player.reloadStartedAt >= RELOAD_TIME_MS) {
      player.reloading = false;
      player.ammo = MAG_SIZE;
      updateHUD();
    }
  }

  function damagePlayer(amount) {
    player.health -= amount;
    if (player.health < 0) player.health = 0;
    updateHUD();
    if (player.health <= 0) {
      // game over
      saveHighScoreIfNeeded();
      showGameOver();
    }
  }

  // Drawing
  function draw() {
    // clear
    ctx.clearRect(0,0,CANVAS_W,CANVAS_H);

    // background grid subtle
    const g = 20;
    ctx.fillStyle = '#021012';
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x=0;x<=CANVAS_W;x+=g){ ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_H); }
    for (let y=0;y<=CANVAS_H;y+=g){ ctx.moveTo(0,y); ctx.lineTo(CANVAS_W,y); }
    ctx.stroke();

    // draw player (triangle pointing left)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = '#00d8ff';
    ctx.beginPath();
    ctx.moveTo(-player.size/2, 0);
    ctx.lineTo(player.size/2, -player.size/2);
    ctx.lineTo(player.size/2, player.size/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // bullets
    ctx.fillStyle = '#ffd34d';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();
    });

    // enemies (red circles)
    ctx.fillStyle = '#ff4d4d';
    enemies.forEach(e => {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size/2, 0, Math.PI*2);
      ctx.fill();
      // small inner ring
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // top-left scoreboard text on canvas (redundant to HUD)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '18px system-ui, Arial';
    ctx.fillText(`Score: ${score}`, 12, 24);
    ctx.fillText(`HP: ${player.health}/${MAX_HEALTH}`, 12, 48);
  }

  // main loop
  function loop() {
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // initial HUD render
  updateHUD();

  // Expose quick debug controls (optional)
  window.__game = {
    start: startGame,
    stop: () => { running = false; },
    spawnEnemy,
    getState: () => ({score, player, enemies: enemies.length, bullets: bullets.length})
  };

})();
