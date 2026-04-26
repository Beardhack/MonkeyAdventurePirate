# Monkey Adventure Pirate Plan

## Summary

Build **Monkey Adventure Pirate** into a 10-level vanilla HTML/CSS/JS canvas adventure with a linear island chain, adjacent-only backtracking, explicit item clues, and about half the levels containing caves, ship holds, huts, vaults, or other interior sub-areas.

Keep the current identity:

- No external assets or libraries.
- Runs by opening `index.html` directly.
- Procedural pixel art drawn in `game.js`.
- HTML/CSS HUD overlay stays crisp.
- Travel remains linear: `1 <-> 2 <-> 3 <-> ... <-> 10`.
- No world map or free destination picker.

## Current State

Built levels:

1. **Banana Skull Island**
   - Interior: `Moon Banana Cave`
   - Quest: `Sail Cloth`, `Wooden Planks`, `Golden Compass`
   - Win/route: repair raft to reach Level 2

2. **Coconut Crown Atoll**
   - Quest: `Signal Lens`, `Ember Shell`
   - Route: light beacon to reach Level 3
   - Backtrack: raft returns to Level 1

3. **Rusty Rudder Reef**
   - Interior: `Sunken Ship Hold`
   - Quest: `Rusty Rudder`, `Coral Key`, `Brass Bell`
   - Route: ring ship bell to reach Level 4
   - Backtrack: raft returns to Level 2

4. **Mango Volcano Isle**
   - Quest: `Cool Mango`, `Obsidian Plug`, `Smoke Charm`
   - Steam gate: first `Cool Mango` cools the vent; a second tree beyond the cleared vent blocks the only altar path and provides the altar mango
   - Route: calm volcano altar to reach Level 5
   - Backtrack: raft returns to Level 3

5. **Sugarcane Smuggler Cove**
   - Interior: `Smuggler Storehouse`
   - Quest: `Storehouse Key`, `Crate Hook`, `Star Chart`
   - Route: read the Star Chart at the lookout pier to reach Level 6
   - Backtrack: cove raft returns to Level 4

6. **Moonlit Mangrove**
   - Interior: `Moon Grotto`
   - Quest: `Moon Pearl`, `Silver Leaf`, `Glow Reed`
   - Required backtrack: get `Moonlit Key`, return to Level 5 storehouse crate for `Glow Reed`
   - Route: align the moon compass stone to reach Level 7
   - Backtrack: mangrove raft returns to Level 5

7. **Stormglass Shoal**
   - Quest: `Stormglass Shard`, `Copper Rod`, `Kite String`
   - Route: repair the storm mast and catch lightning to reach Level 8
   - Backtrack: storm skiff returns to Level 6

8. **Pearlbone Dunes**
   - Quest: `Sun Dial`, `Pearl Token`, `Cactus Canteen`
   - Route: align the sun dial to reach Level 9
   - Backtrack: dune raft returns to Level 7

9. **Whispering Wreckyard**
   - Quest: `Ghost Compass`, `Anchor Charm`, `Captain's Token`
   - Route: restore the ghost compass to reveal Level 10
   - Backtrack: wreckyard raft returns to Level 8

10. **Crown of the Banana King**
   - Interior: `Throne Vault`
   - Quest: `Royal Banana Gem`, `Throne Lever`, `Crown Fragment`
   - Route/final win: reassemble the crown at the Banana King's throne to reveal the golden escape ship
   - Backtrack: royal dock returns to Level 9

## Implementation Rules

- Each main level gets one `QUESTS` entry, one main map, interactables, enemies, objective text, and a route trigger to the next level.
- Interior maps share the parent level's quest unless they intentionally introduce a later cross-level lock.
- All key item pickup text must be explicit, e.g. "This key matches the rusted storehouse door back on Sugarcane Smuggler Cove."
- Backtracking is adjacent-only. A level may only connect to its immediate previous and next level.
- Avoid making every level use an interior. Target interiors on Levels 1, 3, 5, 6, and 10.
- When adding a new level, move final `VICTORY` from the previous endpoint to the new level's final interaction.

## 10-Level Roadmap

### Level 5: Sugarcane Smuggler Cove

- Theme: sugarcane maze, docks, crates, hidden pirate storehouse.
- Interior: **Smuggler Storehouse**.
- Quest items: `Storehouse Key`, `Crate Hook`, `Star Chart`.
- Enemies: `Cane Corsair`, `Barrel Bruiser`, `Dock Sneak`.
- Interactables:
  - Locked storehouse door.
  - Suspicious crates.
  - Retired quartermaster NPC.
  - Crane/pulley that moves a crate after `Crate Hook`.
- Route forward: use `Star Chart` at lookout pier to reveal Level 6.
- Backtrack: cove raft returns to Level 4.

### Level 6: Moonlit Mangrove

- Theme: dark water, roots, moon pools, fireflies, reflective paths.
- Interior: **Moon Grotto** or hollow root chamber.
- Quest items: `Moon Pearl`, `Silver Leaf`, `Glow Reed`.
- Enemies: `Mud Crab`, `Vine Snake`, `Night Bat`.
- Required adjacent backtrack:
  - Level 5 storehouse has a moon-stamped crate.
  - Level 6 gives `Moonlit Key` or equivalent explicit unlock text.
  - Player returns to Level 5, opens crate, gets `Glow Reed`, then returns to Level 6.
- Route forward: place moon items at compass stone to reveal Level 7.
- Backtrack: mangrove raft returns to Level 5.

### Level 7: Stormglass Shoal

- Theme: storm beaches, broken masts, lightning rods, rain-slick stone.
- No interior.
- Quest items: `Stormglass Shard`, `Copper Rod`, `Kite String`.
- Enemies: `Storm Gull`, `Spark Crab`, `Rain Snake`.
- Interactables:
  - Broken lightning mast.
  - Washed-up kite frame.
  - Storm watcher NPC.
- Route forward: repair storm mast to catch lightning and open Level 8.
- Backtrack: storm skiff returns to Level 6.

### Level 8: Pearlbone Dunes

- Theme: white sand, bleached coral, mirage pools, buried markers.
- No interior.
- Quest items: `Sun Dial`, `Pearl Token`, `Cactus Canteen`.
- Enemies: `Sand Crab`, `Mirage Bat`, `Bone Snake`.
- Interactables:
  - Sun dial puzzle.
  - Mirage pool.
  - Buried chest.
- Route forward: align sun dial to reveal Level 9.
- Backtrack: dune raft returns to Level 7.

### Level 9: Whispering Wreckyard

- Theme: scattered ship skeletons, fog, ghostly pirate scraps.
- No full interior, but can use small wreck alcoves as exterior interactables.
- Quest items: `Ghost Compass`, `Anchor Charm`, `Captain's Token`.
- Enemies: `Ghost Crab`, `Fog Bat`, `Anchor Brute`.
- Interactables:
  - Whispering mast NPC.
  - Anchor gate.
  - Broken captain statue.
- Route forward: restore ghost compass to reveal Level 10.
- Backtrack: wreckyard raft returns to Level 8.

### Level 10: Crown of the Banana King

- Theme: golden ruins, banana statues, royal pirate throne.
- Interior: **Throne Vault** / final treasure chamber.
- Quest items: `Royal Banana Gem`, `Throne Lever`, `Crown Fragment`.
- Enemies: `Royal Crab Guard`, `Crown Snake`, `Treasure Bat`.
- Interactables:
  - Ancient monkey statues.
  - Throne room door.
  - Final treasure chest.
  - Banana King ghost NPC.
- Final win: reassemble crown at the throne and reveal the golden escape ship.
- Backtrack: royal dock returns to Level 9 before final victory.
- Status: built. Level 9 now routes here instead of ending the game.

## Technical Plan

- Keep using the existing `QUESTS`, `maps`, `interactables`, `enemies`, `portal`, and adjacent travel patterns.
- Add future levels as data-first entries in `data.js` before adding special-case code in `game.js`.
- Reuse `portal` for interiors:
  - `targetMap`
  - `targetX`
  - `targetY`
  - `targetFacing`
  - `lines`
- Prefer reusable handlers for common patterns:
  - collect item
  - locked gate
  - adjacent travel
  - final route trigger
  - interior portal
- Current interaction cleanup:
  - `interact()` uses an object-type dispatch table instead of a long conditional ladder.
  - repeated pickups use `collectItemAndSpeak()` for item grants, optional chest-open state, banana rewards, pickup audio, and dialogue.
- Inventory display:
  - game logic keeps acquired quest items for progression checks.
  - the HUD lists only currently carried items.
  - locks, route puzzles, and final assembly mark used items as spent so they leave the active inventory.
- Current split:
  - `data.js` owns quests, maps, interactables, enemies, and procedural map builders.
  - `game.js` owns state, input, interactions, battle, travel, rendering, and audio.
  - Keep plain script tags; no bundler.
- Renderer split decision:
  - Defer `render.js` until after Level 10 or final polish.
  - The `data.js` boundary is stable, and Level 10 will likely add the last major batch of final-room sprites before a renderer split is worth the churn.

## Test Plan

For every new level:

- Run `node --check data.js` and `node --check game.js`.
- Script the happy path from Level 1 through the new endpoint.
- Script backward and forward adjacent travel for the new route.
- Verify restart resets:
  - inventory
  - enemy state
  - opened chests
  - gates
  - interior positions
  - route flags
- Verify HUD:
  - correct map name
  - correct inventory count
  - correct collected item list
  - correct objective after each quest state
- Latest scripted verification:
  - `node --check data.js`
  - `node --check game.js`
  - `node --check tests/happy-path.js`
  - `node tests/happy-path.js`
  - split-load happy path from Level 1 through Level 10 victory
  - adjacent backtracking Level 9 `<->` Level 10
  - restart reset for Level 10 inventory, enemies, interiors, gates, and route flags
- Manually test in browser:
  - keyboard controls
  - touch controls
  - pause/resume
  - battle
  - entering/exiting interiors
  - game over/restart
  - final victory

## Assumptions

- `PLAN.md` should be a hybrid roadmap: creative direction plus implementation rules.
- The full game target is 10 main levels.
- Travel stays adjacent-only for the whole game.
- About half the levels should have interiors.
- Item text should explicitly tell players what earlier obstacle or future puzzle the item relates to.
- No external libraries, images, audio files, build step, or server requirement.
