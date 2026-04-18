const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const canvasFrame = document.getElementById("canvas-frame");
const fullscreenToggle = document.getElementById("fullscreen-toggle");

const TILE_SIZE = 48;
const VIEW_COLS = Math.floor(canvas.width / TILE_SIZE);
const VIEW_ROWS = Math.floor(canvas.height / TILE_SIZE);

const keys = new Set();
let mouse = { x: 0, y: 0 };

const moveCatalog = {
  ember: { name: "Ember", power: 16, accuracy: 0.92, color: "#ef6c3e" },
  vineSnap: { name: "Vine Snap", power: 14, accuracy: 0.95, color: "#2d8f64" },
  iceShard: { name: "Ice Shard", power: 25, accuracy: 0.5, color: "#9af0f0" },
  focus: { name: "Focus", power: 0, accuracy: 1, color: "#6c5ce7", buff: 5 },
  tonic: { name: "Tonic", power: 0, accuracy: 1, color: "#2a9d8f", heal: 16 }
};

const creatureTemplates = {
  Pyrel: {
    species: "Pyrel",
    nickname: "Pyrel",
    color: "#d64545",
    role: "Starter",
    maxHp: 58,
    moves: ["ember", "vineSnap", "focus", "tonic"],
    description: "A warm-hearted ember fox that leads the party into danger."
  },
  Mossling: {
    species: "Mossling",
    nickname: "Mossling",
    color: "#4d9a63",
    role: "Wildling",
    maxHp: 42,
    moves: ["vineSnap", "focus"],
    description: "A shy meadow creature that hides in moss and strikes with vines."
  },
  Cindercub: {
    species: "Cindercub",
    nickname: "Cindercub",
    color: "#d15b38",
    role: "Wildling",
    maxHp: 40,
    moves: ["ember", "focus"],
    description: "A fierce cub whose paws glow after every sprint."
  },
  Ripplefin: {
    species: "Ripplefin",
    nickname: "Ripplefin",
    color: "#4d77b4",
    role: "Wildling",
    maxHp: 44,
    moves: ["vineSnap", "tonic", "iceShard"],
    description: "A calm river spirit that mends itself between attacks."
  }
};

const enemyTemplates = Object.values(creatureTemplates)
  .filter((creature) => creature.species !== "Pyrel")
  .map((creature) => ({
    name: creature.species,
    color: creature.color,
    maxHp: creature.maxHp,
    moves: creature.moves
  }));

const worldMaps = {
  sunmeadow: {
    name: "Sunmeadow",
    palette: { top: "#78c98b", bottom: "#5ea96f" },
    encounterRate: 0.24,
    terrain: [
      "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WRRGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGW",
      "WRRTTTTGGGGGGGGGGGGGGTTTTGGGGGGGGGGGGGGGGGGGGGGGGGGGTTTTTTTWWGGGGGGGGGGW",
      "WRRTTTTGGGWWGGGGGGGGGGTTTTGGGGGWWWWWWWWWWWWWRRRWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WRRGGGGGGGWWGGGGGGGGGGGGGGGGGGGWGGGGGGGGGGGGRRRGGGGGGGGGGGGGGGGGGGGGGGGW",
      "WRRRRRGGGGGGGGGGGGGGGGGGGGGGGGGWGGGGGGGGGGGGRRRGGGGGGGGGGGGGGGGGGGGGGGGW",
      "WRRRRRGGGTTTTGGGGGGGGGTTTTGGGGGWTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGTTTTGGGGGGGGGTTTTGGGGGWTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGTTTGGGGGGGGGGGGGGGGGGGGGGGWTTTTTTTTTTTTTRRRRRRTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGTTTGGGGGGGGGGGGGGGGRRGGGGGWTTTTTTTTTTTTTRRRRRRTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGGRRGGGGGWTTTTTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWTTTTTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWWWRRRWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRW",
      "WGGGGGGGGGGGTTTTGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRW",
      "WGGGGGGGGGGGTTTTGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRW",
      "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
    ],
    signs: [
      { x: 5, y: 5, text: "Tall grass is alive with ember spirits." },
      { x: 21, y: 11, text: "Trainer tip: press Enter to open your trainer menu." },
      { x: 25, y: 4, text: "A cave mouth waits to the east. Stay alert." },
      { x: 47, y: 14, text: "Welcome to New Town." }
    ],
    triggers: [
      {
        x: 27,
        y: 5,
        kind: "cave",
        targetMap: "emberCave",
        targetX: 3,
        targetY: 12,
        message: "You step into Ember Cave."
      },
      {
        x: 23,
        y: 12,
        kind: "door",
        targetMap: "wayfarerHouse",
        targetX: 4,
        targetY: 6,
        message: "You enter the wayfarer's cottage."
      }
    ]
  },
  emberCave: {
    name: "Ember Cave",
    palette: { top: "#635166", bottom: "#362933" },
    encounterRate: 0.14,
    terrain: [
      "WWWWWWWWWWWWWWWWWWWWWWWW",
      "WWGGGGGGGGGGGGGGGGGGGGWW",
      "WGGGGGGGGGGGGGGGGGGGGGGW",
      "WGGGGGGWWWWWGGGGGGGGGGGW",
      "WGGGGGGWGGGWGGGGGGGGGGGW",
      "WGGGTTTWGGGWGGGGTTTGGGGW",
      "WGGGTTTWGGGWGGGGTTTGGGGW",
      "WGGGGGGWGGGWGGGGGGGGGGGW",
      "WGGGGGGWGGGWGGGGGGGGGGGW",
      "WGGGGGGWWWWWGGGGGGGGGGGW",
      "WGGGGGGGGGGGGGGGGGGGGGGW",
      "WGGGGGGGGGGGGGGGGGGGGGGW",
      "WGGGGGGGGGGGGGGGGGGGGGGW",
      "WWGGGGGGGGGGGGGGGGGGGGWW",
      "WWWWWWWWWWWWWWWWWWWWWWWW"
    ],
    signs: [
      { x: 8, y: 10, text: "The cave walls shimmer with trapped warmth." }
    ],
    triggers: [
      {
        x: 2,
        y: 13,
        kind: "cave-exit",
        targetMap: "sunmeadow",
        targetX: 27,
        targetY: 6,
        message: "You emerge back into Sunmeadow."
      }
    ]
  },
  wayfarerHouse: {
    name: "Wayfarer Cottage",
    palette: { top: "#000000", bottom: "#020202" },
    encounterRate: 0,
    terrain: [
      "WWWWWWWWWW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WWWWWWWWWW"
    ],
    signs: [
      { x: 5, y: 2, text: "A note reads: rest, explore, and return stronger." }
    ],
    triggers: [
      {
        x: 4,
        y: 6,
        kind: "door-exit",
        targetMap: "sunmeadow",
        targetX: 23,
        targetY: 13,
        message: "You step back outside."
      }
    ]
  }
};

const gameState = {
  scene: "start",
  message: "Walk through tall grass to find a battle.",
  messageShownAt: performance.now(),
  encounterFlash: 0,
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
    potions: 3,
    orbs: 5,
    wins: 0,
    activeIndex: 0,
    party: [
      createCreatureInstance("Pyrel", { nickname: "Pyrel", role: "Starter", captured: true })
    ]
  },
  battle: null,
  pointerHotspot: null
};

function createCreatureInstance(species, overrides = {}) {
  const template = creatureTemplates[species];
  return {
    species: template.species,
    nickname: overrides.nickname || template.nickname,
    color: template.color,
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

function setMessage(text) {
  gameState.message = text;
  gameState.messageShownAt = performance.now();
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
  return ["Start Adventure", "View Controls"];
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
    } else {
      setMessage("Move with WASD or arrows. Press Enter for your party menu. Press F for fullscreen.");
    }
  }
}

function openMenu() {
  if (gameState.scene !== "world") return;
  gameState.scene = "menu";
  gameState.menu.mode = "main";
  gameState.menu.mainIndex = 0;
  gameState.menu.partyIndex = gameState.player.activeIndex;
  setMessage("Trainer menu opened.");
}

function closeMenu(message = "Back to exploring.") {
  gameState.scene = "world";
  gameState.menu.mode = "main";
  setMessage(message);
}

function captureCreature(species) {
  const alreadyOwned = gameState.player.party.some((creature) => creature.species === species);
  if (alreadyOwned) return false;

  const capturedCreature = createCreatureInstance(species, {
    nickname: species,
    role: "Captured",
    captured: true
  });
  gameState.player.party.push(capturedCreature);
  setMessage(`${species} joined your party. Press Enter to view Party.`);
  return true;
}

function attemptCatch() {
  const battle = gameState.battle;
  if (!battle) return false;

  if (gameState.player.orbs <= 0) {
    writeBattleLog("No capture orbs left.");
    return false;
  }

  gameState.player.orbs -= 1;
  const enemy = battle.enemy;
  const alreadyOwned = gameState.player.party.some((creature) => creature.species === enemy.name);
  const healthRatio = enemy.hp / enemy.maxHp;
  const catchChance = clamp(0.2 + (1 - healthRatio) * 0.65 + (alreadyOwned ? -0.08 : 0.05), 0.12, 0.92);

  writeBattleLog(`You threw an ember orb at ${enemy.name}.`);

  if (Math.random() <= catchChance) {
    captureCreature(enemy.name);
    writeBattleLog(`${enemy.name} was captured.`);
    gameState.scene = "world";
    gameState.battle = null;
    return true;
  }

  writeBattleLog(`${enemy.name} broke free.`);
  return false;
}

function beginEncounter() {
  const template = enemyTemplates[Math.floor(Math.random() * enemyTemplates.length)];
  gameState.scene = "battle";
  gameState.encounterFlash = 1;
  getActiveCreature().attackBoost = 0;
  gameState.battle = {
    enemy: {
      ...template,
      hp: template.maxHp,
      attackBoost: 0
    },
    turn: "player",
    log: [`A wild ${template.name} appeared!`],
    buttons: []
  };
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
  const targetX = gameState.player.x + dx;
  const targetY = gameState.player.y + dy;

  if (!isWalkable(targetX, targetY)) {
    setMessage("Unable to go this way.");
    return;
  }

  gameState.player.x = targetX;
  gameState.player.y = targetY;
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
    beginEncounter();
    return;
  }

}

function randomMoveId(moves) {
  return moves[Math.floor(Math.random() * moves.length)];
}

function writeBattleLog(text) {
  gameState.battle.log.unshift(text);
  gameState.battle.log = gameState.battle.log.slice(0, 5);
}

function applyMove(attacker, defender, moveId, owner) {
  const move = moveCatalog[moveId];
  if (Math.random() > move.accuracy) {
    writeBattleLog(`${attacker.nickname || attacker.name}'s ${move.name} missed.`);
    return;
  }

  if (move.heal) {
    attacker.hp = clamp(attacker.hp + move.heal, 0, attacker.maxHp);
    writeBattleLog(`${attacker.nickname || attacker.name} restored ${move.heal} HP with ${move.name}.`);
    return;
  }

  if (move.buff) {
    attacker.attackBoost += move.buff;
    writeBattleLog(`${attacker.nickname || attacker.name} sharpened focus. Attack rose.`);
    return;
  }

  const damage = Math.max(5, move.power + attacker.attackBoost + Math.floor(Math.random() * 5) - 2);
  defender.hp = clamp(defender.hp - damage, 0, defender.maxHp);
  writeBattleLog(`${attacker.nickname || attacker.name} used ${move.name} for ${damage} damage.`);

  if (defender.hp === 0) {
    writeBattleLog(`${defender.nickname || defender.name} was defeated.`);
    if (owner === "player") {
      gameState.player.wins += 1;
    }
  }
}

function enemyTurn() {
  const { enemy } = gameState.battle;
  const activeCreature = getActiveCreature();
  if (enemy.hp <= 0 || activeCreature.hp <= 0) {
    resolveBattleOutcome();
    return;
  }

  const moveId = randomMoveId(enemy.moves);
  applyMove(enemy, activeCreature, moveId, "enemy");

  if (activeCreature.hp <= 0) {
    resolveBattleOutcome();
    return;
  }

  gameState.battle.turn = "player";
}

function resolveBattleOutcome() {
  const battle = gameState.battle;
  const activeCreature = getActiveCreature();

  if (battle.enemy.hp <= 0) {
    setMessage(`${activeCreature.nickname} won in ${currentMap().name}. Total victories: ${gameState.player.wins}.`);
  } else if (activeCreature.hp <= 0) {
    activeCreature.hp = activeCreature.maxHp;
    setMessage(`${activeCreature.nickname} fainted, then recovered back at camp.`);
  }

  setTimeout(() => {
    gameState.scene = "world";
    gameState.battle = null;
  }, 1100);
}

function playerAction(action) {
  const battle = gameState.battle;
  const activeCreature = getActiveCreature();
  if (!battle || battle.turn !== "player") return;

  if (action.type === "move") {
    applyMove(activeCreature, battle.enemy, action.moveId, "player");
  } else if (action.type === "heal") {
    if (gameState.player.potions <= 0) {
      writeBattleLog("No tonics left.");
      return;
    }
    gameState.player.potions -= 1;
    activeCreature.hp = clamp(activeCreature.hp + 20, 0, activeCreature.maxHp);
    writeBattleLog(`${activeCreature.nickname} used a field tonic.`);
  } else if (action.type === "catch") {
    if (attemptCatch()) {
      return;
    }
  } else if (action.type === "run") {
    if (Math.random() < 0.65) {
      setMessage("You escaped safely.");
      gameState.scene = "world";
      gameState.battle = null;
      return;
    }
    writeBattleLog("Couldn't escape!");
  }

  if (battle.enemy.hp <= 0 || activeCreature.hp <= 0) {
    resolveBattleOutcome();
    return;
  }

  battle.turn = "enemy";
  setTimeout(enemyTurn, 600);
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

function handleMenuNavigation(key) {
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
      } else if (selected == "Save Game") {
        setMessage("Saving not yet implemented");
      }
      else {
        closeMenu();
      }
    } else if (key === "Escape") {
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
    } else if (key === "Escape" || key === "Backspace") {
      gameState.menu.mode = "main";
      setMessage("Trainer menu opened.");
    }
  }
}

function drawRoundedRect(x, y, width, height, radius, fill, stroke = null) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
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
  if (tile === "W") {
    drawRoundedRect(px, py, TILE_SIZE, TILE_SIZE, 10, "#6f7a6a");
    drawRoundedRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12, 8, "#8d9987");
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
  } else if (tile === "R") {
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
      drawMapTile(tileAt(x, y), worldToScreenX(x), worldToScreenY(y));
    }
  }

  for (const trigger of map.triggers) {
    drawTrigger(trigger);
  }

  for (const sign of map.signs) {
    drawSign(sign);
  }

  const playerX = worldToScreenX(gameState.player.x) + 8;
  const playerY = worldToScreenY(gameState.player.y) + 5;
  drawRoundedRect(playerX, playerY, 32, 38, 14, "#ffffff", getActiveCreature().color);
  drawRoundedRect(playerX + 4, playerY + 4, 24, 30, 12, getActiveCreature().color);
  drawRoundedRect(playerX + 8, playerY + 8, 16, 10, 4, "#fff0d8");

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

function battleButtons() {
  const moves = getActiveCreature().moves.map((moveId, index) => {
    const x = 490 + (index % 2) * 210;
    const y = 384 + Math.floor(index / 2) * 72;
    return {
      type: "move",
      moveId,
      x,
      y,
      width: 188,
      height: 56
    };
  });

  return [
    ...moves,
    { type: "heal", x: 490, y: 528, width: 120, height: 32 },
    { type: "catch", x: 629, y: 528, width: 120, height: 32 },
    { type: "run", x: 768, y: 528, width: 120, height: 32 }
  ];
}

function drawBattle() {
  const battle = gameState.battle;
  const activeCreature = getActiveCreature();
  if (!battle) return;

  const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  background.addColorStop(0, "#ffe9c1");
  background.addColorStop(1, "#f6b26b");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawRoundedRect(54, 64, 280, 120, 20, "rgba(255, 249, 241, 0.95)", "#3d271d");
  drawRoundedRect(626, 330, 280, 120, 20, "rgba(255, 249, 241, 0.95)", "#3d271d");
  drawText(battle.enemy.name, 78, 98, { font: "14px 'Press Start 2P'" });
  drawText(activeCreature.nickname, 650, 364, { font: "14px 'Press Start 2P'" });
  drawHpBar(78, 118, 220, battle.enemy.hp, battle.enemy.maxHp, "#d96459");
  drawHpBar(650, 384, 220, activeCreature.hp, activeCreature.maxHp, "#2a9d8f");
  drawText(`${battle.enemy.hp}/${battle.enemy.maxHp}`, 78, 154, { font: "16px Outfit" });
  drawText(`${activeCreature.hp}/${activeCreature.maxHp}`, 650, 420, { font: "16px Outfit" });

  ctx.fillStyle = battle.enemy.color;
  ctx.beginPath();
  ctx.ellipse(720, 232, 132, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  drawRoundedRect(676, 146, 86, 96, 26, battle.enemy.color, "#ffffff");
  drawRoundedRect(692, 168, 52, 20, 10, "#fff3e7");

  ctx.fillStyle = activeCreature.color;
  ctx.beginPath();
  ctx.ellipse(240, 418, 148, 54, 0, 0, Math.PI * 2);
  ctx.fill();
  drawRoundedRect(186, 302, 108, 124, 28, activeCreature.color, "#ffffff");
  drawRoundedRect(206, 326, 68, 22, 10, "#fff3e7");

  drawRoundedRect(38, 360, 884, 178, 20, "rgba(255, 251, 245, 0.97)", "#3d271d");
  drawText("Battle Log", 62, 394, { font: "14px 'Press Start 2P'", color: "#b93c2f" });

  ctx.font = "18px Outfit";
  ctx.fillStyle = "#694435";
  battle.log.forEach((line, index) => {
    ctx.fillText(line, 62, 426 + index * 26);
  });

  const buttons = battleButtons();
  battle.buttons = buttons;
  gameState.pointerHotspot = null;

  for (const button of buttons) {
    const move = button.moveId ? moveCatalog[button.moveId] : null;
    const isHovered = mouse.x >= button.x && mouse.x <= button.x + button.width
      && mouse.y >= button.y && mouse.y <= button.y + button.height;

    const fill = button.type === "move"
      ? move.color
      : button.type === "heal"
        ? "#2a9d8f"
        : button.type === "catch"
          ? "#9c6644"
          : "#7f5539";

    drawRoundedRect(button.x, button.y, button.width, button.height, 14, fill, isHovered ? "#fff8f0" : "#3d271d");
    drawText(
      button.type === "move"
        ? move.name
        : button.type === "heal"
          ? `Tonic x${gameState.player.potions}`
          : button.type === "catch"
            ? `Catch x${gameState.player.orbs}`
            : "Run",
      button.x + 16,
      button.y + (button.height > 40 ? 33 : 22),
      { font: button.height > 40 ? "14px 'Press Start 2P'" : "12px 'Press Start 2P'", color: "#fff8f0" }
    );

    if (isHovered) {
      gameState.pointerHotspot = button;
    }
  }

  drawText(
    battle.turn === "player" ? "Your turn" : `${battle.enemy.name} is acting...`,
    760,
    394,
    { font: "14px 'Press Start 2P'", color: "#2a7f62", align: "right" }
  );
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
    drawText("Enter: choose", canvas.width - 220, 250, { font: "14px Outfit", color: "#694435" });
    return;
  }

  drawRoundedRect(42, 40, 876, 492, 22, "rgba(255, 250, 243, 0.98)", "#3d271d");
  drawText("Party", 76, 74, { font: "16px 'Press Start 2P'", color: "#b93c2f" });
  drawText("Enter: lead   Esc: back", 632, 74, { font: "16px Outfit", color: "#694435" });

  gameState.player.party.forEach((creature, index) => {
    const selected = index === gameState.menu.partyIndex;
    const active = index === gameState.player.activeIndex;
    const cardY = 104 + index * 82;
    drawRoundedRect(68, cardY, 378, 64, 14, selected ? "#f3a65a" : "#fff5ea", "#3d271d");
    drawRoundedRect(86, cardY + 10, 46, 44, 14, creature.color, "#ffffff");
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
  drawRoundedRect(612, 132, 144, 132, 28, viewedCreature.color, "#ffffff");
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
  drawText("Echoes of Ember", 480, 138, { font: "34px 'Press Start 2P'", color: "#b93c2f", align: "center" });
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
    drawRoundedRect(154, 358 + index * 68, 272, 48, 14, selected ? "#c8553d" : "#fff3e2", "#3d271d");
    drawText(option, 182, 389 + index * 68, {
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
  drawText("Press Enter to begin your adventure.", 480, 544, {
    font: "18px Outfit",
    color: "#fff8f0",
    align: "center"
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState.scene === "start") {
    drawStartMenu();
  } else if (gameState.scene === "battle") {
    drawBattle();
  } else {
    drawWorld();
    if (gameState.scene === "menu") {
      drawMenuOverlay();
    }
  }

  if (gameState.encounterFlash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${gameState.encounterFlash})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    gameState.encounterFlash = Math.max(0, gameState.encounterFlash - 0.08);
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
    if (movementKeys.includes(key) || ["Enter", "Escape", "Backspace"].includes(key)) {
      handleMenuNavigation(key);
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
});

canvas.addEventListener("click", () => {
  if (gameState.scene !== "battle" || !gameState.pointerHotspot || gameState.battle.turn !== "player") {
    return;
  }

  playerAction(gameState.pointerHotspot);
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
