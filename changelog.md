# Changelog

Project changes are recorded here by date. The README stays focused on what the project is and how to run it.

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
