export const defaultLearnedRecipes = Object.freeze([
  "minorTonic",
  "tonic",
  "minorFocusTonic",
  "focusTonic",
  "basicOrb"
]);

export const recipeCatalog = {
  minorTonic: {
    name: "Brew Minor Tonic",
    creates: { itemId: "minorTonic", quantity: 1 },
    costs: { meadowHerb: 2 },
    station: "shop"
  },
  tonic: {
    name: "Brew Tonic",
    creates: { itemId: "tonic", quantity: 1 },
    costs: { meadowHerb: 3, glowMushroom: 1 },
    station: "shop"
  },
  greaterTonic: {
    name: "Brew Greater Tonic",
    creates: { itemId: "greaterTonic", quantity: 1 },
    costs: { meadowHerb: 3, caveMoss: 1 },
    station: "shop",
    unlock: {
      recipeId: "greaterTonic",
      hint: "Learn this recipe from an advanced field note."
    }
  },
  minorFocusTonic: {
    name: "Brew Minor Focus Tonic",
    creates: { itemId: "minorFocusTonic", quantity: 1 },
    costs: { glowMushroom: 2 },
    station: "shop"
  },
  focusTonic: {
    name: "Brew Focus Tonic",
    creates: { itemId: "focusTonic", quantity: 1 },
    costs: { glowMushroom: 3, shardGem: 1 },
    station: "shop"
  },
  greaterFocusTonic: {
    name: "Brew Greater Focus Tonic",
    creates: { itemId: "greaterFocusTonic", quantity: 1 },
    costs: { glowMushroom: 2, caveMoss: 2, shardGem: 1 },
    station: "shop",
    unlock: {
      recipeId: "greaterFocusTonic",
      hint: "Learn this recipe from an advanced field note."
    }
  },
  basicOrb: {
    name: "Build Basic Capture Orb",
    creates: { itemId: "basicOrb", quantity: 1 },
    costs: { shardGem: 3 },
    station: "shop"
  },
  emberOrb: {
    name: "Build Ember Capture Orb",
    creates: { itemId: "emberOrb", quantity: 1 },
    costs: { shardGem: 2, emberGem: 1, caveMoss: 1 },
    station: "shop",
    unlock: {
      recipeId: "emberOrb",
      hint: "Learn this recipe from a later ranger or shopkeeper."
    }
  }
};
