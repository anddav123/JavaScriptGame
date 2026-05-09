const START_MENU_BACKGROUND_SOURCES = ["assets/menu.png", "assets/menu.svg"];
const START_MENU_BUTTONS = {
  x: 154,
  y: 364,
  width: 272,
  height: 36,
  gap: 12
};

export function createStartMenuController({
  canvas,
  ctx,
  gameState,
  saveController,
  beginIntroCutscene,
  drawCoverImage,
  drawRoundedRect,
  drawText
}) {
  const startMenuBackground = {
    image: new Image(),
    ready: false
  };
  let startMenuBackgroundSourceIndex = 0;

  startMenuBackground.image.decoding = "async";
  startMenuBackground.image.fetchPriority = "high";

  startMenuBackground.image.addEventListener("load", () => {
    startMenuBackground.ready = true;
  });
  startMenuBackground.image.addEventListener("error", () => {
    startMenuBackground.ready = false;
    startMenuBackgroundSourceIndex += 1;
    loadStartMenuBackground();
  });

  function loadStartMenuBackground() {
    const nextSource = START_MENU_BACKGROUND_SOURCES[startMenuBackgroundSourceIndex];
    if (!nextSource) return;
    startMenuBackground.ready = false;
    startMenuBackground.image.src = nextSource;
  }

  function startMenuOptions() {
    return saveController.isDatabaseAvailable()
      ? ["Start Adventure", "Load Adventure", "Import JSON Save"]
      : ["Start Local Adventure", "Import JSON Save", "Load Adventure"];
  }

  async function selectStartMenuOption(index) {
    const selected = startMenuOptions()[index];
    if (selected === "Start Adventure" || selected === "Start Local Adventure") {
      const accountCreated = await saveController.promptToCreateAccount();
      if (accountCreated) {
        beginIntroCutscene();
      }
    } else if (selected === "Load Adventure") {
      const loadResult = await saveController.promptToLoadGame();
      if (loadResult === "fresh-start") {
        beginIntroCutscene();
      }
    } else if (selected === "Import JSON Save") {
      await saveController.promptToImportSaveJson();
    }
  }

  function startMenuOptionAtPoint(x, y) {
    return startMenuOptions().findIndex((option, index) => {
      const buttonY = START_MENU_BUTTONS.y + index * (START_MENU_BUTTONS.height + START_MENU_BUTTONS.gap);
      return x >= START_MENU_BUTTONS.x
        && x <= START_MENU_BUTTONS.x + START_MENU_BUTTONS.width
        && y >= buttonY
        && y <= buttonY + START_MENU_BUTTONS.height;
    });
  }

  function handleStartMenuNavigation(key) {
    const options = startMenuOptions();

    if (key === "ArrowUp" || key === "w") {
      gameState.startMenu.index = (gameState.startMenu.index - 1 + options.length) % options.length;
    } else if (key === "ArrowDown" || key === "s") {
      gameState.startMenu.index = (gameState.startMenu.index + 1) % options.length;
    } else if (key === "Enter") {
      selectStartMenuOption(gameState.startMenu.index);
    }
  }

  function drawStartMenuBackground() {
    if (startMenuBackground.ready && startMenuBackground.image.naturalWidth > 0) {
      drawCoverImage(startMenuBackground.image);
      return true;
    }

    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#f6d365");
    sky.addColorStop(0.52, "#f5a16c");
    sky.addColorStop(1, "#c8553d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 249, 241, 0.18)";
    ctx.beginPath();
    ctx.arc(170, 120, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(820, 98, 92, 0, Math.PI * 2);
    ctx.fill();
    return false;
  }

  function drawStartMenu() {
    const hasBackgroundArtwork = drawStartMenuBackground();

    if (!hasBackgroundArtwork) {
      drawRoundedRect(84, 70, 792, 184, 28, "rgba(255, 248, 238, 0.9)", "#3d271d");
      drawText("Orb Bound", 480, 138, { font: "34px 'Press Start 2P'", color: "#b93c2f", align: "center" });
      drawText("A meadow-born creature RPG", 480, 186, { font: "24px Outfit", color: "#694435", align: "center" });
      drawText("Explore, battle, capture, and uncover connected maps.", 480, 222, {
        font: "20px Outfit",
        color: "#694435",
        align: "center"
      });
    }

    drawRoundedRect(126, 314, 330, 190, 20, "rgba(255, 248, 238, 0.94)", "#1c2634");
    drawText("Start Menu", 166, 348, { font: "15px 'Press Start 2P'", color: "#1c2634" });

    startMenuOptions().forEach((option, index) => {
      const selected = index === gameState.startMenu.index;
      const buttonY = START_MENU_BUTTONS.y + index * (START_MENU_BUTTONS.height + START_MENU_BUTTONS.gap);
      drawRoundedRect(START_MENU_BUTTONS.x, buttonY, START_MENU_BUTTONS.width, START_MENU_BUTTONS.height, 14, selected ? "#f9d85d" : "#fff3e2", "#1c2634");
      drawText(option, 182, buttonY + 24, {
        font: "10px 'Press Start 2P'",
        color: selected ? "#1c2634" : "#2d1b14"
      });
    });

    drawRoundedRect(504, 314, 332, 176, 20, "rgba(255, 248, 238, 0.9)", "#1c2634");
    drawText("Controls", 540, 350, { font: "15px 'Press Start 2P'", color: "#1c2634" });
    drawText("Move", 540, 392, { font: "20px Outfit", color: "#694435" });
    drawText("WASD / Arrow Keys", 800, 392, { font: "20px Outfit", color: "#2d1b14", align: "right" });
    drawText("Select", 540, 430, { font: "20px Outfit", color: "#694435" });
    drawText("Enter / Click", 800, 430, { font: "20px Outfit", color: "#2d1b14", align: "right" });
    drawText("Fullscreen", 540, 468, { font: "20px Outfit", color: "#694435" });
    drawText("F", 800, 468, { font: "20px Outfit", color: "#2d1b14", align: "right" });

    drawRoundedRect(104, 522, 752, 34, 14, "rgba(28, 38, 52, 0.58)");
    drawText("Start fresh, load from database, or import a JSON backup.", 480, 544, {
      font: "18px Outfit",
      color: "#fff8f0",
      align: "center"
    });
  }

  loadStartMenuBackground();

  return {
    drawStartMenu,
    handleStartMenuNavigation,
    selectStartMenuOption,
    startMenuOptionAtPoint
  };
}
