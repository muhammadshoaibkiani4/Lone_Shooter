// Top-Down Shooter — Extended (all requested features)
// Keep visuals exactly as before; only functionality & effects added.

(() => {
  // Canvas + context
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // UI elements
  const menu = document.getElementById('menu');
  const startBtn = document.getElementById('startBtn');
  const menuHigh = document.getElementById('menu-highscore');
  const nameInput = document.getElementById('playerName');

  const gameOver = document.getElementById('gameOver');
  const finalScore = document.getElementById('finalScore');
  const finalHigh = document.getElementById('finalHigh');
  const survivalMsg = document.getElementById('survivalMsg');
  const replayBtn = document.getElementById('replayBtn');
  const homeBtn = document.getElementById('homeBtn');

  const scoreEl = document.getElementById('score');
  const ammoEl = document.getElementById('ammo');
  const reloadEl = document.getElementById('reload');
  const heartsEl = document.getElementById('hearts');
  const timerEl = document.getElementById('timer');

  const STORAGE_KEY = 'topdown_shooter_highscore_v1';

  // Constants
  const CANVAS_W = canvas.width;
  const CANVAS_H = canvas.height;

  const PLAYER_SIZE = 28;
  const PLAYER_SPEED = 3.2;
  const MAX_HEALTH = 10;

  const MAG_SIZE = 50;           // changed to 50
  const FIRE_RATE_MS = 120;
  const RELOAD_TIME_MS = 900;

  const ENEMY_MIN_SIZE = 18;
  const ENEMY_MAX_SIZE = 36;
  const ENEMY_BASE_SPEED = 1.0;
  const ENEMY_SPAWN_CHANCE = 0.018;

  const POWERUP_SPAWN_CHANCE = 0.0025; // rare
  const POWERUP_SIZE = 16;
  const SPEED_MULT = 1.5;
  const POWERUP_DURATION = 10000; // 10s

  // game state
  let running = false;
  let score = 0;
  let highScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  menuHigh.textContent = 'High Score: ' + highScore;

  let keys = {};
  let bullets = [];
  let enemies = [];
  let particles = [];
  let powerups = [];
  let helper = null; // helper bot
  let muzzleFlash = { active: false, until: 0 };

  let shake = { x: 0, y: 0, intensity: 0 };
  let blackExists = false; // only one black enemy at a time

  // Timer
  let startTime = 0;
  let elapsedWhenStopped = 0;

  // Player state
  let playerName = 'Player';
  let player = {
    x: CANVAS_W - 80,
    y: CANVAS_H / 2,
    size: PLAYER_SIZE,
    speed: PLAYER_SPEED,
    health: MAX_HEALTH,
    lastShot: 0,
    ammo: MAG_SIZE,
    reloading: false,
    reloadStartedAt: 0,
    paralyzedUntil: 0,
    speedBoostUntil: 0
  };

  // input handlers
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') e.preventDefault();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // buttons
  startBtn.addEventListener('click', () => {
    playerName = (nameInput.value || 'Player').slice(0, 18);
    startGame();
  });
  replayBtn.addEventListener('click', () => {
    showGameOver(false);
    startGame();
  });
  homeBtn.addEventListener('click', () => {
    showHome();
  });

  // helpers
  function resetGameState() {
    score = 0;
    bullets = [];
    enemies = [];
    particles = [];
    powerups = [];
    helper = null;
    muzzleFlash = { active: false, until: 0 };
    shake = { x: 0, y: 0, intensity: 0 };
    blackExists = false;
    startTime = 0;
    elapsedWhenStopped = 0;

    player.x = CANVAS_W - 80;
    player.y = CANVAS_H / 2;
    player.health = MAX_HEALTH;
    player.lastShot = 0;
    player.ammo = MAG_SIZE;
    player.reloading = false;
    player.reloadStartedAt = 0;
    player.paralyzedUntil = 0;
    player.speedBoostUntil = 0;

    updateHUD();
  }

  function startGame() {
    resetGameState();
    running = true;
    menu.classList.add('hidden');
    gameOver.classList.add('hidden');
    startTime = Date.now();
    loop();
  }

  function showHome() {
    running = false;
    gameOver.classList.add('hidden');
    menu.classList.remove('hidden');
    menuHigh.textContent = 'High Score: ' + highScore;
  }

  function showGameOver(fromDeath = true) {
    running = false;
    finalScore.textContent = 'Score: ' + score;
    finalHigh.textContent = 'High Score: ' + highScore;
    // survival time
    const ms = elapsedWhenStopped || (Date.now() - startTime);
    survivalMsg.textContent = 'You survived for ' + formatDuration(ms) + '.';
    gameOver.classList.remove('hidden');
  }

  function saveHighScoreIfNeeded() {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(STORAGE_KEY, String(highScore));
    }
  }

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

  // shooting
  function tryShoot() {
    if (!running) return;
    const now = Date.now();
    if (player.reloading) return;
    if (player.ammo <= 0) return;
    if (now - player.lastShot < FIRE_RATE_MS) return;
    if (player.paralyzedUntil > now) return; // can't shoot when paralyzed

    player.lastShot = now;
    player.ammo--;
    // bullet goes leftwards
    bullets.push({
      x: player.x - player.size / 2,
      y: player.y,
      dx: -10,
      dy: 0,
      r: 4
    });

    // muzzle flash
    muzzleFlash.active = true;
    muzzleFlash.until = Date.now() + 80;

    // update HUD
    updateHUD();
  }

  function startReload() {
    if (player.reloading) return;
    if (player.ammo === MAG_SIZE) return;
    player.reloading = true;
    player.reloadStartedAt = Date.now();
    setTimeout(() => {
      player.ammo = MAG_SIZE;
      player.reloading = false;
      updateHUD();
    }, RELOAD_TIME_MS);
    updateHUD();
  }

  // enemy spawn
  function spawnEnemy() {
    // decide type by random
    // spawn color probabilities: green common, yellow medium, red less common, black rare & at most one
    const r = Math.random();
    let type = 'green';
    if (r < 0.02 && !blackExists) type = 'black';
    else if (r < 0.25) type = 'red';
    else if (r < 0.55) type = 'yellow';
    else type = 'green';

    // if black, set flag
    if (type === 'black') blackExists = true;

    const size = ENEMY_MIN_SIZE + Math.random() * (ENEMY_MAX_SIZE - ENEMY_MIN_SIZE);
    const y = 20 + Math.random() * (CANVAS_H - 40);
    // speed per type
    let speed = ENEMY_BASE_SPEED + Math.random() * 1.2;
    if (type === 'green') speed *= 0.7;
    if (type === 'yellow') speed *= 1.1;
    if (type === 'red') speed *= 1.6;
    if (type === 'black') speed *= 1.05;

    enemies.push({
      x: -size - 6,
      y,
      size,
      baseSpeed: speed,
      speed,
      hp: type === 'red' ? 1 : 1,
      type,
      spawnedAt: Date.now()
    });
  }

  // powerups spawn
  function spawnPowerup() {
    const kind = Math.random() < 0.5 ? 'speed' : 'helper';
    const x = 60 + Math.random() * (CANVAS_W - 120);
    const y = 40 + Math.random() * (CANVAS_H - 80);
    powerups.push({ x, y, size: POWERUP_SIZE, kind, picked: false });
  }

  // helper bot creation
  function spawnHelper() {
    // only one helper at a time
    if (helper) return;
    helper = {
      x: player.x + 40,
      y: player.y + 20,
      size: 20,
      activeUntil: Date.now() + POWERUP_DURATION,
      lastShot: 0,
      shootInterval: 450
    };
  }

  // damage player
  function damagePlayer(amount) {
    if (player.paralyzedUntil > Date.now()) {
      // still take damage, but cannot move
    }
    player.health -= amount;
    if (player.health < 0) player.health = 0;
    updateHUD();
    // small screen shake
    addShake(6);
    // particles on hit
    makeParticles(player.x, player.y, 10, '#ffb3b3');

    if (player.health <= 0) {
      // stop timer
      elapsedWhenStopped = Date.now() - startTime;
      saveHighScoreIfNeeded();
      // death explosion
      makeParticles(player.x, player.y, 60, '#ff6b6b');
      addShake(16);
      showGameOver();
    }
  }

  // collisions etc
  function update() {
    if (!running) return;

    // Timer update
    const now = Date.now();
    const elapsed = now - startTime;
    timerEl.textContent = 'Time: ' + formatDurationShort(elapsed);

    // movement
    const nowParalyzed = player.paralyzedUntil > Date.now();

    // speed boost
    const speedNow = (player.speedBoostUntil > Date.now()) ? player.speed * SPEED_MULT : player.speed;

    if (!nowParalyzed) {
      if (keys['KeyW'] && player.y - player.size / 2 > 0) player.y -= speedNow;
      if (keys['KeyS'] && player.y + player.size / 2 < CANVAS_H) player.y += speedNow;
      if (keys['KeyA'] && player.x - player.size / 2 > 0) player.x -= speedNow;
      if (keys['KeyD'] && player.x + player.size / 2 < CANVAS_W) player.x += speedNow;
    }

    // shooting
    if (keys['Space']) tryShoot();

    // reload
    if (keys['KeyR']) {
      if (!player.reloading && player.ammo < MAG_SIZE) startReload();
      keys['KeyR'] = false;
    }

    // spawn enemies
    if (Math.random() < ENEMY_SPAWN_CHANCE) spawnEnemy();

    // spawn powerups occasionally
    if (Math.random() < POWERUP_SPAWN_CHANCE) spawnPowerup();

    // move bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx;
      b.y += b.dy;
      if (b.x < -20 || b.x > CANVAS_W + 20 || b.y < -20 || b.y > CANVAS_H + 20) bullets.splice(i, 1);
    }

    // helper bot logic (follows player & shoots nearest enemy)
    if (helper) {
      // follow smoothly
      helper.x += (player.x + 40 - helper.x) * 0.12;
      helper.y += (player.y + 20 - helper.y) * 0.12;

      // shoot nearest every interval
      if (Date.now() - helper.lastShot > helper.shootInterval) {
        helper.lastShot = Date.now();
        // find nearest enemy
        if (enemies.length > 0) {
          let target = enemies.reduce((a, b) => {
            const da = distSq(helper.x, helper.y, a.x, a.y);
            const db = distSq(helper.x, helper.y, b.x, b.y);
            return da < db ? a : b;
          }, enemies[0]);
          // spawn bullet toward target
          const angle = Math.atan2(target.y - helper.y, target.x - helper.x);
          bullets.push({
            x: helper.x,
            y: helper.y,
            dx: Math.cos(angle) * 7,
            dy: Math.sin(angle) * 7,
            r: 4
          });
        }
      }

      // expire helper
      if (Date.now() > helper.activeUntil) helper = null;
    }

    // move enemies & collisions
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      // if player speed boost or helper etc, they still move according to e.speed
      e.x += e.speed;

      // if black passes beyond right edge -> triggers paralysis and remove
      if (e.x - e.size / 2 > CANVAS_W) {
        // if black, remove flag
        if (e.type === 'black') {
          blackExists = false;
        }
        // damage player
        if (e.type === 'black') {
          applyParalysis();
        } else {
          damagePlayer(1);
        }
        enemies.splice(ei, 1);
        continue;
      }

      // collision with player (circle vs circle approximate)
      const d = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
      if (d < e.size / 2 + player.size / 2 - 2) {
        // on collision
        if (e.type === 'black') {
          applyParalysis();
        } else {
          damagePlayer(1);
        }
        // remove enemy and create particles
        makeParticles(e.x, e.y, 8, '#ff9b9b');
        if (e.type === 'black') blackExists = false;
        enemies.splice(ei, 1);
        continue;
      }

      // collision with bullets
      let hit = false;
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];
        const d2 = Math.sqrt((b.x - e.x) ** 2 + (b.y - e.y) ** 2);
        if (d2 < e.size / 2 + b.r) {
          // hit
          bullets.splice(bi, 1);
          hit = true;
          break;
        }
      }
      if (hit) {
        // explosion/particles
        makeParticles(e.x, e.y, 10, '#ff6b6b');
        // reward
        score += 1;
        updateHUD();
        if (e.type === 'black') blackExists = false;
        enemies.splice(ei, 1);
        continue;
      }
    }

    // pick up powerups
    for (let pi = powerups.length - 1; pi >= 0; pi--) {
      const p = powerups[pi];
      const d2 = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);
      if (d2 < p.size / 2 + player.size / 2) {
        // pick it
        if (p.kind === 'speed') {
          player.speedBoostUntil = Date.now() + POWERUP_DURATION;
          // small particle
          makeParticles(player.x, player.y, 12, '#7fbfff');
        } else if (p.kind === 'helper') {
          spawnHelper();
          // small particle
          makeParticles(player.x + 20, player.y, 12, '#bfff9b');
        }
        powerups.splice(pi, 1);
      }
    }

    // move particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pr = particles[i];
      pr.x += pr.vx;
      pr.y += pr.vy;
      pr.life -= 1;
      pr.vx *= 0.98;
      pr.vy *= 0.98;
      if (pr.life <= 0) particles.splice(i, 1);
    }

    // muzzle flash timeout
    if (muzzleFlash.active && Date.now() > muzzleFlash.until) muzzleFlash.active = false;

    // shake decay
    if (shake.intensity > 0) {
      shake.intensity *= 0.85;
      shake.x = (Math.random() - 0.5) * shake.intensity;
      shake.y = (Math.random() - 0.5) * shake.intensity;
      if (shake.intensity < 0.5) {
        shake.intensity = 0;
        shake.x = 0;
        shake.y = 0;
      }
    }

    // update reload completion (in case setTimeout didn't fire due to tab)
    if (player.reloading && Date.now() - player.reloadStartedAt >= RELOAD_TIME_MS) {
      player.reloading = false;
      player.ammo = MAG_SIZE;
      updateHUD();
    }
  }

  function applyParalysis() {
    player.paralyzedUntil = Date.now() + 5000; // 5 seconds
    // effect
    addShake(8);
    makeParticles(player.x, player.y, 18, '#cccccc');
  }

  // drawing
  function draw() {
    // apply camera shake via translate
    ctx.save();
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.translate(shake.x, shake.y);

    // background grid (preserve original style)
    const g = 20;
    ctx.fillStyle = '#021012';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= CANVAS_W; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); }
    for (let y = 0; y <= CANVAS_H; y += g) { ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); }
    ctx.stroke();

    // draw powerups (square design: blue speed, green helper)
    powerups.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.kind === 'speed') {
        ctx.fillStyle = '#4da6ff'; // blue square
      } else {
        ctx.fillStyle = '#7bff7b'; // green square
      }
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    // draw helper if exists
    if (helper) {
      ctx.save();
      ctx.translate(helper.x, helper.y);
      ctx.fillStyle = '#9effff';
      ctx.beginPath();
      ctx.arc(0, 0, helper.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // draw player (triangle pointing left) - unchanged colors
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = '#00d8ff';
    ctx.beginPath();
    ctx.moveTo(-player.size / 2, 0);
    ctx.lineTo(player.size / 2, -player.size / 2);
    ctx.lineTo(player.size / 2, player.size / 2);
    ctx.closePath();
    ctx.fill();

    // draw player name above triangle
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '14px system-ui, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playerName, 0, -player.size / 2 - 8);
    ctx.restore();

    // muzzle flash (small cone on left of the triangle)
    if (muzzleFlash.active) {
      ctx.save();
      ctx.translate(player.x - player.size / 2, player.y);
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-18, -8);
      ctx.lineTo(-18, 8);
      ctx.closePath();
      ctx.fillStyle = '#ffd34d';
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // bullets
    ctx.fillStyle = '#ffd34d';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // enemies with colors based on type
    enemies.forEach(e => {
      if (e.type === 'green') ctx.fillStyle = '#6bff8a';
      else if (e.type === 'yellow') ctx.fillStyle = '#ffd166';
      else if (e.type === 'red') ctx.fillStyle = '#ff6b6b';
      else if (e.type === 'black') ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2);
      ctx.fill();

      // small stroke ring to match style
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // particles
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // HUD overlay text on canvas (redundant to HUD div)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '18px system-ui, Arial';
    ctx.fillText(`Score: ${score}`, 12 - shake.x, 24 - shake.y);
    ctx.fillText(`HP: ${player.health}/${MAX_HEALTH}`, 12 - shake.x, 48 - shake.y);

    ctx.restore(); // restore after shake translate
  }

  // utility: create particles
  function makeParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1 + Math.random() * 3,
        life: 12 + Math.random() * 18,
        maxLife: 12 + Math.random() * 18,
        color
      });
    }
  }

  function addShake(intensity) {
    shake.intensity = Math.max(shake.intensity, intensity);
  }

  function distSq(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  }

  function formatDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  function formatDurationShort(ms) {
    // used on HUD: show mm:ss or ss
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins > 0) return `${mins}:${secs.toString().padStart(2, '0')}`;
    return `${secs}s`;
  }

  // main loop
  function loop() {
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // expose debug utilities
  window.__game = {
    start: startGame,
    stop: () => { running = false; },
    spawnEnemy,
    spawnPowerup,
    getState: () => ({ score, player, enemies: enemies.length, bullets: bullets.length, helper: !!helper })
  };

  // initial HUD render
  updateHUD();

})();
