export const worldMaps = {
  sunmeadow: {
    name: "Sunmeadow",
    mapType: "meadow",
    palette: { top: "#78c98b", bottom: "#5ea96f" },
    audio: { track: "meadow" },
    encounterRate: 0.085,
    gathering: {
      maxActive: 4,
      points: [
        { x: 15, y: 1 },
        { x: 70, y: 5 },
        { x: 43, y: 1 },
        { x: 1, y: 18 },
        { x: 29, y: 18 },
        { x: 29, y: 3 },
        { x: 15, y: 17 },
        { x: 57, y: 1 },
        { x: 6, y: 8 },
        { x: 21, y: 9 },
        { x: 50, y: 5 },
        { x: 36, y: 5 },
        { x: 13, y: 10 },
        { x: 7, y: 1 },
        { x: 28, y: 10 },
        { x: 8, y: 15 },
        { x: 22, y: 16 },
        { x: 22, y: 1 },
        { x: 64, y: 1 },
        { x: 1, y: 12 }
      ],
      resources: [
        { id: "meadowHerb", weight: 6 },
        { id: "glowMushroom", weight: 2 },
        { id: "shardGem", weight: 1 }
      ]
    },
    battleDrops: [
      { id: "meadowHerb", weight: 2 },
      { id: "glowMushroom", weight: 1 }
    ],
    wildCreatures: ["Buzzybee", "Sproutrunk", "Pluma"],
    wildLevelRange: { min: 1, max: 6 },
    terrain: [
      "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WRRTTTGGGGGGGGGGGGGGGGGGGGGGGGGWGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGW",
      "WRRTTTTGGGGGGGGGGGGGGTTTTGGGGGGWGGGGGGGGGGGGGGGGGGGGTTTTTTTWWGGGGGGGGGGW",
      "WRRTTTTGGGWWGGGGGGGGGGTTTTGGGGGWWWWWWWWWWWWWRRRWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WRRTTTTGGGWWGGGGGGGGGGGGGGGGGGGWGGGGGGGGGGGGRRRGGGGGGGGGGGGGGGGGGGGGGGGW",
      "WRRRRRTTTGGGGGGGGGGGGGGGGGGGGGGWGGGGGGGGGGGGRRRGGGGGGGGGGGGGGGGGGGGGGGGW",
      "WRRRRRTGTTTTTGGGGGGGGGTTTTGGGGGWTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTTTTTW",
      "WTTTTTTTTTTTTGGGGGGGGGTTTTGGGGGWTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGTTTGGGGGGGGGGGGGGGGGGGGGGGWTTTTTTTTTTTTTRRRRRRTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGTTTGGGGGGGGGGGGGGGGRRRGGGGWTTTTTTTTTTTTTRRRRRRTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGGRRRGGGGWTTTTTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWTTTTTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWWWRRRWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRW",
      "WGGGGGGGGGGGTTTTGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
      "WGGGGGGGGGGGTTTTGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRW",
      "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
    ],
    signs: [
      { x: 5, y: 5, text: "Tall grass is alive with angry creatures beware." },
      { x: 21, y: 11, text: "Player tip: press Enter to open your menu." },
      { x: 25, y: 4, text: "A cave mouth waits to the east. Stay alert." },
      { x: 47, y: 14, text: "Welcome to New Town." }
    ],
    buildings: [
      {
        x: 24,
        y: 8,
        width: 3,
        height: 3,
        door: { x: 25, y: 10 },
        name: "Wayfarer Cottage",
        text: "Wayfarer Cottage: a tiny resting place tucked beside the meadow path.",
        wallColor: "#ead09a",
        trimColor: "#765337",
        roofColor: "#a65c3b",
        roofTrimColor: "#663321"
      },
      {
        x: 37,
        y: 15,
        width: 4,
        height: 3,
        door: { x: 39, y: 17 },
        name: "New Town Shop",
        sign: "Shop",
        text: "New Town Shop: tonics, capture orbs, and trail snacks line the shelves.",
        wallColor: "#f0d7a6",
        trimColor: "#725135",
        roofColor: "#c8553d",
        roofTrimColor: "#7a2e24"
      },
      {
        x: 54,
        y: 14,
        width: 4,
        height: 3,
        door: { x: 56, y: 16 },
        name: "Sunmeadow Field Station",
        sign: "Range",
        text: "Sunmeadow Field Station: a cosy outpost for trainers exploring the meadow."
      },
      {
        x: 42,
        y: 15,
        width: 3,
        height: 3,
        door: { x: 43, y: 17 },
        name: "New Town Cottage",
        text: "New Town Cottage: warm lamplight glows behind the curtains.",
        lockedMessage: "The cottage door is locked.",
        wallColor: "#e8c47f",
        trimColor: "#7a5434",
        roofColor: "#7f4f9f",
        roofTrimColor: "#4d2c63"
      },
      {
        x: 62,
        y: 14,
        width: 3,
        height: 3,
        door: { x: 63, y: 16 },
        name: "Supply Shed",
        text: "Supply Shed: crates of ranger tools are stacked neatly inside.",
        lockedMessage: "The supply shed is locked.",
        wallColor: "#d8aa6a",
        trimColor: "#6d4b2f",
        roofColor: "#3d8f6f",
        roofTrimColor: "#245441"
      },
      {
        x: 70,
        y: 15,
        width: 3,
        height: 3,
        door: { x: 70, y: 17 },
        name: "East Gatehouse",
        sign: "Gate",
        text: "East Gatehouse: the road narrows through a guarded arch toward Brookbend.",
        wallColor: "#f0d7a6",
        trimColor: "#725135",
        roofColor: "#6b8f62",
        roofTrimColor: "#3d5d37"
      }
    ],
    npcs: [
      {
        x: 50,
        y: 14,
        name: "Meadow Ranger",
        spritePath: "assets/npc/ranger-sprite.png",
        patrol: { shape: "circle", radius: 1, intervalMs: 900 },
        dialogue: "Keep an eye on the tall grass. New creature families have been spotted nearby.",
        introDialogue: {
          id: "rangerBattleDropsIntroSeen",
          speaker: "Meadow Ranger",
          title: "Field Ranger",
          portraitPath: "assets/dialogue/meadow-ranger-portrait.jpg",
          spritePath: "assets/npc/ranger-sprite.png",
          lines: [
            "You're learning the field craft quickly. Here's a ranger trick.",
            "Wild creatures sometimes leave useful materials behind after battle.",
            "The material depends on the creature and where you found it.",
            "Check your Bag's Resources tab after victories, then take anything useful to Lily."
          ]
        }
      },
      {
        x: 62,
        y: 17,
        name: "Meadow Ranger Trainee",
        spritePath: "assets/npc/redshirt-sprite.png",
        patrol: { axis: "x", steps: 3, intervalMs: 1200 },
        dialogue: "Oh no I'm late for my first day of patrol."
      },
      {
        x: 27,
        y: 4,
        name: "Frank",
        spritePath: "assets/npc/redshirt-sprite.png",
        patrol: { shape: "circle", radius: 1, intervalMs: 900 },
        dialogue: "Go safe travelling though the cave.",
        introDialogue: {
          portraitPath: "assets/dialogue/red-shirt-portrait.jpg",
          spritePath: "assets/npc/redshirt-sprite.png"
        },
        battle: {
          id: "frank",
          team: [
            { species: "Sproutrunk", level: 3 },
            { species: "Cubling", level: 3 }
          ],
          chaseRange: 4,
          challengeLine: "You heading for the cave? That means you're ready for a proper battle.",
          victoryMessage: "Frank steps aside and wishes you a good journey though the cave."
        }
      }
    ],
    triggers: [
      {
        x: 27,
        y: 5,
        kind: "cave",
        targetMap: "emberCave",
        targetX: 2,
        targetY: 12,
        message: "You step into Ember Cave."
      },
      {
        x: 25,
        y: 10,
        kind: "door",
        targetMap: "wayfarerHouse",
        targetX: 4,
        targetY: 6,
        message: "You enter the wayfarer's cottage."
      },
      {
        x: 56,
        y: 16,
        kind: "door",
        targetMap: "rangerFieldStation",
        targetX: 5,
        targetY: 6,
        message: "You enter the Ranger Field Station."
      },
      {
        x: 39,
        y: 17,
        kind: "door",
        targetMap: "newTownShop",
        targetX: 5,
        targetY: 6,
        message: "You enter the New Town Shop."
      },
      {
        x: 68,
        y: 2,
        kind: "cave",
        targetMap: "emberCave",
        targetX: 44,
        targetY: 13,
        message: "You step into Ember Cave."
      },
      {
        x: 70,
        y: 17,
        kind: "route",
        targetMap: "brookbend",
        targetX: 1,
        targetY: 26,
        message: "You follow the east road to Brookbend Crossing.",
        requiresTutorials: ["lilyCraftingIntroSeen", "rangerBattleDropsIntroSeen"],
        lockedMessage: "Gone for lunch, Gatehouse Closed. Come back later."
      }
    ]
  },
  newTownShop: {
    name: "New Town Shop",
    mapType: "interior",
    palette: { top: "#000000", bottom: "#020202" },
    encounterRate: -1,
    crafting: { station: "shop" },
    wildCreatures: [],
    terrain: [
      "WWWWWWWWWW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WWWWWRWWWW"
    ],
    signs: [
      { x: 5, y: 1, text: "Today's stock: tonics, capture orbs, and warm field rations." }
    ],
    furniture: [
      {
        x: 1,
        y: 1,
        width: 2,
        height: 1,
        type: "shelf",
        name: "Tonic Shelf",
        text: "Bright tonic bottles are arranged from mild to extra-zingy."
      },
      {
        x: 7,
        y: 1,
        width: 2,
        height: 1,
        type: "shelf",
        name: "Orb Shelf",
        text: "Polished capture orbs sit in little straw nests."
      },
      {
        x: 2,
        y: 3,
        width: 6,
        height: 1,
        type: "table",
        name: "Shop Counter",
        text: "The counter smells faintly of cedar polish and berry sweets."
      },
      {
        x: 1,
        y: 5,
        width: 1,
        height: 1,
        type: "crateStack",
        name: "Delivery Crate",
        text: "A fresh delivery label reads: New Town Shop."
      },
      {
        x: 8,
        y: 5,
        width: 1,
        height: 1,
        type: "cabinet",
        name: "Locked Cabinet",
        text: "Rare supplies are tucked safely behind the little brass latch."
      }
    ],
    npcs: [
      {
        x: 5,
        y: 2,
        name: "Shopkeeper Lily",
        spritePath: "assets/npc/shopkeeper-sprite.png",
        opensCraftingStation: true,
        dialogue: "Bring me the right resources and I'll help you craft supplies.",
        introDialogue: {
          id: "lilyCraftingIntroSeen",
          speaker: "Shopkeeper Lily",
          title: "Shopkeeper",
          portraitPath: "assets/dialogue/shopkeeper-lily-portrait.jpg",
          spritePath: "assets/npc/shopkeeper-sprite.png",
          lines: [
            "Ah, a new gatherer! See those sparkling spots out in the grass?",
            "Herbs, mushrooms, and gems can all be used to craft supplies.",
            "Bring resources to me and I'll help turn them into tonics and capture orbs.",
            "Special items need careful hands — that's what shopkeepers are for."
          ]
        }
      }
    ],
    triggers: [
      {
        x: 5,
        y: 7,
        kind: "door-exit",
        targetMap: "sunmeadow",
        targetX: 39,
        targetY: 18,
        message: "You step back into New Town."
      }
    ]
  },
  rangerFieldStation: {
    name: "Ranger Field Station",
    mapType: "interior",
    palette: { top: "#000000", bottom: "#020202" },
    encounterRate: -1,
    wildCreatures: [],
    terrain: [
      "WWWWWWWWWW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WWWWWRWWWW"
    ],
    signs: [
      { x: 5, y: 2, text: "Ranger log: creature activity around Sunmeadow is increasing." }
    ],
    furniture: [
      {
        x: 1,
        y: 1,
        width: 2,
        height: 1,
        type: "shelf",
        name: "Field Guide Shelf",
        text: "Field guides, twine, and spare notebooks are stacked in careful rows."
      },
      {
        x: 7,
        y: 1,
        width: 2,
        height: 1,
        type: "cabinet",
        name: "Supply Cabinet",
        text: "The cabinet is packed with bandages, sample jars, and trail markers."
      },
      {
        x: 2,
        y: 3,
        width: 2,
        height: 1,
        type: "mapTable",
        name: "Survey Table",
        text: "A Sunmeadow survey map is pinned beneath smooth river stones."
      },
      {
        x: 7,
        y: 4,
        width: 1,
        height: 2,
        type: "crateStack",
        name: "Supply Crates",
        text: "Sturdy crates hold field rations and spare ranger tools."
      }
    ],
    triggers: [
      {
        x: 5,
        y: 7,
        kind: "door-exit",
        targetMap: "sunmeadow",
        targetX: 56,
        targetY: 17,
        message: "You step back into Sunmeadow."
      }
    ]
  },
  emberCave: {
    name: "Ember Cave",
    mapType: "cave",
    palette: { top: "#635166", bottom: "#362933" },
    audio: { track: "emberCave" },
    encounterRate: 0.054,
    gathering: {
      maxActive: 4,
      points: [
        { x: 15, y: 1 },
        { x: 56, y: 11 },
        { x: 34, y: 12 },
        { x: 1, y: 12 },
        { x: 44, y: 1 },
        { x: 21, y: 13 },
        { x: 28, y: 1 },
        { x: 3, y: 1 },
        { x: 11, y: 11 },
        { x: 45, y: 11 },
        { x: 54, y: 2 },
        { x: 36, y: 2 },
        { x: 21, y: 5 },
        { x: 27, y: 9 },
        { x: 9, y: 4 },
        { x: 4, y: 7 },
        { x: 51, y: 7 },
        { x: 16, y: 8 },
        { x: 39, y: 9 },
        { x: 32, y: 6 }
      ],
      resources: [
        { id: "caveMoss", weight: 5 },
        { id: "emberGem", weight: 3 },
        { id: "shardGem", weight: 2 }
      ]
    },
    battleDrops: [
      { id: "caveMoss", weight: 2 },
      { id: "emberGem", weight: 1 }
    ],
    wildCreatures: ["Scorcha"],
    wildLevelRange: { min: 3, max: 12 },
    terrain: [
      "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WWGGGGGGGGGGGGGGGGGGGGWGGGGGGGGGGGGGGGGGGGGGGGGGGGGTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGTTTTTTTGGGGGGGTTTTTTTTTTTTGGGGGGGGW",
      "WGGGGGGWWWWWGGGGGGGGGGGWWWWWWWWWWWWWWWWWWWWWWWWWWWWWTTTTTW",
      "WGGGGGGWGGGWGGGGGGGGGGGWTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTW",
      "WGGGTTTWGGGWGGGGTTTGGGGWWTTTTTWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGTTTWGGGWGGGGTTTGGGGWGGGGGGGGGGGGGTTTTTTTTTTTTTTTTTTWWW",
      "WGGGGGGWGGGWGGGGGGGGGGGWWWWWWWWWWWWWWWWWWWWWWGGGWWWGGGGWWW",
      "WGGGGGGWGGGWGGGGGGGGGGGWTTTTTTTTTTTTTTTTTTTTTGGGWWWGGGGTWW",
      "WGGGGGGWWWWWGGGGGGGGGGGWGGGGGGGGGGGGGGGGGGWWWWWWWWGGGGTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGWTTTTTTTTTTTTTGGGGGGGGGWWWWTTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGWGGGGGGGGGGGGGGGGGGGGGGGGWGGGGGGGGW",
      "WGGGGGGGGGGGGGGGGGGGGGGWGGGGGGGGGGGGGGGGGGWWWWWWWWTTTTTTTW",
      "WWGGGGGGGGGGGGGGGGGGGGWWWWWTTTTTTTTTTTTTTTTGGGWWWWGGGGGGWW",
      "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
    ],
    signs: [
      { x: 8, y: 10, text: "The cave walls shimmer with trapped warmth." }
    ],
    triggers: [
      {
        x: 2,
        y: 13,
        kind: "cave-exit",
        targetMap: "sunmeadow",
        targetX: 27,
        targetY: 6,
        message: "You emerge back into Sunmeadow."
      },
      {
        x: 45,
        y: 13,
        kind: "cave-exit",
        targetMap: "sunmeadow",
        targetX: 68,
        targetY: 1,
        message: "You emerge back into Sunmeadow."
      }
    ]
  },
  brookbend: {
    name: "Brookbend",
    mapType: "meadow",
    palette: { top: "#78c7d8", bottom: "#5fa76f" },
    audio: { track: "meadow" },
    encounterRate: 0.075,
    gathering: {
      maxActive: 4,
      points: [
        { x: 5, y: 17 },
        { x: 10, y: 24 },
        { x: 15, y: 17 },
        { x: 24, y: 23 },
        { x: 30, y: 15 },
        { x: 34, y: 25 },
        { x: 6, y: 27 },
        { x: 29, y: 18 }
      ],
      resources: [
        { id: "meadowHerb", weight: 5 },
        { id: "glowMushroom", weight: 2 },
        { id: "shardGem", weight: 2 }
      ]
    },
    battleDrops: [
      { id: "meadowHerb", weight: 2 },
      { id: "shardGem", weight: 1 }
    ],
    wildCreatures: ["Ripplefin", "Reedlet", "Pebblet", "Pluma"],
    wildLevelRange: { min: 4, max: 10 },
    terrain: [
      "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGWWWGGGGGGGGGWWWGGGGGGGGGWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGRRRRGGGGGWGWGGGGGRRRRGGWGWGGGGGWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGRRRRGGGGGWWWGGGGGRRRRGGWWWGGGGGWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGRRRRGGGGGGGGGGGGGGGG~~~WWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGRRRRGGGGGGGGGG~~~~~~~~~WWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGG~~~~~~~~~GGGWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGGGGG~~~~~~~~~~GGGGGGGGGTTTTTGGGWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGGGGG~~~~~~~GGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGGGGG~~~~GGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWW",
      "WGGGGGGGGGGGGGGGRGGG~~~~GGGGGGGGGGGGGGGWGGGGGGGGGGGGGGGGGWWWWWWWWWWW",
      "WGGGGGGGGGGGTTTGRGG~~~~GGGGTTTRRRGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWW",
      "WGGGTTTGGGGGTTTGRGG~~~~GGGGTTTGGGTTTGGGGGGGGGGGTTTTTTTTTTTTTGGGGGGGW",
      "WGGGTTTGGGGGGGGGRGG~~~~GGGGGGGGGGTTTGGGGGTTTTTTTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGGGGGGGGRGG~~~~GGGGGGGGGGGGGGGGGGGGTTTTGGGTTTTTTTGGGGGGGGGGW",
      "WGGGGGGGGGGGWWWGRGG~~~~GGGWWWGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGW",
      "WGGGGGGGGGGGGGGGRGG~~~~GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGW",
      "WGGRRRRRRRRRRRRRRRR~~~~RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRW",
      "WGGRTTGTGTTTTTGTTGG~~~~GGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWWWGGGGGGGRRRRW",
      "WTRRTTTGTGTTTTTTTGG~~~~GGGGGGGGTTTGGGGGWTTTTTTTTTTTTTTTTTTTRRRRRRRRW",
      "WTRTRRRRGTGGTTTGTGG~~~~GGGGTTTGGGTTTGGGWTTTTTTTTTTTTTTTRRRRRRRTTTTTW",
      "GGRRRTTRRRRGTTTTTTG~~~~GGGGTTTGGGGGGGGGWTTTTTTTTRRRRRRRRRRTTTTTTTTTW",
      "RTTTTTTTTTRRRRRGTGG~~~~GGGGGGGGGGGGGGGGWTTTTTTTTRRTTTTTTTTTTTTTTTTTW",
      "RRRRTTTTTTTTTTRTGTG~~~~GGGGGGGGGGGGGGGGWTTTTTTTRRTTTTTTTTTTTTTTTTTTW",
      "WRRRRRRRRRRRRRRTTTG~~~~GGGGGGGGGGGGGGGGWGGGGGGGRRGGGGGGGGGGGGGGGGGTW",
      "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
    ],
    signs: [
      { x: 18, y: 8, text: "Brook Town: keep parcels dry and boots drier." },
      { x: 15, y: 19, text: "North path: Brook Town. Follow the path to town." },
      { x: 17, y: 19, text: "East road: Brookbend Crossing. Ask the warden before entering the water." },
      { x: 3, y: 19, text: "Brookbend Crossing: shallow water ahead. Ask the warden before entering the current." },
      { x: 30, y: 21, text: "The reeds shake with new creatures after rain." }
    ],
    buildings: [
      {
        x: 16,
        y: 2,
        width: 3,
        height: 3,
        door: { x: 17, y: 4 },
        name: "Warden Cottage",
        sign: "John",
        text: "Warden Cottage: river maps and waterproof satchels hang by the door.",
        wallColor: "#e8c47f",
        trimColor: "#7a5434",
        roofColor: "#3d8f6f",
        roofTrimColor: "#245441"
      },
      {
        x: 29,
        y: 2,
        width: 3,
        height: 3,
        door: { x: 30, y: 4 },
        name: "Brook Storehouse",
        sign: "Store",
        text: "Brook Storehouse: sealed crates are stacked above the damp floorboards.",
        lockedMessage: "The storehouse is locked."
      },
      {
        x: -1,
        y: 24,
        width: 3,
        height: 3,
        door: { x: 1, y: 26 },
        name: "Sunmeadow Gatehouse",
        sign: "Gate",
        text: "Sunmeadow Gatehouse: a small road post marking the way back to New Town.",
        wallColor: "#f0d7a6",
        trimColor: "#725135",
        roofColor: "#6b8f62",
        roofTrimColor: "#3d5d37"
      }
    ],
    nature: [
      {
        type: "tree",
        x: 5,
        y: 12,
        width: 2,
        height: 2,
        name: "River Ash",
        text: "A river ash leans toward the sound of running water."
      },
      {
        type: "tree",
        x: 34,
        y: 12,
        width: 2,
        height: 2,
        name: "Old Brook Oak",
        text: "The old brook oak has deep roots and a hollow where small creatures shelter."
      },
      {
        type: "tree",
        x: 59,
        y: 24,
        width: 2,
        height: 2,
        name: "Reedbank Tree",
        text: "A sturdy tree marks the edge of the reedbank."
      },
       {
        type: "tree",
        x: 4,
        y: 25,
        width: 2,
        height: 2,
        name: "Pathside tree"
      },
      {
        type: "tree",
        x: 1,
        y: 20,
        width: 2,
        height: 2,
        name: "Pathside tree"
      },
      {
        type: "tree",
        x: 10,
        y: 22,
        width: 2,
        height: 2,
        name: "Pathside tree"
      },
      {
        type: "tree",
        x: 15,
        y: 24,
        width: 2,
        height: 2,
        name: "Pathside tree"
      },
      {
        type: "bush",
        x: 18,
        y: 23,
        name: "Riverside bush",
        text: "Glossy leaves hold beads of river spray."
      },
      {
        type: "bush",
        x: 12,
        y: 21,
        width: 2,
        height: 1,
        name: "River Bush",
        text: "Glossy leaves hold beads of river spray."
      },
      {
        type: "bush",
        x: 31,
        y: 19,
        name: "Pathside Bush",
        text: "A pathside bush has been trimmed back by passing boots."
      },
       {
        type: "bush",
        x: 2,
        y: 25,
        width: 2,
        height: 1,
        name: "Pathside Bush"
      }, 
      {
        type: "bush",
        x: 6,
        y: 26,
        name: "Small Bush"
      },
      {
        type: "flowers",
        x: 27,
        y: 13,
        name: "Brook Flowers",
        text: "Tiny flowers brighten the damp bank."
      },
      {
        type: "flowers",
        x: 49,
        y: 27,
        name: "Reed Flowers",
        text: "Small flowers poke through the reeds."
      }
    ],
    npcs: [
      {
        x: 18,
        y: 5,
        name: "Elin",
        spritePath: "assets/npc/shopkeeper-sprite.png",
        dialogue: "John left her waterproof parcel here. Please take it back to her at the crossing.",
        grantsFlag: "brookParcelCollected",
        rewardMessage: "Here's John's parcel. Keep it dry on the way back."
      },
      {
        x: 25,
        y: 8,
        name: "Brook Town Ranger",
        spritePath: "assets/npc/ranger-sprite.png",
        patrol: { axis: "x", steps: 2, intervalMs: 1200 },
        dialogue: "John won't teach the crossing until her parcel arrives. She takes river work seriously."
      },
      {
        x: 10,
        y: 19,
        name: "Brook Warden John",
        spritePath: "assets/npc/ranger-sprite.png",
        patrol: { axis: "y", steps: 1, intervalMs: 1000 },
        dialogue: "Keep your shoulders loose and follow the current, not your panic.",
        requiresFlag: "brookParcelCollected",
        blockedDialogue: "I can't leave the crossing yet. Please collect my parcel from Elin up in Brook Town first.",
        grantsSkill: "swim",
        rewardMessage: "Thanks for bringing the parcel. You learned to swim. Deep water is now passable.",
        introDialogue: {
          id: "brookWardenSwimLessonSeen",
          speaker: "Brook Warden John",
          title: "Brook Warden",
          portraitPath: "assets/dialogue/meadow-ranger-portrait.jpg",
          spritePath: "assets/npc/ranger-sprite.png",
          lines: [
            "You found Elin and brought the parcel. Good. That earns you a proper lesson.",
            "The crossing looks calm, but Brookbend pulls sideways under the surface.",
            "If you fight it, you tire. If you angle with it, the water carries you safely.",
            "Take a breath, step in from the bank, and keep your lead creature close.",
            "There. You've got it. From now on, you can swim across deep water."
          ]
        }
      },
      {
        x: 27,
        y: 20,
        name: "Tom",
        spritePath: "assets/npc/redshirt-sprite.png",
        patrol: { axis: "x", steps: 2, intervalMs: 1100 },
        dialogue: "You made the crossing. That means you're ready for a proper battle.",
        introDialogue: {
          portraitPath: "assets/dialogue/red-shirt-portrait.jpg",
          spritePath: "assets/npc/redshirt-sprite.png"
        },
        battle: {
          id: "tom",
          species: "Pebblet",
          level: 8,
          chaseRange: 4,
          victoryMessage: "Tom steps aside and points toward the reeds beyond the bridge."
        }
      }
    ],
    triggers: [
      {
        x: 1,
        y: 26,
        kind: "route-exit",
        targetMap: "sunmeadow",
        targetX: 70,
        targetY: 17,
        message: "You return to Sunmeadow."
      }
    ]
  },
  wayfarerHouse: {
    name: "Wayfarer Cottage",
    mapType: "interior",
    palette: { top: "#000000", bottom: "#020202" },
    encounterRate: -1,
    wildCreatures: [],
    terrain: [
      "WWWWWWWWWW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WWWWRWWWWW"
    ],
    signs: [
      { x: 5, y: 2, text: "A note reads: rest, explore, and return stronger." }
    ],
    furniture: [
      {
        x: 1,
        y: 1,
        width: 2,
        height: 2,
        type: "bed",
        name: "Traveler's Bed",
        text: "A neatly made bed waits for tired travelers."
      },
      {
        x: 6,
        y: 1,
        width: 2,
        height: 1,
        type: "shelf",
        name: "Keepsake Shelf",
        text: "The shelf holds old route charms and a few well-loved books."
      },
      {
        x: 2,
        y: 4,
        width: 2,
        height: 1,
        type: "table",
        name: "Wooden Table",
        text: "A small wooden table has a chipped mug and folded cloth on it."
      },
      {
        x: 7,
        y: 4,
        width: 1,
        height: 2,
        type: "stove",
        name: "Iron Stove",
        text: "The little iron stove still holds a comfortable warmth."
      }
    ],
    triggers: [
      {
        x: 4,
        y: 7,
        kind: "door-exit",
        targetMap: "sunmeadow",
        targetX: 25,
        targetY: 11,
        message: "You step back outside."
      }
    ]
  }
};
