/* script.js - Neon Shooter v5
   Full gameplay, achievements, easter eggs, story intro, reset system.
   Plain JavaScript. Save as script.js beside index.html & style.css
*/

(() => {
  /* ----------------- DOM IDs / Keys ----------------- */
  const CANVAS_ID = 'gameCanvas';
  const MENU_ID = 'menu';
  const START_BTN_ID = 'startButton';
  const ACH_BTN_ID = 'achievementsButton';
  const RESET_BTN_ID = 'resetButton';
  const MENU_HS_ID = 'menuHighScore';
  const MENU_BT_ID = 'menuBestTime';
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

  const YOUWIN_ID = 'youWin';
  const YOUWIN_MSG = 'youWinMsg';
  const YOUWIN_SCORE = 'youWinScore';
  const WIN_REPLAY = 'winReplay';
  const WIN_HOME = 'winHome';

  const PAUSE_ID = 'pauseScreen';
  const RESUME_ID = 'resumeButton';
  const PAUSE_HOME_ID = 'pauseHomeButton';

  const DIALOGUE_BOX_ID = 'dialogueBox';
  const DIALOGUE_TEXT_ID = 'dialogueText';
  const DIALOGUE_HINT_ID = 'dialogueHint';

  const ACH_POPUP_ID = 'achievementPopup';

  const LS_HIGH = 'ns_highscore_v1';
  const LS_ACH = 'ns_achievements_v1';
  const LS_STATS = 'ns_stats_v1';
  const LS_BESTTIME = 'ns_besttime_v1';
  const LS_INTRO = 'ns_intro_shown_v1';

  /* ----------------- DOM helpers ----------------- */
  const $ = id => document.getElementById(id);
  function mk(tag, props = {}) { const e = document.createElement(tag); Object.assign(e, props); return e; }

  /* ----------------- cached nodes ----------------- */
  const canvas = $(CANVAS_ID);
  const ctx = canvas.getContext('2d');

  const menu = $(MENU_ID);
  const startBtn = $(START_BTN_ID);
  const achBtn = $(ACH_BTN_ID);
  const resetBtn = $(RESET_BTN_ID);
  const menuHighScore = $(MENU_HS_ID);
  const menuBestTime = $(MENU_BT_ID);
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

  const youWin = $(YOUWIN_ID);
  const youWinMsg = $(YOUWIN_MSG);
  const youWinScore = $(YOUWIN_SCORE);
  const winReplay = $(WIN_REPLAY);
  const winHome = $(WIN_HOME);

  const pauseScreen = $(PAUSE_ID);
  const resumeBtn = $(RESUME_ID);
  const pauseHomeBtn = $(PAUSE_HOME_ID);

  const dialogueBox = $(DIALOGUE_BOX_ID);
  const dialogueText = $(DIALOGUE_TEXT_ID);
  const dialogueHint = $(DIALOGUE_HINT_ID);

  const achPopup = $(ACH_POPUP_ID);

  // safe ensures
  function ensure(el, id) { if (!el) { const n = mk('div'); n.id = id; document.body.appendChild(n); return n; } return el; }
  ensure(canvas, CANVAS_ID);
  ensure(menu, MENU_ID);
  ensure(startBtn, START_BTN_ID);
  ensure(achBtn, ACH_BTN_ID);
  ensure(resetBtn, RESET_BTN_ID);
