export function createCanvasUi({ canvas, ctx }) {
  function traceRoundedRectPath(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function drawRoundedRect(x, y, width, height, radius, fill, stroke = null) {
    traceRoundedRectPath(x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  function drawText(text, x, y, options = {}) {
    ctx.fillStyle = options.color || "#2d1b14";
    ctx.font = options.font || "16px Outfit";
    ctx.textAlign = options.align || "left";
    ctx.fillText(text, x, y);
  }

  function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = `${line}${word} `;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line.trim(), x, y);
        line = `${word} `;
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line) {
      ctx.fillText(line.trim(), x, y);
    }
  }

  function drawHpBar(x, y, width, value, max, color) {
    drawRoundedRect(x, y, width, 16, 8, "#f2ddd0");
    drawRoundedRect(x + 2, y + 2, (width - 4) * (value / max), 12, 6, color);
  }

  function drawCoverImage(image) {
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;
    ctx.drawImage(image, x, y, width, height);
  }

  return {
    drawCoverImage,
    drawHpBar,
    drawRoundedRect,
    drawText,
    traceRoundedRectPath,
    wrapText
  };
}
