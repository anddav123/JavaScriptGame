import {
  CREATURE_MAX_LEVEL,
  CREATURE_XP_PER_LEVEL
} from "./constants.js";
import { canCraft, craftRecipe, hasLearnedRecipe, itemCount, removeItem, resourceCount } from "./inventory.js";
import { itemCatalog, itemName, resourceCatalog, resourceName } from "./items.js";
import { moveCatalog } from "./moves.js";
import { recipeCatalog } from "./recipes.js";

function isConfirmKey(key) {
  return key === "Enter" || key === " " || key === "Spacebar";
}

export function createMenuController({
  canvas,
  ctx,
  gameState,
  saveController,
  tileAt,
  currentMap,
  getActiveCreature,
  setMessage,
  drawCreatureSprite,
  drawRoundedRect,
  drawText,
  wrapText
}) {
  function menuOptions() {
    return ["Party", "Bag", "Make Camp", "Save Game", "Export Save", "Import Save", "Close"];
  }

  function shopRecipes() {
    return Object.entries(recipeCatalog)
      .filter(([, recipe]) => recipe.station === "shop");
  }

  function visibleShopRecipes() {
    return shopRecipes().filter(([recipeId, recipe]) => !recipe.unlock || hasLearnedRecipe(gameState, recipeId));
  }

  function bagTabs() {
    return ["Items", "Orbs", "Resources"];
  }

  function currentBagTab() {
    return bagTabs()[gameState.menu.bagTabIndex ?? 0] ?? "Items";
  }

  function bagEntries() {
    const tab = currentBagTab();
    if (tab === "Items") {
      return Object.entries(itemCatalog)
        .filter(([, item]) => item.category === "tonic")
        .map(([id, item]) => ({ id, entry: item, quantity: itemCount(gameState, id), kind: "item" }))
        .filter(({ quantity }) => quantity > 0);
    }

    if (tab === "Orbs") {
      return Object.entries(itemCatalog)
        .filter(([, item]) => item.category === "orb")
        .map(([id, item]) => ({ id, entry: item, quantity: itemCount(gameState, id), kind: "item" }))
        .filter(({ quantity }) => quantity > 0);
    }

    return Object.entries(resourceCatalog)
      .map(([id, resource]) => ({ id, entry: resource, quantity: resourceCount(gameState, id), kind: "resource" }))
      .filter(({ quantity }) => quantity > 0);
  }

  function selectedBagEntry() {
    const entries = bagEntries();
    if (entries.length === 0) return null;
    gameState.menu.bagItemIndex = Math.min(gameState.menu.bagItemIndex ?? 0, entries.length - 1);
    return entries[gameState.menu.bagItemIndex];
  }

  function openMenu() {
    if (gameState.scene !== "world") return;
    gameState.scene = "menu";
    gameState.menu.mode = "main";
    gameState.menu.mainIndex = 0;
    gameState.menu.partyIndex = gameState.player.activeIndex;
  }

  function closeMenu() {
    gameState.scene = "world";
    gameState.menu.mode = "main";
  }

  function openShopCraftMenu() {
    if (currentMap().crafting?.station !== "shop") {
      setMessage("Crafting needs a shopkeeper's tools.");
      return;
    }
    gameState.scene = "menu";
    gameState.menu.mode = "craft";
    gameState.menu.recipeIndex = 0;
    setMessage("The shopkeeper helps with careful crafting.");
  }

  function makeCamp() {
    if (tileAt(gameState.player.x, gameState.player.y) !== "G") {
      setMessage("Not a good spot to make camp.");
      closeMenu();
      return;
    }

    gameState.world.camp = {
      mapId: gameState.world.currentMapId,
      x: gameState.player.x,
      y: gameState.player.y
    };
    setMessage("Camp set. Rest here, switch stored creatures, or return here after fainting.");
    closeMenu();
  }

  function useSelectedBagItem() {
    const selected = selectedBagEntry();
    if (!selected || selected.kind !== "item") {
      setMessage("That cannot be used from the bag.");
      return;
    }

    const item = selected.entry;
    if (selected.quantity <= 0) {
      setMessage(`No ${item.name} left.`);
      return;
    }

    const activeCreature = getActiveCreature();
    if (item.effect === "healHp") {
      if (activeCreature.hp >= activeCreature.maxHp) {
        setMessage(`${activeCreature.nickname} is already at full HP.`);
        return;
      }
      removeItem(gameState, selected.id, 1);
      activeCreature.hp = Math.min(activeCreature.maxHp, activeCreature.hp + item.amount);
      setMessage(`${activeCreature.nickname} used ${item.name} and recovered ${item.amount} HP.`);
      return;
    }

    if (item.effect === "restoreMp") {
      if (gameState.player.mp >= gameState.player.maxMp) {
        setMessage("MP is already full.");
        return;
      }
      removeItem(gameState, selected.id, 1);
      gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + item.amount);
      setMessage(`Used ${item.name} and recovered ${item.amount} MP.`);
      return;
    }

    setMessage(`${item.name} cannot be used from the bag yet.`);
  }

  async function handleMenuNavigation(key) {
    if (gameState.scene !== "menu") return;

    if (gameState.menu.mode === "main") {
      const options = menuOptions();
      if (key === "ArrowUp" || key === "w") {
        gameState.menu.mainIndex = (gameState.menu.mainIndex - 1 + options.length) % options.length;
      } else if (key === "ArrowDown" || key === "s") {
        gameState.menu.mainIndex = (gameState.menu.mainIndex + 1) % options.length;
      } else if (isConfirmKey(key)) {
        const selected = options[gameState.menu.mainIndex];
        if (selected === "Party") {
          gameState.menu.mode = "party";
          gameState.menu.partyIndex = gameState.player.activeIndex;
          setMessage("Browsing your captured creatures.");
        } else if (selected === "Bag") {
          gameState.menu.mode = "bag";
          gameState.menu.bagTabIndex = 0;
          gameState.menu.bagItemIndex = 0;
          setMessage("Checking your bag.");
        } else if (selected === "Make Camp") {
          makeCamp();
        } else if (selected === "Save Game") {
          await saveController.saveGame();
        } else if (selected === "Export Save") {
          await saveController.exportSaveJson();
        } else if (selected === "Import Save") {
          await saveController.promptToImportSaveJson();
        } else {
          closeMenu();
        }
      } else if (key === "Backspace") {
        closeMenu();
      }
      return;
    }

    if (gameState.menu.mode === "bag") {
      const tabs = bagTabs();
      const entries = bagEntries();
      if (key === "ArrowLeft" || key === "a") {
        gameState.menu.bagTabIndex = (gameState.menu.bagTabIndex - 1 + tabs.length) % tabs.length;
        gameState.menu.bagItemIndex = 0;
      } else if (key === "ArrowRight" || key === "d") {
        gameState.menu.bagTabIndex = (gameState.menu.bagTabIndex + 1) % tabs.length;
        gameState.menu.bagItemIndex = 0;
      } else if (key === "ArrowUp" || key === "w") {
        if (entries.length > 0) gameState.menu.bagItemIndex = (gameState.menu.bagItemIndex - 1 + entries.length) % entries.length;
      } else if (key === "ArrowDown" || key === "s") {
        if (entries.length > 0) gameState.menu.bagItemIndex = (gameState.menu.bagItemIndex + 1) % entries.length;
      } else if (isConfirmKey(key)) {
        useSelectedBagItem();
      } else if (key === "Backspace") {
        gameState.menu.mode = "main";
      }
      return;
    }

    if (gameState.menu.mode === "craft") {
      const recipes = visibleShopRecipes();
      if (recipes.length === 0) {
        closeMenu();
        return;
      }
      if (key === "ArrowUp" || key === "w") {
        gameState.menu.recipeIndex = (gameState.menu.recipeIndex - 1 + recipes.length) % recipes.length;
      } else if (key === "ArrowDown" || key === "s") {
        gameState.menu.recipeIndex = (gameState.menu.recipeIndex + 1) % recipes.length;
      } else if (isConfirmKey(key)) {
        const [recipeId, recipe] = recipes[gameState.menu.recipeIndex];
        if (craftRecipe(gameState, recipeId)) {
          gameState.menu.craftFeedback = `Crafted ${recipe.creates.quantity} ${itemName(recipe.creates.itemId)}.`;
          gameState.menu.craftFeedbackShownAt = performance.now();
          setMessage(gameState.menu.craftFeedback);
        } else {
          gameState.menu.craftFeedback = "Not enough resources for that recipe.";
          gameState.menu.craftFeedbackShownAt = performance.now();
          setMessage(gameState.menu.craftFeedback);
        }
      } else if (key === "Backspace") {
        closeMenu();
      }
      return;
    }

    if (gameState.menu.mode === "party") {
      const partySize = gameState.player.party.length;
      if (key === "ArrowUp" || key === "w") {
        gameState.menu.partyIndex = (gameState.menu.partyIndex - 1 + partySize) % partySize;
      } else if (key === "ArrowDown" || key === "s") {
        gameState.menu.partyIndex = (gameState.menu.partyIndex + 1) % partySize;
      } else if (isConfirmKey(key)) {
        gameState.player.activeIndex = gameState.menu.partyIndex;
        const activeCreature = getActiveCreature();
        setMessage(`${activeCreature.nickname} is now leading your party.`);
      } else if (key === "Backspace") {
        gameState.menu.mode = "main";
      }
    }
  }

  function drawMainMenuOverlay() {
    const options = menuOptions();
    const optionGap = 46;
    const menuHeight = 94 + options.length * optionGap;
    drawRoundedRect(canvas.width - 250, 28, 210, menuHeight, 18, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Menu", canvas.width - 220, 58, { font: "14px 'Press Start 2P'", color: "#b93c2f" });
    options.forEach((option, index) => {
      const selected = index === gameState.menu.mainIndex;
      const optionY = 78 + index * optionGap;
      drawRoundedRect(
        canvas.width - 226,
        optionY,
        162,
        36,
        12,
        selected ? "#c8553d" : "#fff4e6",
        "#3d271d"
      );
      drawText(option, canvas.width - 198, optionY + 24, {
        font: "10px 'Press Start 2P'",
        color: selected ? "#fff8f0" : "#2d1b14"
      });
    });
    drawText("Enter/Space: choose", canvas.width - 220, menuHeight + 2, { font: "14px Outfit", color: "#694435" });
  }

  function drawBagMenuOverlay() {
    drawRoundedRect(42, 40, 876, 492, 22, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Item Bag", 76, 74, { font: "16px 'Press Start 2P'", color: "#b93c2f" });
    drawText("←/→ tabs   Enter/Space: use   Backspace: back", 488, 74, { font: "16px Outfit", color: "#694435" });

    const tabs = bagTabs();
    tabs.forEach((tab, index) => {
      const selected = index === (gameState.menu.bagTabIndex ?? 0);
      const x = 76 + index * 152;
      drawRoundedRect(x, 102, 132, 34, 12, selected ? "#c8553d" : "#fff4e6", "#3d271d");
      drawText(tab, x + 66, 124, {
        align: "center",
        font: "10px 'Press Start 2P'",
        color: selected ? "#fff8f0" : "#2d1b14"
      });
    });

    const entries = bagEntries();
    if (entries.length === 0) {
      drawText("Nothing in this section yet.", 84, 184, { font: "20px Outfit", color: "#694435" });
      return;
    }

    gameState.menu.bagItemIndex = Math.min(gameState.menu.bagItemIndex ?? 0, entries.length - 1);
    entries.forEach(({ entry, quantity }, index) => {
      const selected = index === gameState.menu.bagItemIndex;
      const y = 158 + index * 38;
      drawRoundedRect(76, y, 384, 30, 10, selected ? "#f3a65a" : "#fff5ea", "#3d271d");
      drawText(`${entry.name} x${quantity}`, 96, y + 21, {
        font: "16px Outfit",
        color: selected ? "#fff8f0" : "#2d1b14"
      });
    });

    const selected = selectedBagEntry();
    if (!selected) return;

    drawRoundedRect(500, 150, 374, 312, 16, "#fff7ef", "#3d271d");
    drawText(selected.entry.name, 526, 190, { font: "14px 'Press Start 2P'", color: "#b93c2f" });
    drawText(`Quantity: ${selected.quantity}`, 526, 226, { font: "19px Outfit", color: "#2d1b14" });

    const effectText = selected.kind === "resource"
      ? "Resource used in crafting."
      : selected.entry.effect === "healHp"
        ? `Usable: restores ${selected.entry.amount} HP to your lead creature.`
        : selected.entry.effect === "restoreMp"
          ? `Usable: restores ${selected.entry.amount} MP.`
          : "Stored item. Not directly usable yet.";
    drawText(effectText, 526, 260, { font: "18px Outfit", color: "#2a7f62" });

    ctx.font = "18px Outfit";
    ctx.fillStyle = "#694435";
    wrapText(selected.entry.description ?? "No description available.", 526, 304, 304, 24);
  }

  function recipeResourceStatus(recipe) {
    return Object.entries(recipe.costs).map(([resourceId, needed]) => {
      const owned = resourceCount(gameState, resourceId);
      return {
        resourceId,
        name: resourceName(resourceId),
        owned,
        needed,
        missing: Math.max(0, needed - owned)
      };
    });
  }

  function drawCraftMenuOverlay() {
    const recipes = visibleShopRecipes();
    if (recipes.length === 0) return;

    gameState.menu.recipeIndex = Math.min(gameState.menu.recipeIndex ?? 0, recipes.length - 1);
    const [selectedRecipeId, selectedRecipe] = recipes[gameState.menu.recipeIndex];
    const createdItem = itemCatalog[selectedRecipe.creates.itemId];
    const resourceStatus = recipeResourceStatus(selectedRecipe);
    const selectedAffordable = canCraft(gameState, selectedRecipeId);

    drawRoundedRect(42, 40, 876, 492, 22, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Shop Crafting", 76, 74, { font: "16px 'Press Start 2P'", color: "#b93c2f" });
    drawText("Enter/Space: craft   Backspace: back", 568, 74, { font: "16px Outfit", color: "#694435" });

    recipes.forEach(([recipeId, recipe], index) => {
      const selected = index === gameState.menu.recipeIndex;
      const affordable = canCraft(gameState, recipeId);
      const y = 112 + index * 54;
      drawRoundedRect(72, y, 384, 44, 12, selected ? "#c8553d" : affordable ? "#fff4e6" : "#d8c8bb", "#3d271d");
      drawText(recipe.name, 92, y + 19, {
        font: "9px 'Press Start 2P'",
        color: selected ? "#fff8f0" : "#2d1b14"
      });
      drawText(`${recipe.creates.quantity} ${itemName(recipe.creates.itemId)} · ${affordable ? "Ready" : "Missing resources"}`, 92, y + 38, {
        font: "14px Outfit",
        color: selected ? "#fff8f0" : affordable ? "#694435" : "#8d8178"
      });
    });

    drawRoundedRect(492, 112, 396, 356, 16, "#fff7ef", "#3d271d");
    drawText(createdItem?.name ?? itemName(selectedRecipe.creates.itemId), 520, 150, {
      font: "13px 'Press Start 2P'",
      color: "#b93c2f"
    });
    drawText(`Creates: ${selectedRecipe.creates.quantity}`, 520, 184, { font: "18px Outfit", color: "#2d1b14" });
    drawText(selectedAffordable ? "Ready to craft" : "Missing resources", 760, 184, {
      font: "18px Outfit",
      color: selectedAffordable ? "#2a7f62" : "#b93c2f",
      align: "right"
    });

    drawText("Resources", 520, 226, { font: "12px 'Press Start 2P'", color: "#2d1b14" });
    resourceStatus.forEach((status, index) => {
      const y = 260 + index * 30;
      const enough = status.missing === 0;
      drawText(status.name, 532, y, { font: "17px Outfit", color: "#694435" });
      drawText(`${status.owned}/${status.needed}`, 828, y, {
        font: "17px Outfit",
        color: enough ? "#2a7f62" : "#b93c2f",
        align: "right"
      });
      if (!enough) {
        drawText(`Need ${status.missing} more`, 828, y + 20, {
          font: "13px Outfit",
          color: "#b93c2f",
          align: "right"
        });
      }
    });

    ctx.font = "17px Outfit";
    ctx.fillStyle = "#694435";
    wrapText(createdItem?.description ?? "A crafted shop item.", 520, 370, 320, 22);

    const feedbackAge = performance.now() - (gameState.menu.craftFeedbackShownAt ?? 0);
    if (gameState.menu.craftFeedback && feedbackAge < 2500) {
      const successFeedback = gameState.menu.craftFeedback.startsWith("Crafted");
      drawRoundedRect(520, 426, 320, 28, 10, successFeedback ? "#e7f5df" : "#ffe7de", "#3d271d");
      drawText(gameState.menu.craftFeedback, 536, 446, { font: "15px Outfit", color: "#2d1b14" });
    }
  }

  function drawPartyMenuOverlay() {
    drawRoundedRect(42, 40, 876, 492, 22, "rgba(255, 250, 243, 0.98)", "#3d271d");
    drawText("Party", 76, 74, { font: "16px 'Press Start 2P'", color: "#b93c2f" });
    drawText("Enter/Space: lead   Backspace: back", 632, 74, { font: "16px Outfit", color: "#694435" });

    gameState.player.party.forEach((creature, index) => {
      const selected = index === gameState.menu.partyIndex;
      const active = index === gameState.player.activeIndex;
      const cardY = 104 + index * 82;
      drawRoundedRect(68, cardY, 378, 64, 14, selected ? "#f3a65a" : "#fff5ea", "#3d271d");
      drawCreatureSprite(creature, 84, cardY + 6, 58, 52, {
        frameColor: creature.color,
        padding: 5,
        radius: 16
      });
      drawText(creature.nickname, 150, cardY + 24, { font: "12px 'Press Start 2P'", color: selected ? "#fff8f0" : "#2d1b14" });
      drawText(`${creature.species}  Lv ${creature.level}`, 150, cardY + 48, {
        font: "16px Outfit",
        color: selected ? "#fff8f0" : "#694435"
      });
      drawText(`HP ${creature.hp}/${creature.maxHp}`, 394, cardY + 48, {
        font: "16px Outfit",
        color: selected ? "#fff8f0" : "#2a7f62",
        align: "right"
      });
      if (active) {
        drawText("LEAD", 394, cardY + 24, {
          font: "12px 'Press Start 2P'",
          color: selected ? "#fff8f0" : "#b93c2f",
          align: "right"
        });
      }
    });

    const viewedCreature = gameState.player.party[gameState.menu.partyIndex];
    const xpProgress = viewedCreature.level >= CREATURE_MAX_LEVEL
      ? "MAX"
      : `${viewedCreature.xp % CREATURE_XP_PER_LEVEL}/${CREATURE_XP_PER_LEVEL}`;
    drawRoundedRect(484, 104, 398, 388, 16, "#fff7ef", "#3d271d");
    drawCreatureSprite(viewedCreature, 602, 124, 164, 150, {
      frameColor: viewedCreature.color,
      padding: 10,
      radius: 30
    });
    drawText(viewedCreature.nickname, 516, 300, { font: "14px 'Press Start 2P'" });
    drawText(`${viewedCreature.species} · ${viewedCreature.type ?? "Unknown"}`, 516, 332, { font: "20px Outfit", color: "#694435" });
    drawText(`Level ${viewedCreature.level}  XP ${xpProgress}`, 516, 360, { font: "18px Outfit", color: "#2a7f62" });
    drawText(`Role: ${viewedCreature.role}`, 516, 388, { font: "17px Outfit", color: "#694435" });
    drawText(`Moves: ${viewedCreature.moves.map((moveId) => moveCatalog[moveId].name).join(", ")}`, 516, 420, {
      font: "17px Outfit",
      color: "#694435"
    });
    ctx.font = "18px Outfit";
    ctx.fillStyle = "#694435";
    wrapText(viewedCreature.description, 516, 456, 324, 24);
  }

  function drawMenuOverlay() {
    ctx.fillStyle = "rgba(38, 24, 18, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState.menu.mode === "main") {
      drawMainMenuOverlay();
      return;
    }

    if (gameState.menu.mode === "bag") {
      drawBagMenuOverlay();
      return;
    }

    if (gameState.menu.mode === "craft") {
      drawCraftMenuOverlay();
      return;
    }

    drawPartyMenuOverlay();
  }

  return {
    closeMenu,
    drawMenuOverlay,
    handleMenuNavigation,
    openMenu,
    openShopCraftMenu
  };
}
