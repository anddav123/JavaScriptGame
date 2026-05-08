import {
  CREATURE_HP_PER_LEVEL,
  CREATURE_MAX_LEVEL,
  CREATURE_MIN_LEVEL,
  CREATURE_XP_PER_LEVEL,
  INITIAL_PLAYER_MAX_MP,
  PLAYER_MP_RECHARGE_AMOUNT,
  PLAYER_MP_RECHARGE_STEP_INTERVAL,
  TILE_SIZE
} from "./constants.js";
import { createAscensionCutsceneController } from "./ascensionCutscene.js";
import { createBattleController } from "./battle.js";
import { cutscenes } from "./cutscenes.js";
import { creatureTemplates, defaultMovesForLevel, MAX_CREATURE_MOVES } from "./creatures.js";
import { moveCatalog } from "./moves.js";
import { createSaveController } from "./save.js";
import { createSpriteController } from "./sprites.js";
import { createStoryController } from "./story.js";
import { createTileRenderer } from "./tiles.js";
import { createWorldController } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const canvasFrame = document.getElementById("canvas-frame");
const fullscreenToggle = document.getElementById("fullscreen-toggle");
const START_MENU_BACKGROUND_SOURCES = ["assets/menu.png", "assets/menu.svg"];
const START_MENU_BUTTONS = {
  x: 154,
  y: 364,
  width: 272,
  height: 36,
  gap: 12
};

const VIEW_COLS = Math.floor(canvas.width / TILE_SIZE);
const VIEW_ROWS = Math.floor(canvas.height / TILE_SIZE);

const keys = new Set();
let mouse = { x: 0, y: 0 };
const npcSpriteCache = new Map();

const startMenuBackground = {
  image: new Image(),
  ready: false
};
let startMenuBackgroundSourceIndex = 0;

startMenuBackground.image.decoding = "async";
startMenuBackground.image.fetchPriority = "high";

startMenuBackground.image.addEventListener("load", () => {
  startMenuBackground.ready = true;
});
startMenuBackground.image.addEventListener("error", () => {
  startMenuBackground.ready = false;
  startMenuBackgroundSourceIndex += 1;
  loadStartMenuBackground();
});

function loadStartMenuBackground() {
  const nextSource = START_MENU_BACKGROUND_SOURCES[startMenuBackgroundSourceIndex];
  if (!nextSource) return;
  startMenuBackground.ready = false;
  startMenuBackground.image.src = nextSource;
}

loadStartMenuBackground();

const gameState = {
  scene: "start",
  message: "Walk through tall grass to find a battle.",
  messageShownAt: performance.now(),
  encounterTransition: {
    active: false,
    startedAt: 0,
    duration: 1200,
    switchAt: 540,
    enemyName: ""
  },
  camera: { x: 0, y: 0 },
  startMenu: {
    index: 0
  },
  menu: {
    mode: "main",
    mainIndex: 0,
    partyIndex: 0
  },
  world: {
    currentMapId: "sunmeadow",
    camp: null,
    start: { mapId: "sunmeadow", x: 1, y: 1 }
  },
  player: {
    x: 1,
    y: 1,
    facing: "down",
    walkFrame: 0,
    lastMovedAt: 0,
    potions: 3,
    orbs: 5,
    wins: 0,
    maxMp: INITIAL_PLAYER_MAX_MP,
    mp: INITIAL_PLAYER_MAX_MP,
    mpRechargeStepProgress: 0,
    activeIndex: 0,
    party: [
      createCreatureInstance("Cubling", { nickname: "Rory", role: "Starter", captured: true })
    ]
  },
  battle: null,
  cutscene: null,
  ascensionSequence: null,
  moveLearning: null,
  pointerHotspot: null
};

const worldController = createWorldController({
  canvas,
  gameState,
  setMessage,
  clamp,
  onPlayerStep: rechargePlayerMp,
  onEncounter: () => battleController.beginEncounter()
});

const {
  currentMap,
  currentMapCols,
  currentMapRows,
  interactFacing,
  isWalkable,
  movePlayer,
  tileAt,
  updateCamera,
  worldToScreenX,
  worldToScreenY
} = worldController;

const spriteController = createSpriteController({
  ctx,
  getActiveCreature,
  drawRoundedRect,
  traceRoundedRectPath
});

const {
  drawCreatureSprite,
  drawPlayer,
  preloadCreatureSprite
} = spriteController;

const {
  drawMapTile
} = createTileRenderer({ ctx });

const ascensionCutsceneController = createAscensionCutsceneController({
  canvas,
  ctx,
  gameState,
  clearKeys: () => keys.clear(),
  setMessage,
  clamp,
  drawRoundedRect,
  drawText,
  wrapText,
  drawCreatureSprite,
  preloadCreatureSprite
});

const {
  advanceAscensionScene,
  drawAscensionScene,
  startAscensionSequence
} = ascensionCutsceneController;

const battleController = createBattleController({
  canvas,
  ctx,
  gameState,
  getMouse: () => mouse,
  getActiveCreature,
  createCreatureInstance,
  currentMap,
  setMessage,
  clamp,
  clearKeys: () => keys.clear(),
  drawRoundedRect,
  drawText,
  drawHpBar,
  drawCreatureSprite,
  startAscensionSequence,
  startMoveLearningSequence: (learnMoves, outcomeMessage, ascensionScenes = []) => {
    gameState.moveLearning = {
      queue: learnMoves,
      outcomeMessage,
      ascensionScenes,
      selectionIndex: 0
    };
    gameState.scene = "moveLearning";
  },
  onPartyFainted: startPartyFaintedCutscene
});

const saveController = createSaveController({
  gameState,
  createCreatureInstance,
  currentMap,
  isWalkable,
  updateCamera,
  setMessage,
  resetEncounterTransition,
  clamp
});

const storyController = createStoryController({
  canvas,
  ctx,
  gameState,
  cutscenes,
  drawRoundedRect,
  drawText,
  wrapText,
  onComplete: beginNewGame
});

function createCreatureInstance(species, overrides = {}) {
  const template = creatureTemplates[species];
  const level = Number.isFinite(overrides.level)
    ? clamp(Math.round(overrides.level), CREATURE_MIN_LEVEL, CREATURE_MAX_LEVEL)
    : CREATURE_MIN_LEVEL;
  const defaultXp = (level - CREATURE_MIN_LEVEL) * CREATURE_XP_PER_LEVEL;
  const maxCreatureXp = (CREATURE_MAX_LEVEL - CREATURE_MIN_LEVEL) * CREATURE_XP_PER_LEVEL;
  const xp = Number.isFinite(overrides.xp)
    ? clamp(Math.round(overrides.xp), 0, maxCreatureXp)
    : defaultXp;
  const leveledMaxHp = template.maxHp + (level - CREATURE_MIN_LEVEL) * CREATURE_HP_PER_LEVEL;
  const maxHp = Number.isFinite(overrides.maxHp) ? Math.max(1, Math.round(overrides.maxHp)) : leveledMaxHp;
  const moves = Array.isArray(overrides.moves)
    ? [...new Set(overrides.moves)].filter((moveId) => moveCatalog[moveId]).slice(0, MAX_CREATURE_MOVES)
    : defaultMovesForLevel(species, level);
  return {
    species: template.species,
    nickname: overrides.nickname || template.nickname,
    color: template.color,
    spritePath: template.spritePath,
    fallbackSpritePath: template.fallbackSpritePath,
    role: overrides.role || template.role,
    level,
    xp,
    maxHp,
    hp: Number.isFinite(overrides.hp) ? clamp(Math.round(overrides.hp), 0, maxHp) : maxHp,
    attackBoost: 0,
    moves: moves.length > 0 ? moves : [...template.moves].slice(0, MAX_CREATURE_MOVES),
    description: template.description,
    captured: overrides.captured ?? false
  };
}

function getActiveCreature() {
  return gameState.player.party[gameState.player.activeIndex];
}

function traceRoundedRectPath(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function setMessage(text) {
  gameState.message = text;
  gameState.messageShownAt = performance.now();
}

function resetEncounterTransition() {
  gameState.encounterTransition.active = false;
  gameState.encounterTransition.startedAt = 0;
  gameState.encounterTransition.enemyName = "";
}

function rechargePlayerMp() {
  if (gameState.player.mp >= gameState.player.maxMp) {
    gameState.player.mpRechargeStepProgress = 0;
    return;
  }

  const currentStepProgress = Number.isFinite(gameState.player.mpRechargeStepProgress)
    ? gameState.player.mpRechargeStepProgress
    : 0;
  gameState.player.mpRechargeStepProgress = currentStepProgress + 1;

  if (gameState.player.mpRechargeStepProgress < PLAYER_MP_RECHARGE_STEP_INTERVAL) {
    return;
  }

  const rechargeCount = Math.floor(gameState.player.mpRechargeStepProgress / PLAYER_MP_RECHARGE_STEP_INTERVAL);
  gameState.player.mp = clamp(
    gameState.player.mp + rechargeCount * PLAYER_MP_RECHARGE_AMOUNT,
    0,
    gameState.player.maxMp
  );
  gameState.player.mpRechargeStepProgress %= PLAYER_MP_RECHARGE_STEP_INTERVAL;

  if (gameState.player.mp >= gameState.player.maxMp) {
    gameState.player.mpRechargeStepProgress = 0;
  }
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await canvasFrame.requestFullscreen();
    }
  } catch {
    setMessage("Fullscreen is unavailable in this browser.");
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function menuOptions() {
  return ["Party", "Make Camp", "Save Game", "Export Save", "Import Save", "Close"];
}

function makeCamp() {
  if (tileAt(gameState.player.x, gameState.player.y) !== "G") {
    setMessage("Not a good spot to make camp.");
    closeMenu();
    return;
  }

  gameState.world.camp = {
    mapId: gameState.world.currentMapId,
    x: gameState.player.x,
    y: gameState.player.y
  };
  setMessage("Camp set. If your creature faints, you will return here.");
  closeMenu();
}

function startMenuOptions() {
  return saveController.isDatabaseAvailable()
    ? ["Start Adventure", "Load Adventure", "Import JSON Save"]
    : ["Start Local Adventure", "Import JSON Save", "Load Adventure"];
}

function beginNewGame() {
  gameState.scene = "world";
  setMessage(`Welcome to ${currentMap().name}.`);
  updateCamera();
}

function recoverPartyAfterFainting({ recoveryPoint, outcomeMessage }) {
  for (const creature of gameState.player.party) {
    creature.hp = creature.maxHp;
  }

  gameState.world.currentMapId = recoveryPoint.mapId;
  gameState.player.x = recoveryPoint.x;
  gameState.player.y = recoveryPoint.y;
  gameState.player.facing = "down";
  gameState.player.walkFrame = 0;
  gameState.player.lastMovedAt = 0;
  gameState.scene = "world";
  gameState.battle = null;
  gameState.pointerHotspot = null;
  resetEncounterTransition();
  updateCamera();

  if (outcomeMessage) {
    setMessage(outcomeMessage);
  }
}

function startPartyFaintedCutscene({ recoveryPoint, outcomeMessage }) {
  keys.clear();
  storyController.startCutscene("partyFainted", {
    onComplete: () => recoverPartyAfterFainting({ recoveryPoint, outcomeMessage })
  });
}

async function selectStartMenuOption(index) {
  const selected = startMenuOptions()[index];
  if (selected === "Start Adventure" || selected === "Start Local Adventure") {
    const accountCreated = await saveController.promptToCreateAccount();
    if (accountCreated) {
      storyController.startCutscene("intro");
    }
  } else if (selected === "Load Adventure") {
    const loadResult = await saveController.promptToLoadGame();
    if (loadResult === "fresh-start") {
      storyController.startCutscene("intro");
    }
  } else if (selected === "Import JSON Save") {
    await saveController.promptToImportSaveJson();
  }
}

function startMenuOptionAtPoint(x, y) {
  return startMenuOptions().findIndex((option, index) => {
    const buttonY = START_MENU_BUTTONS.y + index * (START_MENU_BUTTONS.height + START_MENU_BUTTONS.gap);
    return x >= START_MENU_BUTTONS.x
      && x <= START_MENU_BUTTONS.x + START_MENU_BUTTONS.width
      && y >= buttonY
      && y <= buttonY + START_MENU_BUTTONS.height;
  });
}

function handleStartMenuNavigation(key) {
  const options = startMenuOptions();

  if (key === "ArrowUp" || key === "w") {
    gameState.startMenu.index = (gameState.startMenu.index - 1 + options.length) % options.length;
  } else if (key === "ArrowDown" || key === "s") {
    gameState.startMenu.index = (gameState.startMenu.index + 1) % options.length;
  } else if (key === "Enter") {
    selectStartMenuOption(gameState.startMenu.index);
  }
}

function openMenu() {
  if (gameState.scene !== "world") return;
  gameState.scene = "menu";
  gameState.menu.mode = "main";
  gameState.menu.mainIndex = 0;
  gameState.menu.partyIndex = gameState.player.activeIndex;
}

function closeMenu() {
  gameState.scene = "world";
  gameState.menu.mode = "main";
  //setMessage("Back to exploring.");
}

function handleWorldInput() {
  if (gameState.scene !== "world") {
    keys.clear();
    return;
  }

  if (keys.has("ArrowUp") || keys.has("w")) {
    movePlayer(0, -1);
  } else if (keys.has("ArrowDown") || keys.has("s")) {
    movePlayer(0, 1);
  } else if (keys.has("ArrowLeft") || keys.has("a")) {
    movePlayer(-1, 0);
  } else if (keys.has("ArrowRight") || keys.has("d")) {
    movePlayer(1, 0);
  }

  keys.clear();
}

async function handleMenuNavigation(key) {
  if (gameState.scene !== "menu") return;

  if (gameState.menu.mode === "main") {
    const options = menuOptions();
    if (key === "ArrowUp" || key === "w") {
      gameState.menu.mainIndex = (gameState.menu.mainIndex - 1 + options.length) % options.length;
    } else if (key === "ArrowDown" || key === "s") {
      gameState.menu.mainIndex = (gameState.menu.mainIndex + 1) % options.length;
    } else if (key === "Enter") {
      const selected = options[gameState.menu.mainIndex];
      if (selected === "Party") {
        gameState.menu.mode = "party";
        gameState.menu.partyIndex = gameState.player.activeIndex;
        setMessage("Browsing your captured creatures.");
      } else if (selected === "Make Camp") {
        makeCamp();
      } else if (selected === "Save Game") {
        await saveController.saveGame();
      } else if (selected === "Export Save") {
        await saveController.exportSaveJson();
      } else if (selected === "Import Save") {
        await saveController.promptToImportSaveJson();
      } else {
        closeMenu();
      }
    } else if (key === "Backspace") {
      closeMenu();
    }
    return;
  }

  if (gameState.menu.mode === "party") {
    const partySize = gameState.player.party.length;
    if (key === "ArrowUp" || key === "w") {
      gameState.menu.partyIndex = (gameState.menu.partyIndex - 1 + partySize) % partySize;
    } else if (key === "ArrowDown" || key === "s") {
      gameState.menu.partyIndex = (gameState.menu.partyIndex + 1) % partySize;
    } else if (key === "Enter") {
      gameState.player.activeIndex = gameState.menu.partyIndex;
      const activeCreature = getActiveCreature();
      setMessage(`${activeCreature.nickname} is now leading your party.`);
    } else if (key === "Backspace") {
      gameState.menu.mode = "main";
    }
  }
}

function drawRoundedRect(x, y, width, height, radius, fill, stroke = null) {
  traceRoundedRectPath(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function drawText(text, x, y, options = {}) {
  ctx.fillStyle = options.color || "#2d1b14";
  ctx.font = options.font || "16px Outfit";
  ctx.textAlign = options.align || "left";
  ctx.fillText(text, x, y);
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (const word of words) {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      line = `${word} `;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line.trim(), x, y);
  }
}

function drawTrigger(trigger) {
  const px = worldToScreenX(trigger.x);
  const py = worldToScreenY(trigger.y);

  if (px + TILE_SIZE < 0 || py + TILE_SIZE < 0 || px > canvas.width || py > canvas.height) {
    return;
  }

  if (trigger.kind.startsWith("cave")) {
    ctx.fillStyle = "rgba(24, 19, 20, 0.24)";
    ctx.beginPath();
    ctx.ellipse(px + 24, py + 40, 21, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#5f6260";
    ctx.beginPath();
    ctx.moveTo(px + 5, py + 40);
    ctx.lineTo(px + 9, py + 24);
    ctx.quadraticCurveTo(px + 12, py + 9, px + 26, py + 7);
    ctx.quadraticCurveTo(px + 40, py + 10, px + 43, py + 25);
    ctx.lineTo(px + 46, py + 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#363a3d";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#2d3134";
    ctx.beginPath();
    ctx.moveTo(px + 14, py + 40);
    ctx.lineTo(px + 16, py + 27);
    ctx.quadraticCurveTo(px + 24, py + 14, px + 33, py + 27);
    ctx.lineTo(px + 36, py + 40);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#111314";
    ctx.beginPath();
    ctx.moveTo(px + 18, py + 40);
    ctx.lineTo(px + 19, py + 30);
    ctx.quadraticCurveTo(px + 24, py + 22, px + 30, py + 30);
    ctx.lineTo(px + 32, py + 40);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(210, 219, 198, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 12, py + 24);
    ctx.lineTo(px + 20, py + 16);
    ctx.moveTo(px + 34, py + 17);
    ctx.lineTo(px + 39, py + 28);
    ctx.stroke();

    drawRoundedRect(px + 8, py + 38, 36, 5, 0, "#3f443f");
  } else {
    drawRoundedRect(px + 8, py + 29, TILE_SIZE - 16, 13, 0, "#8b5f3d", "#4e2d1f");
    drawRoundedRect(px + 11, py + 32, TILE_SIZE - 22, 3, 0, "rgba(255, 221, 166, 0.22)");
    drawRoundedRect(px + 11, py + 38, TILE_SIZE - 22, 2, 0, "rgba(55, 32, 20, 0.28)");

    ctx.strokeStyle = "rgba(55, 32, 20, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + 15, py + 35);
    ctx.lineTo(px + TILE_SIZE - 15, py + 35);
    ctx.moveTo(px + 15, py + 39);
    ctx.lineTo(px + TILE_SIZE - 15, py + 39);
    ctx.stroke();
  }
}

function drawSign(sign) {
  const px = worldToScreenX(sign.x);
  const py = worldToScreenY(sign.y);
  if (px + TILE_SIZE < 0 || py + TILE_SIZE < 0 || px > canvas.width || py > canvas.height) return;

  drawRoundedRect(px + 22, py + 24, 5, 21, 0, "#6d4b2f", "#4e2d1f");
  drawRoundedRect(px + 10, py + 10, 28, 18, 0, "#b8834f", "#5b3723");
  drawRoundedRect(px + 13, py + 13, 22, 3, 0, "rgba(255, 222, 164, 0.3)");
  drawRoundedRect(px + 13, py + 23, 22, 3, 0, "rgba(73, 43, 25, 0.22)");

  ctx.strokeStyle = "rgba(73, 43, 25, 0.34)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + 16, py + 19);
  ctx.lineTo(px + 32, py + 19);
  ctx.stroke();

  drawText("!", px + 24, py + 24, { align: "center", font: "12px 'Press Start 2P'", color: "#fff1cd" });
}

function drawCamp(camp) {
  if (!camp || camp.mapId !== gameState.world.currentMapId) return;

  const px = worldToScreenX(camp.x);
  const py = worldToScreenY(camp.y);
  if (px + TILE_SIZE < 0 || py + TILE_SIZE < 0 || px > canvas.width || py > canvas.height) return;

  ctx.fillStyle = "rgba(45, 27, 20, 0.25)";
  ctx.beginPath();
  ctx.ellipse(px + 24, py + 40, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#6d4b2f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + 8, py + 40);
  ctx.lineTo(px + 24, py + 10);
  ctx.lineTo(px + 40, py + 40);
  ctx.moveTo(px + 24, py + 10);
  ctx.lineTo(px + 24, py + 42);
  ctx.stroke();

  ctx.fillStyle = "#d96459";
  ctx.beginPath();
  ctx.moveTo(px + 7, py + 39);
  ctx.quadraticCurveTo(px + 14, py + 24, px + 24, py + 11);
  ctx.lineTo(px + 24, py + 40);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#6d2d24";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#f3a65a";
  ctx.beginPath();
  ctx.moveTo(px + 24, py + 11);
  ctx.quadraticCurveTo(px + 35, py + 24, px + 41, py + 39);
  ctx.lineTo(px + 24, py + 40);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#8f332b";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#4e2d1f";
  ctx.beginPath();
  ctx.moveTo(px + 21, py + 40);
  ctx.lineTo(px + 24, py + 25);
  ctx.lineTo(px + 30, py + 40);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 241, 205, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + 13, py + 35);
  ctx.quadraticCurveTo(px + 17, py + 25, px + 23, py + 16);
  ctx.moveTo(px + 31, py + 25);
  ctx.quadraticCurveTo(px + 35, py + 31, px + 38, py + 37);
  ctx.stroke();

  drawRoundedRect(px + 5, py + 39, 38, 4, 0, "#6d4b2f");
  drawRoundedRect(px + 9, py + 42, 5, 3, 0, "#c8553d");
  drawRoundedRect(px + 34, py + 42, 5, 3, 0, "#c8553d");
}

function drawFurniture(furniture) {
  const px = worldToScreenX(furniture.x);
  const py = worldToScreenY(furniture.y);
  const width = (furniture.width || 1) * TILE_SIZE;
  const height = (furniture.height || 1) * TILE_SIZE;

  if (px + width < 0 || py + height < 0 || px > canvas.width || py > canvas.height) return;

  ctx.fillStyle = "rgba(45, 27, 20, 0.24)";
  ctx.beginPath();
  ctx.ellipse(px + width / 2, py + height - 7, Math.max(14, width / 2 - 7), 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (furniture.type === "bed") {
    drawRoundedRect(px + 5, py + 6, width - 10, height - 13, 7, "#7a5434", "#4e2d1f");
    drawRoundedRect(px + 10, py + 10, width - 20, 17, 6, "#fff1cd", "#c8a46a");
    drawRoundedRect(px + 10, py + 27, width - 20, height - 39, 5, "#4f9fd8", "#2f5f83");
    drawRoundedRect(px + 14, py + 34, width - 28, 6, 0, "rgba(255, 255, 255, 0.24)");
    return;
  }

  if (furniture.type === "shelf") {
    drawRoundedRect(px + 4, py + 5, width - 8, height - 10, 4, "#7a5434", "#4e2d1f");
    drawRoundedRect(px + 8, py + 12, width - 16, 5, 0, "#4e2d1f");
    drawRoundedRect(px + 8, py + height - 19, width - 16, 5, 0, "#4e2d1f");

    const bookColors = ["#c8553d", "#3d8f6f", "#f0c15f", "#4d9a63", "#7f4f9f"];
    for (let i = 0; i < Math.floor((width - 16) / 8); i += 1) {
      const bookX = px + 10 + i * 8;
      drawRoundedRect(bookX, py + 18, 5, height - 37, 0, bookColors[i % bookColors.length]);
    }
    return;
  }

  if (furniture.type === "cabinet") {
    drawRoundedRect(px + 7, py + 4, width - 14, height - 8, 5, "#8b5f3d", "#4e2d1f");
    ctx.strokeStyle = "rgba(78, 45, 31, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + width / 2, py + 8);
    ctx.lineTo(px + width / 2, py + height - 10);
    ctx.stroke();
    drawRoundedRect(px + width / 2 - 8, py + height / 2, 4, 4, 0, "#f0c15f");
    drawRoundedRect(px + width / 2 + 4, py + height / 2, 4, 4, 0, "#f0c15f");
    drawRoundedRect(px + 12, py + 9, width - 24, 5, 0, "rgba(255, 221, 166, 0.2)");
    return;
  }

  if (furniture.type === "table" || furniture.type === "mapTable") {
    drawRoundedRect(px + 10, py + 29, 7, height - 36, 0, "#5b3723");
    drawRoundedRect(px + width - 17, py + 29, 7, height - 36, 0, "#5b3723");
    drawRoundedRect(px + 5, py + 11, width - 10, 23, 5, "#9c6644", "#4e2d1f");
    drawRoundedRect(px + 9, py + 15, width - 18, 5, 0, "rgba(255, 221, 166, 0.28)");

    if (furniture.type === "mapTable") {
      drawRoundedRect(px + 18, py + 17, width - 36, 11, 1, "#e8d6aa", "#7a5434");
      ctx.strokeStyle = "rgba(64, 92, 76, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 22, py + 24);
      ctx.quadraticCurveTo(px + width / 2, py + 14, px + width - 24, py + 23);
      ctx.stroke();
    } else {
      drawRoundedRect(px + width - 22, py + 17, 8, 9, 3, "#c8e6f5", "#4f6f7c");
    }
    return;
  }

  if (furniture.type === "stove") {
    drawRoundedRect(px + 9, py + 6, width - 18, height - 13, 5, "#4a4f50", "#242829");
    drawRoundedRect(px + 14, py + 14, width - 28, 13, 4, "#262b2c", "#111314");
    drawRoundedRect(px + 16, py + height - 24, width - 32, 11, 3, "#5f6260", "#242829");
    drawRoundedRect(px + width / 2 - 5, py + 2, 10, 12, 2, "#363a3d", "#1f2224");
    ctx.strokeStyle = "rgba(255, 241, 205, 0.24)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 17, py + 19);
    ctx.lineTo(px + width - 17, py + 19);
    ctx.stroke();
    return;
  }

  const cols = furniture.width || 1;
  const rows = furniture.height || 1;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const crateX = px + x * TILE_SIZE + 7;
      const crateY = py + y * TILE_SIZE + 6;
      drawRoundedRect(crateX, crateY, TILE_SIZE - 14, TILE_SIZE - 12, 3, "#b8834f", "#5b3723");
      ctx.strokeStyle = "rgba(91, 55, 35, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(crateX + 4, crateY + 4);
      ctx.lineTo(crateX + TILE_SIZE - 18, crateY + TILE_SIZE - 16);
      ctx.moveTo(crateX + TILE_SIZE - 18, crateY + 4);
      ctx.lineTo(crateX + 4, crateY + TILE_SIZE - 16);
      ctx.stroke();
    }
  }
}

function drawBuilding(building) {
  const px = worldToScreenX(building.x);
  const py = worldToScreenY(building.y);
  const width = building.width * TILE_SIZE;
  const height = building.height * TILE_SIZE;
  const doorX = building.door ? worldToScreenX(building.door.x) + 11 : px + width / 2 - 13;
  const doorY = building.door ? worldToScreenY(building.door.y) + 6 : py + height - 48;
  const wallColor = building.wallColor || "#f3d49a";
  const trimColor = building.trimColor || "#6d4b2f";
  const roofColor = building.roofColor || "#b93c2f";
  const roofTrimColor = building.roofTrimColor || "#6d2d24";

  if (px + width < 0 || py + height < 0 || px > canvas.width || py > canvas.height) return;

  drawRoundedRect(px + 10, py + height - 10, width - 20, 8, 0, "rgba(45, 27, 20, 0.22)");
  drawRoundedRect(px + 6, py + 22, width - 12, height - 28, 0, wallColor, trimColor);

  ctx.strokeStyle = "rgba(109, 75, 47, 0.28)";
  ctx.lineWidth = 2;
  for (let y = py + 38; y < py + height - 14; y += 14) {
    ctx.beginPath();
    ctx.moveTo(px + 9, y);
    ctx.lineTo(px + width - 9, y + ((y / 14) % 2 === 0 ? 1 : -1));
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 244, 198, 0.28)";
  ctx.fillRect(px + 13, py + 28, width - 26, 7);
  ctx.fillStyle = "rgba(92, 55, 35, 0.14)";
  ctx.fillRect(px + 9, py + height - 24, width - 18, 10);

  drawRoundedRect(px + 6, py + 6, width - 12, 34, 0, roofColor, roofTrimColor);

  ctx.strokeStyle = "rgba(255, 215, 141, 0.34)";
  ctx.lineWidth = 3;
  for (let x = px + 14; x < px + width - 18; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, py + 10);
    ctx.lineTo(x + 16, py + 36);
    ctx.stroke();
  }

  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(px + 8, py + 32);
  ctx.lineTo(px + width / 2, py + 2);
  ctx.lineTo(px + width - 8, py + 32);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = roofTrimColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 221, 151, 0.32)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + 19, py + 30);
  ctx.lineTo(px + width / 2, py + 9);
  ctx.lineTo(px + width - 19, py + 30);
  ctx.stroke();

  drawRoundedRect(doorX, doorY, 26, 42, 0, "#845535", "#4e2d1f");
  ctx.strokeStyle = "rgba(78, 45, 31, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(doorX + 13, doorY + 4);
  ctx.lineTo(doorX + 13, doorY + 38);
  ctx.moveTo(doorX + 4, doorY + 18);
  ctx.lineTo(doorX + 22, doorY + 18);
  ctx.stroke();
  drawRoundedRect(doorX + 18, doorY + 22, 4, 4, 0, "#f0c15f");

  const windowXs = width < 144 ? [px + width - 46] : [px + 22, px + width - 46];
  for (const windowX of windowXs) {
    drawRoundedRect(windowX, py + 54, 24, 22, 0, "#9fd7ff", "#4f6f7c");
    ctx.strokeStyle = "rgba(47, 77, 89, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(windowX + 12, py + 55);
    ctx.lineTo(windowX + 12, py + 75);
    ctx.moveTo(windowX + 1, py + 65);
    ctx.lineTo(windowX + 23, py + 65);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
    ctx.fillRect(windowX + 4, py + 57, 7, 5);
  }

  const signText = typeof building.sign === "string" ? building.sign.trim() : "";
  if (signText) {
    let signFontSize = 8;
    let signFont = `${signFontSize}px 'Press Start 2P'`;
    const maxSignWidth = Math.max(42, width - 28);
    const maxTextWidth = maxSignWidth - 12;
    ctx.font = signFont;
    let measuredTextWidth = ctx.measureText(signText).width;

    while (signFontSize > 5 && measuredTextWidth > maxTextWidth) {
      signFontSize -= 1;
      signFont = `${signFontSize}px 'Press Start 2P'`;
      ctx.font = signFont;
      measuredTextWidth = ctx.measureText(signText).width;
    }

    const signWidth = clamp(measuredTextWidth + 18, 42, maxSignWidth);
    drawRoundedRect(px + width / 2 - signWidth / 2, py + 36, signWidth, 16, 0, "#fff1cd", "#6d4b2f");

    ctx.save();
    ctx.translate(px + width / 2, py + 48);
    ctx.scale(Math.min(1, (signWidth - 12) / measuredTextWidth), 1);
    drawText(signText, 0, 0, { align: "center", font: signFont, color: "#6d4b2f" });
    ctx.restore();
  }
}

function createCirclePatrolPath(npc) {
  const requestedRadius = Number.isFinite(npc.patrol.radius) ? npc.patrol.radius : 1;
  const radius = Math.max(1, Math.round(requestedRadius));
  const topY = npc.y;
  const centerX = npc.x;
  const centerY = npc.y + radius;
  const path = [];

  for (let x = centerX; x <= centerX + radius; x += 1) {
    path.push({ x, y: topY });
  }

  for (let y = topY + 1; y <= centerY + radius; y += 1) {
    path.push({ x: centerX + radius, y });
  }

  for (let x = centerX + radius - 1; x >= centerX - radius; x -= 1) {
    path.push({ x, y: centerY + radius });
  }

  for (let y = centerY + radius - 1; y >= topY; y -= 1) {
    path.push({ x: centerX - radius, y });
  }

  for (let x = centerX - radius + 1; x < centerX; x += 1) {
    path.push({ x, y: topY });
  }

  return path;
}

function npcPatrolPath(npc) {
  if (!npc.patrol) return null;

  if (Array.isArray(npc.patrol.path)) {
    const path = npc.patrol.path
      .map((point) => {
        if (!point || typeof point !== "object") return null;

        return {
          x: Number.isFinite(point.x) ? Math.round(point.x) : npc.x + Math.round(point.dx || 0),
          y: Number.isFinite(point.y) ? Math.round(point.y) : npc.y + Math.round(point.dy || 0)
        };
      })
      .filter(Boolean)
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

    return path.length > 1 ? path : null;
  }

  if (npc.patrol.shape === "circle") {
    return createCirclePatrolPath(npc);
  }

  return null;
}

function facingForStep(dx, dy, fallback = "down") {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
  if (dy !== 0) return dy < 0 ? "up" : "down";
  return fallback;
}

function npcPatrolState(npc) {
  if (!npc.patrol) {
    return { x: npc.x, y: npc.y, facing: "down", frame: 0 };
  }

  const steps = Math.max(1, npc.patrol.steps || 1);
  const intervalMs = Math.max(120, npc.patrol.intervalMs || 700);
  const now = performance.now();
  const path = npcPatrolPath(npc);

  if (!npc._patrolState) {
    npc._patrolState = {
      x: npc.x,
      y: npc.y,
      offset: 0,
      direction: -1,
      pathIndex: 0,
      facing: "down",
      frame: 0,
      lastStepAt: now
    };

    if (path) {
      npc._patrolState.x = path[0].x;
      npc._patrolState.y = path[0].y;
    }
  }

  const state = npc._patrolState;
  if (now - state.lastStepAt < intervalMs) {
    return state;
  }

  if (path) {
    const nextPathIndex = (state.pathIndex + 1) % path.length;
    const nextPoint = path[nextPathIndex];
    const nextFacing = facingForStep(nextPoint.x - state.x, nextPoint.y - state.y, state.facing);

    state.facing = nextFacing;

    if (gameState.player.x === nextPoint.x && gameState.player.y === nextPoint.y) {
      state.frame = 0;
      state.lastStepAt = now;
      return state;
    }

    state.x = nextPoint.x;
    state.y = nextPoint.y;
    state.pathIndex = nextPathIndex;
    state.frame = (state.frame + 1) % 3;
    state.lastStepAt = now;
    return state;
  }

  const nextDirection =
    (state.offset <= -steps && state.direction < 0) || (state.offset >= 0 && state.direction > 0)
      ? state.direction * -1
      : state.direction;
  const nextOffset = state.offset + nextDirection;
  const nextX = npc.patrol.axis === "x" ? npc.x + nextOffset : npc.x;
  const nextY = npc.patrol.axis === "x" ? npc.y : npc.y + nextOffset;
  const nextFacing = facingForStep(nextX - state.x, nextY - state.y, state.facing);

  state.facing = nextFacing;
  state.direction = nextDirection;

  if (gameState.player.x === nextX && gameState.player.y === nextY) {
    state.frame = 0;
    state.lastStepAt = now;
    return state;
  }

  state.x = nextX;
  state.y = nextY;
  state.offset = nextOffset;
  state.frame = (state.frame + 1) % 3;
  state.lastStepAt = now;
  return state;
}

function drawNpc(npc) {
  const patrolState = npcPatrolState(npc);
  const px = worldToScreenX(patrolState.x);
  const py = worldToScreenY(patrolState.y);

  if (px + TILE_SIZE < 0 || py + TILE_SIZE < 0 || px > canvas.width || py > canvas.height) return;

  if (npc.spritePath) {
    let spriteRecord = npcSpriteCache.get(npc.spritePath);
    if (!spriteRecord) {
      spriteRecord = { image: new Image(), ready: false, failed: false };
      spriteRecord.image.addEventListener("load", () => {
        spriteRecord.ready = true;
      });
      spriteRecord.image.addEventListener("error", () => {
        spriteRecord.failed = true;
      });
      spriteRecord.image.src = npc.spritePath;
      npcSpriteCache.set(npc.spritePath, spriteRecord);
    }

    if (spriteRecord.ready) {
      const frameSize = 48;
      const facingRows = { down: 0, left: 1, right: 2, up: 3 };
      const frameColumn = Math.min(patrolState.frame, Math.max(0, Math.floor(spriteRecord.image.naturalWidth / frameSize) - 1));
      const frameRow = facingRows[patrolState.facing] ?? facingRows.down;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        spriteRecord.image,
        frameColumn * frameSize,
        frameRow * frameSize,
        frameSize,
        frameSize,
        px,
        py,
        TILE_SIZE,
        TILE_SIZE
      );
      ctx.restore();
      drawText("?", px + 24, py + 7, { align: "center", font: "13px 'Press Start 2P'", color: "#fff1cd" });
      return;
    }
  }

  drawRoundedRect(px + 13, py + 12, 22, 20, 10, "#f5c79c", "#6d4b2f");
  drawRoundedRect(px + 11, py + 28, 26, 17, 8, "#3d8f6f", "#245441");
  drawRoundedRect(px + 14, py + 8, 20, 10, 6, "#6d4b2f");
  drawText("?", px + 24, py + 7, { align: "center", font: "13px 'Press Start 2P'", color: "#fff1cd" });
}

function drawWorld() {
  updateCamera();

  const map = currentMap();
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, map.palette.top);
  gradient.addColorStop(1, map.palette.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const startCol = Math.floor(gameState.camera.x / TILE_SIZE);
  const endCol = Math.min(currentMapCols(), startCol + VIEW_COLS + 2);
  const startRow = Math.floor(gameState.camera.y / TILE_SIZE);
  const endRow = Math.min(currentMapRows(), startRow + VIEW_ROWS + 2);

  for (let y = startRow; y < endRow; y += 1) {
    for (let x = startCol; x < endCol; x += 1) {
      drawMapTile(
        tileAt(x, y),
        worldToScreenX(x),
        worldToScreenY(y),
        x,
        y,
        map.mapType
      );
    }
  }

  for (const trigger of map.triggers || []) {
    drawTrigger(trigger);
  }

  for (const building of map.buildings || []) {
    drawBuilding(building);
  }

  for (const furniture of map.furniture || []) {
    drawFurniture(furniture);
  }

  for (const sign of map.signs || []) {
    drawSign(sign);
  }

  drawCamp(gameState.world.camp);

  for (const npc of map.npcs || []) {
    drawNpc(npc);
  }

  const playerX = worldToScreenX(gameState.player.x);
  const playerY = worldToScreenY(gameState.player.y);
  drawPlayer(gameState.player, playerX, playerY);

  const elapsed = performance.now() - gameState.messageShownAt;
  let messageOpacity = 1;
  if (elapsed > 4000) {
    messageOpacity = Math.max(0, 1 - (elapsed - 4000) / 1000);
  }

  if (messageOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = messageOpacity;
    drawRoundedRect(16, canvas.height - 116, canvas.width - 32, 100, 18, "rgba(255, 248, 238, 0.92)", "#3d271d");
    drawText(currentMap().name, 38, canvas.height - 82, { font: "14px 'Press Start 2P'", color: "#b93c2f" });
    ctx.font = "18px Outfit";
    ctx.fillStyle = "#694435";
    wrapText(gameState.message, 38, canvas.height - 50, canvas.width - 76, 24);
    ctx.restore();
  }

  drawRoundedRect(canvas.width - 280, 18, 262, 106, 18, "rgba(255, 248, 238, 0.45)", "#3d271d");
  drawText(getActiveCreature().nickname, canvas.width - 258, 44, { font: "14px 'Press Start 2P'" });
  drawText(`HP ${getActiveCreature().hp}/${getActiveCreature().maxHp}`, canvas.width - 258, 68, { font: "17px Outfit", color: "#2a7f62" });
  drawText(`MP ${gameState.player.mp}/${gameState.player.maxMp}`, canvas.width - 150, 68, { font: "17px Outfit", color: "#3d5afe" });
  drawText(`Party ${gameState.player.party.length}`, canvas.width - 258, 90, { font: "17px Outfit" });
  drawText(`Orbs ${gameState.player.orbs}`, canvas.width - 150, 90, { font: "17px Outfit", color: "#9c6644" });
  drawText("Enter: Menu", canvas.width - 258, 112, { font: "15px Outfit", color: "#b93c2f" });
}

function drawHpBar(x, y, width, value, max, color) {
  drawRoundedRect(x, y, width, 16, 8, "#f2ddd0");
  drawRoundedRect(x + 2, y + 2, (width - 4) * (value / max), 12, 6, color);
}

function drawCoverImage(image) {
  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;
  ctx.drawImage(image, x, y, width, height);
}

function drawStartMenuBackground() {
  if (startMenuBackground.ready && startMenuBackground.image.naturalWidth > 0) {
    drawCoverImage(startMenuBackground.image);
    return true;
  }

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#f6d365");
  sky.addColorStop(0.52, "#f5a16c");
  sky.addColorStop(1, "#c8553d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 249, 241, 0.18)";
  ctx.beginPath();
  ctx.arc(170, 120, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(820, 98, 92, 0, Math.PI * 2);
  ctx.fill();
  return false;
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function easeInCubic(value) {
  return value ** 3;
}

function drawEncounterTransition() {
  const transition = gameState.encounterTransition;
  if (!transition.active) {
    gameState.scene = "battle";
    battleController.drawBattle();
    return;
  }

  const elapsed = performance.now() - transition.startedAt;
  const progress = clamp(elapsed / transition.duration, 0, 1);
  const switchProgress = clamp(elapsed / transition.switchAt, 0, 1);
  const showBattleScene = elapsed >= transition.switchAt;

  if (showBattleScene) {
    battleController.drawBattle();
  } else {
    drawWorld();
  }

  const flashOpacity = Math.max(0, 0.95 - switchProgress * 1.25);
  if (flashOpacity > 0) {
    ctx.fillStyle = `rgba(255, 250, 240, ${flashOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const coverProgress = progress < 0.5
    ? easeOutCubic(progress / 0.5)
    : 1 - easeInCubic((progress - 0.5) / 0.5);
  const bandCount = 10;
  const bandHeight = Math.ceil(canvas.height / bandCount);

  for (let index = 0; index < bandCount; index += 1) {
    const width = canvas.width * coverProgress;
    const x = index % 2 === 0 ? 0 : canvas.width - width;
    const y = index * bandHeight;
    const fill = index % 2 === 0 ? "#20110d" : "#5c2f1d";
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width, bandHeight + 2);
  }

  if (coverProgress > 0.2) {
    const labelOpacity = clamp((coverProgress - 0.2) / 0.25, 0, 1) * (showBattleScene ? 1 - (progress - 0.5) / 0.5 : 1);
    const labelScale = 0.92 + coverProgress * 0.1;

    ctx.save();
    ctx.globalAlpha = labelOpacity;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(labelScale, labelScale);
    drawRoundedRect(-190, -40, 380, 80, 24, "rgba(255, 245, 233, 0.95)", "#3d271d");
    drawText("Battle!", 0, -2, { align: "center", font: "18px 'Press Start 2P'", color: "#b93c2f" });
    drawText(transition.enemyName, 0, 26, { align: "center", font: "20px Outfit", color: "#694435" });
    ctx.restore();
  }

  if (progress >= 1) {
    resetEncounterTransition();
    gameState.scene = "battle";
    battleController.beginPlayerTurn();
  }
}

function drawMenuOverlay() {
  ctx.fillStyle = "rgba(38, 24, 18, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState.menu.mode === "main") {
    const options = menuOptions();
    const optionGap = 46;
    const menuHeight = 94 + options.length * optionGap;
    drawRoundedRect(canvas.width - 250, 28, 210, menuHeight, 18, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Menu", canvas.width - 220, 58, { font: "14px 'Press Start 2P'", color: "#b93c2f" });
    options.forEach((option, index) => {
      const selected = index === gameState.menu.mainIndex;
      const optionY = 78 + index * optionGap;
      drawRoundedRect(
        canvas.width - 226,
        optionY,
        162,
        36,
        12,
        selected ? "#c8553d" : "#fff4e6",
        "#3d271d"
      );
      drawText(option, canvas.width - 198, optionY + 24, {
        font: "10px 'Press Start 2P'",
        color: selected ? "#fff8f0" : "#2d1b14"
      });
    });
    drawText("Enter: choose", canvas.width - 220, menuHeight + 2, { font: "14px Outfit", color: "#694435" });
    return;
  }

  drawRoundedRect(42, 40, 876, 492, 22, "rgba(255, 250, 243, 0.98)", "#3d271d");
  drawText("Party", 76, 74, { font: "16px 'Press Start 2P'", color: "#b93c2f" });
  drawText("Enter: lead   Backspace: back", 632, 74, { font: "16px Outfit", color: "#694435" });

  gameState.player.party.forEach((creature, index) => {
    const selected = index === gameState.menu.partyIndex;
    const active = index === gameState.player.activeIndex;
    const cardY = 104 + index * 82;
    drawRoundedRect(68, cardY, 378, 64, 14, selected ? "#f3a65a" : "#fff5ea", "#3d271d");
    drawCreatureSprite(creature, 84, cardY + 6, 58, 52, {
      frameColor: creature.color,
      padding: 5,
      radius: 16
    });
    drawText(creature.nickname, 150, cardY + 24, { font: "12px 'Press Start 2P'", color: selected ? "#fff8f0" : "#2d1b14" });
    drawText(`${creature.species}  Lv ${creature.level}`, 150, cardY + 48, {
      font: "16px Outfit",
      color: selected ? "#fff8f0" : "#694435"
    });
    drawText(`HP ${creature.hp}/${creature.maxHp}`, 328, cardY + 48, {
      font: "16px Outfit",
      color: selected ? "#fff8f0" : "#2a7f62",
      align: "right"
    });
    if (active) {
      drawText("LEAD", 394, cardY + 24, {
        font: "12px 'Press Start 2P'",
        color: selected ? "#fff8f0" : "#b93c2f",
        align: "right"
      });
    }
  });

  const viewedCreature = gameState.player.party[gameState.menu.partyIndex];
  const xpProgress = viewedCreature.level >= CREATURE_MAX_LEVEL
    ? "MAX"
    : `${viewedCreature.xp % CREATURE_XP_PER_LEVEL}/${CREATURE_XP_PER_LEVEL}`;
  drawRoundedRect(484, 104, 398, 388, 16, "#fff7ef", "#3d271d");
  drawCreatureSprite(viewedCreature, 602, 124, 164, 150, {
    frameColor: viewedCreature.color,
    padding: 10,
    radius: 30
  });
  drawText(viewedCreature.nickname, 516, 300, { font: "14px 'Press Start 2P'" });
  drawText(viewedCreature.species, 516, 332, { font: "20px Outfit", color: "#694435" });
  drawText(`Level ${viewedCreature.level}  XP ${xpProgress}`, 516, 360, { font: "18px Outfit", color: "#2a7f62" });
  drawText(`Role: ${viewedCreature.role}`, 516, 388, { font: "17px Outfit", color: "#694435" });
  drawText(`Moves: ${viewedCreature.moves.map((moveId) => moveCatalog[moveId].name).join(", ")}`, 516, 420, {
    font: "17px Outfit",
    color: "#694435"
  });
  ctx.font = "18px Outfit";
  ctx.fillStyle = "#694435";
  wrapText(viewedCreature.description, 516, 456, 324, 24);
}

function drawStartMenu() {
  const hasBackgroundArtwork = drawStartMenuBackground();

  if (!hasBackgroundArtwork) {
    drawRoundedRect(84, 70, 792, 184, 28, "rgba(255, 248, 238, 0.9)", "#3d271d");
    drawText("Orb Bound", 480, 138, { font: "34px 'Press Start 2P'", color: "#b93c2f", align: "center" });
    drawText("A meadow-born creature RPG", 480, 186, { font: "24px Outfit", color: "#694435", align: "center" });
    drawText("Explore, battle, capture, and uncover connected maps.", 480, 222, {
      font: "20px Outfit",
      color: "#694435",
      align: "center"
    });
  }

  drawRoundedRect(126, 314, 330, 190, 20, "rgba(255, 248, 238, 0.94)", "#1c2634");
  drawText("Start Menu", 166, 348, { font: "15px 'Press Start 2P'", color: "#1c2634" });

  startMenuOptions().forEach((option, index) => {
    const selected = index === gameState.startMenu.index;
    const buttonY = START_MENU_BUTTONS.y + index * (START_MENU_BUTTONS.height + START_MENU_BUTTONS.gap);
    drawRoundedRect(START_MENU_BUTTONS.x, buttonY, START_MENU_BUTTONS.width, START_MENU_BUTTONS.height, 14, selected ? "#f9d85d" : "#fff3e2", "#1c2634");
    drawText(option, 182, buttonY + 24, {
      font: "10px 'Press Start 2P'",
      color: selected ? "#1c2634" : "#2d1b14"
    });
  });

  drawRoundedRect(504, 314, 332, 176, 20, "rgba(255, 248, 238, 0.9)", "#1c2634");
  drawText("Controls", 540, 350, { font: "15px 'Press Start 2P'", color: "#1c2634" });
  drawText("Move", 540, 392, { font: "20px Outfit", color: "#694435" });
  drawText("WASD / Arrow Keys", 800, 392, { font: "20px Outfit", color: "#2d1b14", align: "right" });
  drawText("Select", 540, 430, { font: "20px Outfit", color: "#694435" });
  drawText("Enter / Click", 800, 430, { font: "20px Outfit", color: "#2d1b14", align: "right" });
  drawText("Fullscreen", 540, 468, { font: "20px Outfit", color: "#694435" });
  drawText("F", 800, 468, { font: "20px Outfit", color: "#2d1b14", align: "right" });

  drawRoundedRect(104, 522, 752, 34, 14, "rgba(28, 38, 52, 0.58)");
  drawText("Start fresh, load from database, or import a JSON backup.", 480, 544, {
    font: "18px Outfit",
    color: "#fff8f0",
    align: "center"
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState.scene === "start") {
    drawStartMenu();
  } else if (gameState.scene === "cutscene") {
    storyController.drawCutscene();
  } else if (gameState.scene === "ascension") {
    drawAscensionScene();
  } else if (gameState.scene === "moveLearning") {
    battleController.drawMoveLearning();
  } else if (gameState.scene === "encounter") {
    drawEncounterTransition();
  } else if (gameState.scene === "battle") {
    battleController.drawBattle();
  } else {
    drawWorld();
    if (gameState.scene === "menu") {
      drawMenuOverlay();
    }
  }

  requestAnimationFrame(render);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const movementKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"];
  const interactionKeys = [" ", "Spacebar"];

  if (key === "f") {
    toggleFullscreen();
    event.preventDefault();
    return;
  }

  if (gameState.scene === "start") {
    if (["ArrowUp", "ArrowDown", "w", "s", "Enter"].includes(key)) {
      handleStartMenuNavigation(key);
      event.preventDefault();
    }
    return;
  }

  if (gameState.scene === "cutscene") {
    if (key === "Enter") {
      storyController.advanceCutscene();
      event.preventDefault();
    }
    return;
  }

  if (gameState.scene === "ascension") {
    if (key === "Enter") {
      advanceAscensionScene();
    }
    if (movementKeys.includes(key) || ["Enter", "Backspace"].includes(key)) {
      event.preventDefault();
    }
    return;
  }

  if (gameState.scene === "moveLearning") {
    if (movementKeys.includes(key) || ["Enter", "Backspace"].includes(key)) {
      battleController.handleMoveLearningNavigation(key);
      event.preventDefault();
    }
    return;
  }

  if (key === "Enter" && gameState.scene === "world") {
    openMenu();
    event.preventDefault();
    return;
  }

  if (interactionKeys.includes(event.key) && gameState.scene === "world") {
    interactFacing();
    event.preventDefault();
    return;
  }

  if (gameState.scene === "menu") {
    if (movementKeys.includes(key) || ["Enter", "Backspace"].includes(key)) {
      handleMenuNavigation(key);
      event.preventDefault();
    }
    return;
  }

  if (gameState.scene === "encounter") {
    if (movementKeys.includes(key) || ["Enter", "Backspace"].includes(key)) {
      event.preventDefault();
    }
    return;
  }

  if (gameState.scene === "battle") {
    if (movementKeys.includes(key) || key === "Enter") {
      battleController.handleBattleNavigation(key);
      event.preventDefault();
    }
    return;
  }

  if (movementKeys.includes(key)) {
    keys.add(key);
    event.preventDefault();
  }
});

function canvasPointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

window.addEventListener("mousemove", (event) => {
  mouse = canvasPointFromEvent(event);

  if (gameState.scene === "start") {
    const hoveredStartMenuOption = startMenuOptionAtPoint(mouse.x, mouse.y);
    if (hoveredStartMenuOption >= 0) {
      gameState.startMenu.index = hoveredStartMenuOption;
    }
    return;
  }

  if (gameState.scene !== "battle" || !gameState.battle) return;

  const hoveredIndex = gameState.battle.buttons.findIndex((button) =>
    mouse.x >= button.x
    && mouse.x <= button.x + button.width
    && mouse.y >= button.y
    && mouse.y <= button.y + button.height
  );

  if (hoveredIndex >= 0) {
    gameState.battle.selectionIndex = hoveredIndex;
  }
});

canvas.addEventListener("click", (event) => {
  mouse = canvasPointFromEvent(event);

  if (gameState.scene === "start") {
    const clickedStartMenuOption = startMenuOptionAtPoint(mouse.x, mouse.y);
    if (clickedStartMenuOption >= 0) {
      gameState.startMenu.index = clickedStartMenuOption;
      selectStartMenuOption(clickedStartMenuOption);
    }
    return;
  }

  if (gameState.scene !== "battle" || !gameState.pointerHotspot || gameState.battle.turn !== "player") {
    return;
  }

  battleController.playerAction(gameState.pointerHotspot);
});

fullscreenToggle.addEventListener("click", () => {
  toggleFullscreen();
});

document.addEventListener("fullscreenchange", () => {
  fullscreenToggle.textContent = document.fullscreenElement ? "X" : "Fullscreen";
});

updateCamera();
saveController.canUseDatabaseSaves().then((available) => {
  setMessage(available
    ? "Database saves available. Start or load your adventure."
    : "Static mode: use local adventure and JSON save import/export.");
});
setInterval(handleWorldInput, 250);
render();
