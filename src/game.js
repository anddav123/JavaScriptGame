import {
  CREATURE_SPRITE_SIZE,
  PLAYER_FACING_ROWS,
  PLAYER_SPRITE_FRAME_SIZE,
  PLAYER_SPRITE_PATH,
  SAVE_VERSION,
  TILE_SIZE
} from "./constants.js";
import { createBattleController } from "./battle.js";
import { creatureTemplates } from "./creatures.js";
import { worldMaps } from "./maps.js";
import { moveCatalog } from "./moves.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const canvasFrame = document.getElementById("canvas-frame");
const fullscreenToggle = document.getElementById("fullscreen-toggle");

const VIEW_COLS = Math.floor(canvas.width / TILE_SIZE);
const VIEW_ROWS = Math.floor(canvas.height / TILE_SIZE);

const keys = new Set();
let mouse = { x: 0, y: 0 };
let playerSpriteReady = false;
const creatureSpriteRegistry = {};

const playerSprite = new Image();
playerSprite.src = PLAYER_SPRITE_PATH;
playerSprite.addEventListener("load", () => {
  playerSpriteReady = true;
});
playerSprite.addEventListener("error", () => {
  playerSpriteReady = false;
});

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
    currentMapId: "sunmeadow"
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
    activeIndex: 0,
    party: [
      createCreatureInstance("Roselle", { nickname: "Roselle", role: "Starter", captured: true })
    ]
  },
  battle: null,
  pointerHotspot: null
};

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
  drawCreatureSprite
});

function createCreatureInstance(species, overrides = {}) {
  const template = creatureTemplates[species];
  return {
    species: template.species,
    nickname: overrides.nickname || template.nickname,
    color: template.color,
    spritePath: template.spritePath,
    role: overrides.role || template.role,
    maxHp: overrides.maxHp || template.maxHp,
    hp: overrides.hp || template.maxHp,
    attackBoost: 0,
    moves: [...template.moves],
    description: template.description,
    captured: overrides.captured ?? false
  };
}

function getActiveCreature() {
  return gameState.player.party[gameState.player.activeIndex];
}

function ensureCreatureSprite(species) {
  if (creatureSpriteRegistry[species]) return creatureSpriteRegistry[species];

  const template = creatureTemplates[species];
  if (!template?.spritePath) {
    creatureSpriteRegistry[species] = { image: null, ready: false };
    return creatureSpriteRegistry[species];
  }

  const image = new Image();
  const spriteSources = [template.spritePath, template.fallbackSpritePath].filter(Boolean);
  const spriteRecord = {
    image,
    ready: false,
    usesPixelArtScaling: false
  };
  let sourceIndex = 0;

  function loadNextSource() {
    const nextSource = spriteSources[sourceIndex];
    if (!nextSource) {
      spriteRecord.ready = false;
      return;
    }

    image.src = nextSource;
  }

  image.addEventListener("load", () => {
    spriteRecord.ready = true;
    spriteRecord.usesPixelArtScaling = image.src.toLowerCase().endsWith(".svg");
  });
  image.addEventListener("error", () => {
    sourceIndex += 1;
    loadNextSource();
  });

  loadNextSource();
  creatureSpriteRegistry[species] = spriteRecord;
  return spriteRecord;
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

function drawCreatureSprite(creature, x, y, width, height, options = {}) {
  const { flip = false, frameColor = creature.color, padding = 10, radius = 24 , border = true} = options;
  const spriteRecord = ensureCreatureSprite(creature.species || creature.name);

  if(border) {
    drawRoundedRect(x, y, width, height, radius, frameColor, "#ffffff");
  }

  if (!spriteRecord.ready) {
    drawRoundedRect(
      x + padding,
      y + padding,
      Math.max(18, width - padding * 2),
      Math.max(18, height - padding * 2),
      Math.max(10, radius - 8),
      "rgba(255, 243, 231, 0.88)"
    );
    return;
  }

  const innerX = x + padding;
  const innerY = y + padding;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const sourceWidth = spriteRecord.image.naturalWidth || CREATURE_SPRITE_SIZE;
  const sourceHeight = spriteRecord.image.naturalHeight || CREATURE_SPRITE_SIZE;
  const scale = Math.min(innerWidth / sourceWidth, innerHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const offsetX = innerX + (innerWidth - drawWidth) / 2;
  const offsetY = innerY + (innerHeight - drawHeight) / 2;

  ctx.save();
  ctx.imageSmoothingEnabled = !spriteRecord.usesPixelArtScaling;
  traceRoundedRectPath(innerX, innerY, innerWidth, innerHeight, Math.max(10, radius - 8));
  ctx.clip();

  if (flip) {
    ctx.translate(offsetX + drawWidth, offsetY);
    ctx.scale(-1, 1);
    ctx.drawImage(spriteRecord.image, 0, 0, drawWidth, drawHeight);
    ctx.restore();
    return;
  }

  ctx.drawImage(spriteRecord.image, offsetX, offsetY, drawWidth, drawHeight);
  ctx.restore();
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

function currentMap() {
  return worldMaps[gameState.world.currentMapId];
}

function currentMapCols() {
  return currentMap().terrain[0].length;
}

function currentMapRows() {
  return currentMap().terrain.length;
}

function isValidMapId(mapId) {
  return typeof mapId === "string" && Boolean(worldMaps[mapId]);
}

function normalizeCreatureSave(creature, index) {
  if (!creature || typeof creature !== "object" || typeof creature.species !== "string" || !creatureTemplates[creature.species]) {
    throw new Error(`Party member ${index + 1} is invalid.`);
  }

  const template = creatureTemplates[creature.species];
  return createCreatureInstance(creature.species, {
    nickname: typeof creature.nickname === "string" && creature.nickname.trim() ? creature.nickname.trim() : template.nickname,
    role: typeof creature.role === "string" && creature.role.trim() ? creature.role.trim() : template.role,
    maxHp: Number.isFinite(creature.maxHp) ? Math.max(1, Math.round(creature.maxHp)) : template.maxHp,
    hp: Number.isFinite(creature.hp) ? Math.max(0, Math.round(creature.hp)) : template.maxHp,
    captured: Boolean(creature.captured)
  });
}

function serializeGameState() {
  return {
    saveVersion: SAVE_VERSION,
    world: {
      currentMapId: gameState.world.currentMapId
    },
    player: {
      x: gameState.player.x,
      y: gameState.player.y,
      facing: gameState.player.facing,
      potions: gameState.player.potions,
      orbs: gameState.player.orbs,
      wins: gameState.player.wins,
      activeIndex: gameState.player.activeIndex,
      party: gameState.player.party.map((creature) => ({
        species: creature.species,
        nickname: creature.nickname,
        role: creature.role,
        maxHp: creature.maxHp,
        hp: creature.hp,
        captured: creature.captured
      }))
    }
  };
}

async function exportSaveJson() {
  if (gameState.scene === "battle") {
    setMessage("Finish the battle before saving.");
    return false;
  }

  const saveJson = JSON.stringify(serializeGameState(), null, 2);

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(saveJson);
      setMessage("Save JSON copied to your clipboard.");
      return true;
    } catch (error) {
      // Fall back to a prompt when clipboard permissions are unavailable.
    }
  }

  window.prompt("Copy your save JSON:", saveJson);
  setMessage("Save JSON ready to copy.");
  return true;
}

function importSaveJson(saveJson) {
  let parsedSave;
  try {
    parsedSave = JSON.parse(saveJson);
  } catch (error) {
    throw new Error("That save data is not valid JSON.");
  }

  if (!parsedSave || typeof parsedSave !== "object") {
    throw new Error("Save data must be a JSON object.");
  }

  if (parsedSave.saveVersion !== SAVE_VERSION) {
    throw new Error("This save version is not supported.");
  }

  if (!isValidMapId(parsedSave.world?.currentMapId)) {
    throw new Error("Save data references an unknown map.");
  }

  if (!Array.isArray(parsedSave.player?.party) || parsedSave.player.party.length === 0) {
    throw new Error("Save data must include at least one party member.");
  }

  const party = parsedSave.player.party.map((creature, index) => normalizeCreatureSave(creature, index));
  const activeIndex = Number.isInteger(parsedSave.player.activeIndex)
    ? clamp(parsedSave.player.activeIndex, 0, party.length - 1)
    : 0;
  const facing = PLAYER_FACING_ROWS[parsedSave.player.facing] !== undefined ? parsedSave.player.facing : "down";
  const nextPlayer = {
    ...gameState.player,
    x: Number.isInteger(parsedSave.player.x) ? parsedSave.player.x : 1,
    y: Number.isInteger(parsedSave.player.y) ? parsedSave.player.y : 1,
    facing,
    walkFrame: 0,
    lastMovedAt: 0,
    potions: Number.isFinite(parsedSave.player.potions) ? Math.max(0, Math.round(parsedSave.player.potions)) : 0,
    orbs: Number.isFinite(parsedSave.player.orbs) ? Math.max(0, Math.round(parsedSave.player.orbs)) : 0,
    wins: Number.isFinite(parsedSave.player.wins) ? Math.max(0, Math.round(parsedSave.player.wins)) : 0,
    activeIndex,
    party
  };

  const previousMapId = gameState.world.currentMapId;
  gameState.world.currentMapId = parsedSave.world.currentMapId;
  if (!isWalkable(nextPlayer.x, nextPlayer.y)) {
    gameState.world.currentMapId = previousMapId;
    throw new Error("Save position is blocked on that map.");
  }

  gameState.player = nextPlayer;
  gameState.scene = "world";
  gameState.menu.mode = "main";
  gameState.menu.mainIndex = 0;
  gameState.menu.partyIndex = activeIndex;
  gameState.startMenu.index = 0;
  gameState.battle = null;
  gameState.pointerHotspot = null;
  resetEncounterTransition();
  updateCamera();
  setMessage(`Adventure resumed in ${currentMap().name}.`);
}

function promptToLoadGame() {
  const saveJson = window.prompt("Paste your save JSON to resume:");
  if (saveJson === null) return;

  try {
    importSaveJson(saveJson);
  } catch (error) {
    window.alert(error.message || "Unable to load that save.");
  }
}

function worldPixelWidth() {
  return currentMapCols() * TILE_SIZE;
}

function worldPixelHeight() {
  return currentMapRows() * TILE_SIZE;
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

function tileAt(x, y) {
  if (y < 0 || y >= currentMapRows() || x < 0 || x >= currentMapCols()) return "W";
  return currentMap().terrain[y][x];
}

function isWalkable(x, y) {
  return tileAt(x, y) !== "W";
}

function getSignAt(x, y) {
  return currentMap().signs.find((sign) => sign.x === x && sign.y === y);
}

function getTriggerAt(x, y) {
  return currentMap().triggers.find((trigger) => trigger.x === x && trigger.y === y);
}

function worldToScreenX(tileX) {
  return tileX * TILE_SIZE - gameState.camera.x;
}

function worldToScreenY(tileY) {
  return tileY * TILE_SIZE - gameState.camera.y;
}

function updateCamera() {
  const targetX = gameState.player.x * TILE_SIZE + TILE_SIZE / 2 - canvas.width / 2;
  const targetY = gameState.player.y * TILE_SIZE + TILE_SIZE / 2 - canvas.height / 2;
  gameState.camera.x = clamp(targetX, 0, Math.max(0, worldPixelWidth() - canvas.width));
  gameState.camera.y = clamp(targetY, 0, Math.max(0, worldPixelHeight() - canvas.height));
}

function menuOptions() {
  return ["Party", "Save Game", "Close"];
}

function startMenuOptions() {
  return ["Start Adventure", "Load Adventure"];
}

function beginNewGame() {
  gameState.scene = "world";
  setMessage(`Welcome to ${currentMap().name}.`);
  updateCamera();
}

function handleStartMenuNavigation(key) {
  const options = startMenuOptions();

  if (key === "ArrowUp" || key === "w") {
    gameState.startMenu.index = (gameState.startMenu.index - 1 + options.length) % options.length;
  } else if (key === "ArrowDown" || key === "s") {
    gameState.startMenu.index = (gameState.startMenu.index + 1) % options.length;
  } else if (key === "Enter") {
    const selected = options[gameState.startMenu.index];
    if (selected === "Start Adventure") {
      beginNewGame();
    } else if (selected === "Load Adventure") {
      promptToLoadGame();
    } 
  }
}

function openMenu() {
  if (gameState.scene !== "world") return;
  gameState.scene = "menu";
  gameState.menu.mode = "main";
  gameState.menu.mainIndex = 0;
  gameState.menu.partyIndex = gameState.player.activeIndex;
  //setMessage("Trainer menu opened.");
}

function closeMenu() {
  gameState.scene = "world";
  gameState.menu.mode = "main";
  //setMessage("Back to exploring.");
}

function enterTrigger(trigger) {
  gameState.world.currentMapId = trigger.targetMap;
  gameState.player.x = trigger.targetX;
  gameState.player.y = trigger.targetY;
  updateCamera();
  setMessage(trigger.message);
}

function movePlayer(dx, dy) {
  if (gameState.scene !== "world") return;
  if (dx < 0) {
    gameState.player.facing = "left";
  } else if (dx > 0) {
    gameState.player.facing = "right";
  } else if (dy < 0) {
    gameState.player.facing = "up";
  } else if (dy > 0) {
    gameState.player.facing = "down";
  }

  const targetX = gameState.player.x + dx;
  const targetY = gameState.player.y + dy;

  if (!isWalkable(targetX, targetY)) {
    setMessage("Unable to go this way.");
    return;
  }

  gameState.player.x = targetX;
  gameState.player.y = targetY;
  gameState.player.walkFrame = gameState.player.walkFrame === 1 ? 2 : 1;
  gameState.player.lastMovedAt = performance.now();
  updateCamera();

  const trigger = getTriggerAt(targetX, targetY);
  if (trigger) {
    enterTrigger(trigger);
    return;
  }

  const sign = getSignAt(targetX, targetY);
  if (sign) {
    setMessage(sign.text);
    return;
  }

  if (tileAt(targetX, targetY) === "T" && Math.random() < currentMap().encounterRate) {
    battleController.beginEncounter();
    return;
  }

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
      } else if (selected === "Save Game") {
        await exportSaveJson();
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
      setMessage("Trainer menu opened.");
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

function drawMapTile(tile, px, py) {
  //draw wall
  if (tile === "W") {
    drawRoundedRect(px, py, TILE_SIZE, TILE_SIZE, 10, "#6f7a6a");
    drawRoundedRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12, 8, "#8d9987");
    return;
  }
  
  //draw road
  if (tile === "R") {
    drawRoundedRect(px, py, TILE_SIZE, TILE_SIZE, 0, "#e8c096");
    ctx.strokeStyle = "#a8a8a3";
    ctx.lineWidth = 1;

    // Top line
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + TILE_SIZE, py);
    ctx.stroke();

    // Vertical middle line
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + TILE_SIZE/2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px + TILE_SIZE/2, py + TILE_SIZE/2);
    ctx.lineTo(px + TILE_SIZE/2, py + TILE_SIZE);
    ctx.stroke();

    // Horizontal middle line
    ctx.beginPath();
    ctx.moveTo(px, py + TILE_SIZE/2 );
    ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE/2);
    ctx.stroke();

    // Bottom line
    ctx.beginPath();
    ctx.moveTo(px, py + TILE_SIZE);
    ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
    ctx.stroke();
  
    return;
  }

  drawRoundedRect(px, py, TILE_SIZE, TILE_SIZE, 10, "#88cf8b");

  if (tile === "T") {
    for (let blade = 0; blade < 5; blade += 1) {
      const bladeX = px + 8 + blade * 7;
      ctx.strokeStyle = blade % 2 === 0 ? "#327f4a" : "#3ea65a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bladeX, py + TILE_SIZE - 10);
      ctx.lineTo(bladeX + 3, py + 16 + (blade % 2) * 8);
      ctx.stroke();
    }
    return;
  } 
  
}

function drawTrigger(trigger) {
  const px = worldToScreenX(trigger.x);
  const py = worldToScreenY(trigger.y);

  if (px + TILE_SIZE < 0 || py + TILE_SIZE < 0 || px > canvas.width || py > canvas.height) {
    return;
  }

  if (trigger.kind.startsWith("cave")) {
    drawRoundedRect(px + 6, py + 8, TILE_SIZE - 12, TILE_SIZE - 12, 12, "#4b3a3d", "#c6a56b");
    drawRoundedRect(px + 14, py + 18, TILE_SIZE - 28, TILE_SIZE - 22, 8, "#181314");
  } else {
    drawRoundedRect(px + 10, py + 6, TILE_SIZE - 20, TILE_SIZE - 12, 8, "#d9ba84", "#6d4b2f");
    drawRoundedRect(px + 18, py + 18, TILE_SIZE - 36, TILE_SIZE - 24, 4, "#845535");
  }
}

function drawSign(sign) {
  const px = worldToScreenX(sign.x) + 12;
  const py = worldToScreenY(sign.y) + 10;
  if (px + 24 < 0 || py + 28 < 0 || px > canvas.width || py > canvas.height) return;
  drawRoundedRect(px, py, 24, 28, 8, "#fff1cd", "#815b2e");
  drawText("!", px + 12, py + 19, { align: "center", font: "18px 'Press Start 2P'", color: "#b93c2f" });
}

function drawPlayer(px, py) {
  const isSpriteUsable =
    playerSpriteReady &&
    playerSprite.complete &&
    playerSprite.naturalWidth >= PLAYER_SPRITE_FRAME_SIZE * 3 &&
    playerSprite.naturalHeight >= PLAYER_SPRITE_FRAME_SIZE * 4;

  if (!isSpriteUsable) {
    drawRoundedRect(px + 8, py + 5, 32, 38, 14, "#ffffff", getActiveCreature().color);
    drawRoundedRect(px + 12, py + 9, 24, 30, 12, getActiveCreature().color);
    drawRoundedRect(px + 16, py + 13, 16, 10, 4, "#fff0d8");
    return;
  }

  const facingRow = PLAYER_FACING_ROWS[gameState.player.facing] ?? PLAYER_FACING_ROWS.down;
  const isIdle = performance.now() - gameState.player.lastMovedAt > 180;
  const frameColumn = isIdle ? 0 : gameState.player.walkFrame;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    playerSprite,
    frameColumn * PLAYER_SPRITE_FRAME_SIZE,
    facingRow * PLAYER_SPRITE_FRAME_SIZE,
    PLAYER_SPRITE_FRAME_SIZE,
    PLAYER_SPRITE_FRAME_SIZE,
    px,
    py,
    TILE_SIZE,
    TILE_SIZE
  );
  ctx.restore();
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
      drawMapTile(tileAt(x, y), worldToScreenX(x), worldToScreenY(y));
    }
  }

  for (const trigger of map.triggers) {
    drawTrigger(trigger);
  }

  for (const sign of map.signs) {
    drawSign(sign);
  }

  const playerX = worldToScreenX(gameState.player.x);
  const playerY = worldToScreenY(gameState.player.y);
  drawPlayer(playerX, playerY);

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
  drawText(`Party ${gameState.player.party.length}`, canvas.width - 258, 90, { font: "17px Outfit" });
  drawText(`Orbs ${gameState.player.orbs}`, canvas.width - 150, 90, { font: "17px Outfit", color: "#9c6644" });
  drawText("Enter: Menu", canvas.width - 258, 112, { font: "15px Outfit", color: "#b93c2f" });
}

function drawHpBar(x, y, width, value, max, color) {
  drawRoundedRect(x, y, width, 16, 8, "#f2ddd0");
  drawRoundedRect(x + 2, y + 2, (width - 4) * (value / max), 12, 6, color);
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
  }
}

function drawMenuOverlay() {
  ctx.fillStyle = "rgba(38, 24, 18, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState.menu.mode === "main") {
    const options = menuOptions();
    drawRoundedRect(canvas.width - 250, 28, 210, 250, 18, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Menu", canvas.width - 220, 58, { font: "14px 'Press Start 2P'", color: "#b93c2f" });
    options.forEach((option, index) => {
      const selected = index === gameState.menu.mainIndex;
      drawRoundedRect(
        canvas.width - 226,
        78 + index * 58,
        162,
        44,
        12,
        selected ? "#c8553d" : "#fff4e6",
        "#3d271d"
      );
      drawText(option, canvas.width - 198, 107 + index * 58, {
        font: "12px 'Press Start 2P'",
        color: selected ? "#fff8f0" : "#2d1b14"
      });
    });
    drawText("Enter: choose", canvas.width - 220, 260, { font: "14px Outfit", color: "#694435" });
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
    drawText(`${creature.species}  ${creature.role}`, 150, cardY + 48, {
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
  drawRoundedRect(484, 104, 398, 388, 16, "#fff7ef", "#3d271d");
  drawCreatureSprite(viewedCreature, 602, 124, 164, 150, {
    frameColor: viewedCreature.color,
    padding: 10,
    radius: 30
  });
  drawText(viewedCreature.nickname, 516, 300, { font: "14px 'Press Start 2P'" });
  drawText(viewedCreature.species, 516, 332, { font: "20px Outfit", color: "#694435" });
  drawText(`Role: ${viewedCreature.role}`, 516, 360, { font: "18px Outfit", color: "#2a7f62" });
  drawText(`Moves: ${viewedCreature.moves.map((moveId) => moveCatalog[moveId].name).join(", ")}`, 516, 392, {
    font: "17px Outfit",
    color: "#694435"
  });
  ctx.font = "18px Outfit";
  ctx.fillStyle = "#694435";
  wrapText(viewedCreature.description, 516, 428, 324, 24);
}

function drawStartMenu() {
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

  drawRoundedRect(84, 70, 792, 184, 28, "rgba(255, 248, 238, 0.9)", "#3d271d");
  drawText("Orb Bound", 480, 138, { font: "34px 'Press Start 2P'", color: "#b93c2f", align: "center" });
  drawText("A meadow-born creature RPG", 480, 186, { font: "24px Outfit", color: "#694435", align: "center" });
  drawText("Explore, battle, capture, and uncover connected maps.", 480, 222, {
    font: "20px Outfit",
    color: "#694435",
    align: "center"
  });

  drawRoundedRect(124, 294, 332, 204, 24, "rgba(255, 248, 238, 0.96)", "#3d271d");
  drawText("Start Menu", 166, 332, { font: "16px 'Press Start 2P'", color: "#b93c2f" });

  startMenuOptions().forEach((option, index) => {
    const selected = index === gameState.startMenu.index;
    drawRoundedRect(154, 358 + index * 52, 272, 40, 14, selected ? "#c8553d" : "#fff3e2", "#3d271d");
    drawText(option, 182, 384 + index * 52, {
      font: "12px 'Press Start 2P'",
      color: selected ? "#fff8f0" : "#2d1b14"
    });
  });

  drawRoundedRect(496, 294, 340, 204, 24, "rgba(255, 248, 238, 0.96)", "#3d271d");
  drawText("Controls", 532, 332, { font: "16px 'Press Start 2P'", color: "#2a7f62" });
  drawText("Move", 532, 374, { font: "20px Outfit", color: "#694435" });
  drawText("WASD / Arrow Keys", 800, 374, { font: "20px Outfit", color: "#2d1b14", align: "right" });
  drawText("Menu", 532, 410, { font: "20px Outfit", color: "#694435" });
  drawText("Enter", 800, 410, { font: "20px Outfit", color: "#2d1b14", align: "right" });
  drawText("Fullscreen", 532, 446, { font: "20px Outfit", color: "#694435" });
  drawText("F", 800, 446, { font: "20px Outfit", color: "#2d1b14", align: "right" });
  drawText("Select", 532, 482, { font: "20px Outfit", color: "#694435" });
  drawText("Enter", 800, 482, { font: "20px Outfit", color: "#2d1b14", align: "right" });

  drawRoundedRect(104, 522, 752, 34, 14, "rgba(58, 30, 22, 0.42)");
  drawText("Start fresh or load a JSON save to continue.", 480, 544, {
    font: "18px Outfit",
    color: "#fff8f0",
    align: "center"
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState.scene === "start") {
    drawStartMenu();
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

  if (key === "Enter" && gameState.scene === "world") {
    openMenu();
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

window.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse = {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };

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

canvas.addEventListener("click", () => {
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
setInterval(handleWorldInput, 150);
render();
