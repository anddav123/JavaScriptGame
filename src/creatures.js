export const MAX_CREATURE_MOVES = 4;

export const creatureTemplates = {
  Cubling: {
    species: "Cubling",
    nickname: "Cubling",
    color: "#4d9a63",
    spritePath: "assets/creatures/cubling-sprite.png",
    fallbackSpritePath: "assets/creatures/cubling-sprite.svg",
    role: "Starter",
    maxHp: 42,
    moves: ["vineSnap", "focus"],
    learnset: [
      { level: 5, move: "leafNeedle" },
      { level: 12, move: "rootJab" },
      { level: 18, move: "thornBurst" }
    ],
    ascension: { level: 20, species: "Dandelio" },
    description: "A bold young lion cub taking its first steps toward ruling the grassy plains."
  },
  Dandelio: {
    species: "Dandelio",
    nickname: "Dandelio",
    color: "#4d9a63",
    spritePath: "assets/creatures/dandelio-sprite.png",
    fallbackSpritePath: "assets/creatures/dandelio-sprite.svg",
    role: "Wildling",
    maxHp: 64,
    moves: ["vineSnap", "focus"],
    learnset: [
      { level: 20, move: "thornBurst" },
      { level: 28, move: "brambleCrash" },
      { level: 36, move: "petalCyclone" },
      { level: 44, move: "heal" }
    ],
    ascension: { level: 50, species: "Folio" },
    description: "A bright young lion with a leafy mane, eager for the day it becomes king."
  },
  Folio: {
    species: "Folio",
    nickname: "Folio",
    color: "#4d9a63",
    spritePath: "assets/creatures/folio-sprite.png",
    fallbackSpritePath: "assets/creatures/folio-sprite.svg",
    role: "Wildling",
    maxHp: 90,
    moves: ["vineSnap", "focus"],
    learnset: [
      { level: 50, move: "petalCyclone" },
      { level: 62, move: "brambleCrash" },
      { level: 74, move: "starfall" },
      { level: 88, move: "sunflare" },
      { level: 100, move: "heal" }
    ],
    description: "The leafy king of the grassy plains, ruling the meadows with quiet strength."
  },
  Scorcha: {
    species: "Scorcha",
    nickname: "Scorcha",
    color: "#d15b38",
    spritePath: "assets/creatures/scorcha-sprite.png",
    fallbackSpritePath: "assets/creatures/scorcha-sprite.svg",
    role: "Wildling",
    maxHp: 40,
    moves: ["ember", "focus"],
    learnset: [
      { level: 5, move: "emberFlick" },
      { level: 14, move: "flareBite" },
      { level: 26, move: "cinderRush" },
      { level: 42, move: "moltenPounce" },
      { level: 60, move: "sunflare" },
      { level: 82, move: "stormDive" }
    ],
    description: "A fierce cave dragon whose lair glows with bursts of flame."
  },
  Sproutrunk: {
    species: "Sproutrunk",
    nickname: "Sproutrunk",
    color: "#4d9a63",
    spritePath: "assets/creatures/sproutrunk-sprite.png",
    fallbackSpritePath: "assets/creatures/sproutrunk-sprite.svg",
    role: "Wildling",
    maxHp: 58,
    moves: ["ember", "vineSnap", "focus", "heal"],
    learnset: [
      { level: 8, move: "rootJab" },
      { level: 16, move: "flareBite" },
      { level: 24, move: "thornBurst" }
    ],
    ascension: { level: 30, species: ["Roselle", "Lilphant"] },
    description: "A gentle young elephant with a sturdy trunk and sprouting forest magic."
  },
  Roselle: {
    species: "Roselle",
    nickname: "Roselle",
    color: "#fc8ccd",
    spritePath: "assets/creatures/roselle-sprite.png",
    fallbackSpritePath: "assets/creatures/roselle-sprite.svg",
    role: "Wildling",
    maxHp: 58,
    moves: ["ember", "vineSnap", "focus", "heal"],
    learnset: [
      { level: 30, move: "petalCyclone" },
      { level: 42, move: "streamLash" },
      { level: 55, move: "moonClaw" },
      { level: 70, move: "starfall" },
      { level: 90, move: "sunflare" }
    ],
    description: "A warm-hearted rose elephant said to remember every face it meets."
  },
  Lilphant: {
    species: "Lilphant",
    nickname: "Lilphant",
    color: "#4d77b4",
    spritePath: "assets/creatures/lilphant-sprite.png",
    fallbackSpritePath: "assets/creatures/lilphant-sprite.svg",
    role: "Wildling",
    maxHp: 44,
    moves: ["vineSnap", "heal", "iceShard"],
    learnset: [
      { level: 30, move: "waterPebble" },
      { level: 40, move: "streamLash" },
      { level: 52, move: "snowPierce" },
      { level: 66, move: "tidalToss" },
      { level: 84, move: "glacierDrop" },
      { level: 100, move: "thunderHorn" }
    ],
    description: "A calm river elephant spirit that mends itself between battles."
  },
  Buzzybee: {
    species: "Buzzybee",
    nickname: "Buzzybee",
    color: "#d9ff03",
    spritePath: "assets/creatures/buzzybee-sprite.png",
    fallbackSpritePath: "assets/creatures/buzzybee-sprite.svg",
    role: "Wildling",
    maxHp: 32,
    moves: ["bump", "focus"],
    learnset: [
      { level: 5, move: "staticTap" },
      { level: 12, move: "chargeZap" },
      { level: 16, move: "sparkNibble" },
      { level: 20, move: "bugBite" },
      { level: 24, move: "sparkSting" }
    ],
    ascension: { level: 25, species: "Zapbee" },
    description: "A cheerful little bee creature that hums happily among the flowers."
  },
  Zapbee: {
    species: "Zapbee",
    nickname: "Zapbee",
    color: "#ffd43b",
    spritePath: "assets/creatures/zapbee-sprite.png",
    fallbackSpritePath: "assets/creatures/zapbee-sprite.svg",
    role: "Wildling",
    maxHp: 54,
    moves: ["sparkNibble", "bugBite", "sparkSting", "focus"],
    learnset: [
      { level: 25, move: "voltJolt" },
      { level: 32, move: "currentClaw" },
      { level: 40, move: "arcLeap" }
    ],
    ascension: { level: 45, species: "Electrabee" },
    description: "A fast, charged pollinator that snaps through the air in bright jolts."
  },
  Electrabee: {
    species: "Electrabee",
    nickname: "Electrabee",
    color: "#ffb703",
    spritePath: "assets/creatures/electrabee-sprite.png",
    fallbackSpritePath: "assets/creatures/electrabee-sprite.svg",
    role: "Wildling",
    maxHp: 78,
    moves: ["voltJolt", "currentClaw", "arcLeap", "focus"],
    learnset: [
      { level: 45, move: "relayBolt" },
      { level: 58, move: "coilSurge" },
      { level: 72, move: "stormPulse" },
      { level: 88, move: "thunderCrash" },
      { level: 100, move: "plasmaCrown" }
    ],
    description: "A radiant hive guardian that conducts stormlight through its wings."
  }
};

export function learnableMovesForLevelGain(species, previousLevel, nextLevel) {
  const learnset = creatureTemplates[species]?.learnset ?? [];
  return learnset
    .filter((entry) => entry.level > previousLevel && entry.level <= nextLevel)
    .map((entry) => entry.move);
}

export function defaultMovesForLevel(species, level) {
  const template = creatureTemplates[species];
  if (!template) return [];

  const moves = [...template.moves];
  for (const entry of template.learnset ?? []) {
    if (entry.level <= level && !moves.includes(entry.move)) {
      moves.push(entry.move);
    }
  }

  return moves.slice(-MAX_CREATURE_MOVES);
}

export const enemyTemplates = Object.values(creatureTemplates)
  .filter((creature) => creature.role !== "Starter")
  .map((creature) => ({
    name: creature.species,
    color: creature.color,
    spritePath: creature.spritePath,
    maxHp: creature.maxHp,
    moves: creature.moves
  }));

export const enemyTemplatesBySpecies = Object.fromEntries(
  enemyTemplates.map((creature) => [creature.name, creature])
);
