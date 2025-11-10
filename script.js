/* === GLOBAL === */
body {
  margin: 0;
  padding: 0;
  background: radial-gradient(circle at center, #040404, #000);
  color: #0ff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* === CANVAS FRAME === */
#frame {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 900px;
  height: 600px;
}
canvas {
  display: none;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #0ff;
  box-shadow: 0 0 20px #0ff;
  border-radius: 10px;
}

/* === OVERLAYS === */
.overlay {
  position: absolute;
  text-align: center;
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid #0ff;
  padding: 20px 40px;
  border-radius: 10px;
  box-shadow: 0 0 25px #0ff;
}
.hidden { display: none; }

.title {
  font-size: 2.4em;
  color: #0ff;
  text-shadow: 0 0 10px #0ff;
  margin-bottom: 10px;
}
.label {
  display: block;
  margin-top: 10px;
  color: #0ff;
  font-weight: bold;
}
.meta {
  color: #0ff;
  text-shadow: 0 0 6px #0ff;
  font-size: 1em;
}
.hint {
  color: #088;
  font-size: 0.9em;
  margin-top: 6px;
}
.btn {
  margin: 5px;
  padding: 10px 22px;
  border: none;
  border-radius: 5px;
  background: #0ff;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 0 15px #0ff;
  transition: 0.2s;
}
.btn:hover { background: #09f; box-shadow: 0 0 25px #09f; }
.btn.alt { background: #08f; color: #fff; }
.btn.alt:hover { background: #0af; }

select, input {
  margin-top: 5px;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #0ff;
  background: #000;
  color: #0ff;
  text-align: center;
  box-shadow: 0 0 10px #0ff inset;
}

/* === ACHIEVEMENTS === */
.ach-list { color: #0ff; }
.ach-list .locked { opacity: 0.4; }
.achievement-popup {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,255,255,0.1);
  border: 1px solid #0ff;
  padding: 8px 18px;
  border-radius: 8px;
  color: #0ff;
  font-weight: bold;
  text-shadow: 0 0 6px #0ff;
  opacity: 0;
  transition: opacity 0.5s;
}
.achievement-popup.show { opacity: 1; }

/* === DIALOGUE BOX === */
.dialogue {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  background: rgba(0, 10, 20, 0.85);
  border: 2px solid #0ff;
  border-radius: 8px;
  box-shadow: 0 0 25px #0ff;
  padding: 15px;
  color: #0ff;
  text-shadow: 0 0 6px #0ff;
}
.dialogue-text {
  font-size: 1.1em;
  line-height: 1.4em;
  min-height: 50px;
  text-align: left;
}
.dialogue-hint {
  font-size: 0.9em;
  color: #08f;
  text-align: right;
  margin-top: 8px;
}

/* === GAME OVER (Blue) === */
#gameOver {
  border-color: #09f;
  box-shadow: 0 0 25px #09f;
  color: #09f;
}

/* === YOU WIN (Green) === */
#youWin {
  border-color: #0f0;
  box-shadow: 0 0 25px #0f0;
  color: #0f0;
}
#youWin h2 {
  text-shadow: 0 0 12px #0f0;
}

/* === PAUSE SCREEN === */
#pauseScreen {
  border-color: #0ff;
  box-shadow: 0 0 25px #0ff;
  color: #0ff;
}
