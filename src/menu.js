import {
  CREATURE_MAX_LEVEL,
  CREATURE_XP_PER_LEVEL
} from "./constants.js";
import { moveCatalog } from "./moves.js";

export function createMenuController({
  canvas,
  ctx,
  gameState,
  saveController,
  tileAt,
  getActiveCreature,
  setMessage,
  drawCreatureSprite,
  drawRoundedRect,
  drawText,
  wrapText
}) {
  function menuOptions() {
    return ["Party", "Make Camp", "Save Game", "Export Save", "Import Save", "Close"];
  }

  function openMenu() {
    if (gameState.scene !== "world") return;
    gameState.scene = "menu";
    gameState.menu.mode = "main";
    gameState.menu.mainIndex = 0;
    gameState.menu.partyIndex = gameState.player.activeIndex;
  }

  function closeMenu() {
    gameState.scene = "world";
    gameState.menu.mode = "main";
  }

  function makeCamp() {
    if (tileAt(gameState.player.x, gameState.player.y) !== "G") {
      setMessage("Not a good spot to make camp.");
      closeMenu();
      return;
    }

    gameState.world.camp = {
      mapId: gameState.world.currentMapId,
      x: gameState.player.x,
      y: gameState.player.y
    };
    setMessage("Camp set. Rest here, switch stored creatures, or return here after fainting.");
    closeMenu();
  }

  async function handleMenuNavigation(key) {
    if (gameState.scene !== "menu") return;

    if (gameState.menu.mode === "main") {
      const options = menuOptions();
      if (key === "ArrowUp" || key === "w") {
        gameState.menu.mainIndex = (gameState.menu.mainIndex - 1 + options.length) % options.length;
      } else if (key === "ArrowDown" || key === "s") {
        gameState.menu.mainIndex = (gameState.menu.mainIndex + 1) % options.length;
      } else if (key === "Enter") {
        const selected = options[gameState.menu.mainIndex];
        if (selected === "Party") {
          gameState.menu.mode = "party";
          gameState.menu.partyIndex = gameState.player.activeIndex;
          setMessage("Browsing your captured creatures.");
        } else if (selected === "Make Camp") {
          makeCamp();
        } else if (selected === "Save Game") {
          await saveController.saveGame();
        } else if (selected === "Export Save") {
          await saveController.exportSaveJson();
        } else if (selected === "Import Save") {
          await saveController.promptToImportSaveJson();
        } else {
          closeMenu();
        }
      } else if (key === "Backspace") {
        closeMenu();
      }
      return;
    }

    if (gameState.menu.mode === "party") {
      const partySize = gameState.player.party.length;
      if (key === "ArrowUp" || key === "w") {
        gameState.menu.partyIndex = (gameState.menu.partyIndex - 1 + partySize) % partySize;
      } else if (key === "ArrowDown" || key === "s") {
        gameState.menu.partyIndex = (gameState.menu.partyIndex + 1) % partySize;
      } else if (key === "Enter") {
        gameState.player.activeIndex = gameState.menu.partyIndex;
        const activeCreature = getActiveCreature();
        setMessage(`${activeCreature.nickname} is now leading your party.`);
      } else if (key === "Backspace") {
        gameState.menu.mode = "main";
      }
    }
  }

  function drawMainMenuOverlay() {
    const options = menuOptions();
    const optionGap = 46;
    const menuHeight = 94 + options.length * optionGap;
    drawRoundedRect(canvas.width - 250, 28, 210, menuHeight, 18, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Menu", canvas.width - 220, 58, { font: "14px 'Press Start 2P'", color: "#b93c2f" });
    options.forEach((option, index) => {
      const selected = index === gameState.menu.mainIndex;
      const optionY = 78 + index * optionGap;
      drawRoundedRect(
        canvas.width - 226,
        optionY,
        162,
        36,
        12,
        selected ? "#c8553d" : "#fff4e6",
        "#3d271d"
      );
      drawText(option, canvas.width - 198, optionY + 24, {
        font: "10px 'Press Start 2P'",
        color: selected ? "#fff8f0" : "#2d1b14"
      });
    });
    drawText("Enter: choose", canvas.width - 220, menuHeight + 2, { font: "14px Outfit", color: "#694435" });
  }

  function drawPartyMenuOverlay() {
    drawRoundedRect(42, 40, 876, 492, 22, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Party", 76, 74, { font: "16px 'Press Start 2P'", color: "#b93c2f" });
    drawText("Enter: lead   Backspace: back", 632, 74, { font: "16px Outfit", color: "#694435" });

    gameState.player.party.forEach((creature, index) => {
      const selected = index === gameState.menu.partyIndex;
      const active = index === gameState.player.activeIndex;
      const cardY = 104 + index * 82;
      drawRoundedRect(68, cardY, 378, 64, 14, selected ? "#f3a65a" : "#fff5ea", "#3d271d");
      drawCreatureSprite(creature, 84, cardY + 6, 58, 52, {
        frameColor: creature.color,
        padding: 5,
        radius: 16
      });
      drawText(creature.nickname, 150, cardY + 24, { font: "12px 'Press Start 2P'", color: selected ? "#fff8f0" : "#2d1b14" });
      drawText(`${creature.species}  Lv ${creature.level}`, 150, cardY + 48, {
        font: "16px Outfit",
        color: selected ? "#fff8f0" : "#694435"
      });
      drawText(`HP ${creature.hp}/${creature.maxHp}`, 394, cardY + 48, {
        font: "16px Outfit",
        color: selected ? "#fff8f0" : "#2a7f62",
        align: "right"
      });
      if (active) {
        drawText("LEAD", 394, cardY + 24, {
          font: "12px 'Press Start 2P'",
          color: selected ? "#fff8f0" : "#b93c2f",
          align: "right"
        });
      }
    });

    const viewedCreature = gameState.player.party[gameState.menu.partyIndex];
    const xpProgress = viewedCreature.level >= CREATURE_MAX_LEVEL
      ? "MAX"
      : `${viewedCreature.xp % CREATURE_XP_PER_LEVEL}/${CREATURE_XP_PER_LEVEL}`;
    drawRoundedRect(484, 104, 398, 388, 16, "#fff7ef", "#3d271d");
    drawCreatureSprite(viewedCreature, 602, 124, 164, 150, {
      frameColor: viewedCreature.color,
      padding: 10,
      radius: 30
    });
    drawText(viewedCreature.nickname, 516, 300, { font: "14px 'Press Start 2P'" });
    drawText(`${viewedCreature.species} · ${viewedCreature.type ?? "Unknown"}`, 516, 332, { font: "20px Outfit", color: "#694435" });
    drawText(`Level ${viewedCreature.level}  XP ${xpProgress}`, 516, 360, { font: "18px Outfit", color: "#2a7f62" });
    drawText(`Role: ${viewedCreature.role}`, 516, 388, { font: "17px Outfit", color: "#694435" });
    drawText(`Moves: ${viewedCreature.moves.map((moveId) => moveCatalog[moveId].name).join(", ")}`, 516, 420, {
      font: "17px Outfit",
      color: "#694435"
    });
    ctx.font = "18px Outfit";
    ctx.fillStyle = "#694435";
    wrapText(viewedCreature.description, 516, 456, 324, 24);
  }

  function drawMenuOverlay() {
    ctx.fillStyle = "rgba(38, 24, 18, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState.menu.mode === "main") {
      drawMainMenuOverlay();
      return;
    }

    drawPartyMenuOverlay();
  }

  return {
    closeMenu,
    drawMenuOverlay,
    handleMenuNavigation,
    openMenu
  };
}
