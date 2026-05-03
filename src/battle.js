import {
  creatureTemplates,
  defaultMovesForLevel,
  enemyTemplates,
  enemyTemplatesBySpecies,
  learnableMovesForLevelGain,
  MAX_CREATURE_MOVES
} from "./creatures.js";
import {
  CREATURE_HP_PER_LEVEL,
  CREATURE_MAX_LEVEL,
  CREATURE_MIN_LEVEL,
  CREATURE_XP_PER_LEVEL,
  CREATURE_XP_PER_WIN,
  PLAYER_BATTLE_MP_RECOVERY
} from "./constants.js";
import { getMoveCost, moveCatalog } from "./moves.js";

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
  drawCreatureSprite,
  startAscensionSequence,
  startMoveLearningSequence
}) {
  function captureCreature(species) {
    const enemy = gameState.battle?.enemy;
    const capturedCreature = createCreatureInstance(species, {
      nickname: species,
      role: "Captured",
      level: enemy?.level,
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

  function queueAfterBattleMessage(text) {
    if (!gameState.battle) return;
    if (!Array.isArray(gameState.battle.afterBattleMessages)) {
      gameState.battle.afterBattleMessages = [];
    }
    gameState.battle.afterBattleMessages.push(text);
  }

  function queueAfterBattleAscension(ascension) {
    if (!gameState.battle) return;
    if (!Array.isArray(gameState.battle.afterBattleAscensions)) {
      gameState.battle.afterBattleAscensions = [];
    }
    gameState.battle.afterBattleAscensions.push(ascension);
  }

  function createCreatureSnapshot(creature) {
    const species = creature.species || creature.name;
    return {
      species,
      name: creature.name || species,
      nickname: creature.nickname || species,
      color: creature.color,
      spritePath: creature.spritePath,
      fallbackSpritePath: creature.fallbackSpritePath,
      role: creature.role,
      level: creature.level,
      maxHp: creature.maxHp,
      hp: creature.hp,
      moves: Array.isArray(creature.moves) ? [...creature.moves] : [],
      description: creature.description
    };
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

  function randomWildLevel() {
    const range = currentMap().wildLevelRange ?? {};
    const minLevel = Number.isFinite(range.min)
      ? clamp(Math.round(range.min), CREATURE_MIN_LEVEL, CREATURE_MAX_LEVEL)
      : CREATURE_MIN_LEVEL;
    const maxLevel = Number.isFinite(range.max)
      ? clamp(Math.round(range.max), minLevel, CREATURE_MAX_LEVEL)
      : minLevel;

    return minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
  }

  function beginEncounter() {
    const encounterPool = wildEncounterPool();
    if (encounterPool.length === 0) return;

    const template = encounterPool[Math.floor(Math.random() * encounterPool.length)];
    const level = randomWildLevel();
    const maxHp = leveledMaxHpForSpecies(template.name, level);
    clearKeys();
    getActiveCreature().attackBoost = 0;
    gameState.battle = {
      enemy: {
        ...template,
        level,
        maxHp,
        hp: maxHp,
        attackBoost: 0,
        moves: defaultMovesForLevel(template.name, level)
      },
      turn: "player",
      log: [`A wild ${template.name} Lv ${level} appeared!`],
      afterBattleMessages: [],
      afterBattleAscensions: [],
      afterBattleLearnMoves: [],
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

  function moveCostForId(moveId) {
    const move = moveCatalog[moveId];
    return move ? getMoveCost(move) : Number.POSITIVE_INFINITY;
  }

  function activeCreatureHasAffordableMove() {
    return getActiveCreature().moves.some((moveId) => gameState.player.mp >= moveCostForId(moveId));
  }

  function rechargePlayerBattleMp() {
    const previousMp = gameState.player.mp;
    gameState.player.mp = clamp(
      gameState.player.mp + PLAYER_BATTLE_MP_RECOVERY,
      0,
      gameState.player.maxMp
    );
    return gameState.player.mp - previousMp;
  }

  function maxCreatureXp() {
    return (CREATURE_MAX_LEVEL - CREATURE_MIN_LEVEL) * CREATURE_XP_PER_LEVEL;
  }

  function leveledMaxHpForSpecies(species, level) {
    const template = creatureTemplates[species];
    if (!template) return 1;
    return template.maxHp + (level - CREATURE_MIN_LEVEL) * CREATURE_HP_PER_LEVEL;
  }

  function normalizeCreatureProgress(creature) {
    creature.level = Number.isFinite(creature.level)
      ? clamp(Math.round(creature.level), CREATURE_MIN_LEVEL, CREATURE_MAX_LEVEL)
      : CREATURE_MIN_LEVEL;
    creature.xp = Number.isFinite(creature.xp)
      ? clamp(Math.round(creature.xp), 0, maxCreatureXp())
      : (creature.level - CREATURE_MIN_LEVEL) * CREATURE_XP_PER_LEVEL;
    creature.maxHp = Number.isFinite(creature.maxHp)
      ? Math.max(1, Math.round(creature.maxHp))
      : leveledMaxHpForSpecies(creature.species, creature.level);
    creature.hp = Number.isFinite(creature.hp)
      ? clamp(Math.round(creature.hp), 0, creature.maxHp)
      : creature.maxHp;
  }

  function applyLevelGain(creature, nextLevel) {
    const gainedLevels = nextLevel - creature.level;
    if (gainedLevels <= 0) return creature.level;

    const previousLevel = creature.level;
    const hpGain = gainedLevels * CREATURE_HP_PER_LEVEL;
    creature.level = nextLevel;
    creature.maxHp += hpGain;
    creature.hp = clamp(creature.hp + hpGain, 0, creature.maxHp);
    const levelMessage = gainedLevels === 1
      ? `${creature.nickname} reached level ${creature.level}.`
      : `${creature.nickname} gained ${gainedLevels} levels to level ${creature.level}.`;
    writeBattleLog(levelMessage);
    queueAfterBattleMessage(levelMessage);
    return previousLevel;
  }

  function moveName(moveId) {
    return moveCatalog[moveId]?.name ?? moveId;
  }

  function moveSummary(moveId) {
    const move = moveCatalog[moveId];
    if (!move) return moveId;

    const effect = move.power > 0
      ? `${move.power} power`
      : move.heal
        ? `heals ${move.heal} HP`
        : "support";
    return `${move.name} — ${effect}, ${getMoveCost(move)} MP`;
  }

  function queueAfterBattleLearnMove(creature, moveId) {
    if (!gameState.battle) return;
    if (!Array.isArray(gameState.battle.afterBattleLearnMoves)) {
      gameState.battle.afterBattleLearnMoves = [];
    }
    gameState.battle.afterBattleLearnMoves.push({ creature, moveId });
  }

  function teachMoveIfPossible(creature, moveId) {
    if (!moveCatalog[moveId] || creature.moves.includes(moveId)) return;

    if (creature.moves.length < MAX_CREATURE_MOVES) {
      creature.moves.push(moveId);
      const learnedMessage = `${creature.nickname} learned ${moveName(moveId)}.`;
      writeBattleLog(learnedMessage);
      queueAfterBattleMessage(learnedMessage);
      return;
    }

    const promptMessage = `${creature.nickname} can learn ${moveName(moveId)}.`;
    writeBattleLog(promptMessage);
    queueAfterBattleMessage(`${promptMessage} Choose a move to forget.`);
    queueAfterBattleLearnMove(creature, moveId);
  }

  function teachLevelUpMoves(creature, previousLevel, nextLevel) {
    for (const moveId of learnableMovesForLevelGain(creature.species, previousLevel, nextLevel)) {
      teachMoveIfPossible(creature, moveId);
    }
  }

  function chooseAscensionSpecies(rule) {
    const options = Array.isArray(rule.species) ? rule.species : [rule.species];
    return options[Math.floor(Math.random() * options.length)];
  }

  function applyAscension(creature, targetSpecies) {
    const targetTemplate = creatureTemplates[targetSpecies];
    if (!targetTemplate || targetTemplate.species === creature.species) return false;

    const beforeAscension = createCreatureSnapshot(creature);
    const previousSpecies = creature.species;
    const targetMaxHp = leveledMaxHpForSpecies(targetTemplate.species, creature.level);
    const hpGain = Math.max(0, targetMaxHp - creature.maxHp);
    if (creature.nickname === previousSpecies) {
      creature.nickname = targetTemplate.nickname;
    }

    creature.species = targetTemplate.species;
    creature.color = targetTemplate.color;
    creature.spritePath = targetTemplate.spritePath;
    creature.fallbackSpritePath = targetTemplate.fallbackSpritePath;
    creature.maxHp = Math.max(creature.maxHp, targetMaxHp);
    creature.hp = clamp(creature.hp + hpGain, 0, creature.maxHp);
    creature.moves = Array.isArray(creature.moves) && creature.moves.length > 0
      ? creature.moves.slice(0, MAX_CREATURE_MOVES)
      : [...targetTemplate.moves].slice(0, MAX_CREATURE_MOVES);
    creature.description = targetTemplate.description;

    const ascensionMessage = `${creature.nickname} ascended from ${previousSpecies} into ${targetTemplate.species}!`;
    writeBattleLog(ascensionMessage);
    queueAfterBattleMessage(ascensionMessage);
    queueAfterBattleAscension({
      before: beforeAscension,
      after: createCreatureSnapshot(creature),
      fromSpecies: previousSpecies,
      toSpecies: targetTemplate.species,
      message: ascensionMessage
    });
    return true;
  }

  function tryAscendCreature(creature) {
    for (let checks = 0; checks < 5; checks += 1) {
      const rule = creatureTemplates[creature.species]?.ascension;
      if (!rule || creature.level < rule.level) return;

      const targetSpecies = chooseAscensionSpecies(rule);
      if (!applyAscension(creature, targetSpecies)) return;
    }
  }

  function awardCreatureWinProgress(creature) {
    normalizeCreatureProgress(creature);
    const previousXp = creature.xp;
    creature.xp = clamp(creature.xp + CREATURE_XP_PER_WIN, 0, maxCreatureXp());
    const gainedXp = creature.xp - previousXp;

    if (gainedXp > 0) {
      writeBattleLog(`${creature.nickname} gained ${gainedXp} XP.`);
    }

    const nextLevel = clamp(
      Math.floor(creature.xp / CREATURE_XP_PER_LEVEL) + CREATURE_MIN_LEVEL,
      CREATURE_MIN_LEVEL,
      CREATURE_MAX_LEVEL
    );
    const previousLevel = applyLevelGain(creature, nextLevel);
    tryAscendCreature(creature);
    if (Number.isFinite(previousLevel) && nextLevel > previousLevel) {
      teachLevelUpMoves(creature, previousLevel, nextLevel);
    }
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

  function skipPlayerTurnForMp() {
    const battle = gameState.battle;
    if (!battle || battle.turn !== "recharging") return;

    const activeCreature = getActiveCreature();
    const recoveredMp = rechargePlayerBattleMp();
    const recoveryText = recoveredMp > 0
      ? `recovered ${recoveredMp} MP`
      : "could not recover more MP";
    writeBattleLog(`${activeCreature.nickname} rested and ${recoveryText}.`);

    if (battle.enemy.hp <= 0 || activeCreature.hp <= 0) {
      resolveBattleOutcome();
      return;
    }

    battle.turn = "enemy";
    setTimeout(enemyTurn, 600);
  }

  function recoverMpForTurn(activeCreature) {
    const recoveredMp = rechargePlayerBattleMp();
    if (recoveredMp <= 0) {
      writeBattleLog(`${activeCreature.nickname}'s MP is already full.`);
      return false;
    }

    writeBattleLog(`${activeCreature.nickname} recovered ${recoveredMp} MP.`);
    return true;
  }

  function beginPlayerTurn() {
    const battle = gameState.battle;
    if (!battle || battle.turn === "recharging") return;

    const activeCreature = getActiveCreature();
    if (battle.enemy.hp <= 0 || activeCreature.hp <= 0) {
      resolveBattleOutcome();
      return;
    }

    if (!activeCreatureHasAffordableMove()) {
      battle.turn = "recharging";
      setTimeout(skipPlayerTurnForMp, 500);
      return;
    }

    battle.turn = "player";
  }

  function resolveBattleOutcome() {
    const battle = gameState.battle;
    if (!battle || battle.resolving) return;

    const activeCreature = getActiveCreature();
    const playerWon = battle.enemy.hp <= 0;
    const playerFainted = activeCreature.hp <= 0;
    battle.resolving = true;
    battle.turn = "resolving";

    setTimeout(() => {
      if (gameState.battle !== battle) return;

      let outcomeMessage = "";
      let ascensionScenes = [];
      if (playerWon) {
        const victoryMessage = `${activeCreature.nickname} won in ${currentMap().name}. Total victories: ${gameState.player.wins}.`;
        awardCreatureWinProgress(activeCreature);
        const milestoneMessages = battle.afterBattleMessages ?? [];
        ascensionScenes = battle.afterBattleAscensions ?? [];
        const learnMoves = battle.afterBattleLearnMoves ?? [];
        outcomeMessage = milestoneMessages.length > 0 ? `${victoryMessage} ${milestoneMessages.join(" ")}` : victoryMessage;
        if (learnMoves.length > 0 && typeof startMoveLearningSequence === "function") {
          gameState.battle = null;
          startMoveLearningSequence(learnMoves, outcomeMessage, ascensionScenes);
          return;
        }
      } else if (playerFainted) {
        activeCreature.hp = activeCreature.maxHp;
        outcomeMessage = `${activeCreature.nickname} fainted, then recovered back at camp.`;
      }

      gameState.battle = null;
      if (playerWon && ascensionScenes.length > 0 && typeof startAscensionSequence === "function") {
        startAscensionSequence(ascensionScenes, outcomeMessage);
        return;
      }

      gameState.scene = "world";
      if (outcomeMessage) {
        setMessage(outcomeMessage);
      }
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

    beginPlayerTurn();
  }

  function playerAction(action) {
    const battle = gameState.battle;
    const activeCreature = getActiveCreature();
    if (!battle || battle.turn !== "player") return;

    if (action.type === "move") {
      const move = moveCatalog[action.moveId];
      const moveCost = getMoveCost(move);
      if (gameState.player.mp < moveCost) {
        writeBattleLog(`Not enough MP for ${move.name}. Need ${moveCost} MP.`);
        return;
      }
      gameState.player.mp = clamp(gameState.player.mp - moveCost, 0, gameState.player.maxMp);
      applyMove(activeCreature, battle.enemy, action.moveId, "player");
    } else if (action.type === "tonic") {
      if (gameState.player.potions <= 0) {
        writeBattleLog("No tonics left.");
        return;
      }
      gameState.player.potions -= 1;
      activeCreature.hp = clamp(activeCreature.hp + 20, 0, activeCreature.maxHp);
      writeBattleLog(`${activeCreature.nickname} used a health tonic.`);
    } else if (action.type === "catch") {
      if (attemptCatch()) {
        return;
      }
    } else if (action.type === "recoverMp") {
      if (!recoverMpForTurn(activeCreature)) {
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
      { type: "tonic", x: 490, y: 528, width: 94, height: 32 },
      { type: "catch", x: 594, y: 528, width: 94, height: 32 },
      { type: "recoverMp", x: 698, y: 528, width: 94, height: 32 },
      { type: "run", x: 802, y: 528, width: 94, height: 32 }
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
        return submenuStart + Math.min(3, submenuIndex + 1);
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

  function activeMoveLearningPrompt() {
    const moveLearning = gameState.moveLearning;
    if (!moveLearning || !Array.isArray(moveLearning.queue) || moveLearning.queue.length === 0) return null;
    return moveLearning.queue[0];
  }

  function finishMoveLearningSequence() {
    const moveLearning = gameState.moveLearning;
    const outcomeMessage = moveLearning?.outcomeMessage ?? "";
    const ascensionScenes = moveLearning?.ascensionScenes ?? [];
    gameState.moveLearning = null;

    if (ascensionScenes.length > 0 && typeof startAscensionSequence === "function") {
      startAscensionSequence(ascensionScenes, outcomeMessage);
      return;
    }

    gameState.scene = "world";
    if (outcomeMessage) {
      setMessage(outcomeMessage);
    }
  }

  function resolveCurrentMoveLearning(replaceIndex = null) {
    const moveLearning = gameState.moveLearning;
    const prompt = activeMoveLearningPrompt();
    if (!moveLearning || !prompt) return;

    const { creature, moveId } = prompt;
    const newMoveName = moveName(moveId);
    let resultMessage;
    if (Number.isInteger(replaceIndex) && replaceIndex >= 0 && replaceIndex < creature.moves.length) {
      const oldMoveId = creature.moves[replaceIndex];
      creature.moves[replaceIndex] = moveId;
      resultMessage = `${creature.nickname} forgot ${moveName(oldMoveId)} and learned ${newMoveName}.`;
    } else {
      resultMessage = `${creature.nickname} did not learn ${newMoveName}.`;
    }
    setMessage(resultMessage);
    moveLearning.outcomeMessage = moveLearning.outcomeMessage
      ? `${moveLearning.outcomeMessage} ${resultMessage}`
      : resultMessage;

    moveLearning.queue.shift();
    moveLearning.selectionIndex = 0;
    if (moveLearning.queue.length === 0) {
      finishMoveLearningSequence();
    }
  }

  function handleMoveLearningNavigation(key) {
    const moveLearning = gameState.moveLearning;
    const prompt = activeMoveLearningPrompt();
    if (!moveLearning || !prompt) return;

    const optionCount = prompt.creature.moves.length + 1;
    if (key === "ArrowUp" || key === "w") {
      moveLearning.selectionIndex = (moveLearning.selectionIndex - 1 + optionCount) % optionCount;
    } else if (key === "ArrowDown" || key === "s") {
      moveLearning.selectionIndex = (moveLearning.selectionIndex + 1) % optionCount;
    } else if (key === "Backspace") {
      resolveCurrentMoveLearning(null);
    } else if (key === "Enter") {
      const selected = clamp(moveLearning.selectionIndex ?? 0, 0, optionCount - 1);
      resolveCurrentMoveLearning(selected < prompt.creature.moves.length ? selected : null);
    }
  }

  function drawMoveLearning() {
    const prompt = activeMoveLearningPrompt();
    if (!prompt) {
      finishMoveLearningSequence();
      return;
    }

    const moveLearning = gameState.moveLearning;
    const { creature, moveId } = prompt;
    const newMove = moveCatalog[moveId];
    const newMoveName = newMove?.name ?? moveName(moveId);
    const options = [
      ...creature.moves.map((knownMoveId, index) => ({ index, label: `Forget ${moveSummary(knownMoveId)}` })),
      { index: null, label: `Do not learn ${moveSummary(moveId)}` }
    ];
    moveLearning.selectionIndex = clamp(moveLearning.selectionIndex ?? 0, 0, options.length - 1);

    const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    background.addColorStop(0, "#f8ddb4");
    background.addColorStop(1, "#c8553d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawRoundedRect(120, 70, 720, 452, 24, "rgba(255, 250, 243, 0.97)", "#3d271d");
    drawText("New Move", 160, 116, { font: "18px 'Press Start 2P'", color: "#b93c2f" });
    drawText(`${creature.nickname} wants to learn ${newMoveName}.`, 160, 164, { font: "24px Outfit", color: "#2d1b14" });
    drawText(moveSummary(moveId), 160, 196, {
      font: "18px Outfit",
      color: "#694435"
    });
    drawText("Choose a move to forget, or decline learning it.", 160, 230, { font: "18px Outfit", color: "#694435" });

    options.forEach((option, index) => {
      const selected = index === moveLearning.selectionIndex;
      const y = 268 + index * 48;
      drawRoundedRect(160, y, 640, 36, 12, selected ? "#c8553d" : "#fff4e6", "#3d271d");
      drawText(option.label, 184, y + 24, {
        font: "14px 'Press Start 2P'",
        color: selected ? "#fff8f0" : "#2d1b14"
      });
    });

    drawText("Enter: choose   Backspace: do not learn", 160, 492, { font: "16px Outfit", color: "#694435" });
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
    drawText(`Lv ${battle.enemy.level ?? CREATURE_MIN_LEVEL}`, 298, 48, {
      font: "16px Outfit",
      color: "#694435",
      align: "right"
    });
    drawText(activeCreature.nickname, 650, 264, { font: "14px 'Press Start 2P'" });
    drawHpBar(78, 68, 220, battle.enemy.hp, battle.enemy.maxHp, "#d96459");
    drawHpBar(650, 284, 220, activeCreature.hp, activeCreature.maxHp, "#2a9d8f");
    drawText(`HP ${battle.enemy.hp}/${battle.enemy.maxHp}`, 78, 104, { font: "16px Outfit" });
    drawText(`HP ${activeCreature.hp}/${activeCreature.maxHp}`, 650, 320, { font: "16px Outfit" });
    drawText(`MP ${gameState.player.mp}/${gameState.player.maxMp}`, 870, 320, {
      font: "16px Outfit",
      color: "#3d5afe",
      align: "right"
    });

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
      const moveCost = move ? getMoveCost(move) : 0;
      const canAffordMove = button.type !== "move" || gameState.player.mp >= moveCost;
      const isHovered = mouse.x >= button.x && mouse.x <= button.x + button.width
        && mouse.y >= button.y && mouse.y <= button.y + button.height;
      const isSelected = index === battle.selectionIndex;

      const fill = button.type === "move"
        ? canAffordMove ? move.color : "#8d8178"
        : button.type === "tonic"
          ? "#2a9d8f"
          : button.type === "catch"
            ? "#9c6644"
            : button.type === "recoverMp"
              ? "#3d5afe"
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
          : button.type === "tonic"
            ? `Tonic x${gameState.player.potions}`
            : button.type === "catch"
              ? `Catch x${gameState.player.orbs}`
              : button.type === "recoverMp"
                ? "MP +1"
                : "Run",
        button.x + 12,
        button.y + (button.height > 40 ? 25 : 22),
        { font: button.height > 40 ? "14px 'Press Start 2P'" : "10px 'Press Start 2P'", color: "#fff8f0" }
      );

      if (button.type === "move") {
        drawText(
          `${moveCost} MP`,
          button.x + 16,
          button.y + 45,
          { font: "14px Outfit", color: canAffordMove ? "#fff8f0" : "#f3d1c3" }
        );
      }

      if (isHovered) {
        gameState.pointerHotspot = button;
        battle.selectionIndex = index;
      }
    });

    drawText(
      battle.turn === "player"
        ? "Your turn"
        : battle.turn === "recharging"
          ? "Recovering MP..."
          : battle.turn === "resolving"
            ? "Battle ending..."
            : `${battle.enemy.name} is acting...`,
      760,
      380,
      { font: "10px 'Press Start 2P'", color: "#2a7f62", align: "right" }
    );
  }

  return {
    beginPlayerTurn,
    beginEncounter,
    drawBattle,
    drawMoveLearning,
    handleBattleNavigation,
    handleMoveLearningNavigation,
    playerAction
  };
}
