import { TILE_SIZE } from "./constants.js";
import { createBattleController } from "./battle.js";
import { cutscenes } from "./cutscenes.js";
import { creatureTemplates } from "./creatures.js";
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

const VIEW_COLS = Math.floor(canvas.width / TILE_SIZE);
const VIEW_ROWS = Math.floor(canvas.height / TILE_SIZE);

const keys = new Set();
let mouse = { x: 0, y: 0 };

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
  cutscene: null,
  pointerHotspot: null
};

const worldController = createWorldController({
  canvas,
  gameState,
  setMessage,
  clamp,
  onEncounter: () => battleController.beginEncounter()
});

const {
  currentMap,
  currentMapCols,
  currentMapRows,
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
  drawPlayer
} = spriteController;

const {
  drawMapTile
} = createTileRenderer({ ctx });

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
      storyController.startCutscene("intro");
    } else if (selected === "Load Adventure") {
      saveController.promptToLoadGame();
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
        await saveController.exportSaveJson();
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

  for (const trigger of map.triggers) {
    drawTrigger(trigger);
  }

  for (const sign of map.signs) {
    drawSign(sign);
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
  } else if (gameState.scene === "cutscene") {
    storyController.drawCutscene();
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

  if (gameState.scene === "cutscene") {
    if (key === "Enter") {
      storyController.advanceCutscene();
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
setInterval(handleWorldInput, 250);
render();
