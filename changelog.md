# Changelog

Project changes are recorded here by date. The README stays focused on what the project is and how to run it.

## 2026-05-09

- Added a five-creature party limit, with extra captured creatures sent to camp storage.
- Added a 200-creature camp storage limit with a capture overflow menu to replace a stored creature or release the new catch.
- Added a camp interaction menu for resting or switching creatures between the active party and camp storage.
- Persisted camp-stored creatures in JSON/database saves.
- Refactored canvas helpers, start menu, in-game menu, world objects, and NPC logic out of `src/game.js`.
- Added `src/worldObjects.js` for buildings, furniture, signs, and walk-on trigger rendering.
- Added `src/nonPlayerCharacter.js` for NPC rendering, sprite loading, dialogue positioning, and patrol animation.
- Kept player movement on the original tile-step behavior while adding NPC-only smooth patrol walking visuals.
- Added `src/canvasUi.js`, `src/menu.js`, and `src/startMenu.js` for shared canvas drawing and menu controllers.
- Extracted battle XP, level-up, ascension, and move-learning rules into `src/battleProgression.js`.
- Slimmed `src/battle.js` so it focuses more on encounter setup, turn flow, player actions, battle input, and battle drawing.

## 2026-05-07

- Added campsite support with party recovery and save/import persistence.
- Added building rendering, door interactions, and interior maps for cottages and the Ranger Field Station.
- Added NPC rendering with sprite support, dialogue, and configurable patrols including horizontal and circular routes.
- Added a party-fainted cutscene before returning the player to camp or the adventure start.
- Made building signs data-driven with a `sign` field and added the Ranger Field Station sign.
- Updated interior wall tiles to render as plain light grey squares.
- Loosened server-side map ID validation to use a safe ID pattern instead of a duplicated hardcoded map list.

## 2026-05-02

- Added creature level-up learnsets with new moves unlocked between levels 5-100.
- Added a four-move limit for player creatures, with a keyboard-controlled prompt to forget a move or decline the new move.
- Persisted each player creature's known moves in JSON/database saves.

## 2026-05-01

- Regenerated runtime PNG artwork from SVG sources for current canvas usage.
- Scaled creature runtime PNGs from 512x512 to 256x256 while keeping SVG source/fallback files.
- Resized the intro story PNG to the exact cover size used by the game canvas.
- Switched player and creature sprite loading to use PNG first, with SVG as fallback/source artwork.
- Updated README asset notes for the optimized runtime PNG workflow.

## 2026-04-28

- Added player MP with a starting pool of 25.
- Added move MP costs and blocked unaffordable moves in battle.
- Added overworld MP recharge: 1 MP every 2 successful steps.
- Added battle MP recovery through the `MP +1` action.
- Added `assets/menu.svg` as the title screen source artwork and `assets/menu.png` as the faster runtime background.
- Added automatic skipped-turn MP recovery when no active creature moves can be afforded.
- Added creature XP, levels, level cap, and HP growth.
- Added ascension rules for `Cubling`, `Dandelio`, and `Sproutrunk`.
- Added after-battle messages for level-ups and ascensions.
- Added after-battle ascension cutscenes that morph the original creature sprite into the new form.
- Moved runtime ascension cutscene logic into its own controller module.
- Deferred HP refill and ascension form changes until after the battle window closes.
- Added map-based wild creature level ranges.
- Added 30 new attack moves to the move catalog.
- Renamed the creature healing move to `Heal`.
- Renamed the battle item action type to `tonic` to avoid confusion with the `Heal` move.
- Updated README documentation for the new battle, progression, move, and map systems.
