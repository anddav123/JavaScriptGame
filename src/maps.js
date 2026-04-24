export const worldMaps = {
  sunmeadow: {
    name: "Sunmeadow",
    palette: { top: "#78c98b", bottom: "#5ea96f" },
    encounterRate: 0.085,
    terrain: [
      "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WRRGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGW",
      "WRRTTTTGGGGGGGGGGGGGGTTTTGGGGGGGGGGGGGGGGGGGGGGGGGGGTTTTTTTWWGGGGGGGGGGW",
      "WRRTTTTGGGWWGGGGGGGGGGTTTTGGGGGWWWWWWWWWWWWWRRRWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WRRGGGGGGGWWGGGGGGGGGGGGGGGGGGGWGGGGGGGGGGGGRRRGGGGGGGGGGGGGGGGGGGGGGGGW",
      "WRRRRRGGGGGGGGGGGGGGGGGGGGGGGGGWGGGGGGGGGGGGRRRGGGGGGGGGGGGGGGGGGGGGGGGW",
      "WRRRRRGGGTTTTGGGGGGGGGTTTTGGGGGWTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGTTTTGGGGGGGGGTTTTGGGGGWTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGTTTGGGGGGGGGGGGGGGGGGGGGGGWTTTTTTTTTTTTTRRRRRRTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGTTTGGGGGGGGGGGGGGGGRRGGGGGWTTTTTTTTTTTTTRRRRRRTTTTTTTTTTTTTTTTTTTTW",
      "WGGGGGGGGGGGGGGGGGGGGGGGRRGGGGGWTTTTTTTTTTTTTTTTRRRTTTTTTTTTTTTTTTTTTTTW",
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
      { x: 5, y: 5, text: "Tall grass is alive with ember spirits." },
      { x: 21, y: 11, text: "Trainer tip: press Enter to open your trainer menu." },
      { x: 25, y: 4, text: "A cave mouth waits to the east. Stay alert." },
      { x: 47, y: 14, text: "Welcome to New Town." }
    ],
    triggers: [
      {
        x: 27,
        y: 5,
        kind: "cave",
        targetMap: "emberCave",
        targetX: 3,
        targetY: 12,
        message: "You step into Ember Cave."
      },
      {
        x: 23,
        y: 12,
        kind: "door",
        targetMap: "wayfarerHouse",
        targetX: 4,
        targetY: 6,
        message: "You enter the wayfarer's cottage."
      }
    ]
  },
  emberCave: {
    name: "Ember Cave",
    palette: { top: "#635166", bottom: "#362933" },
    encounterRate: 0.14,
    terrain: [
      "WWWWWWWWWWWWWWWWWWWWWWWW",
      "WWGGGGGGGGGGGGGGGGGGGGWW",
      "WGGGGGGGGGGGGGGGGGGGGGGW",
      "WGGGGGGWWWWWGGGGGGGGGGGW",
      "WGGGGGGWGGGWGGGGGGGGGGGW",
      "WGGGTTTWGGGWGGGGTTTGGGGW",
      "WGGGTTTWGGGWGGGGTTTGGGGW",
      "WGGGGGGWGGGWGGGGGGGGGGGW",
      "WGGGGGGWGGGWGGGGGGGGGGGW",
      "WGGGGGGWWWWWGGGGGGGGGGGW",
      "WGGGGGGGGGGGGGGGGGGGGGGW",
      "WGGGGGGGGGGGGGGGGGGGGGGW",
      "WGGGGGGGGGGGGGGGGGGGGGGW",
      "WWGGGGGGGGGGGGGGGGGGGGWW",
      "WWWWWWWWWWWWWWWWWWWWWWWW"
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
      }
    ]
  },
  wayfarerHouse: {
    name: "Wayfarer Cottage",
    palette: { top: "#000000", bottom: "#020202" },
    encounterRate: -1,
    terrain: [
      "WWWWWWWWWW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WRRRRRRRRW",
      "WWWWWWWWWW"
    ],
    signs: [
      { x: 5, y: 2, text: "A note reads: rest, explore, and return stronger." }
    ],
    triggers: [
      {
        x: 4,
        y: 6,
        kind: "door-exit",
        targetMap: "sunmeadow",
        targetX: 23,
        targetY: 13,
        message: "You step back outside."
      }
    ]
  }
};
