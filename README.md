# Orb Bound

A lightweight JavaScript browser RPG prototype with:

- A scrolling 2D overworld rendered on a canvas
- Tile-based exploration with walls, signs, and encounter grass
- Multiple maps connected by walk-on triggers such as cave mouths and doors
- Data-driven buildings, furniture, signs, NPCs, and patrol routes
- Turn-based battles with move MP costs, map-ranged wild levels, creature leveling, ascension, healing, capture orbs, item use, drops, and escape chance
- A player menu, party screen, and item bag for browsing captured creatures, levels, XP, HP, moves, items, orbs, and resources
- Runtime gathering spots for herbs, mushrooms, gems, and cave moss
- Water tiles and a save-ready Swim traversal skill for future maps
- Shopkeeper-assisted crafting with learnable recipes
- A title screen using custom menu artwork before gameplay begins

## Run it

Serve the folder with any simple static server, then open the local URL in a browser.

```bash
npx serve .
```

Opening `index.html` directly may fail in some browsers because the game uses JavaScript modules.

Static mode remains supported:

- `Start Local Adventure` starts a game without an account
- `Import JSON Save` loads an exported JSON save
- in-game `Export Save` remains available for backups
- database save/load options are disabled or redirected when the PHP API is unavailable

For local PHP/MySQL account-save development, see `README.dev.md`.

## Controls

- Start menu navigation: `W` / `S` or arrow keys, confirm with `Enter` or `Space`
- Story/dialogue scenes: `Enter` or `Space`
- Move: `WASD` or arrow keys
- Interact with the tile in front of the player: `Space`; learned Swim prompts before entering deep water
- Open player menu: `Enter`
- Toggle fullscreen: `F` or the fullscreen button
- Menu navigation: `WASD` or arrow keys
- Confirm party/menu choice: `Enter` or `Space`
- Back out of party screen: `Backspace`
- Camp menu: interact with camp using `Space`, then choose `Rest` or `Switch Creatures`
- Battle actions: click moves, `Items`, `Catch`, `MP +1`, or `Run`

## Battle and Progression

- Creature moves spend MP, and MP can be recovered by walking, using focus tonics, or using `MP +1` in battle
- Winning battles grants XP, level-ups, new moves, and eventual creature ascensions
- Ascensions play a short sprite-morph cutscene before returning to the overworld
- Battle `Items` lists HP and MP tonics together; using one consumes the player turn
- Capturing uses available capture orbs, including stronger learned-orb recipes such as Ember Capture Orbs
- Battle resource drops unlock after the Meadow Ranger explains them, then defeated wild creatures can drop map/creature-flavoured materials
- The player can carry 5 creatures; extra captures are sent to camp storage
- If camp storage is full, a new catch can replace a stored creature or be released
- Camp can fully restore creature health and player MP or switch stored creatures into the party
- Maps can include connected areas, buildings, furniture, signs, NPCs, patrol routes, water, and wild encounter ranges
- NPC patrols are visually smoothed, while player movement keeps the original tile-step feel

## Gathering and Crafting

- Resource spots are runtime-only map objects and are refreshed when gathered
- Gathering spots have distinct visuals for Meadow Herb, Glow Mushroom, Shard Gem, Ember Gem, and Cave Moss
- Shopkeeper Lily introduces gathering/crafting on first interaction, then opens shop crafting directly afterwards
- The item bag has tabs for Items, Orbs, and Resources
- Basic recipes are learned by default; advanced recipes such as Greater Tonics and Ember Capture Orbs are hidden until learned

For implementation notes, module layout, and backend setup, see `README.dev.md`.

## Next ideas

- Add ways to discover locked recipes through field notes, ranger rewards, and later shopkeepers
- Add quest objectives and more story scenes
- Add party swapping during battle and status effects
- Add new map tile types (Water, Sand, Snow...)
