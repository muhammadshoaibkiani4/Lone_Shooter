/* script.js - Top-Down Shooter v4 (achievements + bullet trails + HUD overlays)
   Plain JavaScript, single-file. Works with the index.html and style.css provided.
*/

(() => {
  /* ---------- Config / constants ---------- */
  const CANVAS_ID = 'gameCanvas';
  const MENU_ID = 'menu';
  const START_BTN_ID = 'startButton';
  const ACH_BTN_ID = 'achievementsButton';
  const MENU_HS_ID = 'menuHighScore';
  const NAME_INPUT_ID = 'playerName';
  const DIFF_ID = 'difficulty';
  const ACH_MENU_ID = 'achievementsMenu';
  const ACH_LIST_ID = 'achievementsList';
  const BACK_BTN_ID = 'backToMenu';

  const GAMEOVER_ID = 'gameOver';
  const SURVIVAL_ID = 'survivalTime';
  const FINAL_SCORE_ID = 'finalScore';
  const HIGH_DISPLAY_ID = 'highScoreDisplay';
  const REPLAY_ID = 'replayButton';
  const HOME_ID = 'homeButton';

  const PAUSE_ID = 'pauseScreen';
  const RESUME_ID = 'resumeButton';
  const PAUSE_HOME_ID = 'pauseHomeButton';

  const ACH_POPUP_ID = 'achievementPopup';

  // Local storage keys
  const LS_HIGH = 'ns_highscore_v1';
  const LS_ACH = 'ns_achievements_v1';
  const LS_STATS = 'ns_stats_v1';

  // Gameplay constants (kept close to previous)
  const CANVAS_W = 800;
  const CANVAS_H = 600;
  const PLAYER_SIZE = 28;
  const PLAYER_SPEED = 3.2;
  const MAX_HEALTH = 10;
  const MAG_SIZE = 50;
  const FIRE_RATE_MS = 120;
  const RELOAD_TIME_MS = 900;

  const ENEMY_MIN = 18;
  const ENEMY_MAX = 36;
  const ENEMY_BASE_SPEED = 1.0;
  const ENEMY_SPAWN_BASE = 0.018;

  const POWERUP_CHANCE = 0.0025;
  const POWERUP_SIZE = 16;
  const SPEED_MULT = 2.0; // doubled speed
  const POWERUP_DURATION = 10000; // 10s

  /* ---------- Helpers for DOM ---------- */
  const $ = id => document.getElementById(id);
  function mk(tag, props = {}) {
    const el = document.createElement(tag);
    Object.assign(el, props);
    return el;
  }

  /* ---------- Select nodes (from index.html) ---------- */
  const canvas = $(CANVAS_ID);
  const ctx = canvas.getContext('2d');

  const menu = $(MENU_ID);
  const startBtn = $(START_BTN_ID);
  const achBtn = $(ACH_BTN_ID);
  const menuHighScore = $(MENU_HS_ID);
  const nameInput = $(NAME_INPUT_ID);
  const diffSelect = $(DIFF_ID);

  const achMenu = $(ACH_MENU_ID);
  const achList = $(ACH_LIST_ID);
  const backBtn = $(BACK_BTN_ID);

  const gameOver = $(GAMEOVER_ID);
  const survivalEl = $(SURVIVAL_ID);
  const finalScoreEl = $(FINAL_SCORE_ID);
  const highDisplay = $(HIGH_DISPLAY_ID);
  const replayBtn = $(REPLAY_ID);
  const homeBtn = $(HOME_ID);

  const pauseScreen = $(PAUSE_ID);
  const resumeBtn = $(RESUME_ID);
  const pauseHomeBtn = $(PAUSE_HOME_ID);

  const achPopup = $(ACH_POPUP_ID);

  // If some element is missing, create a safe fallback
  function ensureEl(el, id) {
    if (!el) {
      const newEl = mk('div', { id });
      document.body.appendChild(newEl);
      return newEl;
    }
    return el;
  }

  ensureEl(canvas, CANVAS_ID);
  ensureEl(menu, MENU_ID);
  ensureEl(startBtn, START_BTN_ID);
  ensureEl(achBtn, ACH_BTN_ID);
  ensureEl(menuHighScore, MENU_HS_ID);
  ensureEl(nameInput, NAME_INPUT_ID);
  ensureEl(diffSelect, DIFF_ID);
  ensureEl(achMenu, ACH_MENU_ID);
  ensureEl(achList, ACH_LIST_ID);
  ensureEl(backBtn, BACK_BTN_ID);

  ensureEl(gameOver, GAMEOVER_ID);
  ensureEl(survivalEl, SURVIVAL_ID);
  ensureEl(finalScoreEl, FINAL_SCORE_ID);
  ensureEl(highDisplay, HIGH_DISPLAY_ID);
  ensureEl(replayBtn, REPLAY_ID);
  ensureEl(homeBtn, HOME_ID);

  ensureEl(pauseScreen, PAUSE_ID);
  ensureEl(resumeBtn, RESUME_ID);
  ensureEl(pauseHomeBtn, PAUSE_HOME_ID);

  ensureEl(achPopup, ACH_POPUP_ID);

  /* ---------- Create HUD overlays (top-left, top-right) ---------- */
  // Top-left group: hearts + ammo
  const hudLeft = mk('div');
  hudLeft.style.position = 'absolute';
  hudLeft.style.left = '20px';
  hudLeft.style.top = '20px';
  hudLeft.style.zIndex = 60;
  hudLeft.style.pointerEvents = 'none';
  document.body.appendChild(hudLeft);

  const heartsContainer = mk('div');
  heartsContainer.style.display = 'flex';
  heartsContainer.style.gap = '6px';
  heartsContainer.style.marginBottom = '8px';
  hudLeft.appendChild(heartsContainer);

  const ammoContainer = mk('div');
  ammoContainer.style.background = 'rgba(0,0,0,0.6)';
  ammoContainer.style.padding = '8px 10px';
  ammoContainer.style.borderRadius = '8px';
  ammoContainer.style.fontWeight = '700';
  ammoContainer.style.boxShadow = '0 0 12px rgba(0,255,255,0.06)';
  ammoContainer.style.pointerEvents = 'none';
  hudLeft.appendChild(ammoContainer);

  // Top-right group: highscore + timer
  const hudRight = mk('div');
  hudRight.style.position = 'absolute';
  hudRight.style.right = '20px';
  hudRight.style.top = '20px';
  hudRight.style.zIndex = 60;
  hudRight.style.textAlign = 'right';
  hudRight.style.pointerEvents = 'none';
  document.body.appendChild(hudRight);

  const highscoreContainer = mk('div');
  highscoreContainer.style.background = 'rgba(0,0,0,0.6)';
  highscoreContainer.style.padding = '8px 10px';
  highscoreContainer.style.borderRadius = '8px';
  highscoreContainer.style.fontWeight = '700';
  highscoreContainer.style.marginBottom = '8px';
  hudRight.appendChild(highscoreContainer);

  const timerContainer = mk('div');
  timerContainer.style.background = 'rgba(0,0,0,0.6)';
  timerContainer.style.padding = '8px 10px';
  timerContainer.style.borderRadius = '8px';
  timerContainer.style.fontWeight = '700';
  hudRight.appendChild(timerContainer);

  // Apply neon look consistent with CSS
  [ammoContainer, highscoreContainer, timerContainer].forEach(el => {
    el.style.color = '#fff';
    el.style.border = '1px solid rgba(0,255,255,0.08)';
  });

  /* ---------- Game state ---------- */
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  let running = false;
  let paused = false;
  let difficulty = 'normal';
  let playerName = 'Player';

  // difficulty params (spawn & speed & blackChance)
  const DIFFICULTY = {
    easy:   { spawn: ENEMY_SPAWN_BASE * 0.7, speedMul: 0.85, blackChance: 0.06 },
    normal: { spawn: ENEMY_SPAWN_BASE * 1.0, speedMul: 1.0,  blackChance: 0.09 },
    hard:   { spawn: ENEMY_SPAWN_BASE * 1.4, speedMul: 1.25, blackChance: 0.13 }
  };

  // Entities
  let player = {};
  let bullets = [];
  let enemies = [];
  let particles = []; // for explosions & small particles
  let powerups = [];
  let helperBot = null;
  let muzzleFlash = { active: false, until: 0 };
  let shake = { x: 0, y: 0, intensity: 0 };
  let blackExists = false;

  // Achievements & stats
  const ACHIEVEMENTS = [
    { id: 'baby_steps', label: 'Baby Steps', text: '🏃 Baby Steps — Survived 10 seconds!', type: 'timed', once: false, cond: s => s.seconds >= 10 },
    { id: 'prog_slow', label: 'Progressing Slowly', text: '⚙️ Progressing Slowly — 50 score reached!', type: 'score', once: false, cond: s => s.score >= 50 },
    { id: 'reload_first', label: 'Wait… There\'s a Reload?', text: '🔫 Wait… There\'s a reload in this game?', type: 'action', once: true, cond: s => s.reloadedOnce },
    { id: 'now_score', label: 'Now That\'s a Score!', text: '💯 Now That\'s a Score!', type: 'score', once: false, cond: s => s.score >= 100 },
    { id: 'keep_going', label: 'Keep Going!', text: '⏱ Keep Going — You can do more!', type: 'timed', once: false, cond: s => s.seconds >= 60 },
    { id: 'out_ammo', label: 'Out of Ammo', text: '💥 Out of Ammo — Keep an eye on your bullets!', type: 'action', once: true, cond: s => s.ranOutOfAmmoOnce },
    { id: 'first_time_die', label: 'First Time?', text: '💀 First Time? Don\'t worry, happens to everyone.', type: 'death', once: true, cond: s => s.deathCount >= 1 },
    { id: 'die_10', label: 'Out of Hand', text: '😵 Well... Now it\'s Getting Out of Hand.', type: 'death', once: false, cond: s => s.deathCount >= 10 },
    { id: 'kill_black', label: 'That Thing\'s Dead?', text: '☠️ You Killed *That* Thing?', type: 'action', once: true, cond: s => s.killedBlackOnce },
    { id: 'paralyzed', label: 'Paralyzed!', text: '⚡ Yeah… That Black Thing Ain\'t Normal.', type: 'action', once: true, cond: s => s.paralyzedOnce },

    // extras
    { id: 'speedster', label: 'Speedster', text: '💨 Speedster — You love going fast!', type: 'stat', once: false, cond: s => s.speedPickups >= 5 },
    { id: 'friendly_fire', label: 'Friendly Fire', text: '🤖 Friendly Fire — You got some help!', type: 'stat', once: false, cond: s => s.helperPickups >= 5 },
    { id: 'flawless', label: 'Flawless Victory', text: '🛡️ Flawless Victory!', type: 'challenge', once: false, cond: s => s.flawlessThisRun },
    { id: 'terminator', label: 'Terminator', text: '🔥 Terminator — 200 total kills!', type: 'persistent', once: false, cond: s => s.totalKills >= 200 },
    { id: 'immortal', label: 'Immortal', text: '👑 Immortal — You\'re getting good at this.', type: 'timed', once: false, cond: s => s.seconds >= 180 }
  ];

  // stats stored across sessions
  const stats = {
    totalKills: 0,
    deathCount: 0,
    speedPickups: 0,
    helperPickups: 0,
    reloadedOnce: false,
    ranOutOfAmmoOnce: false,
    killedBlackOnce: false,
    paralyzedOnce: false
  };

  // per-run trackers for achievements like flawless
  let runTrack = {
    flawlessCandidate: true // becomes false if take damage
  };

  // load from localStorage
  function loadPersistent() {
    const h = parseInt(localStorage.getItem(LS_HIGH) || '0', 10);
    highscore = isNaN(h) ? 0 : h;
    const ach = JSON.parse(localStorage.getItem(LS_ACH) || '{}');
    persistedAchievements = ach;
    const s = JSON.parse(localStorage.getItem(LS_STATS) || '{}');
    Object.assign(stats, s || {});
  }

  function savePersistent() {
    localStorage.setItem(LS_HIGH, String(highscore));
    localStorage.setItem(LS_ACH, JSON.stringify(persistedAchievements));
    localStorage.setItem(LS_STATS, JSON.stringify(stats));
  }

  // persisted state
  let highscore = 0;
  let persistedAchievements = {};

  loadPersistent();

  /* ---------- Game runtime state ---------- */
  let keys = {};
  let lastFrame = 0;
  let score = 0;
  let startTime = 0;
  let elapsedWhenStopped = 0;

  /* ---------- Player initialization ---------- */
  function resetPlayer() {
    player = {
      x: CANVAS_W - 80,
      y: CANVAS_H / 2,
      size: PLAYER_SIZE,
      speed: PLAYER_SPEED,
      health: MAX_HEALTH,
      lastShot: 0,
      ammo: MAG_SIZE,
      reloading: false,
      reloadAt: 0,
      paralyzedUntil: 0,
      speedBoostUntil: 0
    };
  }

  /* ---------- Utility functions ---------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand(a,b) { return a + Math.random()*(b-a); }
  function dist(a,b,c,d){ return Math.hypot(a-c, b-d); }
  function now() { return Date.now(); }

  /* ---------- Achievements handling ---------- */
  function checkAchievementsPeriodically() {
    // gather run/session stats to evaluate conditions
    const elapsed = running ? (now() - startTime) : elapsedWhenStopped;
    const s = {
      seconds: Math.floor(elapsed / 1000),
      score,
      reloadedOnce: stats.reloadedOnce,
      ranOutOfAmmoOnce: stats.ranOutOfAmmoOnce,
      deathCount: stats.deathCount,
      killedBlackOnce: stats.killedBlackOnce,
      paralyzedOnce: stats.paralyzedOnce,
      speedPickups: stats.speedPickups,
      helperPickups: stats.helperPickups,
      totalKills: stats.totalKills,
      flawlessThisRun: runTrack.flawlessCandidate && (sUndefinedFallback => false) // placeholder; we'll compute separately where needed
    };

    // compute flawless: survived >= 60 and no health lost this run
    if (running) {
      const elapsedSec = Math.floor((now() - startTime)/1000);
      s.flawlessThisRun = (elapsedSec >= 60 && runTrack.flawlessCandidate);
    } else {
      s.flawlessThisRun = false;
    }

    ACHIEVEMENTS.forEach(ach => {
      tryUnlockAchievement(ach, s);
    });
  }

  function tryUnlockAchievement(ach, s) {
    const id = ach.id;
    const already = persistedAchievements[id];
    // If achievement is "once only" and already unlocked, skip
    if (ach.once && already) return;
    // Evaluate condition
    let ok = false;
    try { ok = ach.cond(s); } catch(e) { ok = false; }
    if (ok && !persistedAchievements[id]) {
      // unlock
      persistedAchievements[id] = true;
      showAchievementPopup(ach.text);
      // some achievements require updating stats (already done at trigger points)
      savePersistent();
    } else if (ok && !ach.once) {
      // For non-once ones we still show each time they occur (but avoid spamming)
      // We'll show if not shown recently (debounce)
      const lastShown = persistedAchievements[`shown_${id}`] || 0;
      if (Date.now() - lastShown > 5000) {
        showAchievementPopup(ach.text);
        persistedAchievements[`shown_${id}`] = Date.now();
      }
    }
  }

  // show popup at top center
  let achPopupTimeout = null;
  function showAchievementPopup(text) {
    achPopup.innerText = text;
    achPopup.classList.add('show');
    achPopup.style.display = 'block';
    if (achPopupTimeout) clearTimeout(achPopupTimeout);
    achPopupTimeout = setTimeout(() => {
      achPopup.classList.remove('show');
      setTimeout(()=> achPopup.style.display = 'none', 400);
    }, 3000);
  }

  // Build Achievements menu content
  function refreshAchievementsMenu() {
    achList.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
      const li = mk('li');
      const unlocked = !!persistedAchievements[a.id];
      li.textContent = (unlocked ? '✅ ' : '🔒 ') + a.label + ' — ' + a.text.replace(/^[^\s]+\s/, '');
      if (!unlocked) li.classList.add('locked');
      achList.appendChild(li);
    });
  }

  /* ---------- Spawn functions & entities ---------- */
  function spawnEnemy() {
    const diff = DIFFICULTY[difficulty] || DIFFICULTY.normal;
    const r = Math.random();
    let type = 'green';
    if (r < diff.blackChance && !blackExists) type = 'black';
    else if (r < 0.30) type = 'red';
    else if (r < 0.65) type = 'yellow';
    else type = 'green';
    if (type === 'black') blackExists = true;

    const size = ENEMY_MIN + Math.random()*(ENEMY_MAX-ENEMY_MIN);
    const y = 20 + Math.random()*(CANVAS_H-40);
    let speed = ENEMY_BASE_SPEED + Math.random()*1.2;
    speed *= diff.speedMul;
    if (type === 'green') speed *= 0.75;
    if (type === 'yellow') speed *= 1.05;
    if (type === 'red') speed *= 1.5;
    if (type === 'black') speed *= 1.0;

    enemies.push({ x: -size - 10, y, size, speed, type, spawnAt: now() });
  }

  function spawnPowerup() {
    const kind = Math.random() < 0.5 ? 'speed' : 'helper';
    const x = 60 + Math.random()*(CANVAS_W-120);
    const y = 40 + Math.random()*(CANVAS_H-80);
    powerups.push({ x, y, size: POWERUP_SIZE, kind, createdAt: now() });
  }

  // helper bot spawner
  function spawnHelperBot() {
    if (helperBot) return;
    helperBot = { x: player.x + 40, y: player.y + 20, size: 20, activeUntil: now() + POWERUP_DURATION, lastShot: 0, shootInterval: 450};
  }

  /* ---------- Particles & trail handling ---------- */
  function createExplosion(x,y,count=12,color='#ff6b6b') {
    for (let i=0;i<count;i++){
      const ang = Math.random()*Math.PI*2;
      const s = 1 + Math.random()*3;
      const life = 12 + Math.floor(Math.random()*18);
      particles.push({ x, y, vx: Math.cos(ang)*s, vy: Math.sin(ang)*s, r: 1 + Math.random()*3, life, maxLife: life, color });
    }
  }

  // Bullet trails: each bullet has a `trail` array of {x,y,life}
  function updateTrails() {
    bullets.forEach(b => {
      if (!b.trail) b.trail = [];
      b.trail.unshift({ x: b.x, y: b.y, life: 6 });
      if (b.trail.length > 8) b.trail.pop();
    });
    // decay trails inside bullets
    bullets.forEach(b => {
      if (!b.trail) return;
      b.trail.forEach(t => t.life--);
      b.trail = b.trail.filter(t => t.life>0);
    });
  }

  /* ---------- Input ---------- */
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
    if ((e.code === 'KeyP' || e.code === 'Escape') && running) {
      togglePause();
    }
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  /* ---------- HUD updates ---------- */
  function updateHUD() {
    // hearts
    heartsContainer.innerHTML = '';
    for (let i=0;i<MAX_HEALTH;i++) {
      const d = mk('div');
      d.style.width = '18px';
      d.style.height = '18px';
      d.style.borderRadius = '4px';
      d.style.boxShadow = 'inset 0 -3px rgba(0,0,0,0.2)';
      d.style.background = i < player.health ? '#ff4d4d' : 'rgba(255,255,255,0.08)';
      heartsContainer.appendChild(d);
    }
    // ammo
    ammoContainer.textContent = `Ammo: ${player.ammo} / ${MAG_SIZE}`;
    // highscore and timer
    highscoreContainer.textContent = `High Score: ${highscore}`;
    const elapsed = running ? (now() - startTime) : elapsedWhenStopped;
    const short = formatDurationShort(elapsed);
    timerContainer.textContent = `Time: ${short}`;
  }

  /* ---------- Achievement triggers at runtime ---------- */
  function markReloadedOnce() {
    if (!stats.reloadedOnce) {
      stats.reloadedOnce = true;
      tryUnlockAchievementById('reload_first');
      savePersistent();
    }
  }
  function markOutOfAmmoOnce() {
    if (!stats.ranOutOfAmmoOnce) {
      stats.ranOutOfAmmoOnce = true;
      tryUnlockAchievementById('out_ammo');
      savePersistent();
    }
  }
  function markKilledBlack() {
    if (!stats.killedBlackOnce) {
      stats.killedBlackOnce = true;
      tryUnlockAchievementById('kill_black');
      savePersistent();
    }
  }
  function markParalyzed() {
    if (!stats.paralyzedOnce) {
      stats.paralyzedOnce = true;
      tryUnlockAchievementById('paralyzed');
      savePersistent();
    }
  }

  function tryUnlockAchievementById(id) {
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return;
    // create a small s object to evaluate
    const s = {
      seconds: Math.floor((now() - startTime)/1000),
      score,
      reloadedOnce: stats.reloadedOnce,
      ranOutOfAmmoOnce: stats.ranOutOfAmmoOnce,
      deathCount: stats.deathCount,
      killedBlackOnce: stats.killedBlackOnce,
      paralyzedOnce: stats.paralyzedOnce,
      speedPickups: stats.speedPickups,
      helperPickups: stats.helperPickups,
      totalKills: stats.totalKills,
      flawlessThisRun: runTrack.flawlessCandidate && Math.floor((now() - startTime)/1000) >= 60
    };
    tryUnlockAchievement(ach, s);
  }

  /* ---------- Core update / physics ---------- */
  function update(dt) {
    if (!running || paused) return;

    // Timer, HUD
    updateHUD();

    // Movement
    const paralyzed = player.paralyzedUntil > now();
    const speedNow = player.speedBoostUntil > now() ? player.speed * SPEED_MULT : player.speed;
    if (!paralyzed) {
      if (keys['KeyW'] && player.y - player.size/2 > 0) player.y -= speedNow;
      if (keys['KeyS'] && player.y + player.size/2 < CANVAS_H) player.y += speedNow;
      if (keys['KeyA'] && player.x - player.size/2 > 0) player.x -= speedNow;
      if (keys['KeyD'] && player.x + player.size/2 < CANVAS_W) player.x += speedNow;
    }

    // Shooting
    if (keys['Space']) attemptShoot();

    // Reload
    if (keys['KeyR']) {
      if (!player.reloading && player.ammo < MAG_SIZE) {
        player.reloading = true;
        player.reloadAt = now() + RELOAD_TIME_MS;
        markReloadedOnce();
      }
      keys['KeyR'] = false;
    }
    if (player.reloading && now() >= player.reloadAt) {
      player.ammo = MAG_SIZE;
      player.reloading = false;
      updateHUD();
    }

    // Spawn enemies & powerups
    const diff = DIFFICULTY[difficulty] || DIFFICULTY.normal;
    if (Math.random() < diff.spawn) spawnEnemy();
    if (Math.random() < POWERUP_CHANCE) spawnPowerup();

    // bullets movement & trails
    for (let i = bullets.length-1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx;
      b.y += b.dy;
      if (b.x < -20 || b.x > CANVAS_W + 20 || b.y < -20 || b.y > CANVAS_H + 20) {
        bullets.splice(i,1); continue;
      }
    }
    updateTrails();

    // helper bot logic
    if (helperBot) {
      helperBot.x += (player.x + 40 - helperBot.x) * 0.12;
      helperBot.y += (player.y + 20 - helperBot.y) * 0.12;
      if (now() - helperBot.lastShot > helperBot.shootInterval) {
        helperBot.lastShot = now();
        if (enemies.length > 0) {
          let target = enemies.reduce((a,b) => (dist(a.x,a.y,helperBot.x,helperBot.y) < dist(b.x,b.y,helperBot.x,helperBot.y) ? a : b));
          const angle = Math.atan2(target.y - helperBot.y, target.x - helperBot.x);
          bullets.push({ x: helperBot.x, y: helperBot.y, dx: Math.cos(angle)*7, dy: Math.sin(angle)*7, r: 4 });
        }
      }
      if (now() > helperBot.activeUntil) helperBot = null;
    }

    // enemies
    for (let ei = enemies.length-1; ei >= 0; ei--) {
      const e = enemies[ei];
      e.x += e.speed;
      // passed through
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
      const d = dist(e.x,e.y,player.x,player.y);
      if (d < e.size/2 + player.size/2 - 2) {
        if (e.type === 'black') {
          applyParalysis(); markParalyzed();
        } else damagePlayer(1);
        createExplosion(e.x,e.y,10,'#ff9b9b');
        if (e.type === 'black') blackExists = false;
        enemies.splice(ei,1);
        continue;
      }
      // collision with bullets
      let hit = false;
      for (let bi = bullets.length-1; bi >= 0; bi--) {
        const b = bullets[bi];
        const d2 = dist(b.x,b.y,e.x,e.y);
        if (d2 < e.size/2 + b.r) {
          bullets.splice(bi,1);
          hit = true;
          break;
        }
      }
      if (hit) {
        createExplosion(e.x,e.y,10,'#ff6b6b');
        score += 1;
        stats.totalKills = (stats.totalKills || 0) + 1;
        runTrack.flawlessCandidate = runTrack.flawlessCandidate && true; // no-op
        if (e.type === 'black') { blackExists = false; markKilledBlack(); }
        enemies.splice(ei,1);
        tryUnlockAchievementById('prog_slow'); // check score 50
        tryUnlockAchievementById('now_score');  // check score 100
        savePersistent();
        updateHUD();
        continue;
      }
    }

    // powerups pickup
    for (let pi = powerups.length-1; pi >= 0; pi--) {
      const p = powerups[pi];
      if (dist(p.x,p.y,player.x,player.y) < p.size/2 + player.size/2) {
        if (p.kind === 'speed') {
          player.speedBoostUntil = now() + POWERUP_DURATION;
          stats.speedPickups = (stats.speedPickups || 0) + 1;
        } else {
          spawnHelperBot();
          stats.helperPickups = (stats.helperPickups || 0) + 1;
        }
        createExplosion(player.x,player.y,10, p.kind === 'speed' ? '#7fbfff' : '#bfff9b');
        powerups.splice(pi,1);
        savePersistent();
      }
    }

    // particles decay
    for (let i = particles.length-1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.98; p.vy *= 0.98;
      p.life -= 1;
      if (p.life <= 0) particles.splice(i,1);
    }

    // muzzle timeout
    if (muzzleFlash.active && now() > muzzleFlash.until) muzzleFlash.active = false;

    // shake decay
    if (shake.intensity > 0) {
      shake.intensity *= 0.82;
      shake.x = (Math.random()-0.5)*shake.intensity;
      shake.y = (Math.random()-0.5)*shake.intensity;
      if (shake.intensity < 0.6) { shake.intensity = 0; shake.x = 0; shake.y = 0; }
    }
  }

  /* ---------- Shooting logic ---------- */
  function attemptShoot() {
    const t = now();
    if (player.reloading || player.ammo <= 0) {
      if (player.ammo === 0 && !stats.ranOutOfAmmoOnce) {
        stats.ranOutOfAmmoOnce = true;
        tryUnlockAchievementById('out_ammo');
        savePersistent();
      }
      return;
    }
    if (t - player.lastShot < FIRE_RATE_MS) return;
    if (player.paralyzedUntil > t) return;

    player.lastShot = t;
    player.ammo--;
    bullets.push({ x: player.x - player.size/2, y: player.y, dx: -10, dy: 0, r: 4, trail: [] });
    muzzleFlash.active = true;
    muzzleFlash.until = t + 80;
    updateHUD();
  }

  /* ---------- Damage & effects ---------- */
  function damagePlayer(amount) {
    runTrack.flawlessCandidate = false;
    player.health -= amount;
    if (player.health < 0) player.health = 0;
    updateHUD();
    addShake(8);
    createExplosion(player.x,player.y,10,'#ffb3b3');
    if (player.health <= 0) {
      // death
      stats.deathCount = (stats.deathCount || 0) + 1;
      elapsedWhenStopped = now() - startTime;
      savePersistent();
      createExplosion(player.x,player.y,80,'#ff6b6b');
      addShake(18);
      // achievements for death
      tryUnlockAchievementById('first_time_die');
      tryUnlockAchievementById('die_10');
      showGameOver();
    }
  }

  function applyParalysis() {
    player.paralyzedUntil = now() + 5000;
    addShake(8);
    createExplosion(player.x,player.y,18,'#cccccc');
    markParalyzed();
  }

  function addShake(i) {
    shake.intensity = Math.max(shake.intensity || 0, i);
  }

  /* ---------- Drawing ---------- */
  function draw() {
    // clear
    ctx.save();
    ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
    ctx.translate(shake.x, shake.y);

    // background grid (keep same look)
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
      ctx.translate(p.x,p.y);
      ctx.fillStyle = p.kind === 'speed' ? '#4da6ff' : '#7bff7b';
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    });

    // helper bot
    if (helperBot) {
      ctx.save();
      ctx.translate(helperBot.x, helperBot.y);
      ctx.fillStyle = '#9effff';
      ctx.beginPath();
      ctx.arc(0,0, helperBot.size/2, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    // player triangle
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = '#00d8ff';
    ctx.beginPath();
    ctx.moveTo(-player.size/2,0);
    ctx.lineTo(player.size/2, -player.size/2);
    ctx.lineTo(player.size/2, player.size/2);
    ctx.closePath();
    ctx.fill();

    // player name above
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
      ctx.lineTo(-18,-8);
      ctx.lineTo(-18,8);
      ctx.closePath();
      ctx.fillStyle = '#ffd34d';
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // bullets & trails (draw trails first)
    bullets.forEach(b => {
      if (b.trail && b.trail.length) {
        for (let i = 0; i < b.trail.length; i++) {
          const t = b.trail[i];
          const alpha = (t.life / 6) * 0.9;
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,211,77,${alpha})`;
          ctx.arc(t.x, t.y, 2 + i*0.25, 0, Math.PI*2);
          ctx.fill();
        }
      }
    });
    ctx.fillStyle = '#ffd34d';
    bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill(); });

    // enemies
    enemies.forEach(e => {
      if (e.type === 'green') ctx.fillStyle = '#6bff8a';
      else if (e.type === 'yellow') ctx.fillStyle = '#ffd166';
      else if (e.type === 'red') ctx.fillStyle = '#ff6b6b';
      else ctx.fillStyle = '#111111';
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

    // HUD small canvas text (redundant)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '18px system-ui, Arial';
    ctx.fillText(`Score: ${score}`, 12 - shake.x, 24 - shake.y);
    ctx.fillText(`HP: ${player.health}/${MAX_HEALTH}`, 12 - shake.x, 48 - shake.y);

    ctx.restore();
  }

  /* ---------- Main loop ---------- */
  function loop(ts) {
    if (!running) return;
    const t = ts || performance.now();
    const dt = lastFrame ? (t - lastFrame)/1000 : 0;
    lastFrame = t;

    update(dt);
    draw();

    // periodic achievement checks (every frame is fine)
    checkAchievementsPeriodically();

    requestAnimationFrame(loop);
  }

  /* ---------- UI flows (start, pause, gameover) ---------- */
  function showMenu() {
    menu.style.display = 'block';
    achMenu.style.display = 'none';
    canvas.style.display = 'none';
    gameOver.style.display = 'none';
    pauseScreen.style.display = 'none';
    achPopup.style.display = 'none';
  }

  function showAchievementsMenu() {
    menu.style.display = 'none';
    achMenu.style.display = 'block';
    achPopup.style.display = 'none';
    refreshAchievementsMenu();
  }

  function startGame() {
    // read values
    playerName = (nameInput.value || 'Player').slice(0, 18);
    difficulty = diffSelect.value || 'normal';
    running = true;
    paused = false;
    lastFrame = 0;
    score = 0;
    startTime = now();
    elapsedWhenStopped = 0;
    resetPlayer();
    bullets = []; enemies = []; particles = []; powerups = []; helperBot = null; muzzleFlash = { active:false, until:0 }; shake = { x:0,y:0,intensity:0 }; blackExists = false;
    runTrack = { flawlessCandidate: true };
    menu.style.display = 'none';
    achMenu.style.display = 'none';
    canvas.style.display = 'block';
    gameOver.style.display = 'none';
    pauseScreen.style.display = 'none';
    updateHUD();
    requestAnimationFrame(loop);
  }

  function togglePause(force) {
    if (!running) return;
    paused = (typeof force === 'boolean') ? force : !paused;
    pauseScreen.style.display = paused ? 'block' : 'none';
    if (!paused) {
      // resume
      lastFrame = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function showGameOver() {
    running = false;
    paused = false;
    canvas.style.display = 'none';
    gameOver.style.display = 'block';
    survivalEl.textContent = `You survived for ${formatDuration(elapsedWhenStopped)}.`;
    finalScoreEl.textContent = `Score: ${score}`;
    if (score > highscore) { highscore = score; }
    highDisplay.textContent = `High Score: ${highscore}`;
    savePersistent();
    // show achievements menu button still available
    updateHUD();
  }

  function replay() {
    gameOver.style.display = 'none';
    startGame();
  }

  function returnHome() {
    running = false;
    paused = false;
    savePersistent();
    showMenu();
  }

  /* ---------- Utility UI wiring ---------- */
  startBtn && startBtn.addEventListener('click', startGame);
  achBtn && achBtn.addEventListener('click', showAchievementsMenu);
  backBtn && backBtn.addEventListener('click', showMenu);

  replayBtn && replayBtn.addEventListener('click', replay);
  homeBtn && homeBtn.addEventListener('click', returnHome);

  resumeBtn && resumeBtn.addEventListener('click', () => togglePause(false));
  pauseHomeBtn && pauseHomeBtn.addEventListener('click', () => { togglePause(false); returnHome(); });

  // Add keyboard shortcut for resume in pause overlay
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyR' && pauseScreen.style.display === 'block') togglePause(false);
  });

  /* ---------- Save/load / achievements menu ---------- */
  function refreshAchievementsMenu() {
    achList.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
      const li = mk('li');
      const unlocked = !!persistedAchievements[a.id];
      li.textContent = `${unlocked ? '✅' : '🔒'} ${a.label} — ${a.text}`;
      if (!unlocked) li.classList.add('locked');
      achList.appendChild(li);
    });
  }

  // initialize menu high score
  menuHighScore && (menuHighScore.textContent = String(highscore || 0));

  // show achievements in popup when first load? no — only via triggers.

  /* ---------- Format durations ---------- */
  function formatDuration(ms) {
    const totalSec = Math.floor(ms/1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
  function formatDurationShort(ms) {
    const totalSec = Math.floor(ms/1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return m > 0 ? `${m}:${String(s).padStart(2,'0')}` : `${s}s`;
  }

  /* ---------- Save / Load persistent data ---------- */
  function persistInit() {
    // persistedAchievements already loaded above
    if (!persistedAchievements) persistedAchievements = {};
    if (!stats) Object.assign(stats, {});
    // ensure highscore displayed
    highscore = parseInt(localStorage.getItem(LS_HIGH) || '0', 10) || 0;
    highscoreContainer && (highscoreContainer.textContent = `High Score: ${highscore}`);
  }
  persistInit();

  /* ---------- Boot / show menu ---------- */
  // Initially show the menu
  showMenu();
  refreshAchievementsMenu();

  // Expose debug object for dev tweaks
  window.__game = {
    start: startGame,
    stop: () => running = false,
    spawnEnemy,
    spawnPowerup,
    getState: () => ({ running, paused, score, highscore, player, enemies: enemies.length, bullets: bullets.length }),
    unlockAll: () => { ACHIEVEMENTS.forEach(a => persistedAchievements[a.id] = true); savePersistent(); refreshAchievementsMenu(); }
  };

  /* ---------- End of file ---------- */
})();
