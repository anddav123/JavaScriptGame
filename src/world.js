import { TILE_SIZE } from "./constants.js";
import { addResource } from "./inventory.js";
import { resourceName } from "./items.js";
import { worldMaps } from "./maps.js";
import { hasDefeatedTrainer, trainerBattleId } from "./trainerBattles.js";

export function createWorldController({
  canvas,
  gameState,
  setMessage,
  clamp,
  onPlayerStep = () => {},
  onEncounter,
  onCampInteract = () => {},
  onShopCraft = () => {},
  onNpcDialogue = () => {},
  onNpcBattle = () => {},
  onSwimPrompt = () => {}
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

  function isBaseWalkable(x, y) {
    return tileAt(x, y) !== "W"
      && (!isWaterTile(x, y) || canSwim())
      && !getBuildingAt(x, y)
      && !getFurnitureAt(x, y)
      && !getBlockingNatureAt(x, y)
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

  function getNatureAt(x, y) {
    return (currentMap().nature || []).find((nature) => {
      const width = nature.width || 1;
      const height = nature.height || 1;
      return x >= nature.x
        && x < nature.x + width
        && y >= nature.y
        && y < nature.y + height;
    });
  }

  function getBlockingNatureAt(x, y) {
    const nature = getNatureAt(x, y);
    return nature && nature.type !== "flowers" ? nature : null;
  }

  function npcPosition(npc) {
    return npc._patrolState || { x: npc.x, y: npc.y };
  }

  function ensureNpcRuntimeState(npc) {
    if (!npc._patrolState) {
      npc._patrolState = {
        x: npc.x,
        y: npc.y,
        offset: 0,
        direction: -1,
        pathIndex: 0,
        facing: "down",
        frame: 0,
        lastStepAt: performance.now(),
        fromX: npc.x,
        fromY: npc.y,
        toX: npc.x,
        toY: npc.y,
        moveStartedAt: 0,
        moveDuration: 0
      };
    }

    return npc._patrolState;
  }

  function getNpcAt(x, y) {
    return (currentMap().npcs || []).find((npc) => {
      const position = npcPosition(npc);
      return position.x === x && position.y === y;
    });
  }

  function getOtherNpcAt(x, y, ignoredNpc) {
    return (currentMap().npcs || []).find((npc) => {
      if (npc === ignoredNpc) return false;
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

  function distanceToPlayer(x, y) {
    return Math.abs(gameState.player.x - x) + Math.abs(gameState.player.y - y);
  }

  function trainerChaseId(npc) {
    return trainerBattleId(npc);
  }

  function isNpcStepWalkable(npc, x, y) {
    return tileAt(x, y) !== "W"
      && !isWaterTile(x, y)
      && !getBuildingAt(x, y)
      && !getFurnitureAt(x, y)
      && !getBlockingNatureAt(x, y)
      && !getSignAt(x, y)
      && !getTriggerAt(x, y)
      && !getCampAt(x, y)
      && !getOtherNpcAt(x, y, npc)
      && !(gameState.player.x === x && gameState.player.y === y);
  }

  function isNpcReachablePlayerTile(x, y) {
    return tileAt(x, y) !== "W"
      && !isWaterTile(x, y)
      && !getBuildingAt(x, y)
      && !getFurnitureAt(x, y)
      && !getBlockingNatureAt(x, y)
      && !getSignAt(x, y)
      && !getTriggerAt(x, y)
      && !getCampAt(x, y);
  }

  function facingForStep(dx, dy, fallback = "down") {
    if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
    if (dy !== 0) return dy < 0 ? "up" : "down";
    return fallback;
  }

  function npcChaseTargetTiles(npc) {
    return [
      { x: gameState.player.x, y: gameState.player.y - 1 },
      { x: gameState.player.x, y: gameState.player.y + 1 },
      { x: gameState.player.x - 1, y: gameState.player.y },
      { x: gameState.player.x + 1, y: gameState.player.y }
    ].filter((tile) => isNpcStepWalkable(npc, tile.x, tile.y));
  }

  function findNpcChaseStep(npc, startX, startY) {
    const targetKeys = new Set(npcChaseTargetTiles(npc).map((tile) => `${tile.x},${tile.y}`));
    if (targetKeys.size === 0) return null;

    const queue = [{ x: startX, y: startY, firstStep: null }];
    const visited = new Set([`${startX},${startY}`]);
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ].sort((a, b) => (
      distanceToPlayer(startX + a.dx, startY + a.dy)
      - distanceToPlayer(startX + b.dx, startY + b.dy)
    ));

    while (queue.length > 0) {
      const current = queue.shift();
      const currentKey = `${current.x},${current.y}`;
      if (targetKeys.has(currentKey)) {
        return current.firstStep;
      }

      for (const direction of directions) {
        const nextX = current.x + direction.dx;
        const nextY = current.y + direction.dy;
        const nextKey = `${nextX},${nextY}`;
        if (visited.has(nextKey) || !isNpcStepWalkable(npc, nextX, nextY)) continue;

        visited.add(nextKey);
        queue.push({
          x: nextX,
          y: nextY,
          firstStep: current.firstStep || { dx: direction.dx, dy: direction.dy }
        });
      }
    }

    return null;
  }

  function npcStepTowardPlayer(npc) {
    const state = ensureNpcRuntimeState(npc);
    const now = performance.now();
    const stepInterval = Math.max(120, Math.round(npc.battle?.chaseStepMs ?? 220));
    if (now - state.lastStepAt < stepInterval) return true;

    const dx = gameState.player.x - state.x;
    const dy = gameState.player.y - state.y;
    const step = findNpcChaseStep(npc, state.x, state.y);
    if (!step) {
      state.facing = facingForStep(dx, dy, state.facing);
      return false;
    }

    const nextX = state.x + step.dx;
    const nextY = state.y + step.dy;
    state.fromX = state.x;
    state.fromY = state.y;
    state.toX = nextX;
    state.toY = nextY;
    state.x = nextX;
    state.y = nextY;
    state.facing = facingForStep(step.dx, step.dy, state.facing);
    state.frame = (state.frame + 1) % 3;
    state.moveStartedAt = now;
    state.moveDuration = stepInterval;
    state.lastStepAt = now;
    return true;
  }

  function isTrainerChaseLockActive() {
    const activeChaseId = gameState.world.activeTrainerChaseId || null;
    if (!activeChaseId) return false;
    return (currentMap().npcs || []).some((npc) => (
      npc._chaseActive
      && trainerChaseId(npc) === activeChaseId
      && !hasDefeatedTrainer(gameState, npc)
    ));
  }

  function pauseNpcForInteraction(npc) {
    const state = ensureNpcRuntimeState(npc);
    const dx = gameState.player.x - state.x;
    const dy = gameState.player.y - state.y;
    const now = performance.now();
    state.facing = facingForStep(dx, dy, state.facing);
    state.frame = 0;
    state.moveStartedAt = 0;
    state.moveDuration = 0;
    state.lastStepAt = now;
    npc._interactionPauseUntil = now + 3200;
  }

  function updateNpcChases() {
    for (const npc of currentMap().npcs || []) {
      const battle = npc.battle;
      if (!battle || hasDefeatedTrainer(gameState, npc)) {
        npc._chaseActive = false;
        continue;
      }

      const state = ensureNpcRuntimeState(npc);
      const chaseId = trainerChaseId(npc);
      const activeChaseId = gameState.world.activeTrainerChaseId || null;
      if (activeChaseId && activeChaseId !== chaseId) {
        npc._chaseActive = false;
        continue;
      }

      const chaseRange = Math.max(1, Math.round(battle.chaseRange ?? 0));
      const distance = distanceToPlayer(state.x, state.y);
      if (!isNpcReachablePlayerTile(gameState.player.x, gameState.player.y)) {
        npc._chaseActive = false;
        continue;
      }

      if (!npc._chaseActive && (!chaseRange || distance > chaseRange)) {
        continue;
      }

      if (!npc._chaseActive) {
        npc._noticeUntil = performance.now() + 900;
      }

      gameState.world.activeTrainerChaseId = chaseId;
      npc._chaseActive = true;

      if (distance <= 1) {
        onNpcBattle(npc);
        return;
      }

      if (!npcStepTowardPlayer(npc)) {
        npc._chaseActive = false;
        if (gameState.world.activeTrainerChaseId === chaseId) {
          gameState.world.activeTrainerChaseId = null;
        }
        continue;
      }

      if (distanceToPlayer(state.x, state.y) <= 1) {
        onNpcBattle(npc);
        return;
      }
    }
  }

  function updateCamera() {
    const targetX = gameState.player.x * TILE_SIZE + TILE_SIZE / 2 - canvas.width / 2;
    const targetY = gameState.player.y * TILE_SIZE + TILE_SIZE / 2 - canvas.height / 2;
    gameState.camera.x = clamp(targetX, 0, Math.max(0, worldPixelWidth() - canvas.width));
    gameState.camera.y = clamp(targetY, 0, Math.max(0, worldPixelHeight() - canvas.height));
  }

  function enterTrigger(trigger) {
    const missingTutorial = (trigger.requiresTutorials || []).find((tutorialId) => (
      !gameState.player.tutorials?.[tutorialId]
    ));
    if (missingTutorial) {
      setMessage(trigger.lockedMessage || "This way is locked for now.");
      return;
    }

    for (const npc of currentMap().npcs || []) {
      npc._chaseActive = false;
      npc._noticeUntil = 0;
      delete npc._patrolState;
    }
    gameState.world.activeTrainerChaseId = null;

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
    if (isTrainerChaseLockActive()) return;

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

    const nature = getBlockingNatureAt(targetX, targetY);
    if (nature) {
      setMessage(nature.text || `${nature.name || "Plant life"} blocks the way.`);
      return;
    }

    const npc = getNpcAt(targetX, targetY);
    if (npc) {
      pauseNpcForInteraction(npc);

      if (npc.battle && !hasDefeatedTrainer(gameState, npc)) {
        const chaseId = trainerChaseId(npc);
        const activeChaseId = gameState.world.activeTrainerChaseId || null;
        if (activeChaseId && activeChaseId !== chaseId) {
          setMessage(`${npc.name} waits while another challenge is active.`);
          return;
        }

        gameState.world.activeTrainerChaseId = chaseId;
        onNpcBattle(npc);
        return;
      }

      if (npc.opensCraftingStation) {
        setMessage(`${npc.name}: ${npc.dialogue}`);
        onShopCraft(npc);
        return;
      }

      if (npc.introDialogue || npc.grantsFlag || npc.grantsSkill || npc.requiresFlag) {
        onNpcDialogue(npc);
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

      onSwimPrompt({ dx, dy });
      return;
    }

    if (tileAt(targetX, targetY) === "W") {
      setMessage("Unable to go this way.");
    }
  }

  function movePlayer(dx, dy, options = {}) {
    if (gameState.scene !== "world") return;
    if (isTrainerChaseLockActive()) return;

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

      if (!options.skipSwimPrompt && !isWaterTile(gameState.player.x, gameState.player.y)) {
        onSwimPrompt({ dx, dy });
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

    updateNpcChases();
    if (gameState.scene !== "world") return;

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
    isTrainerChaseLockActive,
    isWalkable,
    movePlayer,
    tileAt,
    updateCamera,
    worldPixelHeight,
    worldPixelWidth,
    worldToScreenX,
    worldToScreenY,
    updateNpcChases
  };
}
