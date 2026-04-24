import { PLAYER_FACING_ROWS, SAVE_VERSION } from "./constants.js";
import { creatureTemplates } from "./creatures.js";
import { worldMaps } from "./maps.js";

export function createSaveController({
  gameState,
  createCreatureInstance,
  currentMap,
  isWalkable,
  updateCamera,
  setMessage,
  resetEncounterTransition,
  clamp
}) {
  function isValidMapId(mapId) {
    return typeof mapId === "string" && Boolean(worldMaps[mapId]);
  }

  function normalizeCreatureSave(creature, index) {
    if (!creature || typeof creature !== "object" || typeof creature.species !== "string" || !creatureTemplates[creature.species]) {
      throw new Error(`Party member ${index + 1} is invalid.`);
    }

    const template = creatureTemplates[creature.species];
    return createCreatureInstance(creature.species, {
      nickname: typeof creature.nickname === "string" && creature.nickname.trim() ? creature.nickname.trim() : template.nickname,
      role: typeof creature.role === "string" && creature.role.trim() ? creature.role.trim() : template.role,
      maxHp: Number.isFinite(creature.maxHp) ? Math.max(1, Math.round(creature.maxHp)) : template.maxHp,
      hp: Number.isFinite(creature.hp) ? Math.max(0, Math.round(creature.hp)) : template.maxHp,
      captured: Boolean(creature.captured)
    });
  }

  function serializeGameState() {
    return {
      saveVersion: SAVE_VERSION,
      world: {
        currentMapId: gameState.world.currentMapId
      },
      player: {
        x: gameState.player.x,
        y: gameState.player.y,
        facing: gameState.player.facing,
        potions: gameState.player.potions,
        orbs: gameState.player.orbs,
        wins: gameState.player.wins,
        activeIndex: gameState.player.activeIndex,
        party: gameState.player.party.map((creature) => ({
          species: creature.species,
          nickname: creature.nickname,
          role: creature.role,
          maxHp: creature.maxHp,
          hp: creature.hp,
          captured: creature.captured
        }))
      }
    };
  }

  async function exportSaveJson() {
    if (gameState.scene === "battle") {
      setMessage("Finish the battle before saving.");
      return false;
    }

    const saveJson = JSON.stringify(serializeGameState(), null, 2);

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(saveJson);
        setMessage("Save JSON copied to your clipboard.");
        return true;
      } catch (error) {
        // Fall back to a prompt when clipboard permissions are unavailable.
      }
    }

    window.prompt("Copy your save JSON:", saveJson);
    setMessage("Save JSON ready to copy.");
    return true;
  }

  function importSaveJson(saveJson) {
    let parsedSave;
    try {
      parsedSave = JSON.parse(saveJson);
    } catch (error) {
      throw new Error("That save data is not valid JSON.");
    }

    if (!parsedSave || typeof parsedSave !== "object") {
      throw new Error("Save data must be a JSON object.");
    }

    if (parsedSave.saveVersion !== SAVE_VERSION) {
      throw new Error("This save version is not supported.");
    }

    if (!isValidMapId(parsedSave.world?.currentMapId)) {
      throw new Error("Save data references an unknown map.");
    }

    if (!Array.isArray(parsedSave.player?.party) || parsedSave.player.party.length === 0) {
      throw new Error("Save data must include at least one party member.");
    }

    const party = parsedSave.player.party.map((creature, index) => normalizeCreatureSave(creature, index));
    const activeIndex = Number.isInteger(parsedSave.player.activeIndex)
      ? clamp(parsedSave.player.activeIndex, 0, party.length - 1)
      : 0;
    const facing = PLAYER_FACING_ROWS[parsedSave.player.facing] !== undefined ? parsedSave.player.facing : "down";
    const nextPlayer = {
      ...gameState.player,
      x: Number.isInteger(parsedSave.player.x) ? parsedSave.player.x : 1,
      y: Number.isInteger(parsedSave.player.y) ? parsedSave.player.y : 1,
      facing,
      walkFrame: 0,
      lastMovedAt: 0,
      potions: Number.isFinite(parsedSave.player.potions) ? Math.max(0, Math.round(parsedSave.player.potions)) : 0,
      orbs: Number.isFinite(parsedSave.player.orbs) ? Math.max(0, Math.round(parsedSave.player.orbs)) : 0,
      wins: Number.isFinite(parsedSave.player.wins) ? Math.max(0, Math.round(parsedSave.player.wins)) : 0,
      activeIndex,
      party
    };

    const previousMapId = gameState.world.currentMapId;
    gameState.world.currentMapId = parsedSave.world.currentMapId;
    if (!isWalkable(nextPlayer.x, nextPlayer.y)) {
      gameState.world.currentMapId = previousMapId;
      throw new Error("Save position is blocked on that map.");
    }

    gameState.player = nextPlayer;
    gameState.scene = "world";
    gameState.menu.mode = "main";
    gameState.menu.mainIndex = 0;
    gameState.menu.partyIndex = activeIndex;
    gameState.startMenu.index = 0;
    gameState.battle = null;
    gameState.cutscene = null;
    gameState.pointerHotspot = null;
    resetEncounterTransition();
    updateCamera();
    setMessage(`Adventure resumed in ${currentMap().name}.`);
  }

  function promptToLoadGame() {
    const saveJson = window.prompt("Paste your save JSON to resume:");
    if (saveJson === null) return;

    try {
      importSaveJson(saveJson);
    } catch (error) {
      window.alert(error.message || "Unable to load that save.");
    }
  }

  return {
    exportSaveJson,
    importSaveJson,
    promptToLoadGame,
    serializeGameState
  };
}
