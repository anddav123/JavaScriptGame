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
    description: "A shy meadow creature that hides in moss and strikes with vines."
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
    description: "A shy meadow creature that hides in moss and strikes with vines."
  },
  Folio: {
    species: "Folio",
    nickname: "Folio",
    color: "#4d9a63",
    spritePath: "assets/creatures/folio-sprite.png",
    fallbackSpritePath: "assets/creatures/folio-sprite.svg",
    role: "Wildling",
    maxHp: 120,
    moves: ["vineSnap", "focus"],
    description: "A shy meadow creature that hides in moss and strikes with vines."
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
    description: "A fierce cub whose paws glow after every sprint."
  },
  Sproutrunk: {
    species: "Sproutrunk",
    nickname: "Sproutrunk",
    color: "#4d9a63",
    spritePath: "assets/creatures/sproutrunk-sprite.png",
    fallbackSpritePath: "assets/creatures/sproutrunk-sprite.svg",
    role: "Wildling",
    maxHp: 58,
    moves: ["ember", "vineSnap", "focus", "tonic"],
    description: "A warm-hearted ember fox that leads the party into danger."
  },
  Roselle: {
    species: "Roselle",
    nickname: "Roselle",
    color: "#fc8ccd",
    spritePath: "assets/creatures/roselle-sprite.png",
    fallbackSpritePath: "assets/creatures/pyrel-sprite.svg",
    role: "Wildling",
    maxHp: 58,
    moves: ["ember", "vineSnap", "focus", "tonic"],
    description: "A warm-hearted ember fox that leads the party into danger."
  },
  Lilphant: {
    species: "Lilphant",
    nickname: "Lilphant",
    color: "#4d77b4",
    spritePath: "assets/creatures/lilphant-sprite.png",
    fallbackSpritePath: "assets/creatures/lilphant-spriteripplefin-sprite.svg",
    role: "Wildling",
    maxHp: 44,
    moves: ["vineSnap", "tonic", "iceShard"],
    description: "A calm river spirit that mends itself between attacks."
  }
};

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
