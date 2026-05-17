import { INITIAL_PLAYER_ORBS, INITIAL_PLAYER_POTIONS } from "./constants.js";
import { itemCatalog, resourceCatalog } from "./items.js";
import { defaultLearnedRecipes, recipeCatalog } from "./recipes.js";

export function createInitialLearnedRecipes() {
  return Object.fromEntries(defaultLearnedRecipes.map((recipeId) => [recipeId, true]));
}

export function normalizeLearnedRecipes(learnedRecipes = {}) {
  const knownRecipes = Object.keys(recipeCatalog);
  const normalized = createInitialLearnedRecipes();
  if (!learnedRecipes || typeof learnedRecipes !== "object") return normalized;

  for (const recipeId of knownRecipes) {
    if (learnedRecipes[recipeId] === true) {
      normalized[recipeId] = true;
    }
  }

  return normalized;
}

export function hasLearnedRecipe(gameState, recipeId) {
  gameState.player.learnedRecipes = normalizeLearnedRecipes(gameState.player.learnedRecipes);
  return gameState.player.learnedRecipes[recipeId] === true;
}

export function learnRecipe(gameState, recipeId) {
  if (!recipeCatalog[recipeId]) return false;
  gameState.player.learnedRecipes = normalizeLearnedRecipes(gameState.player.learnedRecipes);
  gameState.player.learnedRecipes[recipeId] = true;
  return true;
}

export function createInitialInventory({ potions = INITIAL_PLAYER_POTIONS, orbs = INITIAL_PLAYER_ORBS } = {}) {
  return normalizeInventory({
    items: {
      minorTonic: potions,
      basicOrb: orbs
    },
    resources: {
      meadowHerb: 0,
      glowMushroom: 0,
      shardGem: 0,
      emberGem: 0,
      caveMoss: 0
    }
  });
}

function cleanQuantity(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(999, Math.round(value))) : 0;
}

function cleanKnownQuantities(source = {}, catalog = {}) {
  return Object.fromEntries(
    Object.keys(catalog).map((id) => [id, cleanQuantity(source[id])])
  );
}

export function normalizeInventory(inventory = {}, legacy = {}) {
  inventory = inventory && typeof inventory === "object" ? inventory : {};
  const items = cleanKnownQuantities(inventory.items, itemCatalog);
  const resources = cleanKnownQuantities(inventory.resources, resourceCatalog);

  if (!inventory.items && legacy) {
    items.minorTonic = cleanQuantity(legacy.potions ?? INITIAL_PLAYER_POTIONS);
    items.basicOrb = cleanQuantity(legacy.orbs ?? INITIAL_PLAYER_ORBS);
  }

  return { items, resources };
}

export function itemCount(gameState, itemId) {
  gameState.player.inventory = normalizeInventory(gameState.player.inventory, gameState.player);
  return gameState.player.inventory.items[itemId] ?? 0;
}

export function resourceCount(gameState, resourceId) {
  gameState.player.inventory = normalizeInventory(gameState.player.inventory, gameState.player);
  return gameState.player.inventory.resources[resourceId] ?? 0;
}

export function addItem(gameState, itemId, quantity = 1) {
  gameState.player.inventory = normalizeInventory(gameState.player.inventory, gameState.player);
  const amount = cleanQuantity(quantity);
  gameState.player.inventory.items[itemId] = cleanQuantity((gameState.player.inventory.items[itemId] ?? 0) + amount);
  syncLegacyCounters(gameState);
}

export function removeItem(gameState, itemId, quantity = 1) {
  gameState.player.inventory = normalizeInventory(gameState.player.inventory, gameState.player);
  const amount = cleanQuantity(quantity);
  if ((gameState.player.inventory.items[itemId] ?? 0) < amount) return false;
  gameState.player.inventory.items[itemId] -= amount;
  syncLegacyCounters(gameState);
  return true;
}

export function addResource(gameState, resourceId, quantity = 1) {
  gameState.player.inventory = normalizeInventory(gameState.player.inventory, gameState.player);
  const amount = cleanQuantity(quantity);
  gameState.player.inventory.resources[resourceId] = cleanQuantity((gameState.player.inventory.resources[resourceId] ?? 0) + amount);
}

export function canCraft(gameState, recipeId) {
  const recipe = recipeCatalog[recipeId];
  if (!recipe) return false;
  if (!hasLearnedRecipe(gameState, recipeId)) return false;
  gameState.player.inventory = normalizeInventory(gameState.player.inventory, gameState.player);
  return Object.entries(recipe.costs).every(([resourceId, quantity]) => resourceCount(gameState, resourceId) >= quantity);
}

export function craftRecipe(gameState, recipeId) {
  const recipe = recipeCatalog[recipeId];
  if (!recipe || !canCraft(gameState, recipeId)) return false;

  for (const [resourceId, quantity] of Object.entries(recipe.costs)) {
    gameState.player.inventory.resources[resourceId] -= quantity;
  }

  addItem(gameState, recipe.creates.itemId, recipe.creates.quantity);
  return true;
}

export function totalItemsByEffect(gameState, effect) {
  gameState.player.inventory = normalizeInventory(gameState.player.inventory, gameState.player);
  return Object.entries(itemCatalog)
    .filter(([, item]) => item.effect === effect)
    .reduce((total, [itemId]) => total + itemCount(gameState, itemId), 0);
}

export function firstAvailableItemByEffect(gameState, effect) {
  gameState.player.inventory = normalizeInventory(gameState.player.inventory, gameState.player);
  return Object.entries(itemCatalog)
    .find(([itemId, item]) => item.effect === effect && itemCount(gameState, itemId) > 0)?.[0] ?? null;
}

export function syncLegacyCounters(gameState) {
  gameState.player.inventory = normalizeInventory(gameState.player.inventory, gameState.player);
  gameState.player.potions = itemCount(gameState, "minorTonic");
  gameState.player.orbs = itemCount(gameState, "basicOrb");
}
