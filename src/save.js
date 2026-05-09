import {
  PLAYER_FACING_ROWS,
  PLAYER_MP_RECHARGE_STEP_INTERVAL,
  PLAYER_PARTY_MAX_SIZE,
  SAVE_VERSION
} from "./constants.js";
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
  const accountState = {
    user: null,
    apiAvailable: null
  };

  async function checkApiAvailable() {
    if (accountState.apiAvailable !== null) return accountState.apiAvailable;

    try {
      const response = await fetch("api/health.php", {
        credentials: "same-origin",
        cache: "no-store"
      });
      const payload = await response.json();
      accountState.apiAvailable = response.ok && payload.ok === true;
    } catch (error) {
      accountState.apiAvailable = false;
    }

    return accountState.apiAvailable;
  }

  async function apiRequest(path, options = {}) {
    let response;
    try {
      response = await fetch(path, {
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        ...options
      });
    } catch (error) {
      throw new Error("The save server is unavailable. Start the PHP/MySQL local stack and try again.");
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error("The save server returned an unexpected response.");
    }

    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || "The save server request failed.");
    }

    return payload;
  }

  function showModalDialog({ message, defaultValue = "", mode = "prompt", inputType = "text" }) {
    return new Promise((resolve) => {
      const host = document.fullscreenElement || document.body;
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(20, 12, 8, 0.72);
        font-family: Outfit, Arial, sans-serif;
      `;

      const panel = document.createElement("div");
      panel.style.cssText = `
        width: min(720px, calc(100% - 40px));
        max-height: calc(100% - 40px);
        box-sizing: border-box;
        padding: 22px;
        border: 3px solid #3d271d;
        border-radius: 18px;
        background: #fff8ef;
        color: #2d1b14;
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
      `;

      const label = document.createElement("label");
      label.textContent = message;
      label.style.cssText = "display:block; font-size:18px; font-weight:700; margin-bottom:14px;";
      panel.appendChild(label);

      let input = null;
      if (mode === "prompt") {
        const hasLargeDefault = defaultValue.length > 120;
        input = hasLargeDefault ? document.createElement("textarea") : document.createElement("input");
        input.value = defaultValue;
        if (!hasLargeDefault) input.type = inputType;
        input.style.cssText = `
          width: 100%;
          min-height: ${hasLargeDefault ? "220px" : "auto"};
          box-sizing: border-box;
          padding: 12px;
          border: 2px solid #694435;
          border-radius: 10px;
          font: 16px monospace;
          color: #2d1b14;
          background: #fff;
          resize: vertical;
        `;
        panel.appendChild(input);
      }

      const actions = document.createElement("div");
      actions.style.cssText = "display:flex; gap:12px; justify-content:flex-end; margin-top:18px;";

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.textContent = mode === "alert" ? "OK" : "Cancel";
      cancelButton.style.cssText = "padding:10px 16px; border-radius:10px; border:2px solid #3d271d; background:#fff4e6; color:#2d1b14; font-weight:700;";
      actions.appendChild(cancelButton);

      let okButton = null;
      if (mode === "prompt") {
        okButton = document.createElement("button");
        okButton.type = "button";
        okButton.textContent = "OK";
        okButton.style.cssText = "padding:10px 16px; border-radius:10px; border:2px solid #3d271d; background:#c8553d; color:#fff8f0; font-weight:700;";
        actions.appendChild(okButton);
      }

      panel.appendChild(actions);
      overlay.appendChild(panel);
      host.appendChild(overlay);

      const cancelValue = mode === "alert" ? true : null;
      const submitPrompt = () => {
        if (mode === "prompt" && input) {
          close(input.value);
        }
      };
      const cancelDialog = () => close(cancelValue);
      const isTextEntryTarget = (target) => target === input;
      const shouldSubmitOnEnter = (event) => {
        if (mode !== "prompt" || !input || event.key !== "Enter") return false;
        if (input.tagName !== "TEXTAREA") return true;
        return !event.shiftKey;
      };
      const shouldCancelOnBackspace = (event) => {
        if (event.key !== "Backspace") return false;
        if (!isTextEntryTarget(event.target)) return true;
        return input.value.length === 0;
      };
      const stopGameInput = (event) => {
        if (event.type === "keydown") {
          if (event.key === "Escape" || shouldCancelOnBackspace(event)) {
            event.preventDefault();
            event.stopPropagation();
            cancelDialog();
            return;
          }

          if (shouldSubmitOnEnter(event)) {
            event.preventDefault();
            event.stopPropagation();
            submitPrompt();
            return;
          }
        }

        event.stopPropagation();
      };

      const close = (value) => {
        document.removeEventListener("keydown", stopGameInput, true);
        document.removeEventListener("keyup", stopGameInput, true);
        overlay.remove();
        resolve(value);
      };

      document.addEventListener("keydown", stopGameInput, true);
      document.addEventListener("keyup", stopGameInput, true);
      overlay.addEventListener("click", stopGameInput);
      overlay.addEventListener("pointerdown", stopGameInput);
      overlay.addEventListener("pointerup", stopGameInput);

      cancelButton.addEventListener("click", cancelDialog);
      okButton?.addEventListener("click", submitPrompt);

      requestAnimationFrame(() => {
        if (input) {
          input.focus();
          input.select();
        } else {
          cancelButton.focus();
        }
      });
    });
  }

  async function showAlert(message) {
    await showModalDialog({ message, mode: "alert" });
  }

  async function showPrompt(message, defaultValue = "", inputType = "text") {
    return showModalDialog({ message, defaultValue, inputType });
  }

  async function promptForCredentials(action) {
    const username = await showPrompt(`${action} username:`);
    if (username === null) return null;

    const password = await showPrompt(`${action} password:`, "", "password");
    if (password === null) return null;

    return { username, password };
  }

  async function register(username, password) {
    const payload = await apiRequest("api/register.php", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    accountState.user = payload.user;
    return payload.user;
  }

  async function login(username, password) {
    const payload = await apiRequest("api/login.php", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    accountState.user = payload.user;
    return payload.user;
  }

  function isDatabaseAvailable() {
    return accountState.apiAvailable === true;
  }

  async function ensureLoggedIn() {
    if (accountState.user) return accountState.user;

    const credentials = await promptForCredentials("Login");
    if (!credentials) return null;

    const user = await login(credentials.username, credentials.password);
    setMessage(`Logged in as ${user.username}.`);
    return user;
  }

  function isValidMapId(mapId) {
    return typeof mapId === "string" && Boolean(worldMaps[mapId]);
  }

  function normalizeCreatureSave(creature, index, label = "Party member") {
    if (!creature || typeof creature !== "object" || typeof creature.species !== "string" || !creatureTemplates[creature.species]) {
      throw new Error(`${label} ${index + 1} is invalid.`);
    }

    const template = creatureTemplates[creature.species];
    return createCreatureInstance(creature.species, {
      nickname: typeof creature.nickname === "string" && creature.nickname.trim() ? creature.nickname.trim() : template.nickname,
      role: typeof creature.role === "string" && creature.role.trim() ? creature.role.trim() : template.role,
      maxHp: Number.isFinite(creature.maxHp) ? Math.max(1, Math.round(creature.maxHp)) : undefined,
      hp: Number.isFinite(creature.hp) ? Math.max(0, Math.round(creature.hp)) : undefined,
      level: Number.isFinite(creature.level) ? Math.round(creature.level) : undefined,
      xp: Number.isFinite(creature.xp) ? Math.max(0, Math.round(creature.xp)) : undefined,
      moves: Array.isArray(creature.moves) ? creature.moves : undefined,
      captured: Boolean(creature.captured)
    });
  }

  function serializeGameState() {
    const serializeCreature = (creature) => ({
      species: creature.species,
      nickname: creature.nickname,
      role: creature.role,
      level: creature.level,
      xp: creature.xp,
      maxHp: creature.maxHp,
      hp: creature.hp,
      moves: creature.moves,
      captured: creature.captured
    });

    return {
      saveVersion: SAVE_VERSION,
      world: {
        currentMapId: gameState.world.currentMapId,
        camp: gameState.world.camp ? { ...gameState.world.camp } : null
      },
      player: {
        x: gameState.player.x,
        y: gameState.player.y,
        facing: gameState.player.facing,
        potions: gameState.player.potions,
        orbs: gameState.player.orbs,
        wins: gameState.player.wins,
        maxMp: gameState.player.maxMp,
        mp: gameState.player.mp,
        mpRechargeStepProgress: gameState.player.mpRechargeStepProgress,
        activeIndex: gameState.player.activeIndex,
        party: gameState.player.party.map(serializeCreature),
        campCreatures: (gameState.player.campCreatures || []).map(serializeCreature)
      }
    };
  }

  async function saveGame() {
    if (gameState.scene === "battle") {
      setMessage("Finish the battle before saving.");
      return false;
    }

    if (!await checkApiAvailable()) {
      setMessage("Database saves unavailable. Use Export Save instead.");
      return exportSaveJson();
    }

    try {
      const user = await ensureLoggedIn();
      if (!user) return false;

      const save = serializeGameState();
      await apiRequest("api/save.php", {
        method: "POST",
        body: JSON.stringify({
          saveVersion: save.saveVersion,
          gameState: save
        })
      });
      setMessage(`Game saved for ${user.username}.`);
      return true;
    } catch (error) {
      await showAlert(error.message || "Unable to save your game.");
      setMessage("Database save failed. Use Export Save as a backup.");
      return false;
    }
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

    await showPrompt("Copy your save JSON:", saveJson);
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

    const parsedCamp = parsedSave.world?.camp;
    const camp = parsedCamp && typeof parsedCamp === "object"
      ? {
          mapId: parsedCamp.mapId,
          x: parsedCamp.x,
          y: parsedCamp.y
        }
      : null;
    if (camp) {
      if (!isValidMapId(camp.mapId) || !Number.isInteger(camp.x) || !Number.isInteger(camp.y)) {
        throw new Error("Save data includes an invalid campsite.");
      }
      const campMap = worldMaps[camp.mapId];
      if (camp.y < 0 || camp.y >= campMap.terrain.length || camp.x < 0 || camp.x >= campMap.terrain[0].length || campMap.terrain[camp.y][camp.x] !== "G") {
        throw new Error("Save data includes an invalid campsite location.");
      }
    }

    if (!Array.isArray(parsedSave.player?.party) || parsedSave.player.party.length === 0) {
      throw new Error("Save data must include at least one party member.");
    }

    const importedParty = parsedSave.player.party.map((creature, index) => normalizeCreatureSave(creature, index));
    const parsedCampCreatures = parsedSave.player.campCreatures;
    if (parsedCampCreatures !== undefined && !Array.isArray(parsedCampCreatures)) {
      throw new Error("Save data includes invalid camp creature storage.");
    }
    const campCreatures = [
      ...importedParty.slice(PLAYER_PARTY_MAX_SIZE),
      ...(Array.isArray(parsedCampCreatures)
        ? parsedCampCreatures.map((creature, index) => normalizeCreatureSave(creature, index, "Camp creature"))
        : [])
    ];
    const party = importedParty.slice(0, PLAYER_PARTY_MAX_SIZE);
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
      maxMp: Number.isFinite(parsedSave.player.maxMp) ? Math.max(1, Math.round(parsedSave.player.maxMp)) : gameState.player.maxMp,
      activeIndex,
      campCreatures,
      party
    };
    nextPlayer.mp = Number.isFinite(parsedSave.player.mp)
      ? clamp(Math.round(parsedSave.player.mp), 0, nextPlayer.maxMp)
      : nextPlayer.maxMp;
    nextPlayer.mpRechargeStepProgress = Number.isFinite(parsedSave.player.mpRechargeStepProgress)
      ? clamp(Math.round(parsedSave.player.mpRechargeStepProgress), 0, PLAYER_MP_RECHARGE_STEP_INTERVAL - 1)
      : 0;
    if (nextPlayer.mp >= nextPlayer.maxMp) {
      nextPlayer.mpRechargeStepProgress = 0;
    }

    const previousMapId = gameState.world.currentMapId;
    const previousCamp = gameState.world.camp;
    gameState.world.currentMapId = parsedSave.world.currentMapId;
    gameState.world.camp = camp;
    if (!isWalkable(nextPlayer.x, nextPlayer.y)) {
      gameState.world.currentMapId = previousMapId;
      gameState.world.camp = previousCamp;
      throw new Error("Save position is blocked on that map.");
    }

    gameState.player = nextPlayer;
    gameState.scene = "world";
    gameState.menu.mode = "main";
    gameState.menu.mainIndex = 0;
    gameState.menu.partyIndex = activeIndex;
    gameState.campMenu.mode = "main";
    gameState.campMenu.mainIndex = 0;
    gameState.campMenu.storedIndex = 0;
    gameState.campMenu.partyIndex = activeIndex;
    gameState.campMenu.selectedStoredIndex = null;
    gameState.startMenu.index = 0;
    gameState.battle = null;
    gameState.cutscene = null;
    gameState.pointerHotspot = null;
    resetEncounterTransition();
    updateCamera();
    setMessage(`Adventure resumed in ${currentMap().name}.`);
  }

  async function canUseDatabaseSaves() {
    return checkApiAvailable();
  }

  async function promptToCreateAccount() {
    if (!await checkApiAvailable()) {
      setMessage("Starting local adventure. Database saves are unavailable.");
      return true;
    }

    const credentials = await promptForCredentials("Create player");
    if (!credentials) return false;

    try {
      const user = await register(credentials.username, credentials.password);
      setMessage(`Player ${user.username} created.`);
      return true;
    } catch (error) {
      await showAlert(error.message || "Unable to create player.");
      return false;
    }
  }

  async function promptToLoadGame() {
    if (!await checkApiAvailable()) {
      await showAlert("Database saves are unavailable in static mode. Use Import JSON Save instead.");
      setMessage("Database saves unavailable. Import a JSON save or start locally.");
      return false;
    }

    try {
      const user = await ensureLoggedIn();
      if (!user) return false;

      const payload = await apiRequest("api/save.php");
      if (!payload.save?.gameState) {
        await showAlert("No saved adventure found for this player. Starting a fresh adventure.");
        setMessage(`No save found for ${user.username}. Starting fresh.`);
        return "fresh-start";
      }

      importSaveJson(JSON.stringify(payload.save.gameState));
      setMessage(`Adventure loaded for ${user.username}.`);
      return true;
    } catch (error) {
      await showAlert(error.message || "Unable to load your game.");
      return false;
    }
  }

  async function promptToImportSaveJson() {
    const saveJson = await showPrompt("Paste your save JSON to resume:");
    if (saveJson === null) return;

    try {
      importSaveJson(saveJson);
    } catch (error) {
      await showAlert(error.message || "Unable to load that save.");
    }
  }

  return {
    canUseDatabaseSaves,
    exportSaveJson,
    importSaveJson,
    isDatabaseAvailable,
    promptToCreateAccount,
    promptToImportSaveJson,
    promptToLoadGame,
    saveGame,
    serializeGameState
  };
}
