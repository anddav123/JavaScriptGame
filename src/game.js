import {
  CREATURE_HP_PER_LEVEL,
  CREATURE_MAX_LEVEL,
  CREATURE_MIN_LEVEL,
  CREATURE_XP_PER_LEVEL,
  INITIAL_PLAYER_MAX_MP,
  INITIAL_PLAYER_ORBS,
  INITIAL_PLAYER_POTIONS,
  PLAYER_PARTY_MAX_SIZE,
  PLAYER_MP_RECHARGE_AMOUNT,
  PLAYER_MP_RECHARGE_STEP_INTERVAL,
  TILE_SIZE
} from "./constants.js";
import { createAscensionCutsceneController } from "./ascensionCutscene.js";
import { createBattleController } from "./battle.js";
import { createCampMenuController } from "./campMenu.js";
import { createCanvasUi } from "./canvasUi.js";
import { cutscenes } from "./cutscenes.js";
import { creatureTemplates, defaultMovesForLevel, MAX_CREATURE_MOVES } from "./creatures.js";
import { createMenuController } from "./menu.js";
import { moveCatalog } from "./moves.js";
import { createNonPlayerCharacterController } from "./nonPlayerCharacter.js";
import { createSaveController } from "./save.js";
import { createSpriteController } from "./sprites.js";
import { createStartMenuController } from "./startMenu.js";
import { createStoryController } from "./story.js";
import { createTileRenderer } from "./tiles.js";
import { createWorldController } from "./world.js";
import { createWorldObjectRenderer } from "./worldObjects.js";
import { getTypeColor } from "./types.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const canvasFrame = document.getElementById("canvas-frame");
const fullscreenToggle = document.getElementById("fullscreen-toggle");

const VIEW_COLS = Math.floor(canvas.width / TILE_SIZE);
const VIEW_ROWS = Math.floor(canvas.height / TILE_SIZE);

const keys = new Set();
let mouse = { x: 0, y: 0 };

const {
  drawCoverImage,
  drawHpBar,
  drawRoundedRect,
  drawText,
  traceRoundedRectPath,
  wrapText
} = createCanvasUi({ canvas, ctx });

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
  campMenu: {
    mode: "main",
    mainIndex: 0,
    storedIndex: 0,
    partyIndex: 0,
    selectedStoredIndex: null,
    pendingCreature: null
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
    potions: INITIAL_PLAYER_POTIONS,
    orbs: INITIAL_PLAYER_ORBS,
    wins: 0,
    maxMp: INITIAL_PLAYER_MAX_MP,
    mp: INITIAL_PLAYER_MAX_MP,
    mpRechargeStepProgress: 0,
    activeIndex: 0,
    campCreatures: [],
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
  onEncounter: () => battleController.beginEncounter(),
  onCampInteract: () => openCampMenu()
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
  drawCampMenuOverlay,
  handleCampMenuNavigation,
  openCampMenu,
  openCampStorageFullMenu
} = createCampMenuController({
  canvas,
  ctx,
  gameState,
  setMessage,
  clamp,
  drawCreatureSprite,
  drawRoundedRect,
  drawText,
  wrapText
});

const {
  drawMapTile
} = createTileRenderer({ ctx });

const {
  drawWorldObjects
} = createWorldObjectRenderer({
  canvas,
  ctx,
  worldToScreenX,
  worldToScreenY,
  clamp,
  drawRoundedRect,
  drawText
});

const {
  drawNpcs
} = createNonPlayerCharacterController({
  canvas,
  ctx,
  gameState,
  worldToScreenX,
  worldToScreenY,
  drawRoundedRect,
  drawText
});

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
  onCampStorageFull: openCampStorageFullMenu,
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

const {
  drawMenuOverlay,
  handleMenuNavigation,
  openMenu
} = createMenuController({
  canvas,
  ctx,
  gameState,
  saveController,
  tileAt,
  getActiveCreature,
  setMessage,
  drawCreatureSprite,
  drawRoundedRect,
  drawText,
  wrapText
});

const {
  drawStartMenu,
  handleStartMenuNavigation,
  selectStartMenuOption,
  startMenuOptionAtPoint
} = createStartMenuController({
  canvas,
  ctx,
  gameState,
  saveController,
  beginIntroCutscene: () => storyController.startCutscene("intro"),
  drawCoverImage,
  drawRoundedRect,
  drawText
});

storyController.schedulePreloadCutsceneImages();

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
    color: template.color ?? getTypeColor(template.type),
    type: template.type,
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

function beginNewGame() {
  gameState.scene = "world";
  setMessage(`Welcome to ${currentMap().name}.`);
  updateCamera();
}

function recoverPartyAfterFainting({ recoveryPoint, outcomeMessage }) {
  for (const creature of gameState.player.party) {
    creature.hp = creature.maxHp;
  }
  gameState.player.mp = gameState.player.maxMp;
  gameState.player.mpRechargeStepProgress = 0;

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

  drawWorldObjects(map);

  drawCamp(gameState.world.camp);

  drawNpcs(map.npcs);

  const playerX = worldToScreenX(gameState.player.x);
  const playerY = worldToScreenY(gameState.player.y);
  drawPlayer(gameState.player, playerX, playerY);

  const elapsed = performance.now() - gameState.messageShownAt;
  let messageOpacity = 1;
  if (elapsed > 2000) {
    messageOpacity = Math.max(0, 1 - (elapsed - 2000) / 1000);
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
  drawText(`Party ${gameState.player.party.length}/${PLAYER_PARTY_MAX_SIZE}`, canvas.width - 258, 90, { font: "17px Outfit" });
  drawText(`Orbs ${gameState.player.orbs}`, canvas.width - 150, 90, { font: "17px Outfit", color: "#9c6644" });
  drawText("Enter: Menu", canvas.width - 258, 112, { font: "15px Outfit", color: "#b93c2f" });
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
    } else if (gameState.scene === "campMenu") {
      drawCampMenuOverlay();
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

  if (gameState.scene === "campMenu") {
    if (movementKeys.includes(key) || ["Enter", "Backspace"].includes(key)) {
      handleCampMenuNavigation(key);
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
