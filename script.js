// =================== NEON SHOOTER v5 ===================
// Fixed full version with achievements, easter eggs & dialogue
// by M. Shoaib & GPT-5

// ======= Canvas Setup =======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 500;

let gameRunning = false;
let paused = false;

// ======= Player =======
let player = {
  x: canvas.width - 100,
  y: canvas.height / 2,
  size: 20,
  speed: 5,
  color: "cyan",
  bullets: 50,
  hp: 10,
  name: "Player",
  paralyzed: false,
};

// ======= Game Vars =======
let bullets = [];
let enemies = [];
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let bestTime = parseInt(localStorage.getItem("bestTime")) || 0;
let gameTimer = 0;
let achievements = JSON.parse(localStorage.getItem("achievements")) || {};
let startTime;
let difficulty = "normal";

// ======= Easter Egg =======
let easterEggMode = null;
let easterEggTriggered = false;

// ======= HTML =======
const startMenu = document.getElementById("startMenu");
const startBtn = document.getElementById("startGame");
const achievementsBtn = document.getElementById("achievementsBtn");
const resetBtn = document.getElementById("resetBtn");
const difficultySelect = document.getElementById("difficulty");
const nameInput = document.getElementById("playerName");
const achievementsBox = document.getElementById("achievementsBox");

// ======= Helper Functions =======
function resetGame() {
  player.hp = 10;
  player.bullets = 50;
  score = 0;
  enemies = [];
  bullets = [];
  gameTimer = 0;
  paused = false;
  player.paralyzed = false;
  startTime = Date.now();
}

function drawPlayer() {
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x - player.size, player.y - player.size / 2);
  ctx.lineTo(player.x - player.size, player.y + player.size / 2);
  ctx.closePath();
  ctx.fillStyle = player.color;
  ctx.fill();

  ctx.font = "14px Orbitron";
  ctx.fillStyle = "cyan";
  ctx.textAlign = "center";
  ctx.fillText(player.name, player.x, player.y - 25);
}

function drawHUD() {
  ctx.font = "16px Orbitron";
  ctx.textAlign = "left";
  ctx.fillStyle = "cyan";
  ctx.fillText(`HP: ${player.hp}/10`, 20, 30);
  ctx.fillText(`Ammo: ${player.bullets}/50`, 20, 55);
  ctx.textAlign = "right";
  ctx.fillText(`Score: ${score}`, canvas.width - 20, 30);
  ctx.fillText(`Time: ${Math.floor(gameTimer)}s`, canvas.width - 20, 55);
}

function spawnEnemy() {
  const colors = ["green", "yellow", "red"];
  let color = colors[Math.floor(Math.random() * colors.length)];
  if (Math.random() < 0.05) color = "black";

  const speed =
    color === "green" ? 2 :
    color === "yellow" ? 3.5 :
    color === "red" ? 5 : 4;

  enemies.push({
    x: 0,
    y: Math.random() * (canvas.height - 30) + 15,
    size: 15,
    color,
    speed,
  });
}

function drawEnemies() {
  enemies.forEach((enemy, i) => {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
    ctx.fillStyle = enemy.color;
    ctx.fill();
    enemy.x += enemy.speed;

    if (enemy.x > canvas.width - 50) {
      if (enemy.color === "black") {
        player.paralyzed = true;
        showAchievement("yeah that black thing ain't normal");
        setTimeout(() => (player.paralyzed = false), 5000);
      } else {
        player.hp--;
      }
      enemies.splice(i, 1);
    }
  });
}

function drawBullets() {
  bullets.forEach((b, i) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "aqua";
    ctx.fill();
    b.x -= 8;
    if (b.x < 0) bullets.splice(i, 1);
  });
}

function checkCollisions() {
  enemies.forEach((enemy, ei) => {
    bullets.forEach((bullet, bi) => {
      const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
      if (dist < enemy.size + 4) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        score += 10;
        if (enemy.color === "black") showAchievement("You killed that thing?");
      }
    });
  });
}

function showAchievement(text) {
  if (achievements[text]) return;
  achievements[text] = true;
  localStorage.setItem("achievements", JSON.stringify(achievements));

  const div = document.createElement("div");
  div.className = "achievement-popup show";
  div.textContent = `🏆 ${text}`;
  document.body.appendChild(div);
  setTimeout(() => {
    div.classList.remove("show");
    setTimeout(() => div.remove(), 500);
  }, 3000);
}

function youWin() {
  gameRunning = false;
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00ff00";
  ctx.font = "32px Orbitron";
  ctx.textAlign = "center";
  ctx.fillText("✅ YOU WIN!", canvas.width / 2, canvas.height / 2);
  showAchievement("So that's how it feels to be the enemy");
}

function gameOver() {
  gameRunning = false;
  const survived = Math.floor(gameTimer);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  if (survived > bestTime) {
    bestTime = survived;
    localStorage.setItem("bestTime", bestTime);
  }
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00bfff";
  ctx.font = "32px Orbitron";
  ctx.textAlign = "center";
  ctx.fillText("💀 Game Over 💀", canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillText(`You survived ${survived}s`, canvas.width / 2, canvas.height / 2);
  ctx.fillText(`Score: ${score} | High: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);
}

function updateGame() {
  if (!gameRunning || paused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gameTimer = (Date.now() - startTime) / 1000;
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawHUD();
  checkCollisions();
  if (Math.random() < 0.02) spawnEnemy();
  if (player.hp <= 0) {
    showAchievement("First time?");
    gameOver();
    return;
  }
  requestAnimationFrame(updateGame);
}

// ======= Easter Egg Activation =======
nameInput.addEventListener("change", () => {
  const val = nameInput.value.toLowerCase();
  if (["red", "green", "yellow", "black"].includes(val)) easterEggMode = val;
  if (val === "big") easterEggMode = "big";
  if (val === "small") easterEggMode = "small";
  if (val === "invisible") easterEggMode = "invisible";
});

// ======= Controls =======
document.addEventListener("keydown", (e) => {
  if (!gameRunning) {
    if (e.key === "Enter") startGame();
    return;
  }
  if (paused) return;

  if (player.paralyzed) return;

  if (e.key === "w") player.y -= player.speed;
  if (e.key === "s") player.y += player.speed;
  if (e.key === "a") player.x -= player.speed;
  if (e.key === "d") player.x += player.speed;

  if (e.key === " ") {
    if (player.bullets > 0) {
      bullets.push({ x: player.x - player.size, y: player.y });
      player.bullets--;
    } else showAchievement("Now keep checking your ammo");
  }

  if (e.key === "r") {
    player.bullets = 50;
    showAchievement("There's a reload in this game?");
  }

  if (e.key === "Escape") paused = !paused;
});

// ======= Game Start + Dialogue =======
function startGame() {
  player.name = nameInput.value || "Player";
  difficulty = difficultySelect.value;
  resetGame();

  // Easter egg effects
  if (easterEggMode) {
    if (["red", "green", "yellow", "black"].includes(easterEggMode)) {
      player.color = easterEggMode;
      showAchievement("So that's how it feels to be the enemy");
    }
    if (easterEggMode === "big") {
      player.size = 40;
      showAchievement("now that's a Big Boi");
    }
    if (easterEggMode === "small") {
      player.size = 10;
      showAchievement("now that's a small boi");
    }
    if (easterEggMode === "invisible") {
      player.color = "rgba(0,255,255,0.1)";
      showAchievement("now you see me now you don't");
    }
  }

  startMenu.style.display = "none";
  gameRunning = true;
  startTime = Date.now();

  // Intro dialogue (only once)
  if (!localStorage.getItem("introShown")) {
    showDialogue([
      `[Unknown] Hey, wake up ${player.name}!`,
      `${player.name}: Where am I?`,
      `[Unknown] I don’t know that either... just keep shooting and survive.`,
      `${player.name}: Hey, wait—`,
    ]);
    localStorage.setItem("introShown", "true");
  }

  updateGame();
}

// ======= Dialogue =======
function showDialogue(lines) {
  const box = document.createElement("div");
  box.className = "dialogue";
  const text = document.createElement("div");
  text.className = "dialogue-text";
  box.appendChild(text);
  document.body.appendChild(box);

  let index = 0;
  function nextLine() {
    if (index >= lines.length) {
      box.remove();
      return;
    }
    let i = 0;
    text.textContent = "";
    const line = lines[index];
    const interval = setInterval(() => {
      text.textContent += line[i];
      i++;
      if (i >= line.length) {
        clearInterval(interval);
        index++;
        setTimeout(nextLine, 1000);
      }
    }, 40);
  }
  nextLine();
}

// ======= Reset Button =======
resetBtn.addEventListener("click", () => {
  localStorage.clear();
  achievements = {};
  highScore = 0;
  bestTime = 0;
  alert("All progress reset!");
  location.reload();
});

// ======= Achievements =======
achievementsBtn.addEventListener("click", () => {
  achievementsBox.style.display = "block";
  achievementsBox.innerHTML = "<h2>Achievements</h2>";
  for (let key in achievements) {
    achievementsBox.innerHTML += `<p>🏆 ${key}</p>`;
  }
  achievementsBox.innerHTML += `<button id='closeAchievements'>Close</button>`;
  document.getElementById("closeAchievements").onclick = () => (achievementsBox.style.display = "none");
});

// ======= Start Button =======
startBtn.addEventListener("click", startGame);
