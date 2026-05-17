export function createDialogueSceneController({
  canvas,
  ctx,
  gameState,
  drawRoundedRect,
  drawText,
  wrapText
}) {
  const spriteCache = new Map();
  let currentOnComplete = null;

  function traceRoundedRectPath(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function spriteFor(src) {
    if (!src) return null;
    if (spriteCache.has(src)) return spriteCache.get(src);

    const image = new Image();
    const record = { image, ready: false };
    image.addEventListener("load", () => {
      record.ready = true;
    });
    image.addEventListener("error", () => {
      record.ready = false;
    });
    image.src = src;
    spriteCache.set(src, record);
    return record;
  }

  function startDialogueScene(dialogue, options = {}) {
    if (!dialogue || !Array.isArray(dialogue.lines) || dialogue.lines.length === 0) return;

    currentOnComplete = typeof options.onComplete === "function" ? options.onComplete : null;
    gameState.scene = "dialogue";
    gameState.dialogue = {
      speaker: dialogue.speaker || "",
      title: dialogue.title || "",
      portraitPath: dialogue.portraitPath || null,
      spritePath: dialogue.spritePath || null,
      lines: dialogue.lines,
      index: 0
    };

    if (dialogue.portraitPath || dialogue.spritePath) {
      spriteFor(dialogue.portraitPath || dialogue.spritePath);
    }
  }

  function finishDialogueScene() {
    const onComplete = currentOnComplete;
    currentOnComplete = null;
    gameState.dialogue = null;
    gameState.scene = "world";
    if (typeof onComplete === "function") {
      onComplete();
    }
  }

  function advanceDialogueScene() {
    if (gameState.scene !== "dialogue" || !gameState.dialogue) return;

    gameState.dialogue.index += 1;
    if (gameState.dialogue.index >= gameState.dialogue.lines.length) {
      finishDialogueScene();
    }
  }

  function drawSpritePortrait(dialogue) {
    const panelX = 86;
    const panelY = 110;
    const portraitSrc = dialogue.portraitPath || dialogue.spritePath;
    const spriteRecord = spriteFor(portraitSrc);

    drawRoundedRect(panelX, panelY, 220, 290, 22, "#fff4e6", "#3d271d");
    drawRoundedRect(panelX + 28, panelY + 32, 164, 164, 26, "#f3d7a8", "#7a5434");

    if (spriteRecord?.ready) {
      const portraitX = panelX + 28;
      const portraitY = panelY + 32;
      const portraitSize = 164;
      const sourceSize = Math.min(spriteRecord.image.naturalWidth, spriteRecord.image.naturalHeight);
      const sourceX = (spriteRecord.image.naturalWidth - sourceSize) / 2;
      const sourceY = (spriteRecord.image.naturalHeight - sourceSize) / 2;
      ctx.save();
      traceRoundedRectPath(portraitX, portraitY, portraitSize, portraitSize, 26);
      ctx.clip();
      ctx.imageSmoothingEnabled = !dialogue.spritePath || Boolean(dialogue.portraitPath);
      ctx.drawImage(spriteRecord.image, sourceX, sourceY, sourceSize, sourceSize, portraitX, portraitY, portraitSize, portraitSize);
      ctx.restore();
      ctx.imageSmoothingEnabled = true;
    } else {
      drawText("?", panelX + 110, panelY + 134, {
        align: "center",
        font: "42px 'Press Start 2P'",
        color: "#b93c2f"
      });
    }

    drawText(dialogue.speaker, panelX + 110, panelY + 232, {
      align: "center",
      font: "11px 'Press Start 2P'",
      color: "#b93c2f"
    });
    if (dialogue.title) {
      drawText(dialogue.title, panelX + 110, panelY + 264, {
        align: "center",
        font: "18px Outfit",
        color: "#694435"
      });
    }
  }

  function drawDialogueScene() {
    const dialogue = gameState.dialogue;
    if (!dialogue) return;

    ctx.fillStyle = "rgba(20, 12, 8, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawRoundedRect(54, 66, canvas.width - 108, canvas.height - 132, 28, "rgba(255, 250, 243, 0.97)", "#3d271d");
    drawSpritePortrait(dialogue);

    const textX = 344;
    const textY = 122;
    drawText(dialogue.speaker, textX, textY, {
      font: "16px 'Press Start 2P'",
      color: "#b93c2f"
    });

    drawRoundedRect(textX, textY + 42, 520, 220, 18, "#fff7ef", "#7a5434");
    ctx.font = "25px Outfit";
    ctx.fillStyle = "#2d1b14";
    wrapText(dialogue.lines[dialogue.index] ?? "", textX + 26, textY + 92, 460, 34);

    drawText(`${dialogue.index + 1}/${dialogue.lines.length}`, textX + 500, textY + 292, {
      align: "right",
      font: "16px Outfit",
      color: "#694435"
    });
    drawText("Enter/Space: continue", textX, textY + 292, {
      font: "16px Outfit",
      color: "#2a7f62"
    });
  }

  return {
    advanceDialogueScene,
    drawDialogueScene,
    startDialogueScene
  };
}
