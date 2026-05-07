import { TILE_SIZE } from "./constants.js";

function traceRoundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke = null) {
  traceRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function traceRoughRoundedRectPath(ctx, x, y, width, height, radius, offsets) {
  const right = x + width;
  const bottom = y + height;
  const [
    topStartY,
    topEndY,
    rightStartX,
    rightEndX,
    bottomEndY,
    bottomStartY,
    leftEndX,
    leftStartX
  ] = offsets;

  ctx.beginPath();
  ctx.moveTo(x + radius, y + topStartY);
  ctx.lineTo(right - radius, y + topEndY);
  ctx.quadraticCurveTo(right + rightStartX, y + topEndY, right + rightStartX, y + radius);
  ctx.lineTo(right + rightEndX, bottom - radius);
  ctx.quadraticCurveTo(right + rightEndX, bottom + bottomEndY, right - radius, bottom + bottomEndY);
  ctx.lineTo(x + radius, bottom + bottomStartY);
  ctx.quadraticCurveTo(x + leftEndX, bottom + bottomStartY, x + leftEndX, bottom - radius);
  ctx.lineTo(x + leftStartX, y + radius);
  ctx.quadraticCurveTo(x + leftStartX, y + topStartY, x + radius, y + topStartY);
  ctx.closePath();
}

function drawRoughRoundedRect(ctx, x, y, width, height, radius, fill, offsets) {
  traceRoughRoundedRectPath(ctx, x, y, width, height, radius, offsets);
  ctx.fillStyle = fill;
  ctx.fill();
}

function createGrassTileCanvas(variant, hasTallGrass = false, theme = "meadow") {
  const grassCanvas = document.createElement("canvas");
  grassCanvas.width = TILE_SIZE;
  grassCanvas.height = TILE_SIZE;

  const grassCtx = grassCanvas.getContext("2d");
  const grassTheme = {
    meadow: {
      bases: ["#88cf8b", "#86ca86", "#8bd28a", "#84c985"],
      lightFill: "rgba(213, 245, 171, 0.05)",
      shadeFill: "rgba(41, 116, 55, 0.045)",
      tuftStroke: "rgba(45, 126, 64, 0.28)",
      bladeShadowStroke: "rgba(34, 100, 52, 0.3)",
      bladeStrokes: ["#327f4a", "#3ea65a"]
    },
    cave: {
      bases: ["#50685c", "#4a6156", "#566f60", "#455b52"],
      lightFill: "rgba(155, 176, 145, 0.055)",
      shadeFill: "rgba(18, 31, 34, 0.12)",
      tuftStroke: "rgba(27, 72, 59, 0.34)",
      bladeShadowStroke: "rgba(13, 31, 34, 0.38)",
      bladeStrokes: ["#244d40", "#2f6350"]
    }
  }[theme];
  const grassTexture = [
    {
      light: [[5, 7, 18, 6], [28, 22, 12, 5]],
      shade: [[8, 34, 15, 5], [33, 8, 7, 14]],
      tufts: [[9, 29, 10, 25], [21, 16, 23, 13], [35, 37, 37, 33]],
      blades: [[8, 40, 12, 19], [14, 42, 13, 17], [20, 41, 23, 22], [27, 42, 28, 15], [34, 41, 31, 21], [40, 39, 42, 18]]
    },
    {
      light: [[11, 10, 14, 5], [30, 32, 10, 4]],
      shade: [[4, 28, 12, 6], [35, 13, 7, 18]],
      tufts: [[12, 37, 15, 33], [27, 21, 28, 17], [39, 31, 37, 27]],
      blades: [[7, 41, 9, 22], [13, 40, 17, 16], [22, 42, 21, 20], [29, 41, 32, 18], [36, 42, 35, 15], [42, 40, 39, 24]]
    },
    {
      light: [[6, 18, 13, 5], [24, 7, 17, 5]],
      shade: [[10, 38, 18, 4], [35, 25, 8, 12]],
      tufts: [[8, 24, 11, 20], [23, 34, 21, 30], [34, 16, 36, 12]],
      blades: [[6, 40, 10, 18], [12, 42, 12, 23], [19, 41, 17, 15], [26, 42, 30, 20], [34, 41, 36, 17], [41, 40, 38, 21]]
    },
    {
      light: [[8, 8, 16, 4], [27, 28, 14, 5]],
      shade: [[7, 31, 10, 8], [31, 13, 10, 15]],
      tufts: [[13, 18, 15, 14], [25, 38, 28, 34], [40, 26, 39, 22]],
      blades: [[8, 42, 7, 21], [15, 40, 18, 18], [21, 42, 24, 15], [29, 41, 27, 22], [35, 42, 38, 19], [41, 40, 43, 16]]
    }
  ][variant];

  drawRoundedRect(grassCtx, 0, 0, TILE_SIZE, TILE_SIZE, 0, grassTheme.bases[variant]);

  grassCtx.save();
  traceRoundedRectPath(grassCtx, 0, 0, TILE_SIZE, TILE_SIZE, 0);
  grassCtx.clip();

  grassCtx.fillStyle = grassTheme.lightFill;
  for (const [x, y, width, height] of grassTexture.light) {
    grassCtx.fillRect(x, y, width, height);
  }

  grassCtx.fillStyle = grassTheme.shadeFill;
  for (const [x, y, width, height] of grassTexture.shade) {
    grassCtx.fillRect(x, y, width, height);
  }

  grassCtx.strokeStyle = grassTheme.tuftStroke;
  grassCtx.lineWidth = 2;
  grassCtx.lineCap = "round";
  grassCtx.beginPath();
  for (const [startX, startY, endX, endY] of grassTexture.tufts) {
    grassCtx.moveTo(startX, startY);
    grassCtx.lineTo(endX, endY);
  }
  grassCtx.stroke();

  if (hasTallGrass) {
    grassCtx.lineWidth = 3;
    grassCtx.beginPath();
    grassCtx.strokeStyle = grassTheme.bladeShadowStroke;
    for (const [baseX, baseY, tipX, tipY] of grassTexture.blades) {
      grassCtx.moveTo(baseX + 1, baseY);
      grassCtx.lineTo(tipX + 1, tipY + 2);
    }
    grassCtx.stroke();

    grassCtx.beginPath();
    for (const [baseX, baseY, tipX, tipY] of grassTexture.blades) {
      grassCtx.strokeStyle = baseX % 2 === 0 ? grassTheme.bladeStrokes[0] : grassTheme.bladeStrokes[1];
      grassCtx.moveTo(baseX, baseY);
      grassCtx.lineTo(tipX, tipY);
      grassCtx.stroke();
      grassCtx.beginPath();
    }
  }

  grassCtx.restore();
  return grassCanvas;
}

function createWallTileCanvas(variant) {
  const wallCanvas = document.createElement("canvas");
  wallCanvas.width = TILE_SIZE;
  wallCanvas.height = TILE_SIZE;

  const wallCtx = wallCanvas.getContext("2d");
  const wallInset = 1.5;
  const wallInnerSize = TILE_SIZE - wallInset * 2;
  const wallInnerRadius = 7.5;
  const wallTexture = [
    {
      chips: [[13, 14, 7, 2], [28, 30, 10, 2], [10, 38, 3, 3]],
      moss: [[7, 8, 8, 2], [33, 41, 7, 2]],
      cracks: [[18, 21, 23, 19], [23, 19, 27, 22]],
      highlights: [[7, 7, 17, 3], [12, 19, 9, 2]],
      shadows: [[28, 34, 12, 4], [38, 16, 3, 14]]
    },
    {
      chips: [[26, 12, 8, 2], [11, 27, 12, 2], [36, 35, 3, 3]],
      moss: [[9, 40, 10, 2], [35, 10, 5, 2]],
      cracks: [[32, 20, 36, 24], [36, 24, 34, 29]],
      highlights: [[8, 12, 12, 3], [24, 7, 11, 2]],
      shadows: [[25, 31, 16, 4], [10, 35, 8, 3]]
    },
    {
      chips: [[9, 18, 6, 2], [29, 24, 9, 2], [20, 39, 5, 2]],
      moss: [[7, 11, 6, 2], [28, 39, 12, 2]],
      cracks: [[16, 31, 20, 28], [20, 28, 25, 30]],
      highlights: [[10, 8, 19, 3], [31, 18, 7, 2]],
      shadows: [[17, 34, 21, 4], [37, 25, 3, 10]]
    },
    {
      chips: [[18, 10, 11, 2], [35, 24, 4, 3], [9, 33, 9, 2]],
      moss: [[8, 39, 7, 2], [30, 8, 10, 2]],
      cracks: [[27, 30, 31, 33], [31, 33, 36, 31]],
      highlights: [[7, 15, 13, 3], [22, 7, 15, 2]],
      shadows: [[24, 36, 17, 4], [36, 20, 4, 11]]
    }
  ][variant];
  const wallShape = [
    {
      outer: [-0.2, 0.6, -0.4, 0.3, -0.2, 0.4, 0.3, -0.2],
      inner: [0.4, -0.3, 0.5, -0.2, 0.3, -0.4, -0.5, 0.2]
    },
    {
      outer: [0.5, -0.2, 0.2, -0.5, 0.5, -0.1, -0.3, 0.4],
      inner: [-0.3, 0.4, -0.2, 0.6, -0.5, 0.2, 0.4, -0.4]
    },
    {
      outer: [-0.5, 0.3, 0.5, -0.2, 0.2, -0.5, 0.2, 0.6],
      inner: [0.5, 0, 0.4, -0.4, -0.2, 0.5, -0.6, -0.1]
    },
    {
      outer: [0.2, -0.5, -0.3, 0.5, -0.4, 0.3, 0.5, -0.1],
      inner: [-0.4, 0.3, 0.6, 0, 0.4, -0.5, -0.2, 0.5]
    }
  ][variant];

  drawRoughRoundedRect(wallCtx, 0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1, 9, "#6f7a6a", wallShape.outer);
  drawRoughRoundedRect(
    wallCtx,
    wallInset,
    wallInset,
    wallInnerSize,
    wallInnerSize,
    wallInnerRadius,
    "#8d9987",
    wallShape.inner
  );

  wallCtx.save();
  traceRoughRoundedRectPath(
    wallCtx,
    wallInset,
    wallInset,
    wallInnerSize,
    wallInnerSize,
    wallInnerRadius,
    wallShape.inner
  );
  wallCtx.clip();

  const stoneShade = wallCtx.createLinearGradient(wallInset, wallInset, wallInset, TILE_SIZE - wallInset);
  stoneShade.addColorStop(0, "rgba(255, 255, 255, 0.12)");
  stoneShade.addColorStop(1, "rgba(54, 66, 49, 0.14)");
  wallCtx.fillStyle = stoneShade;
  wallCtx.fillRect(wallInset, wallInset, wallInnerSize, wallInnerSize);

  const diagonalShade = wallCtx.createLinearGradient(wallInset, wallInset, TILE_SIZE - wallInset, TILE_SIZE - wallInset);
  diagonalShade.addColorStop(0, "rgba(255, 255, 255, 0.1)");
  diagonalShade.addColorStop(0.52, "rgba(255, 255, 255, 0)");
  diagonalShade.addColorStop(1, "rgba(37, 47, 36, 0.13)");
  wallCtx.fillStyle = diagonalShade;
  wallCtx.fillRect(wallInset, wallInset, wallInnerSize, wallInnerSize);

  wallCtx.fillStyle = "rgba(238, 247, 226, 0.16)";
  for (const [x, y, width, height] of wallTexture.highlights) {
    wallCtx.fillRect(x, y, width, height);
  }

  wallCtx.fillStyle = "rgba(35, 45, 34, 0.16)";
  for (const [x, y, width, height] of wallTexture.shadows) {
    wallCtx.fillRect(x, y, width, height);
  }

  wallCtx.fillStyle = "rgba(56, 67, 52, 0.2)";
  for (const [x, y, width, height] of wallTexture.chips) {
    wallCtx.fillRect(x, y, width, height);
  }

  wallCtx.fillStyle = "rgba(55, 107, 68, 0.24)";
  for (const [x, y, width, height] of wallTexture.moss) {
    wallCtx.fillRect(x, y, width, height);
  }

  wallCtx.strokeStyle = "rgba(44, 57, 42, 0.28)";
  wallCtx.lineWidth = 1;
  wallCtx.lineCap = "round";
  wallCtx.beginPath();
  for (const [startX, startY, endX, endY] of wallTexture.cracks) {
    wallCtx.moveTo(startX, startY);
    wallCtx.lineTo(endX, endY);
  }
  wallCtx.stroke();

  wallCtx.strokeStyle = "rgba(67, 78, 61, 0.35)";
  wallCtx.lineWidth = 0.4;
  wallCtx.lineCap = "butt";
  traceRoughRoundedRectPath(
    wallCtx,
    wallInset + 0.5,
    wallInset + 0.5,
    wallInnerSize - 1,
    wallInnerSize - 1,
    wallInnerRadius,
    wallShape.inner
  );
  wallCtx.stroke();
  wallCtx.restore();

  return wallCanvas;
}

function createRoadTileCanvas(variant) {
  const roadCanvas = document.createElement("canvas");
  roadCanvas.width = TILE_SIZE;
  roadCanvas.height = TILE_SIZE;

  const roadCtx = roadCanvas.getContext("2d");
  const quarterTile = TILE_SIZE / 4;
  const roadTexture = [
    {
      dirt: [[7, 10, 5, 1], [29, 18, 7, 1], [14, 37, 3, 1], [39, 5, 2, 2]],
      cracks: [[35, 31, 40, 29], [40, 29, 43, 31]]
    },
    {
      dirt: [[11, 28, 6, 1], [34, 8, 4, 1], [25, 41, 8, 1], [5, 18, 2, 2]],
      cracks: [[18, 8, 20, 13], [20, 13, 24, 14]]
    },
    {
      dirt: [[6, 35, 8, 1], [20, 13, 3, 1], [38, 30, 5, 1], [29, 24, 2, 2]],
      cracks: [[9, 21, 13, 23], [13, 23, 15, 27]]
    },
    {
      dirt: [[15, 7, 5, 1], [31, 34, 4, 1], [8, 22, 7, 1], [22, 31, 2, 2]],
      cracks: [[27, 38, 30, 35], [30, 35, 35, 36]]
    }
  ][variant];
  const verticalJoints = [
    [0, 0, 1],
    [2, 0, 1],
    [4, 0, 1],
    [1, 1, 2],
    [3, 1, 2],
    [0, 2, 3],
    [2, 2, 3],
    [4, 2, 3],
    [1, 3, 4],
    [3, 3, 4]
  ];

  roadCtx.fillStyle = "#e8c096";
  roadCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  roadCtx.fillStyle = "rgba(97, 70, 45, 0.13)";
  for (const [x, y, width, height] of roadTexture.dirt) {
    roadCtx.fillRect(x, y, width, height);
  }

  roadCtx.strokeStyle = "rgba(83, 61, 47, 0.2)";
  roadCtx.lineWidth = 1;
  roadCtx.lineCap = "round";
  roadCtx.beginPath();
  for (const [startX, startY, endX, endY] of roadTexture.cracks) {
    roadCtx.moveTo(startX, startY);
    roadCtx.lineTo(endX, endY);
  }
  roadCtx.stroke();

  roadCtx.strokeStyle = "#a8a8a3";
  roadCtx.lineWidth = 1;
  roadCtx.lineCap = "butt";
  roadCtx.beginPath();

  for (let line = 0; line <= 4; line += 1) {
    const y = line * quarterTile;
    roadCtx.moveTo(0, y);
    roadCtx.lineTo(TILE_SIZE, y);
  }

  for (const [xStep, startStep, endStep] of verticalJoints) {
    const x = xStep * quarterTile;
    roadCtx.moveTo(x, startStep * quarterTile);
    roadCtx.lineTo(x, endStep * quarterTile);
  }

  roadCtx.stroke();
  return roadCanvas;
}

function tileVariant(mapX, mapY, xWeight, yWeight, variantCount) {
  return Math.abs(mapX * xWeight + mapY * yWeight) % variantCount;
}

export function createTileRenderer({ ctx }) {
  const wallTileCanvases = [0, 1, 2, 3].map(createWallTileCanvas);
  const roadTileCanvases = [0, 1, 2, 3].map(createRoadTileCanvas);
  const grassTileCanvases = {
    meadow: [0, 1, 2, 3].map((variant) => createGrassTileCanvas(variant)),
    cave: [0, 1, 2, 3].map((variant) => createGrassTileCanvas(variant, false, "cave"))
  };
  const tallGrassTileCanvases = {
    meadow: [0, 1, 2, 3].map((variant) => createGrassTileCanvas(variant, true)),
    cave: [0, 1, 2, 3].map((variant) => createGrassTileCanvas(variant, true, "cave"))
  };

  function drawMapTile(tile, px, py, mapX = 0, mapY = 0, mapType = "meadow") {
    const grassTheme = grassTileCanvases[mapType] ? mapType : "meadow";

    if (tile === "W") {
      if (mapType === "interior") {
        ctx.fillStyle = "#fffcdc";
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        return;
      }

      const wallVariant = tileVariant(mapX, mapY, 19, 23, wallTileCanvases.length);
      ctx.drawImage(wallTileCanvases[wallVariant], px, py);
      return;
    }

    if (tile === "R") {
      const roadVariant = tileVariant(mapX, mapY, 17, 31, roadTileCanvases.length);
      ctx.drawImage(roadTileCanvases[roadVariant], px, py);
      return;
    }

    if (tile === "T") {
      const tallGrassTiles = tallGrassTileCanvases[grassTheme];
      const tallGrassVariant = tileVariant(mapX, mapY, 13, 29, tallGrassTiles.length);
      ctx.drawImage(tallGrassTiles[tallGrassVariant], px, py);
      return;
    }

    const grassTiles = grassTileCanvases[grassTheme];
    const grassVariant = tileVariant(mapX, mapY, 11, 37, grassTiles.length);
    ctx.drawImage(grassTiles[grassVariant], px, py);
  }

  return {
    drawMapTile
  };
}
