import {
  INITIAL_PLAYER_ORBS,
  INITIAL_PLAYER_POTIONS,
  TILE_SIZE
} from "./constants.js";
import { addResource, normalizeInventory, syncLegacyCounters } from "./inventory.js";
import { resourceName } from "./items.js";
import { worldMaps } from "./maps.js";

export function createWorldController({
  canvas,
  gameState,
  setMessage,
  clamp,
  onPlayerStep = () => {},
  onEncounter,
  onCampInteract = () => {},
  onShopCraft = () => {},
  onNpcDialogue = () => {}
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

  function canSwim() {
    return gameState.player.skills?.swim === true;
  }

  function isWaterTile(x, y) {
    return tileAt(x, y) === "~";
  }

  function askToSwim() {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      return window.confirm("The water is deep here. Do you want to swim?");
    }

    return false;
  }

  function isBaseWalkable(x, y) {
    return tileAt(x, y) !== "W"
      && (!isWaterTile(x, y) || canSwim())
      && !getBuildingAt(x, y)
      && !getFurnitureAt(x, y)
      && !getNpcAt(x, y)
      && !getSignAt(x, y);
  }

  function isWalkable(x, y) {
    ensureGatheringSpots();
    return isBaseWalkable(x, y);
  }

  function runtimeGatheringState() {
    gameState.world.gatheringSpots ??= {};
    return gameState.world.gatheringSpots;
  }

  function currentGatheringSpots() {
    return runtimeGatheringState()[gameState.world.currentMapId] ?? [];
  }

  function isGatheringSpotAt(x, y) {
    return currentGatheringSpots().some((spot) => spot.x === x && spot.y === y);
  }

  function isGatheringPointAvailable(point) {
    if (!point || tileAt(point.x, point.y) !== "G") return false;
    if (!isBaseWalkable(point.x, point.y)) return false;
    if (getTriggerAt(point.x, point.y)) return false;
    if (getCampAt(point.x, point.y)) return false;
    if (gameState.player.x === point.x && gameState.player.y === point.y) return false;
    if (isGatheringSpotAt(point.x, point.y)) return false;
    return true;
  }

  function isActiveGatheringSpotValid(spot) {
    if (!spot || tileAt(spot.x, spot.y) !== "G") return false;
    if (!isBaseWalkable(spot.x, spot.y)) return false;
    if (getTriggerAt(spot.x, spot.y)) return false;
    if (getCampAt(spot.x, spot.y)) return false;
    return true;
  }

  function randomGatheringResource(gathering) {
    const totalWeight = gathering.resources.reduce((total, entry) => total + Math.max(0, entry.weight ?? entry.chance ?? 1), 0);
    if (totalWeight <= 0) return null;

    let roll = Math.random() * totalWeight;
    return gathering.resources.find((entry) => {
      roll -= Math.max(0, entry.weight ?? entry.chance ?? 1);
      return roll <= 0;
    }) || gathering.resources[0];
  }

  function spawnGatheringSpot() {
    const gathering = currentMap().gathering;
    if (!gathering || !Array.isArray(gathering.points) || !Array.isArray(gathering.resources)) return false;

    const availablePoints = gathering.points.filter(isGatheringPointAvailable);
    if (availablePoints.length === 0) return false;

    const point = availablePoints[Math.floor(Math.random() * availablePoints.length)];
    const resource = randomGatheringResource(gathering);
    if (!resource) return false;

    runtimeGatheringState()[gameState.world.currentMapId].push({
      x: point.x,
      y: point.y,
      resourceId: resource.id,
      quantity: Number.isFinite(resource.quantity) ? Math.max(1, Math.round(resource.quantity)) : 1
    });
    return true;
  }

  function ensureGatheringSpots() {
    const gathering = currentMap().gathering;
    const state = runtimeGatheringState();
    const mapId = gameState.world.currentMapId;
    state[mapId] ??= [];

    if (!gathering || !Array.isArray(gathering.points) || !Array.isArray(gathering.resources)) {
      state[mapId] = [];
      return;
    }

    state[mapId] = state[mapId].filter(isActiveGatheringSpotValid);

    const targetCount = Math.min(gathering.maxActive ?? 10, gathering.points.length);
    let guard = gathering.points.length * 2;
    while (state[mapId].length < targetCount && guard > 0) {
      if (!spawnGatheringSpot()) break;
      guard -= 1;
    }
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
    delete runtimeGatheringState()[trigger.targetMap];
    ensureGatheringSpots();
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

  function gatherResourceAt(targetX, targetY) {
    ensureGatheringSpots();
    const spots = currentGatheringSpots();
    const spotIndex = spots.findIndex((spot) => spot.x === targetX && spot.y === targetY);
    if (spotIndex < 0) return false;

    const [spot] = spots.splice(spotIndex, 1);
    addResource(gameState, spot.resourceId, spot.quantity);
    setMessage(`Gathered ${spot.quantity} ${resourceName(spot.resourceId)}.`);
    spawnGatheringSpot();
    return true;
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
        gameState.player.inventory = normalizeInventory(gameState.player.inventory, gameState.player);
        gameState.player.inventory.items.minorTonic = INITIAL_PLAYER_POTIONS;
        gameState.player.inventory.items.basicOrb = INITIAL_PLAYER_ORBS;
        syncLegacyCounters(gameState);
      }

      if (npc.opensCraftingStation) {
        setMessage(`${npc.name}: ${npc.dialogue}`);
        onShopCraft(npc);
        return;
      }

      if (npc.introDialogue) {
        onNpcDialogue(npc);
        return;
      }

      if (npc.restockInitialItems) {
        setMessage(`${npc.name}: ${npc.dialogue} Restocked to ${INITIAL_PLAYER_ORBS} capture orbs and ${INITIAL_PLAYER_POTIONS} minor tonics.`);
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

    if (gatherResourceAt(gameState.player.x, gameState.player.y) || gatherResourceAt(targetX, targetY)) {
      return;
    }

    if (isWaterTile(targetX, targetY)) {
      if (!canSwim()) {
        setMessage("The water is too deep to cross.");
        return;
      }

      if (askToSwim()) {
        movePlayer(dx, dy, { skipSwimPrompt: true });
      } else {
        setMessage("You stay on dry land.");
      }
      return;
    }

    if (tileAt(targetX, targetY) === "W") {
      setMessage("Unable to go this way.");
    }
  }

  function movePlayer(dx, dy, options = {}) {
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

    if (isWaterTile(targetX, targetY)) {
      if (!canSwim()) {
        setMessage("The water is too deep to cross.");
        return;
      }

      if (!options.skipSwimPrompt && !isWaterTile(gameState.player.x, gameState.player.y) && !askToSwim()) {
        setMessage("You stay on dry land.");
        return;
      }
    }

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
    gameState.player.isSwimming = isWaterTile(targetX, targetY);
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
    currentGatheringSpots,
    ensureGatheringSpots,
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
