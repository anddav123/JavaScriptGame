const ASCENSION_SCENE_DURATION = 3800;

export function createAscensionCutsceneController({
  canvas,
  ctx,
  gameState,
  clearKeys,
  setMessage,
  clamp,
  drawRoundedRect,
  drawText,
  wrapText,
  drawCreatureSprite,
  preloadCreatureSprite
}) {
  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value ** 3
      : 1 - (-2 * value + 2) ** 3 / 2;
  }

  function smoothStep(start, end, value) {
    const progress = clamp((value - start) / (end - start), 0, 1);
    return progress * progress * (3 - 2 * progress);
  }

  function cloneAscensionCreature(creature = {}) {
    return {
      ...creature,
      moves: Array.isArray(creature.moves) ? [...creature.moves] : []
    };
  }

  function startAscensionSequence(ascensions, outcomeMessage) {
    const events = Array.isArray(ascensions)
      ? ascensions.map((ascension) => ({
        ...ascension,
        before: cloneAscensionCreature(ascension.before),
        after: cloneAscensionCreature(ascension.after)
      }))
      : [];

    if (events.length === 0) {
      gameState.scene = "world";
      if (outcomeMessage) {
        setMessage(outcomeMessage);
      }
      return;
    }

    events.forEach((event) => {
      preloadCreatureSprite(event.before.species);
      preloadCreatureSprite(event.after.species);
    });

    clearKeys();
    gameState.pointerHotspot = null;
    gameState.ascensionSequence = {
      events,
      index: 0,
      startedAt: performance.now(),
      duration: ASCENSION_SCENE_DURATION,
      outcomeMessage
    };
    gameState.scene = "ascension";
  }

  function finishAscensionSequence() {
    const outcomeMessage = gameState.ascensionSequence?.outcomeMessage;
    gameState.ascensionSequence = null;
    gameState.scene = "world";
    if (outcomeMessage) {
      setMessage(outcomeMessage);
    }
  }

  function advanceAscensionScene() {
    const sequence = gameState.ascensionSequence;
    if (gameState.scene !== "ascension" || !sequence) return;

    const elapsed = performance.now() - sequence.startedAt;
    if (elapsed < sequence.duration) {
      sequence.startedAt = performance.now() - sequence.duration;
      return;
    }

    sequence.index += 1;
    if (sequence.index >= sequence.events.length) {
      finishAscensionSequence();
      return;
    }

    sequence.startedAt = performance.now();
  }

  function drawCenteredCreatureSprite(creature, centerX, centerY, width, height, scale, alpha, options = {}) {
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    drawCreatureSprite(creature, -width / 2, -height / 2, width, height, {
      ...options,
      border: false
    });
    ctx.restore();
  }

  function drawAscensionScene() {
    const sequence = gameState.ascensionSequence;
    const event = sequence?.events[sequence.index];
    if (!sequence || !event) {
      finishAscensionSequence();
      return;
    }

    const elapsed = performance.now() - sequence.startedAt;
    const progress = clamp(elapsed / sequence.duration, 0, 1);
    const revealProgress = smoothStep(0.38, 0.84, progress);
    const flashProgress = Math.sin(progress * Math.PI);
    const settleProgress = smoothStep(0.78, 1, progress);
    const oldAlpha = 1 - smoothStep(0.42, 0.72, progress);
    const newAlpha = smoothStep(0.52, 0.9, progress);
    const pulse = Math.sin(progress * Math.PI * 12) * (1 - revealProgress) * 0.035;
    const centerX = canvas.width / 2;
    const centerY = 262;

    const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
    background.addColorStop(0, "#20110d");
    background.addColorStop(0.46, "#5c3a2e");
    background.addColorStop(1, "#f6b26b");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.globalAlpha = 0.18 + flashProgress * 0.18;
    ctx.fillStyle = event.after.color;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 92, 198 + revealProgress * 32, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (let index = 0; index < 12; index += 1) {
      const angle = (Math.PI * 2 * index) / 12 + progress * Math.PI * 0.9;
      const innerRadius = 82 + revealProgress * 28;
      const outerRadius = 154 + flashProgress * 44;
      const startX = centerX + Math.cos(angle) * innerRadius;
      const startY = centerY + Math.sin(angle) * innerRadius * 0.66;
      const endX = centerX + Math.cos(angle) * outerRadius;
      const endY = centerY + Math.sin(angle) * outerRadius * 0.66;

      ctx.save();
      ctx.globalAlpha = 0.18 + flashProgress * 0.34;
      ctx.strokeStyle = index % 2 === 0 ? "#fff8d8" : event.after.color;
      ctx.lineWidth = index % 2 === 0 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.18 + flashProgress * 0.46;
    ctx.strokeStyle = "#fff8d8";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 122 + revealProgress * 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    drawCenteredCreatureSprite(
      event.before,
      centerX,
      centerY,
      198,
      218,
      1 + smoothStep(0.08, 0.38, progress) * 0.12 - revealProgress * 0.16 + pulse,
      oldAlpha,
      { frameColor: event.before.color, padding: 12, radius: 38 }
    );

    ctx.save();
    ctx.globalAlpha = smoothStep(0.2, 0.68, progress) * (1 - settleProgress) * 0.72;
    ctx.fillStyle = "#fff8d8";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 100 + revealProgress * 62, 124 + revealProgress * 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawCenteredCreatureSprite(
      event.after,
      centerX,
      centerY,
      212,
      232,
      0.74 + easeInOutCubic(newAlpha) * 0.36 - settleProgress * 0.06,
      newAlpha,
      { frameColor: event.after.color, padding: 12, radius: 40 }
    );

    drawText("Ascension", centerX, 68, {
      align: "center",
      font: "18px 'Press Start 2P'",
      color: "#fff8f0"
    });
    drawText(`${event.fromSpecies} to ${event.toSpecies}`, centerX, 104, {
      align: "center",
      font: "22px Outfit",
      color: "#ffe6b3"
    });

    drawRoundedRect(68, canvas.height - 142, canvas.width - 136, 104, 22, "rgba(255, 248, 238, 0.94)", "#3d271d");
    ctx.font = "22px Outfit";
    ctx.fillStyle = "#4a2c21";
    wrapText(event.message, 500, canvas.height - 96, canvas.width - 200, 30);

    if (progress >= 1) {
      drawText("Enter", canvas.width - 98, canvas.height - 62, {
        font: "12px 'Press Start 2P'",
        color: "#7f5539",
        align: "right"
      });
    }
  }

  return {
    advanceAscensionScene,
    drawAscensionScene,
    startAscensionSequence
  };
}
