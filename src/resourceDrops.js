import { creatureTypes } from "./types.js";

export const resourceDropsByCreatureType = Object.freeze({
  [creatureTypes.NATURE]: [
    { id: "meadowHerb", weight: 5 },
    { id: "glowMushroom", weight: 2 }
  ],
  [creatureTypes.FIRE]: [
    { id: "emberGem", weight: 5 },
    { id: "shardGem", weight: 2 },
    { id: "caveMoss", weight: 1 }
  ],
  [creatureTypes.WATER]: [
    { id: "meadowHerb", weight: 2 },
    { id: "shardGem", weight: 1 }
  ],
  [creatureTypes.FLYING]: [
    { id: "shardGem", weight: 2 },
    { id: "meadowHerb", weight: 1 }
  ],
  [creatureTypes.STONE]: [
    { id: "shardGem", weight: 3 },
    { id: "meadowHerb", weight: 1 }
  ],
  [creatureTypes.LIGHTNING]: [
    { id: "meadowHerb", weight: 4 },
    { id: "glowMushroom", weight: 1 }
  ],
  [creatureTypes.MAGIC]: [
    { id: "shardGem", weight: 3 },
    { id: "glowMushroom", weight: 2 }
  ],
  [creatureTypes.ICE]: [
    { id: "shardGem", weight: 3 },
    { id: "caveMoss", weight: 1 },
    { id: "meadowHerb", weight: 1 }
  ],
  [creatureTypes.POISON]: [
    { id: "glowMushroom", weight: 4 },
    { id: "caveMoss", weight: 2 },
    { id: "meadowHerb", weight: 1 }
  ],
  [creatureTypes.SHADOW]: [
    { id: "glowMushroom", weight: 3 },
    { id: "shardGem", weight: 2 },
    { id: "caveMoss", weight: 1 }
  ],
  [creatureTypes.LIGHT]: [
    { id: "shardGem", weight: 3 },
    { id: "meadowHerb", weight: 2 },
    { id: "glowMushroom", weight: 1 }
  ],
  [creatureTypes.DRAGON]: [
    { id: "emberGem", weight: 3 },
    { id: "shardGem", weight: 3 },
    { id: "caveMoss", weight: 1 }
  ]
});

export function resourceDropsForCreatureType(type) {
  return resourceDropsByCreatureType[type] || [];
}
