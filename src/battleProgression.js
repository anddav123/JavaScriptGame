import {
  creatureTemplates,
  learnableMovesForLevelGain,
  MAX_CREATURE_MOVES
} from "./creatures.js";
import {
  CREATURE_HP_PER_LEVEL,
  CREATURE_MAX_LEVEL,
  CREATURE_MIN_LEVEL,
  CREATURE_XP_PER_LEVEL,
  CREATURE_XP_PER_WIN
} from "./constants.js";
import { getMoveCost, moveCatalog } from "./moves.js";
import { getTypeColor } from "./types.js";

export function createBattleProgressionController({
  gameState,
  setMessage,
  clamp,
  writeBattleLog,
  startAscensionSequence
}) {
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

  function queueAfterBattleLearnMove(creature, moveId) {
    if (!gameState.battle) return;
    if (!Array.isArray(gameState.battle.afterBattleLearnMoves)) {
      gameState.battle.afterBattleLearnMoves = [];
    }
    gameState.battle.afterBattleLearnMoves.push({ creature, moveId });
  }

  function createCreatureSnapshot(creature) {
    const species = creature.species || creature.name;
    return {
      species,
      name: creature.name || species,
      nickname: creature.nickname || species,
      color: creature.color ?? getTypeColor(creature.type),
      type: creature.type,
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
    return `${move.name} — ${move.type ?? "Typeless"}, ${effect}, ${getMoveCost(move)} MP`;
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
    creature.color = targetTemplate.color ?? getTypeColor(targetTemplate.type);
    creature.type = targetTemplate.type;
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

  return {
    activeMoveLearningPrompt,
    awardCreatureWinProgress,
    finishMoveLearningSequence,
    handleMoveLearningNavigation,
    leveledMaxHpForSpecies,
    moveName,
    moveSummary
  };
}
