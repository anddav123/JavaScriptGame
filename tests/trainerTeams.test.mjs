import assert from "node:assert/strict";
import test from "node:test";
import { createBattleController } from "../src/battle.js";
import { creatureTemplates, defaultMovesForLevel, enemyTemplates } from "../src/creatures.js";
import { totalXpForLevel } from "../src/creatureXp.js";
import { createInitialInventory } from "../src/inventory.js";
import { worldMaps } from "../src/maps.js";
import { hasDefeatedTrainer, trainerBattleRecord } from "../src/trainerBattles.js";

function playerCreature(species = "Cubling") {
  const template = creatureTemplates[species];
  const level = 3;
  const maxHp = template.maxHp + (level - 1) * 2;
  return {
    ...template,
    level,
    xp: totalXpForLevel(level),
    maxHp,
    hp: maxHp,
    attackBoost: 0,
    moves: defaultMovesForLevel(species, level)
  };
}

function setup(t, { party = [playerCreature()], onPartyFainted } = {}) {
  const timers = [];
  let now = 0;
  t.mock.method(globalThis, "setTimeout", (callback, delay = 0) => {
    const timer = { callback, at: now + delay };
    timers.push(timer);
    return timer;
  });
  t.mock.method(Math, "random", () => 0);
  const gameState = {
    scene: "world",
    player: {
      party,
      activeIndex: 0,
      mp: 40,
      maxMp: 40,
      wins: 0,
      battles: {},
      tutorials: { rangerBattleDropsIntroSeen: true },
      inventory: createInitialInventory()
    },
    world: {
      currentMapId: "sunmeadow",
      activeTrainerChaseId: "frank",
      start: { mapId: "sunmeadow", x: 1, y: 1 }
    },
    encounterTransition: {},
    battle: null
  };
  const messages = [];
  const drawnText = [];
  const getActiveCreature = () => gameState.player.party[gameState.player.activeIndex];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }) }, {
    get: (target, key) => target[key] ?? (() => {})
  });
  const controller = createBattleController({
    canvas: { width: 960, height: 576 },
    ctx,
    gameState,
    getMouse: () => ({ x: -1, y: -1 }),
    getActiveCreature,
    currentMap: () => worldMaps[gameState.world.currentMapId],
    setMessage: (message) => messages.push(message),
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    clearKeys() {},
    drawRoundedRect() {},
    drawText: (text) => drawnText.push(text),
    drawHpBar() {},
    drawCreatureSprite() {},
    onPartyFainted
  });
  const frank = structuredClone(worldMaps.sunmeadow.npcs.find((npc) => npc.name === "Frank"));
  const finishTimers = () => {
    let callbacks = 0;
    while (timers.length > 0) {
      assert.ok(callbacks++ < 100, "battle timers should settle");
      timers.sort((a, b) => a.at - b.at);
      const timer = timers.shift();
      now = timer.at;
      timer.callback();
    }
  };
  const defeatEnemy = () => {
    getActiveCreature().attackBoost = 1000;
    controller.playerAction({ type: "move", moveId: getActiveCreature().moves[0] });
    finishTimers();
  };
  const faintPlayer = () => {
    getActiveCreature().hp = 1;
    gameState.player.mp = 39;
    gameState.battle.enemy.attackBoost = 1000;
    gameState.battle.enemy.moves = ["natureVineWhip"];
    controller.playerAction({ type: "recoverMp" });
    finishTimers();
  };
  return { controller, gameState, frank, messages, drawnText, defeatEnemy, faintPlayer, finishTimers };
}

test("Frank's team includes a starter without adding starters to wild encounters", (t) => {
  const { controller, gameState, frank, drawnText } = setup(t);
  controller.beginTrainerBattle(frank);
  assert.equal(gameState.scene, "encounter");
  assert.deepEqual(gameState.battle.trainer.team.map(({ name, level }) => ({ name, level })), [
    { name: "Sproutrunk", level: 3 },
    { name: "Cubling", level: 3 }
  ]);
  assert.equal(gameState.battle.enemy.hp, 62);
  assert.equal(gameState.battle.trainer.team[1].hp, 46);
  assert.equal(gameState.encounterTransition.enemyName, "Sproutrunk");
  assert.equal(enemyTemplates.some(({ name }) => name === "Cubling"), false);
  controller.drawBattle();
  assert.ok(drawnText.includes("Creature 1/2"));
});

test("a knockout sends out the next creature and only a full-team win grants rewards", (t) => {
  const { controller, gameState, frank, defeatEnemy, drawnText } = setup(t);
  controller.beginTrainerBattle(frank);
  gameState.scene = "battle";
  const battle = gameState.battle;
  const player = gameState.player.party[0];
  player.hp = 20;
  battle.menuMode = "items";
  battle.selectionIndex = 4;
  defeatEnemy();

  assert.equal(gameState.battle, battle);
  assert.equal(battle.enemy.name, "Cubling");
  assert.equal(battle.enemy.hp, battle.enemy.maxHp);
  assert.equal(battle.enemy.attackBoost, 0);
  assert.equal(battle.turn, "player");
  assert.equal(battle.menuMode, "actions");
  assert.equal(battle.selectionIndex, 0);
  assert.equal(player.hp, 20);
  assert.equal(player.attackBoost, 1000);
  assert.ok(gameState.player.mp < 40);
  assert.equal(hasDefeatedTrainer(gameState, frank), false);
  assert.equal(trainerBattleRecord(gameState, "sunmeadow", "frank"), null);
  assert.equal(player.xp, totalXpForLevel(3));
  assert.equal(gameState.player.inventory.resources.meadowHerb, 0);
  controller.drawBattle();
  assert.ok(drawnText.includes("Creature 2/2"));

  defeatEnemy();
  assert.equal(gameState.battle, null);
  assert.equal(gameState.scene, "world");
  assert.equal(gameState.player.wins, 2);
  assert.equal(hasDefeatedTrainer(gameState, frank), true);
  assert.equal(trainerBattleRecord(gameState, "sunmeadow", "frank").wins, 1);
  assert.equal(player.xp, totalXpForLevel(3) + 6);
  assert.equal(gameState.player.inventory.resources.meadowHerb, 2);
  assert.equal(gameState.world.activeTrainerChaseId, null);
});

test("extra inputs during a knockout cannot count the same creature twice", (t) => {
  const { controller, gameState, frank, finishTimers } = setup(t);
  controller.beginTrainerBattle(frank);
  gameState.player.party[0].attackBoost = 1000;
  controller.playerAction({ type: "move", moveId: "natureVineWhip" });
  const remainingMp = gameState.player.mp;
  controller.playerAction({ type: "move", moveId: "natureVineWhip" });
  finishTimers();
  assert.equal(gameState.player.wins, 1);
  assert.equal(gameState.player.mp, remainingMp);
  assert.equal(gameState.battle.enemy.name, "Cubling");
  assert.equal(gameState.battle.trainer.defeatedOpponents.length, 1);
});

test("trainer creatures cannot be caught and trainer battles cannot be escaped", (t) => {
  const { controller, gameState, frank, defeatEnemy } = setup(t);
  controller.beginTrainerBattle(frank);
  for (let index = 0; index < 2; index += 1) {
    const enemy = gameState.battle.enemy;
    controller.playerAction({ type: "catch" });
    controller.playerAction({ type: "run" });
    assert.equal(gameState.battle.enemy, enemy);
    assert.equal(gameState.battle.turn, "player");
    assert.equal(gameState.player.inventory.items.basicOrb, 5);
    assert.equal(gameState.player.party.length, 1);
    if (index === 0) defeatEnemy();
  }
});

test("player replacements continue the team battle and XP goes to each opponent's winner", (t) => {
  const party = [playerCreature(), playerCreature("Scorcha")];
  const { controller, gameState, frank, defeatEnemy, faintPlayer } = setup(t, { party });
  controller.beginTrainerBattle(frank);
  defeatEnemy();
  faintPlayer();
  assert.equal(gameState.player.activeIndex, 1);
  assert.equal(gameState.battle.enemy.name, "Cubling");
  assert.equal(hasDefeatedTrainer(gameState, frank), false);
  defeatEnemy();
  assert.equal(gameState.battle, null);
  assert.equal(party[0].xp, totalXpForLevel(3) + 3);
  assert.equal(party[1].xp, totalXpForLevel(3) + 3);
});

test("losing to a later team member records a loss and rematches start with a fresh team", (t) => {
  const { controller, gameState, frank, defeatEnemy, faintPlayer } = setup(t);
  controller.beginTrainerBattle(frank);
  defeatEnemy();
  faintPlayer();
  assert.equal(gameState.battle, null);
  assert.equal(gameState.scene, "world");
  assert.equal(hasDefeatedTrainer(gameState, frank), false);
  assert.equal(trainerBattleRecord(gameState, "sunmeadow", "frank").losses, 1);
  assert.equal(gameState.world.activeTrainerChaseId, null);
  assert.equal(gameState.player.party[0].hp, gameState.player.party[0].maxHp);
  assert.equal(gameState.player.party[0].xp, totalXpForLevel(3));
  controller.beginTrainerBattle(frank);
  assert.equal(gameState.battle.enemy.name, "Sproutrunk");
  assert.equal(gameState.battle.enemy.hp, gameState.battle.enemy.maxHp);
  assert.equal(gameState.battle.trainer.teamIndex, 0);
  assert.equal(gameState.battle.trainer.defeatedOpponents.length, 0);
});

test("a team loss still invokes the party-fainted cutscene hook", (t) => {
  let recovery;
  const { controller, gameState, frank, defeatEnemy, faintPlayer } = setup(t, {
    onPartyFainted: (details) => { recovery = details; }
  });
  controller.beginTrainerBattle(frank);
  defeatEnemy();
  faintPlayer();
  assert.equal(gameState.battle, null);
  assert.deepEqual(recovery.recoveryPoint, { mapId: "sunmeadow", x: 1, y: 1 });
  assert.match(recovery.outcomeMessage, /party fainted/);
});

test("existing single-creature trainers still work", (t) => {
  const { controller, gameState, defeatEnemy } = setup(t);
  const trainer = worldMaps.brookbend.npcs.find((npc) => npc.battle && !Array.isArray(npc.battle.team));
  assert.ok(trainer, "Brookbend should have a single-creature trainer");
  gameState.world.currentMapId = "brookbend";
  controller.beginTrainerBattle(trainer);
  assert.ok(gameState.battle, `${trainer.name}'s battle should start`);
  assert.equal(gameState.battle.enemy.name, trainer.battle.species);
  assert.equal(gameState.battle.enemy.level, trainer.battle.level);
  defeatEnemy();
  assert.equal(gameState.battle, null);
  assert.equal(hasDefeatedTrainer(gameState, trainer), true);
});

test("wild battles still end after one opponent", (t) => {
  const { controller, gameState, defeatEnemy } = setup(t);
  controller.beginEncounter();
  assert.equal(gameState.battle.trainer, undefined);
  defeatEnemy();
  assert.equal(gameState.battle, null);
  assert.equal(gameState.scene, "world");
  assert.deepEqual(gameState.player.battles, {});
  assert.ok(gameState.player.party[0].xp > totalXpForLevel(3));
});

test("empty teams and unknown species are rejected before starting a battle", (t) => {
  const { controller, gameState, frank, messages } = setup(t);
  for (const team of [[], [{ species: "Unknown" }], [{ species: "Cubling" }, null]]) {
    frank.battle.team = team;
    controller.beginTrainerBattle(frank);
    assert.equal(gameState.battle, null);
    assert.equal(gameState.scene, "world");
    assert.equal(messages.at(-1), "Frank is not ready to battle.");
  }
});
