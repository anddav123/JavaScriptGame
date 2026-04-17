# Echoes of Ember

A lightweight JavaScript browser RPG prototype with:

- A scrolling 2D overworld rendered on a canvas
- Tile-based exploration with walls, signs, and encounter grass
- Multiple maps connected by walk-on triggers such as cave mouths and doors
- Pokemon-style turn-based battles with moves, healing, and escape chance
- A Pokemon-inspired trainer menu and party screen for browsing captured creatures

## Run it

Open `index.html` in a browser, or serve the folder with any simple static server.

## Controls

- Move: `WASD` or arrow keys
- Open trainer menu: `Enter`
- Toggle fullscreen: `F` or the fullscreen button
- Menu navigation: `WASD` or arrow keys
- Confirm party/menu choice: `Enter`
- Back out of party screen: `Esc` or `Backspace`
- Battle actions: click moves, `Tonic`, `Catch`, or `Run`

## Files

- `index.html`: app shell and canvas mount
- `style.css`: page styling and game shell UI
- `src/game.js`: world logic, battle loop, rendering, and input

## Map Notes

- Maps live in the `worldMaps` object in `src/game.js`
- Each map has `terrain`, `signs`, `triggers`, a `name`, and an `encounterRate`
- `triggers` let you move between maps by stepping on door or cave tiles
- The camera follows the player automatically, so maps can now be larger than the canvas

## Next ideas

- Replace placeholder shapes with sprite sheets
- Add NPCs, quests, and interior maps
- Add party swapping during battle and status effects
- Save progress with `localStorage`
