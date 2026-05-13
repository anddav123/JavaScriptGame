import {
  CREATURE_MAX_LEVEL,
  CREATURE_XP_PER_LEVEL,
  PLAYER_CAMP_MAX_CREATURES,
  PLAYER_PARTY_MAX_SIZE
} from "./constants.js";
import { moveCatalog } from "./moves.js";

function isConfirmKey(key) {
  return key === "Enter" || key === " " || key === "Spacebar";
}

export function createCampMenuController({
  canvas,
  ctx,
  gameState,
  setMessage,
  clamp,
  drawCreatureSprite,
  drawRoundedRect,
  drawText,
  wrapText
}) {
  function storedCreatures() {
    if (!Array.isArray(gameState.player.campCreatures)) {
      gameState.player.campCreatures = [];
    }
    return gameState.player.campCreatures;
  }

  function campOptions() {
    return ["Rest", "Switch Creatures", "Close"];
  }

  function openCampMenu() {
    if (gameState.scene !== "world") return;
    gameState.scene = "campMenu";
    gameState.campMenu.mode = "main";
    gameState.campMenu.mainIndex = 0;
    gameState.campMenu.storedIndex = 0;
    gameState.campMenu.partyIndex = gameState.player.activeIndex;
    gameState.campMenu.selectedStoredIndex = null;
    gameState.campMenu.pendingCreature = null;
    setMessage("Camp is ready.");
  }

  function closeCampMenu() {
    gameState.scene = "world";
    gameState.campMenu.mode = "main";
    gameState.campMenu.selectedStoredIndex = null;
    gameState.campMenu.pendingCreature = null;
  }

  function openCampStorageFullMenu(capturedCreature) {
    gameState.scene = "campMenu";
    gameState.campMenu.mode = "captureStorageFull";
    gameState.campMenu.mainIndex = 0;
    gameState.campMenu.storedIndex = 0;
    gameState.campMenu.partyIndex = gameState.player.activeIndex;
    gameState.campMenu.selectedStoredIndex = null;
    gameState.campMenu.pendingCreature = capturedCreature;
  }

  function restAtCamp() {
    for (const creature of [...gameState.player.party, ...storedCreatures()]) {
      creature.hp = creature.maxHp;
    }
    gameState.player.mp = gameState.player.maxMp;
    gameState.player.mpRechargeStepProgress = 0;
    setMessage("Your creatures rested at camp and fully recovered.");
    closeCampMenu();
  }

  function beginCampSwitch() {
    const storage = storedCreatures();
    if (storage.length === 0) {
      setMessage("No creatures are waiting at camp.");
      return;
    }

    gameState.campMenu.mode = "stored";
    gameState.campMenu.storedIndex = clamp(gameState.campMenu.storedIndex ?? 0, 0, storage.length - 1);
    setMessage("Choose a creature from camp storage.");
  }

  function chooseStoredCreature() {
    const storage = storedCreatures();
    if (storage.length === 0) {
      gameState.campMenu.mode = "main";
      setMessage("No creatures are waiting at camp.");
      return;
    }

    gameState.campMenu.selectedStoredIndex = clamp(gameState.campMenu.storedIndex ?? 0, 0, storage.length - 1);
    gameState.campMenu.partyIndex = gameState.player.activeIndex;
    gameState.campMenu.mode = "party";
    setMessage("Choose the party creature to send back to camp.");
  }

  function swapCampCreatureIntoParty() {
    const storage = storedCreatures();
    const storedIndex = gameState.campMenu.selectedStoredIndex;
    const partyIndex = gameState.campMenu.partyIndex;

    if (!Number.isInteger(storedIndex) || storedIndex < 0 || storedIndex >= storage.length) {
      gameState.campMenu.mode = "stored";
      setMessage("Choose a creature from camp storage.");
      return;
    }

    if (!Number.isInteger(partyIndex) || partyIndex < 0 || partyIndex >= gameState.player.party.length) {
      gameState.campMenu.mode = "party";
      setMessage("Choose a party creature to switch.");
      return;
    }

    const campCreature = storage[storedIndex];
    const partyCreature = gameState.player.party[partyIndex];
    gameState.player.party[partyIndex] = campCreature;
    storage[storedIndex] = partyCreature;
    gameState.player.activeIndex = clamp(gameState.player.activeIndex, 0, gameState.player.party.length - 1);
    setMessage(`${campCreature.nickname} joined your party. ${partyCreature.nickname} is resting at camp.`);
    closeCampMenu();
  }

  function handleCampMenuNavigation(key) {
    if (gameState.scene !== "campMenu") return;

    if (gameState.campMenu.mode === "main") {
      const options = campOptions();
      if (key === "ArrowUp" || key === "w") {
        gameState.campMenu.mainIndex = (gameState.campMenu.mainIndex - 1 + options.length) % options.length;
      } else if (key === "ArrowDown" || key === "s") {
        gameState.campMenu.mainIndex = (gameState.campMenu.mainIndex + 1) % options.length;
      } else if (isConfirmKey(key)) {
        const selected = options[gameState.campMenu.mainIndex];
        if (selected === "Rest") {
          restAtCamp();
        } else if (selected === "Switch Creatures") {
          beginCampSwitch();
        } else {
          closeCampMenu();
        }
      } else if (key === "Backspace") {
        closeCampMenu();
      }
      return;
    }

    if (gameState.campMenu.mode === "captureStorageFull") {
      const storage = storedCreatures();
      if (!gameState.campMenu.pendingCreature) {
        closeCampMenu();
        return;
      }

      if (storage.length === 0) {
        storage.push(gameState.campMenu.pendingCreature);
        setMessage(`${gameState.campMenu.pendingCreature.nickname} was stored at camp.`);
        closeCampMenu();
        return;
      }

      if (key === "ArrowUp" || key === "w") {
        gameState.campMenu.storedIndex = (gameState.campMenu.storedIndex - 1 + storage.length) % storage.length;
      } else if (key === "ArrowDown" || key === "s") {
        gameState.campMenu.storedIndex = (gameState.campMenu.storedIndex + 1) % storage.length;
      } else if (isConfirmKey(key)) {
        replaceStoredCreatureWithPendingCapture();
      } else if (key === "Backspace") {
        forfeitPendingCapture();
      }
      return;
    }

    if (gameState.campMenu.mode === "stored") {
      const storage = storedCreatures();
      if (storage.length === 0) {
        gameState.campMenu.mode = "main";
        return;
      }

      if (key === "ArrowUp" || key === "w") {
        gameState.campMenu.storedIndex = (gameState.campMenu.storedIndex - 1 + storage.length) % storage.length;
      } else if (key === "ArrowDown" || key === "s") {
        gameState.campMenu.storedIndex = (gameState.campMenu.storedIndex + 1) % storage.length;
      } else if (isConfirmKey(key)) {
        chooseStoredCreature();
      } else if (key === "Backspace") {
        gameState.campMenu.mode = "main";
      }
      return;
    }

    if (gameState.campMenu.mode === "party") {
      const partySize = gameState.player.party.length;
      if (key === "ArrowUp" || key === "w") {
        gameState.campMenu.partyIndex = (gameState.campMenu.partyIndex - 1 + partySize) % partySize;
      } else if (key === "ArrowDown" || key === "s") {
        gameState.campMenu.partyIndex = (gameState.campMenu.partyIndex + 1) % partySize;
      } else if (isConfirmKey(key)) {
        swapCampCreatureIntoParty();
      } else if (key === "Backspace") {
        gameState.campMenu.mode = "stored";
      }
    }
  }

  function replaceStoredCreatureWithPendingCapture() {
    const storage = storedCreatures();
    const pendingCreature = gameState.campMenu.pendingCreature;
    if (!pendingCreature || storage.length === 0) {
      closeCampMenu();
      return;
    }

    const storedIndex = clamp(gameState.campMenu.storedIndex ?? 0, 0, storage.length - 1);
    const releasedCreature = storage[storedIndex];
    storage[storedIndex] = pendingCreature;
    setMessage(`${pendingCreature.nickname} was stored at camp. ${releasedCreature.nickname} was released.`);
    closeCampMenu();
  }

  function forfeitPendingCapture() {
    const pendingCreature = gameState.campMenu.pendingCreature;
    if (pendingCreature) {
      setMessage(`${pendingCreature.nickname} was released.`);
    }
    closeCampMenu();
  }

  function xpProgress(creature) {
    return creature.level >= CREATURE_MAX_LEVEL
      ? "MAX"
      : `${creature.xp % CREATURE_XP_PER_LEVEL}/${CREATURE_XP_PER_LEVEL}`;
  }

  function drawCreatureRow(creature, x, y, width, selected, badge = "") {
    drawRoundedRect(x, y, width, 58, 12, selected ? "#f3a65a" : "#fff5ea", "#3d271d");
    drawCreatureSprite(creature, x + 12, y + 6, 52, 46, {
      frameColor: creature.color,
      padding: 5,
      radius: 14
    });
    drawText(creature.nickname, x + 76, y + 23, {
      font: "11px 'Press Start 2P'",
      color: selected ? "#fff8f0" : "#2d1b14"
    });
    drawText(`${creature.species}  Lv ${creature.level}`, x + 76, y + 46, {
      font: "15px Outfit",
      color: selected ? "#fff8f0" : "#694435"
    });
    drawText(`HP ${creature.hp}/${creature.maxHp}`, x + width - 18, y + 46, {
      font: "15px Outfit",
      color: selected ? "#fff8f0" : "#2a7f62",
      align: "right"
    });
    if (badge) {
      drawText(badge, x + width - 18, y + 23, {
        font: "10px 'Press Start 2P'",
        color: selected ? "#fff8f0" : "#b93c2f",
        align: "right"
      });
    }
  }

  function visibleCreatureWindow(index, count, maxRows) {
    if (count <= maxRows) return 0;
    return clamp(index - Math.floor(maxRows / 2), 0, count - maxRows);
  }

  function drawCreatureDetails(creature, x, y, width, height) {
    drawRoundedRect(x, y, width, height, 16, "#fff7ef", "#3d271d");
    drawCreatureSprite(creature, x + width / 2 - 74, y + 18, 148, 132, {
      frameColor: creature.color,
      padding: 10,
      radius: 28
    });
    drawText(creature.nickname, x + 30, y + 178, { font: "13px 'Press Start 2P'" });
    drawText(`${creature.species} · ${creature.type ?? "Unknown"}`, x + 30, y + 208, { font: "19px Outfit", color: "#694435" });
    drawText(`Level ${creature.level}  XP ${xpProgress(creature)}`, x + 30, y + 234, {
      font: "17px Outfit",
      color: "#2a7f62"
    });
    drawText(`HP ${creature.hp}/${creature.maxHp}`, x + 30, y + 260, {
      font: "17px Outfit",
      color: "#2a7f62"
    });
    drawText(`Moves: ${creature.moves.map((moveId) => moveCatalog[moveId]?.name ?? moveId).join(", ")}`, x + 30, y + 286, {
      font: "16px Outfit",
      color: "#694435"
    });
    ctx.font = "17px Outfit";
    ctx.fillStyle = "#694435";
    wrapText(creature.description, x + 30, y + 324, width - 60, 23);
  }

  function drawCampMainOverlay() {
    const options = campOptions();
    drawRoundedRect(260, 104, 440, 318, 20, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Camp", 300, 146, { font: "17px 'Press Start 2P'", color: "#b93c2f" });
    drawText(`Party ${gameState.player.party.length}/${PLAYER_PARTY_MAX_SIZE}`, 300, 180, {
      font: "18px Outfit",
      color: "#694435"
    });
    drawText(`Stored ${storedCreatures().length}/${PLAYER_CAMP_MAX_CREATURES}`, 500, 180, {
      font: "18px Outfit",
      color: "#694435"
    });

    options.forEach((option, index) => {
      const selected = index === gameState.campMenu.mainIndex;
      const y = 214 + index * 54;
      drawRoundedRect(300, y, 360, 40, 12, selected ? "#c8553d" : "#fff4e6", "#3d271d");
      drawText(option, 326, y + 27, {
        font: "12px 'Press Start 2P'",
        color: selected ? "#fff8f0" : "#2d1b14"
      });
    });

    drawText("Enter/Space: choose   Backspace: close", 300, 392, { font: "16px Outfit", color: "#694435" });
  }

  function drawStoredCreatureOverlay() {
    const storage = storedCreatures();
    drawRoundedRect(42, 40, 876, 492, 22, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Camp Storage", 76, 74, { font: "16px 'Press Start 2P'", color: "#b93c2f" });
    drawText("Enter/Space: select   Backspace: back", 600, 74, { font: "16px Outfit", color: "#694435" });

    if (storage.length === 0) {
      drawText("No creatures are waiting at camp.", 76, 148, { font: "22px Outfit", color: "#694435" });
      return;
    }

    const maxRows = 6;
    const start = visibleCreatureWindow(gameState.campMenu.storedIndex, storage.length, maxRows);
    storage.slice(start, start + maxRows).forEach((creature, offset) => {
      const index = start + offset;
      drawCreatureRow(creature, 68, 104 + offset * 64, 400, index === gameState.campMenu.storedIndex);
    });

    if (storage.length > maxRows) {
      drawText(`${gameState.campMenu.storedIndex + 1}/${storage.length}`, 432, 510, {
        font: "15px Outfit",
        color: "#694435",
        align: "right"
      });
    }

    drawCreatureDetails(storage[gameState.campMenu.storedIndex], 506, 104, 376, 388);
  }

  function drawPartyReplacementOverlay() {
    const storage = storedCreatures();
    const campCreature = storage[gameState.campMenu.selectedStoredIndex];
    drawRoundedRect(42, 40, 876, 492, 22, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Choose Replacement", 76, 74, { font: "16px 'Press Start 2P'", color: "#b93c2f" });
    drawText("Enter/Space: switch   Backspace: back", 610, 74, { font: "16px Outfit", color: "#694435" });

    if (!campCreature) {
      drawText("Choose a creature from camp storage first.", 76, 148, { font: "22px Outfit", color: "#694435" });
      return;
    }

    drawText(`${campCreature.nickname} will join your party.`, 76, 108, {
      font: "18px Outfit",
      color: "#694435"
    });

    gameState.player.party.forEach((creature, index) => {
      const badge = index === gameState.player.activeIndex ? "LEAD" : "";
      drawCreatureRow(creature, 68, 132 + index * 66, 400, index === gameState.campMenu.partyIndex, badge);
    });

    drawCreatureDetails(campCreature, 506, 132, 376, 360);
  }

  function drawCaptureStorageFullOverlay() {
    const storage = storedCreatures();
    const pendingCreature = gameState.campMenu.pendingCreature;
    drawRoundedRect(42, 40, 876, 492, 22, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Camp Full", 76, 74, { font: "16px 'Press Start 2P'", color: "#b93c2f" });
    drawText("Enter/Space: replace stored   Backspace: forfeit catch", 474, 74, {
      font: "16px Outfit",
      color: "#694435"
    });

    if (!pendingCreature) {
      drawText("No pending capture.", 76, 148, { font: "22px Outfit", color: "#694435" });
      return;
    }

    drawText(`${pendingCreature.nickname} needs a camp storage slot.`, 76, 108, {
      font: "18px Outfit",
      color: "#694435"
    });

    const maxRows = 6;
    const start = visibleCreatureWindow(gameState.campMenu.storedIndex, storage.length, maxRows);
    storage.slice(start, start + maxRows).forEach((creature, offset) => {
      const index = start + offset;
      drawCreatureRow(creature, 68, 132 + offset * 62, 400, index === gameState.campMenu.storedIndex);
    });

    if (storage.length > maxRows) {
      drawText(`${gameState.campMenu.storedIndex + 1}/${storage.length}`, 432, 510, {
        font: "15px Outfit",
        color: "#694435",
        align: "right"
      });
    }

    drawCreatureDetails(pendingCreature, 506, 132, 376, 360);
  }

  function drawCampMenuOverlay() {
    ctx.fillStyle = "rgba(38, 24, 18, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState.campMenu.mode === "stored") {
      drawStoredCreatureOverlay();
      return;
    }

    if (gameState.campMenu.mode === "party") {
      drawPartyReplacementOverlay();
      return;
    }

    if (gameState.campMenu.mode === "captureStorageFull") {
      drawCaptureStorageFullOverlay();
      return;
    }

    drawCampMainOverlay();
  }

  return {
    drawCampMenuOverlay,
    handleCampMenuNavigation,
    openCampMenu,
    openCampStorageFullMenu
  };
}
