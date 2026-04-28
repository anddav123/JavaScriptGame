# Orb Bound

A lightweight JavaScript browser RPG prototype with:

- A scrolling 2D overworld rendered on a canvas
- Tile-based exploration with walls, signs, and encounter grass
- Multiple maps connected by walk-on triggers such as cave mouths and doors
- Turn-based battles with move MP costs, map-ranged wild levels, creature leveling, ascension, healing, and escape chance
- A player menu and party screen for browsing captured creatures, levels, XP, HP, and moves
- A title screen with a simple start menu before gameplay begins

## Run it

Serve the folder with any simple static server, then open the local URL in a browser.

```bash
npx serve .
```

Opening `index.html` directly may fail in some browsers because the game uses JavaScript modules.

## Controls

- Start menu navigation: `W` / `S` or arrow keys, confirm with `Enter`
- Story dialogue: `Enter`
- Move: `WASD` or arrow keys
- Open player menu: `Enter`
- Toggle fullscreen: `F` or the fullscreen button
- Menu navigation: `WASD` or arrow keys
- Confirm party/menu choice: `Enter`
- Back out of party screen: `Backspace`
- Battle actions: click moves, `Tonic`, `Catch`, `MP +1`, or `Run`

## Battle and Progression

- Player MP starts at 25 and is spent by creature moves
- Overworld steps restore 1 MP every 2 successful steps until full
- `MP +1` in battle restores 1 MP and forfeits the player's turn
- If no creature move can be afforded, the player turn is skipped and 1 MP is recovered
- Creature move costs are defined in `src/moves.js`; non-damage moves default to 2 MP
- The move catalog includes starter moves plus a larger pool of elemental attack moves for future learnsets
- Winning battles grants 2 XP to the active creature
- Every 10 XP grants 1 level, up to level 100
- Each level grants +2 max HP and +2 current HP
- Level-up messages appear after the battle closes
- Ascensions play a short sprite-morph cutscene before returning to the overworld

## Ascension

- `Cubling` ascends into `Dandelio` at level 20
- `Dandelio` ascends into `Folio` at level 50
- `Sproutrunk` ascends randomly into `Roselle` or `Lilphant` at level 30
- Ascended creatures keep their level, XP, current role, captured state, and custom nickname
- Ascension cutscenes preserve the original sprite briefly, then morph into the new creature sprite
- Ascension rules live on creature templates in `src/creatures.js`

## Files

- `index.html`: app shell and canvas mount
- `changelog.md`: dated project change history
- `style.css`: page styling and game shell UI
- `assets/player-sprite.png`: 48px-frame player sprite sheet, with `assets/player-sprite.svg` as fallback
- `src/game.js`: game state, rendering, input coordination, party UI, scene routing, and overworld MP recovery
- `src/ascensionCutscene.js`: runtime ascension cutscene state, sprite morph animation, and input advancement
- `src/constants.js`: shared sprite, save, tile, MP, and creature progression constants
- `src/cutscenes.js`: story scene data and dialogue steps
- `src/moves.js`: move definitions, MP costs, healing moves, and move cost helpers
- `src/creatures.js`: creature templates, starting moves, ascension rules, and enemy template setup
- `src/battle.js`: encounter setup, combat actions, MP recovery, XP rewards, ascension, battle navigation, and battle rendering
- `src/save.js`: save serialization, export, import, load prompts, MP state, and creature progression state
- `src/sprites.js`: player and creature sprite loading, caching, preloading, fallback drawing, and sprite rendering
- `src/story.js`: cutscene state, image loading, dialogue advancement, and cutscene rendering
- `src/world.js`: current map queries, camera movement, triggers, signs, and player movement
- `src/maps.js`: map terrain, signs, triggers, encounter rates, wild creature pools, and wild level ranges
- `assets/story/`: story and cutscene artwork, with PNG images and SVG fallbacks

## Map Notes

- Maps live in the `worldMaps` object in `src/maps.js`
- Each map has `terrain`, `signs`, `triggers`, a `name`, and an `encounterRate`
- `wildCreatures` controls which creatures can appear on that map
- `wildLevelRange` controls the inclusive random level range for wild encounters
- Sunmeadow currently spawns wild creatures from levels 1-10
- Ember Cave currently spawns wild creatures from levels 3-12
- `triggers` let you move between maps by stepping on door or cave tiles
- The camera follows the player automatically, so maps can now be larger than the canvas

## Next ideas

- Add NPCs, quests, and interior maps
- Add move learning by level and richer creature move pools
- Add party swapping during battle and status effects
- Save progress with `localStorage`
