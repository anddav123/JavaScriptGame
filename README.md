# Orb Bound

A lightweight JavaScript browser RPG prototype with:

- A scrolling 2D overworld rendered on a canvas
- Tile-based exploration with walls, signs, and encounter grass
- Multiple maps connected by walk-on triggers such as cave mouths and doors
-  turn-based battles with moves, healing, and escape chance
- A player menu and party screen for browsing captured creatures
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
- Back out of party screen: `Esc` or `Backspace`
- Battle actions: click moves, `Tonic`, `Catch`, or `Run`

## Files

- `index.html`: app shell and canvas mount
- `style.css`: page styling and game shell UI
- `assets/player-sprite.png`: 48px-frame player sprite sheet, with `assets/player-sprite.svg` as fallback
- `src/game.js`: game state, rendering, and input coordination
- `src/constants.js`: shared sprite, save, and tile constants
- `src/cutscenes.js`: story scene data and dialogue steps
- `src/moves.js`: move definitions
- `src/creatures.js`: creature and enemy definitions
- `src/battle.js`: encounter setup, combat actions, battle navigation, and battle rendering
- `src/save.js`: save serialization, export, import, and load prompts
- `src/sprites.js`: player and creature sprite loading, caching, fallback drawing, and sprite rendering
- `src/story.js`: cutscene state, image loading, dialogue advancement, and cutscene rendering
- `src/world.js`: current map queries, camera movement, triggers, signs, and player movement
- `src/maps.js`: map terrain, signs, triggers, and encounter settings
- `assets/story/`: story and cutscene artwork, with PNG images and SVG fallbacks

## Map Notes

- Maps live in the `worldMaps` object in `src/maps.js`
- Each map has `terrain`, `signs`, `triggers`, a `name`, and an `encounterRate`
- `triggers` let you move between maps by stepping on door or cave tiles
- The camera follows the player automatically, so maps can now be larger than the canvas

## Next ideas

- Replace placeholder shapes with sprite sheets
- Add NPCs, quests, and interior maps
- Add party swapping during battle and status effects
- Save progress with `localStorage`
