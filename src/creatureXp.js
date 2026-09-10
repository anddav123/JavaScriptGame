import {
  CREATURE_MAX_LEVEL,
  CREATURE_MIN_LEVEL,
  CREATURE_XP_BASE_TO_LEVEL,
  CREATURE_XP_GROWTH_PER_LEVEL,
  CREATURE_XP_LEGACY_PER_LEVEL
} from "./constants.js";

/**
 * XP required to advance from `level` to `level + 1`.
 * Increases each level: base + growth * (level - min).
 */
export function xpRequiredToAdvance(level) {
  const safeLevel = Number.isFinite(level)
    ? Math.round(level)
    : CREATURE_MIN_LEVEL;
  if (safeLevel < CREATURE_MIN_LEVEL || safeLevel >= CREATURE_MAX_LEVEL) {
    return 0;
  }

  return CREATURE_XP_BASE_TO_LEVEL
    + CREATURE_XP_GROWTH_PER_LEVEL * (safeLevel - CREATURE_MIN_LEVEL);
}

/**
 * Total lifetime XP needed to reach the start of `level`.
 * Closed form of sum_{i=0}^{n-1} (base + growth * i).
 */
export function totalXpForLevel(level) {
  const safeLevel = Number.isFinite(level)
    ? Math.min(CREATURE_MAX_LEVEL, Math.max(CREATURE_MIN_LEVEL, Math.round(level)))
    : CREATURE_MIN_LEVEL;
  const steps = safeLevel - CREATURE_MIN_LEVEL;
  if (steps <= 0) return 0;

  return steps * CREATURE_XP_BASE_TO_LEVEL
    + CREATURE_XP_GROWTH_PER_LEVEL * steps * (steps - 1) / 2;
}

export function maxCreatureXp() {
  return totalXpForLevel(CREATURE_MAX_LEVEL);
}

export function levelForTotalXp(xp) {
  const safeXp = Number.isFinite(xp) ? Math.max(0, Math.round(xp)) : 0;
  let level = CREATURE_MIN_LEVEL;
  while (level < CREATURE_MAX_LEVEL && safeXp >= totalXpForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function xpIntoCurrentLevel(xp, level = levelForTotalXp(xp)) {
  const safeLevel = Number.isFinite(level)
    ? Math.min(CREATURE_MAX_LEVEL, Math.max(CREATURE_MIN_LEVEL, Math.round(level)))
    : CREATURE_MIN_LEVEL;
  return Math.max(0, Math.round(xp) - totalXpForLevel(safeLevel));
}

/**
 * Map legacy flat XP (10 per level) onto the new curve while preserving level.
 */
export function migrateCreatureXp(level, xp) {
  const safeLevel = Number.isFinite(level)
    ? Math.min(CREATURE_MAX_LEVEL, Math.max(CREATURE_MIN_LEVEL, Math.round(level)))
    : CREATURE_MIN_LEVEL;
  const floor = totalXpForLevel(safeLevel);

  if (safeLevel >= CREATURE_MAX_LEVEL) {
    return maxCreatureXp();
  }

  const next = totalXpForLevel(safeLevel + 1);
  const span = Math.max(1, next - floor);

  if (Number.isFinite(xp) && xp >= floor && xp < next) {
    return Math.round(xp);
  }

  const legacyFloor = (safeLevel - CREATURE_MIN_LEVEL) * CREATURE_XP_LEGACY_PER_LEVEL;
  const legacyInto = Number.isFinite(xp)
    ? Math.max(0, Math.round(xp) - legacyFloor)
    : 0;
  const ratio = Math.min(0.999, Math.max(0, legacyInto / CREATURE_XP_LEGACY_PER_LEVEL));
  return floor + Math.floor(ratio * span);
}

export function xpProgressLabel(creature) {
  const level = Number.isFinite(creature?.level)
    ? creature.level
    : levelForTotalXp(creature?.xp);
  if (level >= CREATURE_MAX_LEVEL) {
    return "MAX";
  }

  const into = xpIntoCurrentLevel(creature.xp, level);
  const needed = xpRequiredToAdvance(level);
  return `${into}/${needed}`;
}
