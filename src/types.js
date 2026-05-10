export const creatureTypes = Object.freeze({
  WATER: "Water",
  FIRE: "Fire",
  NATURE: "Nature",
  STONE: "Stone",
  LIGHTNING: "Lightning",
  FLYING: "Flying",
  MAGIC: "Magic",
  ICE: "Ice",
  POISON: "Poison",
  SHADOW: "Shadow",
  LIGHT: "Light",
  DRAGON: "Dragon"
});

export const typeColors = Object.freeze({
  [creatureTypes.WATER]: "#228be6",
  [creatureTypes.FIRE]: "#ef6c3e",
  [creatureTypes.NATURE]: "#2d8f64",
  [creatureTypes.STONE]: "#60514c",
  [creatureTypes.LIGHTNING]: "#f8ff95",
  [creatureTypes.FLYING]: "#b8e2ff",
  [creatureTypes.MAGIC]: "#845ef7",
  [creatureTypes.ICE]: "#88cbda",
  [creatureTypes.POISON]: "#81d842",
  [creatureTypes.SHADOW]: "#06032b",
  [creatureTypes.LIGHT]: "#faffb6",
  [creatureTypes.DRAGON]: "#988917"
});

export const TYPE_DAMAGE_MULTIPLIERS = Object.freeze({
  strong: 1.5,
  weak: 0.75,
  neutral: 1
});

const typeStrengths = Object.freeze({
  [creatureTypes.WATER]: creatureTypes.FIRE,
  [creatureTypes.FIRE]: creatureTypes.ICE,
  [creatureTypes.ICE]: creatureTypes.FLYING,
  [creatureTypes.FLYING]: creatureTypes.NATURE,
  [creatureTypes.NATURE]: creatureTypes.STONE,
  [creatureTypes.STONE]: creatureTypes.LIGHTNING,
  [creatureTypes.LIGHTNING]: creatureTypes.WATER,
  [creatureTypes.MAGIC]: creatureTypes.DRAGON,
  [creatureTypes.DRAGON]: creatureTypes.SHADOW,
  [creatureTypes.SHADOW]: creatureTypes.LIGHT,
  [creatureTypes.LIGHT]: creatureTypes.POISON,
  [creatureTypes.POISON]: creatureTypes.MAGIC
});

export function getTypeColor(type, fallback = "#8d8178") {
  return typeColors[type] ?? fallback;
}

export function typeEffectiveness(moveType, defenderType) {
  if (!moveType || !defenderType) {
    return { label: "neutral", multiplier: TYPE_DAMAGE_MULTIPLIERS.neutral };
  }

  if (typeStrengths[moveType] === defenderType) {
    return { label: "strong", multiplier: TYPE_DAMAGE_MULTIPLIERS.strong };
  }

  if (typeStrengths[defenderType] === moveType) {
    return { label: "weak", multiplier: TYPE_DAMAGE_MULTIPLIERS.weak };
  }

  return { label: "neutral", multiplier: TYPE_DAMAGE_MULTIPLIERS.neutral };
}
