import { TILE_SIZE } from "./constants.js";

const NPC_STEP_ANIMATION_FACTOR = 0.3;
const NPC_STEP_ANIMATION_MAX_DURATION = 520;
const NPC_STEP_ANIMATION_MIN_DURATION = 140;

export function createNonPlayerCharacterController({
  canvas,
  ctx,
  gameState,
  worldToScreenX,
  worldToScreenY,
  drawRoundedRect,
  drawText
}) {
  const npcSpriteCache = new Map();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function easeMovementProgress(value) {
    return value < 0.5
      ? 2 * value * value
      : 1 - ((-2 * value + 2) ** 2) / 2;
  }

  function animatedPatrolState(state, now = performance.now()) {
    if (!state.moveStartedAt || !state.moveDuration) {
      return { ...state, isMoving: false, movementProgress: 0 };
    }

    const progress = clamp((now - state.moveStartedAt) / state.moveDuration, 0, 1);
    if (progress >= 1) {
      return { ...state, isMoving: false, movementProgress: 1 };
    }

    const easedProgress = easeMovementProgress(progress);
    return {
      ...state,
      x: state.fromX + (state.toX - state.fromX) * easedProgress,
      y: state.fromY + (state.toY - state.fromY) * easedProgress,
      isMoving: true,
      movementProgress: progress
    };
  }

  function walkFrameForMovement(visualState, frameCount) {
    if (!visualState.isMoving || frameCount <= 1) return 0;

    const walkingFrameCount = Math.max(1, frameCount - 1);
    return 1 + (Math.floor(visualState.movementProgress * walkingFrameCount * 2) % walkingFrameCount);
  }

  function startPatrolAnimation(state, nextX, nextY, now, intervalMs) {
    const maxDuration = Math.min(NPC_STEP_ANIMATION_MAX_DURATION, intervalMs * 0.82);
    const minDuration = Math.min(NPC_STEP_ANIMATION_MIN_DURATION, maxDuration);
    state.fromX = state.x;
    state.fromY = state.y;
    state.toX = nextX;
    state.toY = nextY;
    state.moveStartedAt = now;
    state.moveDuration = clamp(intervalMs * NPC_STEP_ANIMATION_FACTOR, minDuration, maxDuration);
  }

  function createCirclePatrolPath(npc) {
    const requestedRadius = Number.isFinite(npc.patrol.radius) ? npc.patrol.radius : 1;
    const radius = Math.max(1, Math.round(requestedRadius));
    const topY = npc.y;
    const centerX = npc.x;
    const centerY = npc.y + radius;
    const path = [];

    for (let x = centerX; x <= centerX + radius; x += 1) {
      path.push({ x, y: topY });
    }

    for (let y = topY + 1; y <= centerY + radius; y += 1) {
      path.push({ x: centerX + radius, y });
    }

    for (let x = centerX + radius - 1; x >= centerX - radius; x -= 1) {
      path.push({ x, y: centerY + radius });
    }

    for (let y = centerY + radius - 1; y >= topY; y -= 1) {
      path.push({ x: centerX - radius, y });
    }

    for (let x = centerX - radius + 1; x < centerX; x += 1) {
      path.push({ x, y: topY });
    }

    return path;
  }

  function npcPatrolPath(npc) {
    if (!npc.patrol) return null;

    if (Array.isArray(npc.patrol.path)) {
      const path = npc.patrol.path
        .map((point) => {
          if (!point || typeof point !== "object") return null;

          return {
            x: Number.isFinite(point.x) ? Math.round(point.x) : npc.x + Math.round(point.dx || 0),
            y: Number.isFinite(point.y) ? Math.round(point.y) : npc.y + Math.round(point.dy || 0)
          };
        })
        .filter(Boolean)
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

      return path.length > 1 ? path : null;
    }

    if (npc.patrol.shape === "circle") {
      return createCirclePatrolPath(npc);
    }

    return null;
  }

  function facingForStep(dx, dy, fallback = "down") {
    if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
    if (dy !== 0) return dy < 0 ? "up" : "down";
    return fallback;
  }

  function npcPatrolState(npc) {
    if (!npc.patrol) {
      return { x: npc.x, y: npc.y, facing: "down", frame: 0 };
    }

    const steps = Math.max(1, npc.patrol.steps || 1);
    const intervalMs = Math.max(120, npc.patrol.intervalMs || 700);
    const now = performance.now();
    const path = npcPatrolPath(npc);

    if (!npc._patrolState) {
      npc._patrolState = {
        x: npc.x,
        y: npc.y,
        offset: 0,
        direction: -1,
        pathIndex: 0,
        facing: "down",
        frame: 0,
        lastStepAt: now,
        fromX: npc.x,
        fromY: npc.y,
        toX: npc.x,
        toY: npc.y,
        moveStartedAt: 0,
        moveDuration: 0
      };

      if (path) {
        npc._patrolState.x = path[0].x;
        npc._patrolState.y = path[0].y;
        npc._patrolState.fromX = path[0].x;
        npc._patrolState.fromY = path[0].y;
        npc._patrolState.toX = path[0].x;
        npc._patrolState.toY = path[0].y;
      }
    }

    const state = npc._patrolState;
    if (now - state.lastStepAt < intervalMs) {
      return state;
    }

    if (path) {
      const nextPathIndex = (state.pathIndex + 1) % path.length;
      const nextPoint = path[nextPathIndex];
      const nextFacing = facingForStep(nextPoint.x - state.x, nextPoint.y - state.y, state.facing);

      state.facing = nextFacing;

      if (gameState.player.x === nextPoint.x && gameState.player.y === nextPoint.y) {
        state.frame = 0;
        state.lastStepAt = now;
        return state;
      }

      startPatrolAnimation(state, nextPoint.x, nextPoint.y, now, intervalMs);
      state.x = nextPoint.x;
      state.y = nextPoint.y;
      state.pathIndex = nextPathIndex;
      state.frame = (state.frame + 1) % 3;
      state.lastStepAt = now;
      return state;
    }

    const nextDirection =
      (state.offset <= -steps && state.direction < 0) || (state.offset >= 0 && state.direction > 0)
        ? state.direction * -1
        : state.direction;
    const nextOffset = state.offset + nextDirection;
    const nextX = npc.patrol.axis === "x" ? npc.x + nextOffset : npc.x;
    const nextY = npc.patrol.axis === "x" ? npc.y : npc.y + nextOffset;
    const nextFacing = facingForStep(nextX - state.x, nextY - state.y, state.facing);

    state.facing = nextFacing;
    state.direction = nextDirection;

    if (gameState.player.x === nextX && gameState.player.y === nextY) {
      state.frame = 0;
      state.lastStepAt = now;
      return state;
    }

    startPatrolAnimation(state, nextX, nextY, now, intervalMs);
    state.x = nextX;
    state.y = nextY;
    state.offset = nextOffset;
    state.frame = (state.frame + 1) % 3;
    state.lastStepAt = now;
    return state;
  }

  function drawNpc(npc) {
    const patrolState = npcPatrolState(npc);
    const visualState = animatedPatrolState(patrolState);
    const px = worldToScreenX(visualState.x);
    const py = worldToScreenY(visualState.y);

    if (px + TILE_SIZE < 0 || py + TILE_SIZE < 0 || px > canvas.width || py > canvas.height) return;

    if (npc.spritePath) {
      let spriteRecord = npcSpriteCache.get(npc.spritePath);
      if (!spriteRecord) {
        spriteRecord = { image: new Image(), ready: false, failed: false };
        spriteRecord.image.addEventListener("load", () => {
          spriteRecord.ready = true;
        });
        spriteRecord.image.addEventListener("error", () => {
          spriteRecord.failed = true;
        });
        spriteRecord.image.src = npc.spritePath;
        npcSpriteCache.set(npc.spritePath, spriteRecord);
      }

      if (spriteRecord.ready) {
        const frameSize = 48;
        const facingRows = { down: 0, left: 1, right: 2, up: 3 };
        const frameCount = Math.max(1, Math.floor(spriteRecord.image.naturalWidth / frameSize));
        const frameColumn = Math.min(walkFrameForMovement(visualState, frameCount), frameCount - 1);
        const frameRow = facingRows[patrolState.facing] ?? facingRows.down;
        const walkBob = visualState.isMoving ? Math.round(Math.sin(visualState.movementProgress * Math.PI) * -2) : 0;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          spriteRecord.image,
          frameColumn * frameSize,
          frameRow * frameSize,
          frameSize,
          frameSize,
          px,
          py + walkBob,
          TILE_SIZE,
          TILE_SIZE
        );
        ctx.restore();
        drawText("?", px + 24, py + walkBob + 7, { align: "center", font: "13px 'Press Start 2P'", color: "#fff1cd" });
        return;
      }
    }

    const walkBob = visualState.isMoving ? Math.round(Math.sin(visualState.movementProgress * Math.PI) * -3) : 0;
    drawRoundedRect(px + 13, py + walkBob + 12, 22, 20, 10, "#f5c79c", "#6d4b2f");
    drawRoundedRect(px + 11, py + walkBob + 28, 26, 17, 8, "#3d8f6f", "#245441");
    drawRoundedRect(px + 14, py + walkBob + 8, 20, 10, 6, "#6d4b2f");
    drawText("?", px + 24, py + walkBob + 7, { align: "center", font: "13px 'Press Start 2P'", color: "#fff1cd" });
  }

  function drawNpcs(npcs = []) {
    for (const npc of npcs) {
      drawNpc(npc);
    }
  }

  return {
    drawNpc,
    drawNpcs,
    npcPatrolState
  };
}
