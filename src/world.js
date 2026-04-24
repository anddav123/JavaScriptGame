import { TILE_SIZE } from "./constants.js";
import { worldMaps } from "./maps.js";

export function createWorldController({
  canvas,
  gameState,
  setMessage,
  clamp,
  onEncounter
}) {
  function currentMap() {
    return worldMaps[gameState.world.currentMapId];
  }

  function currentMapCols() {
    return currentMap().terrain[0].length;
  }

  function currentMapRows() {
    return currentMap().terrain.length;
  }

  function worldPixelWidth() {
    return currentMapCols() * TILE_SIZE;
  }

  function worldPixelHeight() {
    return currentMapRows() * TILE_SIZE;
  }

  function tileAt(x, y) {
    if (y < 0 || y >= currentMapRows() || x < 0 || x >= currentMapCols()) return "W";
    return currentMap().terrain[y][x];
  }

  function isWalkable(x, y) {
    return tileAt(x, y) !== "W";
  }

  function getSignAt(x, y) {
    return currentMap().signs.find((sign) => sign.x === x && sign.y === y);
  }

  function getTriggerAt(x, y) {
    return currentMap().triggers.find((trigger) => trigger.x === x && trigger.y === y);
  }

  function worldToScreenX(tileX) {
    return tileX * TILE_SIZE - gameState.camera.x;
  }

  function worldToScreenY(tileY) {
    return tileY * TILE_SIZE - gameState.camera.y;
  }

  function updateCamera() {
    const targetX = gameState.player.x * TILE_SIZE + TILE_SIZE / 2 - canvas.width / 2;
    const targetY = gameState.player.y * TILE_SIZE + TILE_SIZE / 2 - canvas.height / 2;
    gameState.camera.x = clamp(targetX, 0, Math.max(0, worldPixelWidth() - canvas.width));
    gameState.camera.y = clamp(targetY, 0, Math.max(0, worldPixelHeight() - canvas.height));
  }

  function enterTrigger(trigger) {
    gameState.world.currentMapId = trigger.targetMap;
    gameState.player.x = trigger.targetX;
    gameState.player.y = trigger.targetY;
    updateCamera();
    setMessage(trigger.message);
  }

  function movePlayer(dx, dy) {
    if (gameState.scene !== "world") return;
    if (dx < 0) {
      gameState.player.facing = "left";
    } else if (dx > 0) {
      gameState.player.facing = "right";
    } else if (dy < 0) {
      gameState.player.facing = "up";
    } else if (dy > 0) {
      gameState.player.facing = "down";
    }

    const targetX = gameState.player.x + dx;
    const targetY = gameState.player.y + dy;

    if (!isWalkable(targetX, targetY)) {
      setMessage("Unable to go this way.");
      return;
    }

    gameState.player.x = targetX;
    gameState.player.y = targetY;
    gameState.player.walkFrame = gameState.player.walkFrame === 1 ? 2 : 1;
    gameState.player.lastMovedAt = performance.now();
    updateCamera();

    const trigger = getTriggerAt(targetX, targetY);
    if (trigger) {
      enterTrigger(trigger);
      return;
    }

    const sign = getSignAt(targetX, targetY);
    if (sign) {
      setMessage(sign.text);
      return;
    }

    if (tileAt(targetX, targetY) === "T" && Math.random() < currentMap().encounterRate) {
      onEncounter();
    }
  }

  return {
    currentMap,
    currentMapCols,
    currentMapRows,
    isWalkable,
    movePlayer,
    tileAt,
    updateCamera,
    worldPixelHeight,
    worldPixelWidth,
    worldToScreenX,
    worldToScreenY
  };
}
