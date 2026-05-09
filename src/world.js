import {
  INITIAL_PLAYER_ORBS,
  INITIAL_PLAYER_POTIONS,
  TILE_SIZE
} from "./constants.js";
import { worldMaps } from "./maps.js";

export function createWorldController({
  canvas,
  gameState,
  setMessage,
  clamp,
  onPlayerStep = () => {},
  onEncounter,
  onCampInteract = () => {}
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
    return tileAt(x, y) !== "W"
      && !getBuildingAt(x, y)
      && !getFurnitureAt(x, y)
      && !getNpcAt(x, y)
      && !getSignAt(x, y);
  }

  function getSignAt(x, y) {
    return (currentMap().signs || []).find((sign) => sign.x === x && sign.y === y);
  }

  function getTriggerAt(x, y) {
    return (currentMap().triggers || []).find((trigger) => trigger.x === x && trigger.y === y);
  }

  function getBuildingAt(x, y) {
    return (currentMap().buildings || []).find((building) => (
      x >= building.x
      && x < building.x + building.width
      && y >= building.y
      && y < building.y + building.height
      && (!building.door || building.door.x !== x || building.door.y !== y)
    ));
  }

  function getBuildingDoorAt(x, y) {
    return (currentMap().buildings || []).find((building) => (
      building.door
      && building.door.x === x
      && building.door.y === y
    ));
  }

  function getFurnitureAt(x, y) {
    return (currentMap().furniture || []).find((furniture) => {
      const width = furniture.width || 1;
      const height = furniture.height || 1;
      return x >= furniture.x
        && x < furniture.x + width
        && y >= furniture.y
        && y < furniture.y + height;
    });
  }

  function npcPosition(npc) {
    return npc._patrolState || { x: npc.x, y: npc.y };
  }

  function getNpcAt(x, y) {
    return (currentMap().npcs || []).find((npc) => {
      const position = npcPosition(npc);
      return position.x === x && position.y === y;
    });
  }

  function getCampAt(x, y) {
    const camp = gameState.world.camp;
    if (!camp || camp.mapId !== gameState.world.currentMapId) return null;
    return camp.x === x && camp.y === y ? camp : null;
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

  function facingOffset() {
    return {
      left: { dx: -1, dy: 0 },
      right: { dx: 1, dy: 0 },
      up: { dx: 0, dy: -1 },
      down: { dx: 0, dy: 1 }
    }[gameState.player.facing] || { dx: 0, dy: 1 };
  }

  function interactFacing() {
    if (gameState.scene !== "world") return;

    const { dx, dy } = facingOffset();
    const targetX = gameState.player.x + dx;
    const targetY = gameState.player.y + dy;

    if (getCampAt(gameState.player.x, gameState.player.y) || getCampAt(targetX, targetY)) {
      onCampInteract();
      return;
    }

    const trigger = getTriggerAt(targetX, targetY);

    if (trigger) {
      enterTrigger(trigger);
      return;
    }

    const buildingDoor = getBuildingDoorAt(targetX, targetY);
    if (buildingDoor) {
      setMessage(buildingDoor.lockedMessage || `${buildingDoor.name} is locked.`);
      return;
    }

    const building = getBuildingAt(targetX, targetY);
    if (building) {
      setMessage(building.text || `${building.name} stands here.`);
      return;
    }

    const furniture = getFurnitureAt(targetX, targetY);
    if (furniture) {
      setMessage(furniture.text || `${furniture.name || "Furniture"} blocks the way.`);
      return;
    }

    const npc = getNpcAt(targetX, targetY);
    if (npc) {
      if (npc.restockInitialItems) {
        gameState.player.potions = INITIAL_PLAYER_POTIONS;
        gameState.player.orbs = INITIAL_PLAYER_ORBS;
        setMessage(`${npc.name}: ${npc.dialogue} Restocked to ${INITIAL_PLAYER_ORBS} capture orbs and ${INITIAL_PLAYER_POTIONS} tonics.`);
        return;
      }

      setMessage(`${npc.name}: ${npc.dialogue}`);
      return;
    }

    const sign = getSignAt(targetX, targetY);
    if (sign) {
      setMessage(sign.text);
      return;
    }

    if (tileAt(targetX, targetY) === "W") {
      setMessage("Unable to go this way.");
    }
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

    const trigger = getTriggerAt(targetX, targetY);

    const buildingDoor = getBuildingDoorAt(targetX, targetY);
    if (buildingDoor && !trigger) {
      setMessage(buildingDoor.lockedMessage || `${buildingDoor.name} is locked.`);
      return;
    }

    if (!isWalkable(targetX, targetY)) {
      return;
    }

    gameState.player.x = targetX;
    gameState.player.y = targetY;
    gameState.player.walkFrame = gameState.player.walkFrame === 1 ? 2 : 1;
    gameState.player.lastMovedAt = performance.now();
    onPlayerStep();
    updateCamera();

    if (trigger) {
      enterTrigger(trigger);
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
    interactFacing,
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
