export const DEFAULT_MOVE_MP_COST = 2;

export const moveCatalog = {
  ember: { name: "Ember", power: 16, accuracy: 0.92, color: "#ef6c3e", mpCost: 5 },
  vineSnap: { name: "Vine Snap", power: 14, accuracy: 0.95, color: "#2d8f64", mpCost: 4 },
  iceShard: { name: "Ice Shard", power: 25, accuracy: 0.5, color: "#9af0f0", mpCost: 8 },
  leafNeedle: { name: "Leaf Needle", power: 10, accuracy: 0.98, color: "#5dbb63", mpCost: 3 },
  rootJab: { name: "Root Jab", power: 12, accuracy: 0.96, color: "#7a9f43", mpCost: 4 },
  thornBurst: { name: "Thorn Burst", power: 18, accuracy: 0.9, color: "#2f9e44", mpCost: 5 },
  brambleCrash: { name: "Bramble Crash", power: 28, accuracy: 0.78, color: "#2f6f3e", mpCost: 9 },
  petalCyclone: { name: "Petal Cyclone", power: 24, accuracy: 0.84, color: "#f58fc3", mpCost: 8 },
  emberFlick: { name: "Ember Flick", power: 9, accuracy: 0.98, color: "#ff9f43", mpCost: 3 },
  flareBite: { name: "Flare Bite", power: 20, accuracy: 0.88, color: "#e8590c", mpCost: 6 },
  cinderRush: { name: "Cinder Rush", power: 26, accuracy: 0.82, color: "#d9480f", mpCost: 8 },
  moltenPounce: { name: "Molten Pounce", power: 34, accuracy: 0.72, color: "#b02a1f", mpCost: 11 },
  sunflare: { name: "Sunflare", power: 40, accuracy: 0.68, color: "#f08c00", mpCost: 13 },
  waterPebble: { name: "Water Pebble", power: 11, accuracy: 0.97, color: "#4dabf7", mpCost: 3 },
  streamLash: { name: "Stream Lash", power: 17, accuracy: 0.92, color: "#228be6", mpCost: 5 },
  mistCut: { name: "Mist Cut", power: 21, accuracy: 0.88, color: "#74c0fc", mpCost: 6 },
  tidalToss: { name: "Tidal Toss", power: 30, accuracy: 0.76, color: "#1864ab", mpCost: 10 },
  frostNip: { name: "Frost Nip", power: 13, accuracy: 0.94, color: "#a5d8ff", mpCost: 4 },
  snowPierce: { name: "Snow Pierce", power: 19, accuracy: 0.9, color: "#91e2f5", mpCost: 6 },
  glacierDrop: { name: "Glacier Drop", power: 36, accuracy: 0.7, color: "#5bc0de", mpCost: 12 },
  stoneTap: { name: "Stone Tap", power: 12, accuracy: 0.97, color: "#8d6e63", mpCost: 4 },
  pebbleBarrage: { name: "Pebble Barrage", power: 22, accuracy: 0.85, color: "#7c6f64", mpCost: 7 },
  graniteSlam: { name: "Granite Slam", power: 32, accuracy: 0.74, color: "#5c534d", mpCost: 10 },
  mudHook: { name: "Mud Hook", power: 16, accuracy: 0.91, color: "#8a5a44", mpCost: 5 },
  gustPeck: { name: "Gust Peck", power: 10, accuracy: 0.98, color: "#90a4ae", mpCost: 3 },
  windShear: { name: "Wind Shear", power: 23, accuracy: 0.86, color: "#6ec6ff", mpCost: 7 },
  stormDive: { name: "Storm Dive", power: 35, accuracy: 0.72, color: "#4dabf7", mpCost: 11 },
  sparkNibble: { name: "Spark Nibble", power: 12, accuracy: 0.95, color: "#ffd43b", mpCost: 4 },
  arcLeap: { name: "Arc Leap", power: 24, accuracy: 0.83, color: "#fab005", mpCost: 8 },
  thunderHorn: { name: "Thunder Horn", power: 38, accuracy: 0.69, color: "#f59f00", mpCost: 12 },
  shadowSwipe: { name: "Shadow Swipe", power: 18, accuracy: 0.9, color: "#6f42c1", mpCost: 5 },
  moonClaw: { name: "Moon Claw", power: 27, accuracy: 0.8, color: "#7048e8", mpCost: 9 },
  starfall: { name: "Starfall", power: 42, accuracy: 0.65, color: "#845ef7", mpCost: 14 },
  focus: { name: "Focus", power: 0, accuracy: 1, color: "#6c5ce7", buff: 5, mpCost: DEFAULT_MOVE_MP_COST },
  heal: { name: "Heal", power: 0, accuracy: 1, color: "#2a9d8f", heal: 16, mpCost: DEFAULT_MOVE_MP_COST }
};

export function getMoveCost(move) {
  return Number.isFinite(move?.mpCost) ? Math.max(0, Math.round(move.mpCost)) : DEFAULT_MOVE_MP_COST;
}
