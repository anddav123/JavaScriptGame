export function trainerBattleId(npcOrBattle) {
  const battle = npcOrBattle?.battle || npcOrBattle;
  const rawId = battle?.id || npcOrBattle?.name || "trainer";
  return String(rawId)
    .trim()
    .replace(/Defeated$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "trainer";
}

export function trainerBattleMapId(gameState, npcOrBattle) {
  return npcOrBattle?.battle?.mapId
    || npcOrBattle?.mapId
    || gameState.world.currentMapId;
}

export function trainerBattleRecord(gameState, mapId, opponentId) {
  const battles = gameState.player.battles || {};
  return battles?.[mapId]?.[opponentId] || null;
}

export function hasDefeatedTrainer(gameState, npc) {
  const mapId = trainerBattleMapId(gameState, npc);
  const opponentId = trainerBattleId(npc);
  const record = trainerBattleRecord(gameState, mapId, opponentId);
  return record?.defeated === true;
}

export function recordTrainerBattleResult(gameState, npcOrTrainer, result) {
  const mapId = trainerBattleMapId(gameState, npcOrTrainer);
  const opponentId = trainerBattleId(npcOrTrainer);
  const previous = trainerBattleRecord(gameState, mapId, opponentId) || {};
  const won = result === "win";
  const lost = result === "loss";

  gameState.player.battles = {
    ...(gameState.player.battles || {}),
    [mapId]: {
      ...(gameState.player.battles?.[mapId] || {}),
      [opponentId]: {
        wins: Math.max(0, Math.round(previous.wins || 0)) + (won ? 1 : 0),
        losses: Math.max(0, Math.round(previous.losses || 0)) + (lost ? 1 : 0),
        defeated: previous.defeated === true || won,
        lastResult: result
      }
    }
  };
}

export function normalizeTrainerBattleHistory(battles) {
  const normalized = {};

  if (battles && typeof battles === "object" && !Array.isArray(battles)) {
    for (const [mapId, mapBattles] of Object.entries(battles)) {
      if (typeof mapId !== "string" || !mapBattles || typeof mapBattles !== "object" || Array.isArray(mapBattles)) continue;

      for (const [opponentId, record] of Object.entries(mapBattles)) {
        if (typeof opponentId !== "string") continue;

        if (!record || typeof record !== "object" || Array.isArray(record)) continue;

        const wins = Number.isFinite(record.wins) ? Math.max(0, Math.round(record.wins)) : 0;
        const losses = Number.isFinite(record.losses) ? Math.max(0, Math.round(record.losses)) : 0;
        const defeated = record.defeated === true || wins > 0;
        const lastResult = ["win", "loss"].includes(record.lastResult) ? record.lastResult : null;
        normalized[mapId] ??= {};
        normalized[mapId][opponentId] = { wins, losses, defeated, lastResult };
      }
    }
  }

  return normalized;
}
