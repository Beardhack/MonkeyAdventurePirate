# Monkey Adventure Pirate

A tiny retro 90s-style pixel adventure/JRPG MVP built with vanilla HTML, CSS, JavaScript, and an HTML5 canvas.

## How to Run

Open `index.html` in a modern browser. No build step, server, assets, or external libraries are required.

The page loads `data.js` first for quests, maps, interactables, enemies, and procedural map builders, then `game.js` for runtime state, input, interactions, rendering, and audio.

## Tests

Run `node --check data.js`, `node --check game.js`, and `node tests/happy-path.js` after gameplay or interaction changes. The happy-path script split-loads `data.js` before `game.js`, stubs the browser APIs, and verifies the route from Level 1 through Level 10 victory plus the Level 9 `<->` Level 10 backtrack and restart reset checks.

## Controls

- Arrow keys or WASD: move
- E or Space: interact / confirm
- Enter: confirm on menus
- Escape: pause or back
- M: mute or unmute sound
- Touch controls appear automatically on coarse-pointer devices, with a D-pad, E action button, and pause button.

## Objective

Captain Bananas has shipwrecked on Banana Skull Island. Explore the beach, jungle, shipwreck, lagoon, and cave. Collect all three raft parts:

- Sail Cloth
- Wooden Planks
- Golden Compass

Then return to the lagoon raft, repair it, and sail to Coconut Crown Atoll. On the atoll, find the Signal Lens and Ember Shell, then light the hilltop beacon to reveal Rusty Rudder Reef. Recover the Rusty Rudder and Coral Key, enter the Sunken Ship Hold for the Brass Bell, then ring the restored ship bell to reach Mango Volcano Isle. Use the first Cool Mango to cool the steam vent, pick a second Cool Mango beyond the cleared steam path, gather the Obsidian Plug and Smoke Charm, then calm the volcano altar to reveal Sugarcane Smuggler Cove.

At Sugarcane Smuggler Cove, talk to the retired quartermaster for the Storehouse Key, open suspicious crates for the Crate Hook, unlock the Smuggler Storehouse to find the Star Chart, then use the hook at the crane pulley and read the chart at the lookout pier to reveal Moonlit Mangrove.

In Moonlit Mangrove, collect the Silver Leaf, enter the Moon Grotto for the Moon Pearl and Moonlit Key, backtrack to the Smuggler Storehouse to unlock the moon-stamped crate for the Glow Reed, then return to the mangrove and align the moon compass stone to reveal Stormglass Shoal.

On Stormglass Shoal, collect the Stormglass Shard, Copper Rod, and Kite String, then raise the repaired storm mast to catch lightning and reveal Pearlbone Dunes.

On Pearlbone Dunes, dig up the Sun Dial, claim the Pearl Token from the mirage pool, grab the Cactus Canteen, then align the sun dial puzzle to reveal Whispering Wreckyard.

In Whispering Wreckyard, recover the Ghost Compass, find the Anchor Charm, open the anchor gate for the Captain's Token, then restore the ghost compass stand to reveal the Crown of the Banana King.

At the Crown of the Banana King, claim the Royal Banana Gem, set it into the ancient monkey statues to recover the Throne Lever, open the Throne Vault, take the Crown Fragment from the final treasure chest, then reassemble the crown at the Banana King's throne to reveal the golden escape ship and win.

Unlocked routes stay adjacent and linear: Island <-> Atoll <-> Reef <-> Volcano <-> Cove <-> Mangrove <-> Stormglass <-> Dunes <-> Wreckyard <-> Crown. Use the local raft, beacon route, ship bell current, volcano altar current, cove lookout, mangrove compass, storm mast, sun dial, ghost compass stand, or royal dock to move back and forth one step at a time.

## MVP Notes

- All art is procedural pixel art drawn in code.
- Level data and procedural map generation live in `data.js`; the game loop and renderer live in `game.js`.
- The HUD shows HP, bananas, current map, objective, and a running inventory list of currently carried items. Quest and key items leave the active inventory once they are spent on a lock, route puzzle, or final assembly.
- Sound effects are generated with the Web Audio API.
- Combat is intentionally simple: Attack, Throw Banana, or Run.
- The island, cave, atoll, reef, ship hold, volcano, cove, storehouse, mangrove, moon grotto, stormglass shoal, pearlbone dunes, whispering wreckyard, royal ruins, and throne vault are small, focused maps designed for a complete short playthrough.
