# Local Development

This project can run as a static browser game, or with the PHP/MySQL backend for account-based saves.

## Project files

- `index.html`: app shell and canvas mount
- `style.css`: page styling and game shell UI
- `changelog.md`: dated project change history
- `assets/menu.svg`: title screen source artwork
- `assets/menu.png`: optimized 960x576 title screen runtime background generated from `assets/menu.svg`
- `assets/player-sprite.png`: 48px-frame player sprite sheet, with `assets/player-sprite.svg` as fallback/source artwork
- `assets/npc/`: NPC sprite sheets
- `assets/creatures/png/`: optimized 256px runtime creature PNGs
- `assets/creatures/svg/`: SVG fallbacks/source artwork
- `assets/story/`: story and cutscene artwork, with canvas-sized PNG images and SVG fallbacks/source artwork

## Frontend module layout

The browser game is loaded from `src/game.js`, which wires the shared game state to smaller controller modules.

- `src/game.js`: bootstrap, controller wiring, scene routing, input coordination, and top-level render loop
- `src/ascensionCutscene.js`: runtime ascension cutscene state, sprite morph animation, and input advancement
- `src/battleProgression.js`: battle XP, level-up, ascension, and move-learning rules
- `src/campMenu.js`: camp rest and creature storage switching UI
- `src/canvasUi.js`: shared canvas drawing helpers
- `src/constants.js`: shared sprite, save, tile, MP, and creature progression constants
- `src/creatures.js`: creature templates, starting moves, ascension rules, and enemy template setup
- `src/cutscenes.js`: story scene data and dialogue steps
- `src/maps.js`: map terrain, buildings, furniture, NPCs, signs, triggers, encounter rates, wild creature pools, and wild level ranges
- `src/moves.js`: move definitions, MP costs, healing moves, and move cost helpers
- `src/startMenu.js`: title screen rendering, selection, and pointer hit detection
- `src/menu.js`: in-game menu and party screen
- `src/world.js`: map lookups, collisions, triggers, camera, interactions, and player tile movement
- `src/worldObjects.js`: building, furniture, sign, and trigger rendering
- `src/nonPlayerCharacter.js`: NPC sprite loading, patrol state, dialogue markers, and NPC-only smooth walking visuals
- `src/battle.js`: encounter setup, turn flow, player actions, battle input, and battle drawing
- `src/save.js`: database save flow, JSON export/import, save validation, camp storage, and modal prompts
- `src/sprites.js`: player and creature sprite loading, caching, preloading, fallback drawing, and sprite rendering
- `src/story.js`: cutscene state, image loading, dialogue advancement, and cutscene rendering

For small refactors, prefer moving cohesive behavior into one of these modules before adding new responsibilities to `game.js`.

## Gameplay data notes

- Maps live in the `worldMaps` object in `src/maps.js`
- Each map has `terrain`, `signs`, `triggers`, a `name`, and an `encounterRate`
- Maps can also define `buildings`, `furniture`, and `npcs`
- `wildCreatures` controls which creatures can appear on that map
- `wildLevelRange` controls the inclusive random level range for wild encounters
- Sunmeadow currently spawns wild creatures from levels 1-6
- Ember Cave currently spawns wild creatures from levels 3-12
- `triggers` let the player move between maps by stepping on door or cave tiles
- NPC patrols can be static, horizontal/vertical, or circular depending on their map data
- NPC movement is visually smoothed in `src/nonPlayerCharacter.js`, while player movement keeps the original tile-step behavior in `src/world.js`

## Progression notes

- Player MP starts at 40 and is spent by creature moves
- Overworld steps restore 1 MP every 2 successful steps until full
- `MP +1` in battle restores 1 MP and forfeits the player's turn
- If no creature move can be afforded, the player turn is skipped and 1 MP is recovered
- The player party is capped at 5 creatures
- Captures beyond the party cap are stored in `player.campCreatures`
- Interacting with camp opens a menu to rest or swap stored creatures with party creatures
- Creature move costs are defined in `src/moves.js`; non-damage moves default to 2 MP
- Winning battles grants 2 XP to the active creature
- Every 10 XP grants 1 level, up to level 100
- Each level grants +2 max HP and +2 current HP
- Level-up messages appear after the battle closes
- `Cubling` ascends into `Dandelio` at level 20
- `Dandelio` ascends into `Folio` at level 50
- `Sproutrunk` ascends randomly into `Roselle` or `Lilphant` at level 30
- Ascended creatures keep their level, XP, current role, captured state, and custom nickname
- Ascension rules live on creature templates in `src/creatures.js`

## Quick checks

There is no package-managed test runner yet, but individual JavaScript modules can be syntax checked with Node:

```bash
node --check src/game.js
node --check src/battle.js
node --check src/battleProgression.js
node --check src/campMenu.js
```

## PHP/MySQL backend

Requirements:

- Docker Desktop or another Docker Compose compatible runtime

Start the local stack:

```bash
docker compose up -d --build
```

Local URLs:

- Game: <http://localhost:8080>
- API health check: <http://localhost:8080/api/health.php>
- phpMyAdmin: <http://localhost:8081>

Database connection details for local development:

- Host from containers: `mysql`
- Host from the Mac: `127.0.0.1:3307`
- Database: `orb_bound`
- User: `orb_bound_user`
- Password: `orb_bound_password`

Session cookie options:

- `TRUST_PROXY_HEADERS=false` by default. Set to `true` only when a trusted reverse proxy overwrites forwarded headers.
- `FORCE_SECURE_COOKIES=false` by default. Set to `true` in HTTPS production so session cookies are always marked `Secure`.

Stop the stack:

```bash
docker compose down
```

Reset the database completely:

```bash
docker compose down -v
docker compose up -d
```

## API endpoints

All endpoints return JSON.

- `GET /api/health.php`
- `GET /api/me.php`
- `POST /api/register.php` with `{ "username": "player1", "password": "password123" }`
- `POST /api/login.php` with `{ "username": "player1", "password": "password123" }`
- `POST /api/logout.php`
- `GET /api/save.php`
- `POST /api/save.php` with `{ "saveVersion": 1, "gameState": { ... } }`

Passwords are stored using PHP `password_hash()`.

## Frontend save flow

When running through the PHP/Apache container:

- `Start Adventure` prompts for a new username/password, registers the player, then starts the intro.
- `Load Adventure` prompts for username/password, logs in, and loads that player's MySQL save.
- In-game `Save Game` stores the current state against the logged-in player.
- `Export Save` and `Import Save` remain available as JSON backup options.

If you run the game with a plain static server, account-based saves will not work because the PHP endpoints are not executed. The frontend detects this and switches to static/local mode:

- `Start Local Adventure` starts without account creation
- `Import JSON Save` remains available from the title screen
- in-game `Save Game` falls back to JSON export
- database load shows a clear unavailable message

Use `docker compose up -d --build` for database-backed saves.
