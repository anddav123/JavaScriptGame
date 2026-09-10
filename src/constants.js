export const TILE_SIZE = 48;
export const PLAYER_SPRITE_PATH = "assets/player-sprite.png";
export const PLAYER_SPRITE_FALLBACK_PATH = "assets/player-sprite.svg";
export const PLAYER_SPRITE_FRAME_SIZE = 48;
export const PLAYER_SPRITE_FALLBACK_FRAME_SIZE = 48;
export const CREATURE_SPRITE_SIZE = 96;
export const SAVE_VERSION = 1;
export const INITIAL_PLAYER_MAX_MP = 40;
export const INITIAL_MINOR_TONICS = 3;
export const INITIAL_BASIC_ORBS = 5;
export const PLAYER_MP_RECHARGE_AMOUNT = 1;
export const PLAYER_MP_RECHARGE_STEP_INTERVAL = 2;
export const PLAYER_BATTLE_MP_RECOVERY = 1;
export const PLAYER_PARTY_MAX_SIZE = 5;
export const PLAYER_CAMP_MAX_CREATURES = 200;
export const CREATURE_MIN_LEVEL = 1;
export const CREATURE_MAX_LEVEL = 100;
/** XP awarded for defeating an equal-level enemy. Scales by enemy/player level ratio. */
export const CREATURE_XP_BASE_PER_WIN = 2;
export const CREATURE_XP_MIN_PER_WIN = 1;
export const CREATURE_XP_MAX_PER_WIN = 12;
export const CREATURE_XP_TRAINER_MULTIPLIER = 1.5;
/** XP needed to go from level 1 → 2. Each further level adds GROWTH more XP. */
export const CREATURE_XP_BASE_TO_LEVEL = 10;
export const CREATURE_XP_GROWTH_PER_LEVEL = 2;
/** Pre-curve flat XP-per-level, kept for migrating older saves. */
export const CREATURE_XP_LEGACY_PER_LEVEL = 10;
export const CREATURE_HP_PER_LEVEL = 2;

export const PLAYER_FACING_ROWS = {
  down: 0,
  left: 1,
  right: 2,
  up: 3
};
