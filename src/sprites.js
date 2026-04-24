import {
  CREATURE_SPRITE_SIZE,
  PLAYER_FACING_ROWS,
  PLAYER_SPRITE_FALLBACK_FRAME_SIZE,
  PLAYER_SPRITE_FALLBACK_PATH,
  PLAYER_SPRITE_FRAME_SIZE,
  PLAYER_SPRITE_PATH,
  TILE_SIZE
} from "./constants.js";
import { creatureTemplates } from "./creatures.js";

export function createSpriteController({
  ctx,
  getActiveCreature,
  drawRoundedRect,
  traceRoundedRectPath
}) {
  const playerSpriteRecord = {
    image: new Image(),
    frameSize: PLAYER_SPRITE_FRAME_SIZE,
    ready: false
  };
  const creatureSpriteRegistry = {};

  const playerSpriteSources = [
    { src: PLAYER_SPRITE_PATH, frameSize: PLAYER_SPRITE_FRAME_SIZE },
    { src: PLAYER_SPRITE_FALLBACK_PATH, frameSize: PLAYER_SPRITE_FALLBACK_FRAME_SIZE }
  ].filter((source) => source.src);
  let playerSpriteSourceIndex = 0;

  function loadNextPlayerSprite() {
    const nextSource = playerSpriteSources[playerSpriteSourceIndex];
    if (!nextSource) {
      playerSpriteRecord.ready = false;
      return;
    }

    playerSpriteRecord.ready = false;
    playerSpriteRecord.frameSize = nextSource.frameSize;
    playerSpriteRecord.image.src = nextSource.src;
  }

  playerSpriteRecord.image.addEventListener("load", () => {
    playerSpriteRecord.ready = true;
  });
  playerSpriteRecord.image.addEventListener("error", () => {
    playerSpriteSourceIndex += 1;
    loadNextPlayerSprite();
  });

  loadNextPlayerSprite();

  function ensureCreatureSprite(species) {
    if (creatureSpriteRegistry[species]) return creatureSpriteRegistry[species];

    const template = creatureTemplates[species];
    if (!template?.spritePath) {
      creatureSpriteRegistry[species] = { image: null, ready: false };
      return creatureSpriteRegistry[species];
    }

    const image = new Image();
    const spriteSources = [template.spritePath, template.fallbackSpritePath].filter(Boolean);
    const spriteRecord = {
      image,
      ready: false,
      usesPixelArtScaling: false
    };
    let sourceIndex = 0;

    function loadNextSource() {
      const nextSource = spriteSources[sourceIndex];
      if (!nextSource) {
        spriteRecord.ready = false;
        return;
      }

      image.src = nextSource;
    }

    image.addEventListener("load", () => {
      spriteRecord.ready = true;
      spriteRecord.usesPixelArtScaling = image.src.toLowerCase().endsWith(".svg");
    });
    image.addEventListener("error", () => {
      sourceIndex += 1;
      loadNextSource();
    });

    loadNextSource();
    creatureSpriteRegistry[species] = spriteRecord;
    return spriteRecord;
  }

  function drawCreatureSprite(creature, x, y, width, height, options = {}) {
    const { flip = false, frameColor = creature.color, padding = 10, radius = 24, border = true } = options;
    const spriteRecord = ensureCreatureSprite(creature.species || creature.name);

    if (border) {
      drawRoundedRect(x, y, width, height, radius, frameColor, "#ffffff");
    }

    if (!spriteRecord.ready) {
      drawRoundedRect(
        x + padding,
        y + padding,
        Math.max(18, width - padding * 2),
        Math.max(18, height - padding * 2),
        Math.max(10, radius - 8),
        "rgba(255, 243, 231, 0.88)"
      );
      return;
    }

    const innerX = x + padding;
    const innerY = y + padding;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const sourceWidth = spriteRecord.image.naturalWidth || CREATURE_SPRITE_SIZE;
    const sourceHeight = spriteRecord.image.naturalHeight || CREATURE_SPRITE_SIZE;
    const scale = Math.min(innerWidth / sourceWidth, innerHeight / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const offsetX = innerX + (innerWidth - drawWidth) / 2;
    const offsetY = innerY + (innerHeight - drawHeight) / 2;

    ctx.save();
    ctx.imageSmoothingEnabled = !spriteRecord.usesPixelArtScaling;
    traceRoundedRectPath(innerX, innerY, innerWidth, innerHeight, Math.max(10, radius - 8));
    ctx.clip();

    if (flip) {
      ctx.translate(offsetX + drawWidth, offsetY);
      ctx.scale(-1, 1);
      ctx.drawImage(spriteRecord.image, 0, 0, drawWidth, drawHeight);
      ctx.restore();
      return;
    }

    ctx.drawImage(spriteRecord.image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  }

  function drawPlayer(player, x, y) {
    const playerSprite = playerSpriteRecord.image;
    const frameSize = playerSpriteRecord.frameSize;
    const isSpriteUsable =
      playerSpriteRecord.ready &&
      playerSprite.complete &&
      playerSprite.naturalWidth >= frameSize * 3 &&
      playerSprite.naturalHeight >= frameSize * 4;

    if (!isSpriteUsable) {
      drawRoundedRect(x + 8, y + 5, 32, 38, 14, "#ffffff", getActiveCreature().color);
      drawRoundedRect(x + 12, y + 9, 24, 30, 12, getActiveCreature().color);
      drawRoundedRect(x + 16, y + 13, 16, 10, 4, "#fff0d8");
      return;
    }

    const facingRow = PLAYER_FACING_ROWS[player.facing] ?? PLAYER_FACING_ROWS.down;
    const isIdle = performance.now() - player.lastMovedAt > 180;
    const frameColumn = isIdle ? 0 : player.walkFrame;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      playerSprite,
      frameColumn * frameSize,
      facingRow * frameSize,
      frameSize,
      frameSize,
      x,
      y,
      TILE_SIZE,
      TILE_SIZE
    );
    ctx.restore();
  }

  return {
    drawCreatureSprite,
    drawPlayer
  };
}
