import { enemyTemplates, enemyTemplatesBySpecies } from "./creatures.js";
import { moveCatalog } from "./moves.js";

export function createBattleController({
  canvas,
  ctx,
  gameState,
  getMouse,
  getActiveCreature,
  createCreatureInstance,
  currentMap,
  setMessage,
  clamp,
  clearKeys,
  drawRoundedRect,
  drawText,
  drawHpBar,
  drawCreatureSprite
}) {
  function captureCreature(species) {
    const capturedCreature = createCreatureInstance(species, {
      nickname: species,
      role: "Captured",
      captured: true
    });
    gameState.player.party.push(capturedCreature);
    setMessage(`${species} joined your party. Press Enter to view Party.`);
    return true;
  }

  function writeBattleLog(text) {
    gameState.battle.log.unshift(text);
    gameState.battle.log = gameState.battle.log.slice(0, 5);
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

    writeBattleLog(`You threw an capture orb at ${enemy.name}.`);

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

  function wildEncounterPool() {
    const mapCreatures = currentMap().wildCreatures;
    if (!Array.isArray(mapCreatures)) return enemyTemplates;

    const mapPool = mapCreatures
      .map((species) => enemyTemplatesBySpecies[species])
      .filter(Boolean);

    return mapPool;
  }

  function beginEncounter() {
    const encounterPool = wildEncounterPool();
    if (encounterPool.length === 0) return;

    const template = encounterPool[Math.floor(Math.random() * encounterPool.length)];
    clearKeys();
    getActiveCreature().attackBoost = 0;
    gameState.battle = {
      enemy: {
        ...template,
        hp: template.maxHp,
        attackBoost: 0
      },
      turn: "player",
      log: [`A wild ${template.name} appeared!`],
      buttons: [],
      selectionIndex: 0
    };
    gameState.scene = "encounter";
    gameState.encounterTransition.active = true;
    gameState.encounterTransition.startedAt = performance.now();
    gameState.encounterTransition.enemyName = template.name;
  }

  function randomMoveId(moves) {
    return moves[Math.floor(Math.random() * moves.length)];
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

  function battleMoveCount() {
    return getActiveCreature().moves.length;
  }

  function battleMoveRowCount() {
    return Math.ceil(battleMoveCount() / 2);
  }

  function battleSubmenuStartIndex() {
    return battleMoveCount();
  }

  function moveSelectionIndex(direction) {
    const battle = gameState.battle;
    if (!battle || battle.buttons.length === 0) return 0;

    const currentIndex = clamp(battle.selectionIndex ?? 0, 0, battle.buttons.length - 1);
    const moveCount = battleMoveCount();
    const submenuStart = battleSubmenuStartIndex();

    if (currentIndex >= submenuStart) {
      const submenuIndex = currentIndex - submenuStart;

      if (direction === "left") {
        return submenuStart + Math.max(0, submenuIndex - 1);
      }

      if (direction === "right") {
        return submenuStart + Math.min(2, submenuIndex + 1);
      }

      if (direction === "up") {
        return Math.min(moveCount - 1, 2);
      }

      return currentIndex;
    }

    const row = Math.floor(currentIndex / 2);
    const col = currentIndex % 2;
    const lastMoveIndex = moveCount - 1;
    const lastRow = battleMoveRowCount() - 1;

    if (direction === "left") {
      if (col === 1) {
        return currentIndex - 1;
      }
      return currentIndex;
    }

    if (direction === "right") {
      if (col === 0 && currentIndex + 1 <= lastMoveIndex) {
        return currentIndex + 1;
      }
      return currentIndex;
    }

    if (direction === "up") {
      if (row === 0) {
        return currentIndex;
      }

      const targetIndex = currentIndex - 2;
      if (targetIndex <= lastMoveIndex) {
        return targetIndex;
      }

      return lastMoveIndex;
    }

    if (direction === "down") {
      const targetIndex = currentIndex + 2;

      if (row < lastRow && targetIndex <= lastMoveIndex) {
        return targetIndex;
      }

      return submenuStart + Math.min(col, 2);
    }

    return currentIndex;
  }

  function handleBattleNavigation(key) {
    const battle = gameState.battle;
    if (!battle || battle.turn !== "player") return;

    if (battle.buttons.length === 0) {
      battle.buttons = battleButtons();
    }

    if (key === "ArrowUp" || key === "w") {
      battle.selectionIndex = moveSelectionIndex("up");
    } else if (key === "ArrowDown" || key === "s") {
      battle.selectionIndex = moveSelectionIndex("down");
    } else if (key === "ArrowLeft" || key === "a") {
      battle.selectionIndex = moveSelectionIndex("left");
    } else if (key === "ArrowRight" || key === "d") {
      battle.selectionIndex = moveSelectionIndex("right");
    } else if (key === "Enter") {
      playerAction(battle.buttons[battle.selectionIndex]);
    }
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

    drawRoundedRect(54, 14, 280, 120, 20, "rgba(255, 249, 241, 0.95)", "#3d271d");
    drawRoundedRect(626, 230, 280, 120, 20, "rgba(255, 249, 241, 0.95)", "#3d271d");
    drawText(battle.enemy.name, 78, 48, { font: "14px 'Press Start 2P'" });
    drawText(activeCreature.nickname, 650, 264, { font: "14px 'Press Start 2P'" });
    drawHpBar(78, 68, 220, battle.enemy.hp, battle.enemy.maxHp, "#d96459");
    drawHpBar(650, 284, 220, activeCreature.hp, activeCreature.maxHp, "#2a9d8f");
    drawText(`${battle.enemy.hp}/${battle.enemy.maxHp}`, 78, 104, { font: "16px Outfit" });
    drawText(`${activeCreature.hp}/${activeCreature.maxHp}`, 650, 320, { font: "16px Outfit" });

    ctx.fillStyle = battle.enemy.color;
    ctx.beginPath();
    ctx.ellipse(720, 132, 132, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    drawCreatureSprite(battle.enemy, 664, 24, 118, 132, {
      frameColor: battle.enemy.color,
      padding: 8,
      radius: 30,
      border: false
    });

    ctx.fillStyle = activeCreature.color;
    ctx.beginPath();
    ctx.ellipse(240, 298, 148, 54, 0, 0, Math.PI * 2);
    ctx.fill();
    drawCreatureSprite(activeCreature, 168, 160, 148, 164, {
      flip: true,
      frameColor: activeCreature.color,
      padding: 10,
      radius: 34,
      border: false
    });

    drawRoundedRect(38, 360, 884, 178, 20, "rgba(255, 251, 245, 0.97)", "#3d271d");
    drawText("Battle Log", 62, 394, { font: "14px 'Press Start 2P'", color: "#b93c2f" });

    ctx.font = "18px Outfit";
    ctx.fillStyle = "#694435";
    battle.log.forEach((line, index) => {
      ctx.fillText(line, 62, 426 + index * 26);
    });

    const buttons = battleButtons();
    const mouse = getMouse();
    battle.buttons = buttons;
    battle.selectionIndex = clamp(battle.selectionIndex ?? 0, 0, buttons.length - 1);
    gameState.pointerHotspot = null;

    buttons.forEach((button, index) => {
      const move = button.moveId ? moveCatalog[button.moveId] : null;
      const isHovered = mouse.x >= button.x && mouse.x <= button.x + button.width
        && mouse.y >= button.y && mouse.y <= button.y + button.height;
      const isSelected = index === battle.selectionIndex;

      const fill = button.type === "move"
        ? move.color
        : button.type === "heal"
          ? "#2a9d8f"
          : button.type === "catch"
            ? "#9c6644"
            : "#7f5539";

      drawRoundedRect(
        button.x,
        button.y,
        button.width,
        button.height,
        14,
        fill,
        isHovered || isSelected ? "#dbcd0e" : "#3d271d"
      );
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
        battle.selectionIndex = index;
      }
    });

    drawText(
      battle.turn === "player" ? "Your turn" : `${battle.enemy.name} is acting...`,
      760,
      380,
      { font: "10px 'Press Start 2P'", color: "#2a7f62", align: "right" }
    );
  }

  return {
    beginEncounter,
    drawBattle,
    handleBattleNavigation,
    playerAction
  };
}
