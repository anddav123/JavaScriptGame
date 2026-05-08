export const worldMaps = {
  sunmeadow: {
    name: "Sunmeadow",
    mapType: "meadow",
    palette: { top: "#78c98b", bottom: "#5ea96f" },
    encounterRate: 0.085,
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
      "WGGGGGGGGGGGTTTTGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRW",
      "WGGGGGGGGGGGTTTTGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRW",
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
        x: 68,
        y: 15,
        width: 2,
        height: 2,
        door: { x: 68, y: 16 },
        name: "Tiny Storehouse",
        text: "Tiny Storehouse: a compact little building with a sturdy lock.",
        lockedMessage: "The storehouse door is locked.",
        wallColor: "#f0d7a6",
        trimColor: "#725135",
        roofColor: "#b95e3c",
        roofTrimColor: "#6d2d24"
      }
    ],
    npcs: [
      {
        x: 50,
        y: 14,
        name: "Meadow Ranger",
        spritePath: "assets/npc/ranger-sprite.png",
        patrol: { shape: "circle", radius: 1, intervalMs: 700 },
        dialogue: "Keep an eye on the tall grass. New creature families have been spotted nearby."
      },
      {
        x: 62,
        y: 17,
        name: "Meadow Ranger Trainee",
        spritePath: "assets/npc/ranger-sprite.png",
        patrol: { axis: "x", steps: 3, intervalMs: 700 },
        dialogue: "Oh no I'm late for my first day of patrol."
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
        x: 68,
        y: 2,
        kind: "cave",
        targetMap: "emberCave",
        targetX: 44,
        targetY: 13,
        message: "You step into Ember Cave."
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
    encounterRate: 0.14,
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
