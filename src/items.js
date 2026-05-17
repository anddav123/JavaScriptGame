export const itemCatalog = {
  minorTonic: {
    name: "Minor Tonic",
    category: "tonic",
    effect: "healHp",
    amount: 20,
    description: "Restores 20 HP to the lead creature."
  },
  tonic: {
    name: "Tonic",
    category: "tonic",
    effect: "healHp",
    amount: 50,
    description: "Restores 50 HP to the lead creature."
  },
  greaterTonic: {
    name: "Greater Tonic",
    category: "tonic",
    effect: "healHp",
    amount: 100,
    description: "Restores 100 HP to the lead creature."
  },
  minorFocusTonic: {
    name: "Minor Focus Tonic",
    category: "tonic",
    effect: "restoreMp",
    amount: 10,
    description: "Restores 10 MP."
  },
  focusTonic: {
    name: "Focus Tonic",
    category: "tonic",
    effect: "restoreMp",
    amount: 25,
    description: "Restores 25 MP."
  },
  greaterFocusTonic: {
    name: "Greater Focus Tonic",
    category: "tonic",
    effect: "restoreMp",
    amount: 50,
    description: "Restores 50 MP."
  },
  basicOrb: {
    name: "Basic Capture Orb",
    category: "orb",
    effect: "capture",
    catchBonus: 0,
    description: "A standard orb for catching wild creatures."
  },
  emberOrb: {
    name: "Ember Capture Orb",
    category: "orb",
    effect: "capture",
    catchBonus: 0.15,
    description: "A warm crystal-powered orb with a better catch chance than a basic orb."
  }
};

export const resourceCatalog = {
  meadowHerb: {
    name: "Meadow Herb",
    description: "A bright green herb used for healing tonics."
  },
  glowMushroom: {
    name: "Glow Mushroom",
    description: "A soft-glowing mushroom used in stronger brews."
  },
  shardGem: {
    name: "Shard Gem",
    description: "A small crystal shard used to build capture orbs."
  },
  emberGem: {
    name: "Ember Gem",
    description: "A warm cave gem used for stronger crafting later."
  },
  caveMoss: {
    name: "Cave Moss",
    description: "Hardy moss that stores cave moisture and mineral energy."
  }
};

export function itemName(itemId) {
  return itemCatalog[itemId]?.name ?? itemId;
}

export function resourceName(resourceId) {
  return resourceCatalog[resourceId]?.name ?? resourceId;
}
