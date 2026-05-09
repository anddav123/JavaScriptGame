import { TILE_SIZE } from "./constants.js";

export function createWorldObjectRenderer({
  canvas,
  ctx,
  worldToScreenX,
  worldToScreenY,
  clamp,
  drawRoundedRect,
  drawText
}) {
  function isOffscreen(px, py, width = TILE_SIZE, height = TILE_SIZE) {
    return px + width < 0 || py + height < 0 || px > canvas.width || py > canvas.height;
  }

  function drawTrigger(trigger) {
    const px = worldToScreenX(trigger.x);
    const py = worldToScreenY(trigger.y);

    if (isOffscreen(px, py)) {
      return;
    }

    if (trigger.kind.startsWith("cave")) {
      ctx.fillStyle = "rgba(24, 19, 20, 0.24)";
      ctx.beginPath();
      ctx.ellipse(px + 24, py + 40, 21, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#5f6260";
      ctx.beginPath();
      ctx.moveTo(px + 5, py + 40);
      ctx.lineTo(px + 9, py + 24);
      ctx.quadraticCurveTo(px + 12, py + 9, px + 26, py + 7);
      ctx.quadraticCurveTo(px + 40, py + 10, px + 43, py + 25);
      ctx.lineTo(px + 46, py + 40);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#363a3d";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#2d3134";
      ctx.beginPath();
      ctx.moveTo(px + 14, py + 40);
      ctx.lineTo(px + 16, py + 27);
      ctx.quadraticCurveTo(px + 24, py + 14, px + 33, py + 27);
      ctx.lineTo(px + 36, py + 40);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#111314";
      ctx.beginPath();
      ctx.moveTo(px + 18, py + 40);
      ctx.lineTo(px + 19, py + 30);
      ctx.quadraticCurveTo(px + 24, py + 22, px + 30, py + 30);
      ctx.lineTo(px + 32, py + 40);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(210, 219, 198, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 12, py + 24);
      ctx.lineTo(px + 20, py + 16);
      ctx.moveTo(px + 34, py + 17);
      ctx.lineTo(px + 39, py + 28);
      ctx.stroke();

      drawRoundedRect(px + 8, py + 38, 36, 5, 0, "#3f443f");
      return;
    }

    drawRoundedRect(px + 8, py + 29, TILE_SIZE - 16, 13, 0, "#8b5f3d", "#4e2d1f");
    drawRoundedRect(px + 11, py + 32, TILE_SIZE - 22, 3, 0, "rgba(255, 221, 166, 0.22)");
    drawRoundedRect(px + 11, py + 38, TILE_SIZE - 22, 2, 0, "rgba(55, 32, 20, 0.28)");

    ctx.strokeStyle = "rgba(55, 32, 20, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + 15, py + 35);
    ctx.lineTo(px + TILE_SIZE - 15, py + 35);
    ctx.moveTo(px + 15, py + 39);
    ctx.lineTo(px + TILE_SIZE - 15, py + 39);
    ctx.stroke();
  }

  function drawSign(sign) {
    const px = worldToScreenX(sign.x);
    const py = worldToScreenY(sign.y);
    if (isOffscreen(px, py)) return;

    drawRoundedRect(px + 22, py + 24, 5, 21, 0, "#6d4b2f", "#4e2d1f");
    drawRoundedRect(px + 10, py + 10, 28, 18, 0, "#b8834f", "#5b3723");
    drawRoundedRect(px + 13, py + 13, 22, 3, 0, "rgba(255, 222, 164, 0.3)");
    drawRoundedRect(px + 13, py + 23, 22, 3, 0, "rgba(73, 43, 25, 0.22)");

    ctx.strokeStyle = "rgba(73, 43, 25, 0.34)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 16, py + 19);
    ctx.lineTo(px + 32, py + 19);
    ctx.stroke();

    drawText("!", px + 24, py + 24, { align: "center", font: "12px 'Press Start 2P'", color: "#fff1cd" });
  }

  function drawFurniture(furniture) {
    const px = worldToScreenX(furniture.x);
    const py = worldToScreenY(furniture.y);
    const width = (furniture.width || 1) * TILE_SIZE;
    const height = (furniture.height || 1) * TILE_SIZE;

    if (isOffscreen(px, py, width, height)) return;

    ctx.fillStyle = "rgba(45, 27, 20, 0.24)";
    ctx.beginPath();
    ctx.ellipse(px + width / 2, py + height - 7, Math.max(14, width / 2 - 7), 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (furniture.type === "bed") {
      drawRoundedRect(px + 5, py + 6, width - 10, height - 13, 7, "#7a5434", "#4e2d1f");
      drawRoundedRect(px + 10, py + 10, width - 20, 17, 6, "#fff1cd", "#c8a46a");
      drawRoundedRect(px + 10, py + 27, width - 20, height - 39, 5, "#4f9fd8", "#2f5f83");
      drawRoundedRect(px + 14, py + 34, width - 28, 6, 0, "rgba(255, 255, 255, 0.24)");
      return;
    }

    if (furniture.type === "shelf") {
      drawRoundedRect(px + 4, py + 5, width - 8, height - 10, 4, "#7a5434", "#4e2d1f");
      drawRoundedRect(px + 8, py + 12, width - 16, 5, 0, "#4e2d1f");
      drawRoundedRect(px + 8, py + height - 19, width - 16, 5, 0, "#4e2d1f");

      const bookColors = ["#c8553d", "#3d8f6f", "#f0c15f", "#4d9a63", "#7f4f9f"];
      for (let i = 0; i < Math.floor((width - 16) / 8); i += 1) {
        const bookX = px + 10 + i * 8;
        drawRoundedRect(bookX, py + 18, 5, height - 37, 0, bookColors[i % bookColors.length]);
      }
      return;
    }

    if (furniture.type === "cabinet") {
      drawRoundedRect(px + 7, py + 4, width - 14, height - 8, 5, "#8b5f3d", "#4e2d1f");
      ctx.strokeStyle = "rgba(78, 45, 31, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + width / 2, py + 8);
      ctx.lineTo(px + width / 2, py + height - 10);
      ctx.stroke();
      drawRoundedRect(px + width / 2 - 8, py + height / 2, 4, 4, 0, "#f0c15f");
      drawRoundedRect(px + width / 2 + 4, py + height / 2, 4, 4, 0, "#f0c15f");
      drawRoundedRect(px + 12, py + 9, width - 24, 5, 0, "rgba(255, 221, 166, 0.2)");
      return;
    }

    if (furniture.type === "table" || furniture.type === "mapTable") {
      drawRoundedRect(px + 10, py + 29, 7, height - 36, 0, "#5b3723");
      drawRoundedRect(px + width - 17, py + 29, 7, height - 36, 0, "#5b3723");
      drawRoundedRect(px + 5, py + 11, width - 10, 23, 5, "#9c6644", "#4e2d1f");
      drawRoundedRect(px + 9, py + 15, width - 18, 5, 0, "rgba(255, 221, 166, 0.28)");

      if (furniture.type === "mapTable") {
        drawRoundedRect(px + 18, py + 17, width - 36, 11, 1, "#e8d6aa", "#7a5434");
        ctx.strokeStyle = "rgba(64, 92, 76, 0.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 22, py + 24);
        ctx.quadraticCurveTo(px + width / 2, py + 14, px + width - 24, py + 23);
        ctx.stroke();
      } else {
        drawRoundedRect(px + width - 22, py + 17, 8, 9, 3, "#c8e6f5", "#4f6f7c");
      }
      return;
    }

    if (furniture.type === "stove") {
      drawRoundedRect(px + 9, py + 6, width - 18, height - 13, 5, "#4a4f50", "#242829");
      drawRoundedRect(px + 14, py + 14, width - 28, 13, 4, "#262b2c", "#111314");
      drawRoundedRect(px + 16, py + height - 24, width - 32, 11, 3, "#5f6260", "#242829");
      drawRoundedRect(px + width / 2 - 5, py + 2, 10, 12, 2, "#363a3d", "#1f2224");
      ctx.strokeStyle = "rgba(255, 241, 205, 0.24)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 17, py + 19);
      ctx.lineTo(px + width - 17, py + 19);
      ctx.stroke();
      return;
    }

    const cols = furniture.width || 1;
    const rows = furniture.height || 1;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const crateX = px + x * TILE_SIZE + 7;
        const crateY = py + y * TILE_SIZE + 6;
        drawRoundedRect(crateX, crateY, TILE_SIZE - 14, TILE_SIZE - 12, 3, "#b8834f", "#5b3723");
        ctx.strokeStyle = "rgba(91, 55, 35, 0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(crateX + 4, crateY + 4);
        ctx.lineTo(crateX + TILE_SIZE - 18, crateY + TILE_SIZE - 16);
        ctx.moveTo(crateX + TILE_SIZE - 18, crateY + 4);
        ctx.lineTo(crateX + 4, crateY + TILE_SIZE - 16);
        ctx.stroke();
      }
    }
  }

  function drawBuilding(building) {
    const px = worldToScreenX(building.x);
    const py = worldToScreenY(building.y);
    const width = building.width * TILE_SIZE;
    const height = building.height * TILE_SIZE;
    const doorX = building.door ? worldToScreenX(building.door.x) + 11 : px + width / 2 - 13;
    const doorY = building.door ? worldToScreenY(building.door.y) + 6 : py + height - 48;
    const wallColor = building.wallColor || "#f3d49a";
    const trimColor = building.trimColor || "#6d4b2f";
    const roofColor = building.roofColor || "#b93c2f";
    const roofTrimColor = building.roofTrimColor || "#6d2d24";

    if (isOffscreen(px, py, width, height)) return;

    drawRoundedRect(px + 10, py + height - 10, width - 20, 8, 0, "rgba(45, 27, 20, 0.22)");
    drawRoundedRect(px + 6, py + 22, width - 12, height - 28, 0, wallColor, trimColor);

    ctx.strokeStyle = "rgba(109, 75, 47, 0.28)";
    ctx.lineWidth = 2;
    for (let y = py + 38; y < py + height - 14; y += 14) {
      ctx.beginPath();
      ctx.moveTo(px + 9, y);
      ctx.lineTo(px + width - 9, y + ((y / 14) % 2 === 0 ? 1 : -1));
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 244, 198, 0.28)";
    ctx.fillRect(px + 13, py + 28, width - 26, 7);
    ctx.fillStyle = "rgba(92, 55, 35, 0.14)";
    ctx.fillRect(px + 9, py + height - 24, width - 18, 10);

    drawRoundedRect(px + 6, py + 6, width - 12, 34, 0, roofColor, roofTrimColor);

    ctx.strokeStyle = "rgba(255, 215, 141, 0.34)";
    ctx.lineWidth = 3;
    for (let x = px + 14; x < px + width - 18; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, py + 10);
      ctx.lineTo(x + 16, py + 36);
      ctx.stroke();
    }

    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 32);
    ctx.lineTo(px + width / 2, py + 2);
    ctx.lineTo(px + width - 8, py + 32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = roofTrimColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 221, 151, 0.32)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 19, py + 30);
    ctx.lineTo(px + width / 2, py + 9);
    ctx.lineTo(px + width - 19, py + 30);
    ctx.stroke();

    drawRoundedRect(doorX, doorY, 26, 42, 0, "#845535", "#4e2d1f");
    ctx.strokeStyle = "rgba(78, 45, 31, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(doorX + 13, doorY + 4);
    ctx.lineTo(doorX + 13, doorY + 38);
    ctx.moveTo(doorX + 4, doorY + 18);
    ctx.lineTo(doorX + 22, doorY + 18);
    ctx.stroke();
    drawRoundedRect(doorX + 18, doorY + 22, 4, 4, 0, "#f0c15f");

    const windowXs = width < 144 ? [px + width - 46] : [px + 22, px + width - 46];
    for (const windowX of windowXs) {
      drawRoundedRect(windowX, py + 54, 24, 22, 0, "#9fd7ff", "#4f6f7c");
      ctx.strokeStyle = "rgba(47, 77, 89, 0.72)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(windowX + 12, py + 55);
      ctx.lineTo(windowX + 12, py + 75);
      ctx.moveTo(windowX + 1, py + 65);
      ctx.lineTo(windowX + 23, py + 65);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
      ctx.fillRect(windowX + 4, py + 57, 7, 5);
    }

    const signText = typeof building.sign === "string" ? building.sign.trim() : "";
    if (signText) {
      let signFontSize = 8;
      let signFont = `${signFontSize}px 'Press Start 2P'`;
      const maxSignWidth = Math.max(42, width - 28);
      const maxTextWidth = maxSignWidth - 12;
      ctx.font = signFont;
      let measuredTextWidth = ctx.measureText(signText).width;

      while (signFontSize > 5 && measuredTextWidth > maxTextWidth) {
        signFontSize -= 1;
        signFont = `${signFontSize}px 'Press Start 2P'`;
        ctx.font = signFont;
        measuredTextWidth = ctx.measureText(signText).width;
      }

      const signWidth = clamp(measuredTextWidth + 18, 42, maxSignWidth);
      drawRoundedRect(px + width / 2 - signWidth / 2, py + 36, signWidth, 16, 0, "#fff1cd", "#6d4b2f");

      ctx.save();
      ctx.translate(px + width / 2, py + 48);
      ctx.scale(Math.min(1, (signWidth - 12) / measuredTextWidth), 1);
      drawText(signText, 0, 0, { align: "center", font: signFont, color: "#6d4b2f" });
      ctx.restore();
    }
  }

  function drawWorldObjects(map) {
    for (const trigger of map.triggers || []) {
      drawTrigger(trigger);
    }

    for (const building of map.buildings || []) {
      drawBuilding(building);
    }

    for (const furniture of map.furniture || []) {
      drawFurniture(furniture);
    }

    for (const sign of map.signs || []) {
      drawSign(sign);
    }
  }

  return {
    drawBuilding,
    drawFurniture,
    drawSign,
    drawTrigger,
    drawWorldObjects
  };
}
