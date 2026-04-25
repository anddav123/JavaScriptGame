export const creatureTemplates = {
  Roselle: {
    species: "Roselle",
    nickname: "Roselle",
    color: "#fc8ccd",
    spritePath: "assets/creatures/pyrel-sprite.png",
    fallbackSpritePath: "assets/creatures/pyrel-sprite.svg",
    role: "Starter",
    maxHp: 58,
    moves: ["ember", "vineSnap", "focus", "tonic"],
    description: "A warm-hearted ember fox that leads the party into danger."
  },
  Folio: {
    species: "Folio",
    nickname: "Folio",
    color: "#4d9a63",
    spritePath: "assets/creatures/mossling-sprite.png",
    fallbackSpritePath: "assets/creatures/mossling-sprite.svg",
    role: "Wildling",
    maxHp: 42,
    moves: ["vineSnap", "focus"],
    description: "A shy meadow creature that hides in moss and strikes with vines."
  },
  Scorcha: {
    species: "Scorcha",
    nickname: "Scorcha",
    color: "#d15b38",
    spritePath: "assets/creatures/cindercub-sprite.png",
    fallbackSpritePath: "assets/creatures/cindercub-sprite.svg",
    role: "Wildling",
    maxHp: 40,
    moves: ["ember", "focus"],
    description: "A fierce cub whose paws glow after every sprint."
  },
  Lilphant: {
    species: "Lilphant",
    nickname: "Lilphant",
    color: "#4d77b4",
    spritePath: "assets/creatures/ripplefin-sprite.png",
    fallbackSpritePath: "assets/creatures/ripplefin-sprite.svg",
    role: "Wildling",
    maxHp: 44,
    moves: ["vineSnap", "tonic", "iceShard"],
    description: "A calm river spirit that mends itself between attacks."
  }
};

export const enemyTemplates = Object.values(creatureTemplates)
  .filter((creature) => creature.species !== "Roselle")
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
