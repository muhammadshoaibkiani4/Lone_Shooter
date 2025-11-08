// Top-Down Shooter v3 — Layout, Menu, Pause, Difficulty, HUD fixes, tuned powerups/enemies
(() => {
  // Canvas + context
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // UI elements
  const menu = document.getElementById('menu');
  const startBtn = document.getElementById('startBtn');
  const menuHigh = document.getElementById('menu-highscore');
  const nameInput = document.getElementById('playerName');
  const difficultySelect = document.getElementById('difficulty');

  const pauseOverlay = document.getElementById('pause');
  const resumeBtn = document.getElementById('resumeBtn');
  const pauseHomeBtn = document.getElementById('pauseHomeBtn');

  const gameOver = document.getElementById('gameOver');
  const finalScore = document.getElementById('finalScore');
  const finalHigh = document.getElementById('finalHigh');
  const survivalMsg = document.getElementById('survivalMsg');
  const replayBtn = document.getElementById('replayBtn');
  const homeBtn = document.getElementById('homeBtn');

  const heartsEl = document.getElementById('hearts');
  const ammoEl = document.getElementById('ammo');
  const highscoreEl = document.getElementById('highscore');
  const timerEl = document.getElementById('timer');

  const STORAGE_KEY = 'topdown_shooter_highscore_v1';

  // Constants & defaults
  const CANVAS_W = canvas.width;
  const CANVAS_H = canvas.height;

  const PLAYER_SIZE = 28;
  const PLAYER_SPEED = 3.2;
  const MAX_HEALTH = 10;

  const MAG_SIZE = 50;
  const FIRE_RATE_MS = 120;
  const RELOAD_TIME_MS = 900;

  const ENEMY_MIN_SIZE = 18;
  const ENEMY_MAX_SIZE = 36;
  const ENEMY_BASE_SPEED = 1.0;
  const ENEMY_SPAWN_BASE = 0.018; // will scale by difficulty

  const POWERUP_SPAWN_CHANCE = 0.0025;
  const POWERUP_SIZE = 16;
  const SPEED_MULT = 2.0; // doubled speed boost per request
  const POWERUP_DURATION = 10000; // 10s

  // State
  let running = false;
  let paused = false;
  let score = 0;
  let highScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  menuHigh.textContent = 'High Score: ' + highScore;
  highscoreEl.textContent = 'High Score: ' + highScore;

  let keys = {};
  let bullets = [];
  let enemies = [];
  let particles = [];
  let powerups = [];
  let helper = null;
  let muzzleFlash = { active: false, until: 0 };

  let shake = { x: 0, y: 0, intensity: 0 };
  let blackExists = false;

  // Timer
  let startTime = 0;
  let elapsedWhenStopped = 0;

  // Difficulty settings (multipliers and probabilities)
  let difficulty = 'normal';
  const DIFFICULTY_SETTINGS = {
    easy:   { spawnMult: 0.7, enemySpeedMult: 0.85, blackChance: 0.06 },
    normal: { spawnMult: 1.0, enemySpeedMult: 1.0,  blackChance: 0.09 },
    hard:   { spawnMult: 1.4, enemySpeedMult: 1.25, blackChance: 0.13 }
  };

  // Player
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

  // Input handlers
  window.addEventListener('keydown', (e) => {
    // Prevent space scroll
    if (e.code === 'Space') e.preventDefault();
    keys[e.code] = true;

    // Pause toggle
    if ((e.code === 'KeyP' || e.code === 'Escape') && running) {
      togglePause();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Menu buttons
  startBtn.addEventListener('click', () => {
    playerName = (nameInput.value || 'Player').slice(0, 18);
    difficulty = difficultySelect.value || 'normal';
    startGame();
  });

  // Pause controls
  resumeBtn.addEventListener('click', () => togglePause(false));
  pauseHomeBtn.addEventListener('click', () => {
    togglePause(false);
    showHome();
  });

  // Game over buttons
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
    particles = [];
    powerups = [];
    helper = null;
    muzzleFlash = { active: false, until: 0 };
    shake = { x:0,y:0,intensity:0 };
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
    paused = false;
    menu.classList.add('hidden');
    gameOver.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    startTime = Date.now();
    loop();
  }

  function showHome() {
    running = false;
    paused = false;
    gameOver.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    menu.classList.remove('hidden');
    menuHigh.textContent = 'High Score: ' + highScore;
    highscoreEl.textContent = 'High Score: ' + highScore;
  }

  function showGameOver() {
    running = false;
    paused = false;
    finalScore.textContent = 'Score: ' + score;
    finalHigh.textContent = 'High Score: ' + highScore;
    const ms = elapsedWhenStopped || (Date.now() - startTime);
    survivalMsg.textContent = 'You survived for ' + formatDuration(ms) + '.';
    gameOver.classList.remove('hidden');
  }

  function saveHighScoreIfNeeded() {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(STORAGE_KEY, String(highScore));
      highscoreEl.textContent = 'High Score: ' + highScore;
    }
  }

  function updateHUD() {
    // Hearts top-left
    heartsEl.innerHTML = '';
    for (let i = 0; i < MAX_HEALTH; i++) {
      const d = document.createElement('div');
      d.className = 'heart' + (i < player.health ? '' : ' empty');
      heartsEl.appendChild(d);
    }

    // Ammo under hearts
    ammoEl.textContent = `Ammo: ${player.ammo} / ${MAG_SIZE}`;

    // Highscore (top-right)
    highscoreEl.textContent = 'High Score: ' + highScore;
  }

  // Shooting
  function tryShoot() {
    if (!running || paused) return;
    const now = Date.now();
    if (player.reloading) return;
    if (player.ammo <= 0) return;
    if (now - player.lastShot < FIRE_RATE_MS) return;
    if (player.paralyzedUntil > now) return;

    player.lastShot = now;
    player.ammo--;
    bullets.push({ x: player.x - player.size/2, y: player.y, dx: -10, dy: 0, r: 4 });

    // muzzle flash short
    muzzleFlash.active = true;
    muzzleFlash.until = Date.now() + 80;
    updateHUD();
  }

  function startReload() {
    if (player.reloading) return;
    if (player.ammo === MAG_SIZE) return;
    player.reloading = true;
    player.reloadStartedAt = Date.now();
    setTimeout(() => {
      // If game unpaused/resumed, ensure reload still completes
      player.ammo = MAG_SIZE;
      player.reloading = false;
      updateHUD();
    }, RELOAD_TIME_MS);
    updateHUD();
  }

  // Enemy spawn tuned by difficulty
  function spawnEnemy() {
    const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal;
    const r = Math.random();
    let type = 'green';

    // balance: black spawns occasionally, but not extremely rare
    if (r < settings.blackChance && !blackExists) type = 'black';
    else if (r < 0.30) type = 'red';
    else if (r < 0.65) type = 'yellow';
    else type = 'green';

    if (type === 'black') blackExists = true;

    const size = ENEMY_MIN_SIZE + Math.random() * (ENEMY_MAX_SIZE - ENEMY_MIN_SIZE);
    const y = 20 + Math.random() * (CANVAS_H - 40);

    let speed = ENEMY_BASE_SPEED + Math.random() * 1.2;
    speed *= settings.enemySpeedMult;

    if (type === 'green') speed *= 0.75;
    if (type === 'yellow') speed *= 1.05;
    if (type === 'red') speed *= 1.5;
    if (type === 'black') speed *= 1.0;

    enemies.push({ x: -size - 6, y, size, speed, type, spawnedAt: Date.now() });
  }

  function spawnPowerup() {
    const kind = Math.random() < 0.5 ? 'speed' : 'helper';
    const x = 60 + Math.random() * (CANVAS_W - 120);
    const y = 40 + Math.random() * (CANVAS_H - 80);
    powerups.push({ x, y, size: POWERUP_SIZE, kind, picked: false });
  }

  function spawnHelper() {
    if (helper) return;
    helper = { x: player.x + 40, y: player.y + 20, size: 20, activeUntil: Date.now() + POWERUP_DURATION, lastShot: 0, shootInterval: 450 };
  }

  // damage & paralysis
  function damagePlayer(amount) {
    player.health -= amount;
    if (player.health < 0) player.health = 0;
    updateHUD();
    addShake(6);
    makeParticles(player.x, player.y, 10, '#ffb3b3');

    if (player.health <= 0) {
      elapsedWhenStopped = Date.now() - startTime;
      saveHighScoreIfNeeded();
      makeParticles(player.x, player.y, 80, '#ff6b6b'); // big explosion
      addShake(18);
      showGameOver();
    }
  }

  function applyParalysis() {
    player.paralyzedUntil = Date.now() + 5000;
    addShake(8);
    makeParticles(player.x, player.y, 18, '#cccccc');
  }

  // main update loop
  function update() {
    if (!running || paused) return;

    const now = Date.now();
    timerEl.textContent = 'Time: ' + formatDurationShort(now - startTime);

    // movement (consider paralysis and speed powerup)
    const paralyzed = player.paralyzedUntil > Date.now();
    const speedNow = (player.speedBoostUntil > Date.now()) ? player.speed * SPEED_MULT : player.speed;

    if (!paralyzed) {
      if (keys['KeyW'] && player.y - player.size/2 > 0) player.y -= speedNow;
      if (keys['KeyS'] && player.y + player.size/2 < CANVAS_H) player.y += speedNow;
      if (keys['KeyA'] && player.x - player.size/2 > 0) player.x -= speedNow;
      if (keys['KeyD'] && player.x + player.size/2 < CANVAS_W) player.x += speedNow;
    }

    // shooting and reload
    if (keys['Space']) tryShoot();
    if (keys['KeyR']) {
      if (!player.reloading && player.ammo < MAG_SIZE) startReload();
      keys['KeyR'] = false;
    }

    // spawn enemies/powerups based on difficulty
    const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal;
    if (Math.random() < ENEMY_SPAWN_BASE * settings.spawnMult) spawnEnemy();
    if (Math.random() < POWERUP_SPAWN_CHANCE) spawnPowerup();

    // bullets movement
    for (let i = bullets.length -1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx;
      b.y += b.dy;
      if (b.x < -20 || b.x > CANVAS_W + 20) bullets.splice(i, 1);
    }

    // helper logic
    if (helper) {
      helper.x += (player.x + 40 - helper.x) * 0.12;
      helper.y += (player.y + 20 - helper.y) * 0.12;

      if (Date.now() - helper.lastShot > helper.shootInterval) {
        helper.lastShot = Date.now();
        if (enemies.length > 0) {
          let target = enemies.reduce((a,b) => (distSq(helper.x,helper.y,a.x,a.y) < distSq(helper.x,helper.y,b.x,b.y) ? a : b));
          const angle = Math.atan2(target.y - helper.y, target.x - helper.x);
          bullets.push({ x: helper.x, y: helper.y, dx: Math.cos(angle)*7, dy: Math.sin(angle)*7, r:4 });
        }
      }
      if (Date.now() > helper.activeUntil) helper = null;
    }

    // enemies movement & collisions
    for (let ei = enemies.length -1; ei >= 0; ei--) {
      const e = enemies[ei];
      e.x += e.speed;

      // if passes right edge
      if (e.x - e.size/2 > CANVAS_W) {
        if (e.type === 'black') {
          applyParalysis();
        } else {
          damagePlayer(1);
        }
        if (e.type === 'black') blackExists = false;
        enemies.splice(ei,1);
        continue;
      }

      // collision with player
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < e.size/2 + player.size/2 - 2) {
        // on collision
        if (e.type === 'black') applyParalysis();
        else damagePlayer(1);

        makeParticles(e.x, e.y, 8, '#ff9b9b');
        if (e.type === 'black') blackExists = false;
        enemies.splice(ei,1);
        continue;
      }

      // collision with bullets
      let hit = false;
      for (let bi = bullets.length -1; bi >= 0; bi--) {
        const b = bullets[bi];
        const d2 = Math.hypot(b.x - e.x, b.y - e.y);
        if (d2 < e.size/2 + b.r) {
          bullets.splice(bi,1);
          hit = true;
          break;
        }
      }
      if (hit) {
        makeParticles(e.x, e.y, 10, '#ff6b6b');
        score += 1;
        updateHUD();
        if (e.type === 'black') blackExists = false;
        enemies.splice(ei,1);
        continue;
      }
    }

    // powerups pickup
    for (let pi = powerups.length -1; pi >= 0; pi--) {
      const p = powerups[pi];
      const d2 = Math.hypot(p.x - player.x, p.y - player.y);
      if (d2 < p.size/2 + player.size/2) {
        if (p.kind === 'speed') {
          player.speedBoostUntil = Date.now() + POWERUP_DURATION;
          makeParticles(player.x, player.y, 12, '#7fbfff');
        } else {
          spawnHelper();
          makeParticles(player.x + 20, player.y, 12, '#bfff9b');
        }
        powerups.splice(pi,1);
      }
    }

    // particles update
    for (let i = particles.length -1; i >= 0; i--) {
      const pr = particles[i];
      pr.x += pr.vx;
      pr.y += pr.vy;
      pr.life -= 1;
      pr.vx *= 0.98;
      pr.vy *= 0.98;
      if (pr.life <= 0) particles.splice(i,1);
    }

    // muzzle flash timeout
    if (muzzleFlash.active && Date.now() > muzzleFlash.until) muzzleFlash.active = false;

    // shake decay
    if (shake.intensity > 0) {
      shake.intensity *= 0.82;
      shake.x = (Math.random()-0.5) * shake.intensity;
      shake.y = (Math.random()-0.5) * shake.intensity;
      if (shake.intensity < 0.6) { shake.intensity = 0; shake.x = 0; shake.y = 0; }
    }

    // reload completion fallback
    if (player.reloading && Date.now() - player.reloadStartedAt >= RELOAD_TIME_MS) {
      player.reloading = false;
      player.ammo = MAG_SIZE;
      updateHUD();
    }
  }

  // draw
  function draw() {
    ctx.save();
    ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
    ctx.translate(shake.x, shake.y);

    // background grid (unchanged)
    const g = 20;
    ctx.fillStyle = '#021012';
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x=0;x<=CANVAS_W;x+=g){ ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_H); }
    for (let y=0;y<=CANVAS_H;y+=g){ ctx.moveTo(0,y); ctx.lineTo(CANVAS_W,y); }
    ctx.stroke();

    // powerups (squares)
    powerups.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = (p.kind === 'speed') ? '#4da6ff' : '#7bff7b';
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    });

    // helper
    if (helper) {
      ctx.save();
      ctx.translate(helper.x, helper.y);
      ctx.fillStyle = '#9effff';
      ctx.beginPath();
      ctx.arc(0,0,helper.size/2,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // player triangle (unchanged)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = '#00d8ff';
    ctx.beginPath();
    ctx.moveTo(-player.size/2,0);
    ctx.lineTo(player.size/2, -player.size/2);
    ctx.lineTo(player.size/2, player.size/2);
    ctx.closePath();
    ctx.fill();

    // player name above triangle
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '14px system-ui, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playerName, 0, -player.size/2 - 8);
    ctx.restore();

    // muzzle flash
    if (muzzleFlash.active) {
      ctx.save();
      ctx.translate(player.x - player.size/2, player.y);
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(0,0);
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
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();
    });

    // enemies (color by type)
    enemies.forEach(e => {
      if (e.type === 'green') ctx.fillStyle = '#6bff8a';
      else if (e.type === 'yellow') ctx.fillStyle = '#ffd166';
      else if (e.type === 'red') ctx.fillStyle = '#ff6b6b';
      else ctx.fillStyle = '#111111'; // black
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size/2, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // particles
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // small HUD text on canvas (redundant)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '18px system-ui, Arial';
    ctx.fillText(`Score: ${score}`, 12 - shake.x, 24 - shake.y);
    ctx.fillText(`HP: ${player.health}/${MAX_HEALTH}`, 12 - shake.x, 48 - shake.y);

    ctx.restore();
  }

  // utilities
  function makeParticles(x,y,count,color) {
    for (let i=0;i<count;i++){
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const life = 12 + Math.random() * 18;
      particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, r: 1 + Math.random()*3, life, maxLife: life, color });
    }
  }

  function addShake(intensity) {
    shake.intensity = Math.max(shake.intensity || 0, intensity);
  }

  function distSq(ax,ay,bx,by){ const dx=ax-bx, dy=ay-by; return dx*dx+dy*dy; }

  function formatDuration(ms) {
    const totalSec = Math.floor(ms/1000);
    const hours = Math.floor(totalSec/3600);
    const mins = Math.floor((totalSec%3600)/60);
    const secs = totalSec%60;
    if (hours>0) return `${hours}h ${mins}m ${secs}s`;
    if (mins>0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }
  function formatDurationShort(ms) {
    const totalSec = Math.floor(ms/1000);
    const mins = Math.floor(totalSec/60);
    const secs = totalSec%60;
    if (mins>0) return `${mins}:${secs.toString().padStart(2,'0')}`;
    return `${secs}s`;
  }

  // pause handling
  function togglePause(forceState) {
    if (!running) return;
    if (typeof forceState === 'boolean') paused = !forceState ? false : true;
    else paused = !paused;

    if (paused) {
      pauseOverlay.classList.remove('hidden');
    } else {
      pauseOverlay.classList.add('hidden');
    }
  }

  // main loop
  function loop(){
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // debug utilities
  window.__game = {
    start: () => { playerName = 'Player'; startGame(); },
    stop: () => { running = false; },
    spawnEnemy,
    spawnPowerup,
    getState: () => ({score, player, enemies: enemies.length, bullets: bullets.length, helper: !!helper})
  };

  // initialize HUD and display menu on load
  updateHUD();
  // ensure menu visible on load
  menu.classList.remove('hidden');
  gameOver.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
})();
