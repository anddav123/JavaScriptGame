import {
  defaultMovesForLevel,
  enemyTemplates,
  enemyTemplatesBySpecies
} from "./creatures.js";
import {
  CREATURE_MAX_LEVEL,
  CREATURE_MIN_LEVEL,
  PLAYER_CAMP_MAX_CREATURES,
  PLAYER_PARTY_MAX_SIZE,
  PLAYER_BATTLE_MP_RECOVERY
} from "./constants.js";
import { createBattleProgressionController } from "./battleProgression.js";
import { getMoveCost, moveCatalog } from "./moves.js";
import { getTypeColor, typeEffectiveness } from "./types.js";

const BATTLE_SPRITE_BOUNDS = Object.freeze({
  enemy: { x: 664, y: 24, width: 118, height: 132 },
  player: { x: 168, y: 160, width: 148, height: 164 }
});

const DEFAULT_BATTLE_ANIMATION_DURATION = 700;
const DEFAULT_BATTLE_TURN_DELAY = 700;
const CAPTURE_SUCCESS_ANIMATION_DURATION = 1000;
const CAPTURE_BREAK_ANIMATION_DURATION = 800;
const CAPTURE_ORB_COLOR = "#3d8bfd";
const TONIC_ANIMATION_DURATION = 850;
const TONIC_LIQUID_COLOR = "#8e44ad";

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
  startMoveLearningSequence,
  onCampStorageFull,
  onPartyFainted
}) {
  function campCreatureStorage() {
    if (!Array.isArray(gameState.player.campCreatures)) {
      gameState.player.campCreatures = [];
    }
    return gameState.player.campCreatures;
  }

  function captureCreature(species) {
    const enemy = gameState.battle?.enemy;
    const capturedCreature = createCreatureInstance(species, {
      nickname: species,
      role: "Captured",
      level: enemy?.level,
      captured: true
    });

    if (gameState.player.party.length < PLAYER_PARTY_MAX_SIZE) {
      gameState.player.party.push(capturedCreature);
      setMessage(`${species} joined your party. Press Enter to view Party.`);
      return "party";
    }

    const storage = campCreatureStorage();
    if (storage.length >= PLAYER_CAMP_MAX_CREATURES) {
      setMessage(`Camp storage is full. Store ${species} by replacing a camp creature, or forfeit the catch.`);
      if (typeof onCampStorageFull === "function") {
        onCampStorageFull(capturedCreature);
      }
      return "storageFull";
    }

    storage.push(capturedCreature);
    const campAction = gameState.world.camp ? "Visit camp" : "Make camp";
    setMessage(`${species} was sent to camp storage. ${campAction} to switch creatures.`);
    return "camp";
  }

  function writeBattleLog(text) {
    gameState.battle.log.unshift(text);
    gameState.battle.log = gameState.battle.log.slice(0, 5);
  }

  function battleAnimationTargetForOwner(owner) {
    return owner === "player" ? "enemy" : "player";
  }

  function battleAnimationUserForOwner(owner) {
    return owner === "player" ? "player" : "enemy";
  }

  function startBattleAnimation(move, target, animationType = move.animation ?? "impact") {
    const battle = gameState.battle;
    if (!battle) return 0;

    const duration = move.animationDuration ?? DEFAULT_BATTLE_ANIMATION_DURATION;
    battle.animations ??= [];
    battle.animations.push({
      type: animationType,
      target,
      color: move.color ?? getTypeColor(move.type, "#fff8f0"),
      startedAt: performance.now(),
      duration
    });

    return duration;
  }

  function startCaptureAnimation(outcome) {
    const battle = gameState.battle;
    if (!battle) return 0;

    const duration = outcome === "success" ? CAPTURE_SUCCESS_ANIMATION_DURATION : CAPTURE_BREAK_ANIMATION_DURATION;
    battle.animations ??= [];
    battle.animations.push({
      type: "capture",
      target: "enemy",
      outcome,
      color: CAPTURE_ORB_COLOR,
      startedAt: performance.now(),
      duration
    });

    return duration;
  }

  function startTonicAnimation() {
    const battle = gameState.battle;
    if (!battle) return 0;

    battle.animations ??= [];
    battle.animations.push({
      type: "tonic",
      target: "player",
      color: TONIC_LIQUID_COLOR,
      startedAt: performance.now(),
      duration: TONIC_ANIMATION_DURATION
    });

    return TONIC_ANIMATION_DURATION;
  }

  function activeCaptureSuccessAnimation() {
    const battle = gameState.battle;
    const now = performance.now();
    return battle?.animations?.find((animation) => {
      if (animation.type !== "capture" || animation.outcome !== "success") return false;
      const duration = Math.max(1, animation.duration ?? CAPTURE_SUCCESS_ANIMATION_DURATION);
      return now - animation.startedAt < duration;
    });
  }

  function drawImpactAnimation(animation, bounds, elapsedRatio) {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const maxRadius = Math.max(bounds.width, bounds.height) * 0.48;
    const radius = 10 + maxRadius * elapsedRatio;
    const opacity = 1 - elapsedRatio;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = animation.color;
    ctx.lineWidth = 6 - elapsedRatio * 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = opacity * 0.85;
    ctx.fillStyle = animation.color;
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      const distance = radius * 0.72;
      const particleSize = 6 - elapsedRatio * 3;
      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(angle) * distance,
        centerY + Math.sin(angle) * distance,
        particleSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.globalAlpha = opacity * 0.35;
    ctx.fillStyle = animation.color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawShieldAnimation(animation, bounds, elapsedRatio) {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const width = bounds.width * (0.58 + elapsedRatio * 0.16);
    const height = bounds.height * (0.68 + elapsedRatio * 0.12);
    const topY = centerY - height * 0.5;
    const opacity = 1 - elapsedRatio;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = animation.color;
    ctx.fillStyle = animation.color;
    ctx.lineWidth = 5 - elapsedRatio * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, topY);
    ctx.quadraticCurveTo(centerX + width * 0.44, topY + height * 0.08, centerX + width * 0.42, topY + height * 0.42);
    ctx.quadraticCurveTo(centerX + width * 0.36, topY + height * 0.78, centerX, topY + height);
    ctx.quadraticCurveTo(centerX - width * 0.36, topY + height * 0.78, centerX - width * 0.42, topY + height * 0.42);
    ctx.quadraticCurveTo(centerX - width * 0.44, topY + height * 0.08, centerX, topY);
    ctx.closePath();
    ctx.stroke();

    ctx.globalAlpha = opacity * 0.16;
    ctx.fill();

    ctx.globalAlpha = opacity * 0.65;
    for (let index = 0; index < 3; index += 1) {
      const shimmerY = topY + height * (0.28 + index * 0.18) - elapsedRatio * 18;
      ctx.beginPath();
      ctx.moveTo(centerX - width * 0.22, shimmerY);
      ctx.lineTo(centerX + width * 0.22, shimmerY - 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHeartShape(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.32);
    ctx.bezierCurveTo(x - size, y - size * 0.22, x - size * 0.62, y - size, x, y - size * 0.42);
    ctx.bezierCurveTo(x + size * 0.62, y - size, x + size, y - size * 0.22, x, y + size * 0.32);
    ctx.closePath();
    ctx.fill();
  }

  function drawHeartsAnimation(animation, bounds, elapsedRatio) {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const opacity = 1 - elapsedRatio;
    const orbitRadiusX = bounds.width * 0.38;
    const orbitRadiusY = bounds.height * 0.32;
    const rotation = elapsedRatio * Math.PI * 2;

    ctx.save();
    ctx.fillStyle = animation.color;
    for (let index = 0; index < 6; index += 1) {
      const angle = rotation + (Math.PI * 2 * index) / 6;
      const bob = Math.sin(elapsedRatio * Math.PI + index) * 8;
      const x = centerX + Math.cos(angle) * orbitRadiusX;
      const y = centerY + Math.sin(angle) * orbitRadiusY - elapsedRatio * 24 + bob;
      const size = 8 + Math.sin(elapsedRatio * Math.PI) * 5;

      ctx.globalAlpha = opacity * (0.55 + index * 0.055);
      drawHeartShape(x, y, size);
    }

    ctx.globalAlpha = opacity * 0.18;
    ctx.beginPath();
    ctx.arc(centerX, centerY, bounds.width * (0.24 + elapsedRatio * 0.12), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTonicAnimation(animation, bounds, elapsedRatio) {
    const beakerWidth = 42;
    const beakerHeight = 64;
    const x = bounds.x + bounds.width * 0.68;
    const y = bounds.y + bounds.height * 0.08;
    const opacity = elapsedRatio < 0.82 ? 1 : 1 - (elapsedRatio - 0.82) / 0.18;
    const liquidRatio = Math.max(0, 1 - elapsedRatio * 1.08);
    const liquidHeight = (beakerHeight - 16) * liquidRatio;
    const liquidY = y + beakerHeight - 8 - liquidHeight;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff8f0";
    ctx.fillStyle = "rgba(255, 248, 240, 0.22)";

    ctx.beginPath();
    ctx.moveTo(x + 12, y + 4);
    ctx.lineTo(x + 30, y + 4);
    ctx.lineTo(x + 30, y + 16);
    ctx.lineTo(x + 38, y + beakerHeight - 6);
    ctx.quadraticCurveTo(x + beakerWidth / 2, y + beakerHeight + 2, x + 4, y + beakerHeight - 6);
    ctx.lineTo(x + 12, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = animation.color;
    ctx.globalAlpha = opacity * 0.82;
    ctx.beginPath();
    ctx.moveTo(x + 8, liquidY);
    ctx.quadraticCurveTo(x + beakerWidth / 2, liquidY - Math.sin(elapsedRatio * Math.PI * 8) * 3, x + 34, liquidY);
    ctx.lineTo(x + 36, y + beakerHeight - 8);
    ctx.quadraticCurveTo(x + beakerWidth / 2, y + beakerHeight - 1, x + 6, y + beakerHeight - 8);
    ctx.closePath();
    ctx.fill();

    if (elapsedRatio > 0.64) {
      const sparkleRatio = (elapsedRatio - 0.64) / 0.36;
      ctx.globalAlpha = (1 - sparkleRatio) * 0.9;
      ctx.fillStyle = animation.color;
      for (let index = 0; index < 5; index += 1) {
        const angle = (Math.PI * 2 * index) / 5;
        const distance = 20 + sparkleRatio * 22;
        ctx.beginPath();
        ctx.arc(
          bounds.x + bounds.width / 2 + Math.cos(angle) * distance,
          bounds.y + bounds.height / 2 + Math.sin(angle) * distance,
          4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawCaptureAnimation(animation, bounds, elapsedRatio) {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const maxRadius = Math.max(bounds.width, bounds.height) * 0.58;
    const pulse = Math.sin(elapsedRatio * Math.PI * 4) * 5;
    const isSuccess = animation.outcome === "success";
    const radius = isSuccess
      ? maxRadius * (1 - Math.max(0, elapsedRatio - 0.28) / 0.72) + 8
      : maxRadius + pulse;
    const opacity = isSuccess ? 1 - elapsedRatio * 0.18 : 1 - elapsedRatio * 0.35;

    ctx.save();
    ctx.strokeStyle = animation.color;
    ctx.fillStyle = animation.color;
    ctx.lineWidth = 6;

    if (isSuccess) {
      ctx.globalAlpha = opacity * 0.22;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(8, radius), 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(8, radius), 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = Math.min(1, elapsedRatio * 1.4) * 0.85;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(5, radius * 0.32), 0, Math.PI * 2);
      ctx.fill();
    } else if (elapsedRatio < 0.55) {
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const breakRatio = (elapsedRatio - 0.55) / 0.45;
      ctx.globalAlpha = 1 - breakRatio;
      for (let index = 0; index < 10; index += 1) {
        const angle = (Math.PI * 2 * index) / 10;
        const shardDistance = maxRadius * (0.88 + breakRatio * 0.72);
        const shardX = centerX + Math.cos(angle) * shardDistance;
        const shardY = centerY + Math.sin(angle) * shardDistance;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * maxRadius * 0.74, centerY + Math.sin(angle) * maxRadius * 0.74);
        ctx.lineTo(shardX, shardY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function drawBattleAnimations() {
    const battle = gameState.battle;
    if (!battle?.animations?.length) return;

    const now = performance.now();
    battle.animations = battle.animations.filter((animation) => {
      const duration = Math.max(1, animation.duration ?? DEFAULT_BATTLE_ANIMATION_DURATION);
      const elapsedRatio = (now - animation.startedAt) / duration;
      if (elapsedRatio >= 1) return false;

      const bounds = BATTLE_SPRITE_BOUNDS[animation.target];
      if (!bounds) return false;

      const clampedRatio = clamp(elapsedRatio, 0, 1);
      if (animation.type === "impact") {
        drawImpactAnimation(animation, bounds, clampedRatio);
      } else if (animation.type === "shield") {
        drawShieldAnimation(animation, bounds, clampedRatio);
      } else if (animation.type === "hearts") {
        drawHeartsAnimation(animation, bounds, clampedRatio);
      } else if (animation.type === "capture") {
        drawCaptureAnimation(animation, bounds, clampedRatio);
      } else if (animation.type === "tonic") {
        drawTonicAnimation(animation, bounds, clampedRatio);
      }

      return true;
    });
  }

  const {
    activeMoveLearningPrompt,
    awardCreatureWinProgress,
    finishMoveLearningSequence,
    handleMoveLearningNavigation,
    leveledMaxHpForSpecies,
    moveName,
    moveSummary
  } = createBattleProgressionController({
    gameState,
    setMessage,
    clamp,
    writeBattleLog,
    startAscensionSequence
  });

  function attemptCatch() {
    const battle = gameState.battle;
    if (!battle) return { attempted: false, animationDuration: 0 };

    if (gameState.player.orbs <= 0) {
      writeBattleLog("No capture orbs left.");
      return { attempted: false, animationDuration: 0 };
    }

    gameState.player.orbs -= 1;
    const enemy = battle.enemy;
    const alreadyOwned = [...gameState.player.party, ...campCreatureStorage()]
      .some((creature) => creature.species === enemy.name);
    const healthRatio = enemy.hp / enemy.maxHp;
    const catchChance = clamp(0.2 + (1 - healthRatio) * 0.65 + (alreadyOwned ? -0.08 : 0.05), 0.12, 0.92);
    const captured = Math.random() <= catchChance;
    const animationDuration = startCaptureAnimation(captured ? "success" : "break");

    battle.turn = "capturing";
    writeBattleLog(`You threw a capture orb at ${enemy.name}.`);

    return {
      attempted: true,
      captured,
      species: enemy.name,
      animationDuration
    };
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
      animations: [],
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

  function applyMove(attacker, defender, moveId, owner) {
    const move = moveCatalog[moveId];
    if (Math.random() > move.accuracy) {
      writeBattleLog(`${attacker.nickname || attacker.name}'s ${move.name} missed.`);
      return { hit: false, animationDuration: 0 };
    }

    if (move.heal) {
      attacker.hp = clamp(attacker.hp + move.heal, 0, attacker.maxHp);
      writeBattleLog(`${attacker.nickname || attacker.name} restored ${move.heal} HP with ${move.name}.`);
      const animationDuration = startBattleAnimation(move, battleAnimationUserForOwner(owner), move.animation ?? "hearts");
      return { hit: true, animationDuration };
    }

    if (move.buff) {
      attacker.attackBoost += move.buff;
      writeBattleLog(`${attacker.nickname || attacker.name} sharpened focus. Attack rose.`);
      const animationDuration = startBattleAnimation(move, battleAnimationUserForOwner(owner), move.animation ?? "shield");
      return { hit: true, animationDuration };
    }

    const baseDamage = Math.max(5, move.power + attacker.attackBoost + Math.floor(Math.random() * 5) - 2);
    const effectiveness = typeEffectiveness(move.type, defender.type);
    const damage = Math.max(1, Math.round(baseDamage * effectiveness.multiplier));
    defender.hp = clamp(defender.hp - damage, 0, defender.maxHp);
    writeBattleLog(`${attacker.nickname || attacker.name} used ${move.name} for ${damage} damage.`);
    const animationDuration = startBattleAnimation(move, battleAnimationTargetForOwner(owner));

    if (effectiveness.label === "strong") {
      writeBattleLog("It was effective.");
    } else if (effectiveness.label === "weak") {
      writeBattleLog("It was resisted.");
    }

    if (defender.hp === 0) {
      writeBattleLog(`${defender.nickname || defender.name} was defeated.`);
      if (owner === "player") {
        gameState.player.wins += 1;
      }
    }

    return { hit: true, animationDuration };
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
        const nextCreatureIndex = gameState.player.party.findIndex((_, offset) => {
          if (offset === 0) return false;
          const index = (gameState.player.activeIndex + offset) % gameState.player.party.length;
          return gameState.player.party[index].hp > 0;
        });

        if (nextCreatureIndex >= 0) {
          const faintedName = activeCreature.nickname;
          gameState.player.activeIndex = (gameState.player.activeIndex + nextCreatureIndex) % gameState.player.party.length;
          const nextCreature = getActiveCreature();
          battle.resolving = false;
          writeBattleLog(`${nextCreature.nickname} stepped in as lead creature.`);
          setMessage(`${faintedName} fainted. ${nextCreature.nickname} is now leading your party.`);
          beginPlayerTurn();
          return;
        }

        const recoveryPoint = gameState.world.camp || gameState.world.start || { mapId: "sunmeadow", x: 1, y: 1 };
        outcomeMessage = gameState.world.camp
          ? `Your party fainted, then fully recovered back at camp.`
          : `Your party fainted, then fully recovered back at the start of your adventure.`;
        gameState.battle = null;

        if (typeof onPartyFainted === "function") {
          onPartyFainted({ recoveryPoint, outcomeMessage });
          return;
        }

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
    const battle = gameState.battle;
    const { enemy } = battle;
    const activeCreature = getActiveCreature();
    if (enemy.hp <= 0 || activeCreature.hp <= 0) {
      resolveBattleOutcome();
      return;
    }

    const moveId = randomMoveId(enemy.moves);
    const moveResult = applyMove(enemy, activeCreature, moveId, "enemy");
    const nextTurnDelay = moveResult?.animationDuration || 0;

    setTimeout(() => {
      if (gameState.battle !== battle) return;

      if (activeCreature.hp <= 0) {
        resolveBattleOutcome();
        return;
      }

      beginPlayerTurn();
    }, nextTurnDelay);
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
      action.moveResult = applyMove(activeCreature, battle.enemy, action.moveId, "player");
    } else if (action.type === "tonic") {
      if (gameState.player.potions <= 0) {
        writeBattleLog("No tonics left.");
        return;
      }
      gameState.player.potions -= 1;
      activeCreature.hp = clamp(activeCreature.hp + 20, 0, activeCreature.maxHp);
      writeBattleLog(`${activeCreature.nickname} used a health tonic.`);
      action.moveResult = { animationDuration: startTonicAnimation() };
    } else if (action.type === "catch") {
      const catchResult = attemptCatch();
      if (!catchResult.attempted) {
        return;
      }

      setTimeout(() => {
        if (gameState.battle !== battle) return;

        if (catchResult.captured) {
          const captureResult = captureCreature(catchResult.species);
          writeBattleLog(`${catchResult.species} was captured.`);
          gameState.battle = null;
          if (captureResult !== "storageFull") {
            gameState.scene = "world";
          }
          return;
        }

        writeBattleLog(`${catchResult.species} broke free.`);
        battle.turn = "enemy";
        setTimeout(enemyTurn, DEFAULT_BATTLE_TURN_DELAY);
      }, catchResult.animationDuration);
      return;
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

    const nextTurnDelay = action.moveResult?.animationDuration || DEFAULT_BATTLE_TURN_DELAY;

    if (battle.enemy.hp <= 0 || activeCreature.hp <= 0) {
      setTimeout(() => {
        if (gameState.battle === battle) {
          resolveBattleOutcome();
        }
      }, action.moveResult?.animationDuration || 0);
      return;
    }

    battle.turn = "enemy";
    setTimeout(enemyTurn, nextTurnDelay);
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
    drawText(battle.enemy.type ?? "Unknown", 78, 126, { font: "14px Outfit", color: "#694435" });
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
    drawText(`Lv ${activeCreature.level ?? CREATURE_MIN_LEVEL}`, 870, 264, {
      font: "16px Outfit",
      color: "#694435",
      align: "right"
    });
    drawText(activeCreature.type ?? "Unknown", 650, 342, { font: "14px Outfit", color: "#694435" });

    const captureSuccessAnimation = activeCaptureSuccessAnimation();
    const captureElapsedRatio = captureSuccessAnimation
      ? clamp((performance.now() - captureSuccessAnimation.startedAt) / captureSuccessAnimation.duration, 0, 1)
      : 0;
    const enemySpriteOpacity = captureSuccessAnimation ? Math.max(0, 1 - captureElapsedRatio * 1.35) : 1;

    ctx.save();
    ctx.globalAlpha = enemySpriteOpacity;
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
    ctx.restore();

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

    drawBattleAnimations();

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
        ? canAffordMove ? move.color ?? getTypeColor(move.type) : "#8d8178"
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
          `${moveCost} MP · ${move.type ?? "Typeless"}`,
          button.x + 16,
          button.y + 45,
          { font: "13px Outfit", color: canAffordMove ? "#fff8f0" : "#f3d1c3" }
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
          : battle.turn === "capturing"
            ? "Capture orb thrown..."
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
