export function createStoryController({
  canvas,
  ctx,
  gameState,
  cutscenes,
  drawRoundedRect,
  drawText,
  wrapText,
  onComplete
}) {
  const imageCache = {};
  let currentOnComplete = null;

  function setImageFetchPriority(image, fetchPriority) {
    if (fetchPriority && "fetchPriority" in image) {
      image.fetchPriority = fetchPriority;
    }
  }

  function prewarmImageRecord(imageRecord) {
    imageRecord.decodeOnLoad = true;
    if (!imageRecord.image.decode) return Promise.resolve();
    if (imageRecord.decodePromise) return imageRecord.decodePromise;

    imageRecord.decodePromise = imageRecord.image.decode().catch(() => null);
    return imageRecord.decodePromise;
  }

  function imageFor(src, fallbackSrc = null, options = {}) {
    const cacheKey = fallbackSrc ? `${src}|${fallbackSrc}` : src;
    if (imageCache[cacheKey]) {
      setImageFetchPriority(imageCache[cacheKey].image, options.fetchPriority);
      return imageCache[cacheKey];
    }

    const image = new Image();
    image.decoding = "async";
    setImageFetchPriority(image, options.fetchPriority);

    const imageRecord = {
      image,
      ready: false,
      activeSrc: src,
      decodeOnLoad: false,
      decodePromise: null
    };

    image.addEventListener("load", () => {
      imageRecord.ready = true;
      if (imageRecord.decodeOnLoad) {
        prewarmImageRecord(imageRecord);
      }
    });
    image.addEventListener("error", () => {
      if (fallbackSrc && imageRecord.activeSrc !== fallbackSrc) {
        imageRecord.activeSrc = fallbackSrc;
        imageRecord.decodePromise = null;
        image.src = fallbackSrc;
        if (imageRecord.decodeOnLoad) {
          prewarmImageRecord(imageRecord);
        }
        return;
      }

      imageRecord.ready = false;
    });

    image.src = src;
    imageCache[cacheKey] = imageRecord;
    return imageRecord;
  }

  function imageStepsForCutscene(id = null) {
    const scenes = id ? [cutscenes[id] || []] : Object.values(cutscenes);
    return scenes.flatMap((steps) => steps.filter((step) => step.type === "image"));
  }

  function preloadCutsceneImages(id = null) {
    const preloadPromises = imageStepsForCutscene(id).map((step) => {
      const imageRecord = imageFor(step.src, step.fallbackSrc, { fetchPriority: "low" });
      return prewarmImageRecord(imageRecord);
    });

    return Promise.allSettled(preloadPromises);
  }

  function schedulePreloadCutsceneImages(id = null) {
    const preload = () => preloadCutsceneImages(id);
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(preload, { timeout: 1500 });
      return;
    }

    setTimeout(preload, 250);
  }

  function activeCutsceneSteps() {
    return cutscenes[gameState.cutscene?.id] || [];
  }

  function processCurrentStep() {
    const steps = activeCutsceneSteps();

    while (gameState.cutscene.index < steps.length) {
      const step = steps[gameState.cutscene.index];

      if (step.type === "image") {
        gameState.cutscene.imageSrc = step.src;
        gameState.cutscene.fallbackImageSrc = step.fallbackSrc || null;
        imageFor(step.src, step.fallbackSrc, { fetchPriority: "high" });
        gameState.cutscene.index += 1;
        continue;
      }

      if (step.type === "dialogue") {
        gameState.cutscene.speaker = step.speaker;
        gameState.cutscene.text = step.text;
        return;
      }

      if (step.type === "end") {
        finishCutscene();
        return;
      }

      gameState.cutscene.index += 1;
    }

    finishCutscene();
  }

  function startCutscene(id, options = {}) {
    currentOnComplete = typeof options.onComplete === "function" ? options.onComplete : null;
    gameState.scene = "cutscene";
    gameState.cutscene = {
      id,
      index: 0,
      imageSrc: null,
      fallbackImageSrc: null,
      speaker: "",
      text: ""
    };
    processCurrentStep();
  }

  function advanceCutscene() {
    if (gameState.scene !== "cutscene" || !gameState.cutscene) return;
    gameState.cutscene.index += 1;
    processCurrentStep();
  }

  function finishCutscene() {
    const completeCutscene = currentOnComplete || onComplete;
    currentOnComplete = null;
    gameState.cutscene = null;
    if (typeof completeCutscene === "function") {
      completeCutscene();
    }
  }

  function drawCoverImage(image) {
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;
    ctx.drawImage(image, x, y, width, height);
  }

  function drawFallbackBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#f6d365");
    sky.addColorStop(0.48, "#f7b267");
    sky.addColorStop(1, "#5ea96f");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawCutscene() {
    const cutscene = gameState.cutscene;
    if (!cutscene) return;

    const imageRecord = cutscene.imageSrc
      ? imageFor(cutscene.imageSrc, cutscene.fallbackImageSrc, { fetchPriority: "high" })
      : null;
    if (imageRecord?.ready && imageRecord.image.complete && imageRecord.image.naturalWidth > 0) {
      drawCoverImage(imageRecord.image);
    } else {
      drawFallbackBackground();
    }

    ctx.fillStyle = "rgba(29, 18, 14, 0.28)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawRoundedRect(46, canvas.height - 166, canvas.width - 92, 124, 22, "rgba(255, 248, 238, 0.94)", "#3d271d");
    drawText(cutscene.speaker, 78, canvas.height - 120, {
      font: "14px 'Press Start 2P'",
      color: "#b93c2f"
    });

    ctx.font = "21px Outfit";
    ctx.fillStyle = "#4a2c21";
    wrapText(cutscene.text, 78, canvas.height - 82, canvas.width - 156, 29);
    drawText("Enter", canvas.width - 96, canvas.height - 62, {
      font: "12px 'Press Start 2P'",
      color: "#7f5539",
      align: "right"
    });
  }

  return {
    advanceCutscene,
    drawCutscene,
    preloadCutsceneImages,
    schedulePreloadCutsceneImages,
    startCutscene
  };
}
