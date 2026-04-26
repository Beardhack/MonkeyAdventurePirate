"use strict";

// Static quest, map, object, enemy, and procedural level data.
const PARTS = ["Sail Cloth", "Wooden Planks", "Golden Compass"];
const BEACON_ITEMS = ["Signal Lens", "Ember Shell"];
const REEF_ITEMS = ["Rusty Rudder", "Coral Key", "Brass Bell"];
const VOLCANO_ITEMS = ["Cool Mango", "Obsidian Plug", "Smoke Charm"];
const COVE_ITEMS = ["Storehouse Key", "Crate Hook", "Star Chart"];
const MANGROVE_ITEMS = ["Moon Pearl", "Silver Leaf", "Glow Reed"];
const STORM_ITEMS = ["Stormglass Shard", "Copper Rod", "Kite String"];
const DUNE_ITEMS = ["Sun Dial", "Pearl Token", "Cactus Canteen"];
const WRECK_ITEMS = ["Ghost Compass", "Anchor Charm", "Captain's Token"];
const CROWN_ITEMS = ["Royal Banana Gem", "Throne Lever", "Crown Fragment"];
const QUESTS = {
  raft: {
    statusLabel: "Parts",
    items: [
      { name: PARTS[0], label: "Sail" },
      { name: PARTS[1], label: "Planks" },
      { name: PARTS[2], label: "Compass" }
    ],
    findObjective: "Find the raft parts",
    readyObjective: "Repair the raft at the lagoon"
  },
  beacon: {
    statusLabel: "Beacon",
    items: [
      { name: BEACON_ITEMS[0], label: "Lens" },
      { name: BEACON_ITEMS[1], label: "Shell" }
    ],
    findObjective: "Find beacon supplies",
    readyObjective: "Light the hilltop beacon"
  },
  reefBell: {
    statusLabel: "Bell",
    items: [
      { name: REEF_ITEMS[0], label: "Rudder" },
      { name: REEF_ITEMS[1], label: "Key" },
      { name: REEF_ITEMS[2], label: "Bell" }
    ],
    findObjective: "Recover reef bell pieces",
    readyObjective: "Ring the restored ship bell"
  },
  volcanoCalm: {
    statusLabel: "Volcano",
    items: [
      { name: VOLCANO_ITEMS[0], label: "Mango" },
      { name: VOLCANO_ITEMS[1], label: "Plug" },
      { name: VOLCANO_ITEMS[2], label: "Charm" }
    ],
    findObjective: "Gather volcano offerings",
    readyObjective: "Calm the volcano altar"
  },
  coveChart: {
    statusLabel: "Cove",
    items: [
      { name: COVE_ITEMS[0], label: "Key" },
      { name: COVE_ITEMS[1], label: "Hook" },
      { name: COVE_ITEMS[2], label: "Chart" }
    ],
    findObjective: "Uncover the smuggler cove route",
    readyObjective: "Read the chart at the lookout pier"
  },
  mangroveCompass: {
    statusLabel: "Moon",
    items: [
      { name: MANGROVE_ITEMS[0], label: "Pearl" },
      { name: MANGROVE_ITEMS[1], label: "Leaf" },
      { name: MANGROVE_ITEMS[2], label: "Reed" }
    ],
    findObjective: "Gather moon compass pieces",
    readyObjective: "Align the moon compass stone"
  },
  stormMast: {
    statusLabel: "Storm",
    items: [
      { name: STORM_ITEMS[0], label: "Glass" },
      { name: STORM_ITEMS[1], label: "Rod" },
      { name: STORM_ITEMS[2], label: "String" }
    ],
    findObjective: "Repair the storm mast",
    readyObjective: "Raise the storm mast"
  },
  duneDial: {
    statusLabel: "Dunes",
    items: [
      { name: DUNE_ITEMS[0], label: "Dial" },
      { name: DUNE_ITEMS[1], label: "Pearl" },
      { name: DUNE_ITEMS[2], label: "Canteen" }
    ],
    findObjective: "Solve the dune mirage",
    readyObjective: "Align the sun dial"
  },
  wreckCompass: {
    statusLabel: "Wreck",
    items: [
      { name: WRECK_ITEMS[0], label: "Compass" },
      { name: WRECK_ITEMS[1], label: "Anchor" },
      { name: WRECK_ITEMS[2], label: "Token" }
    ],
    findObjective: "Restore the ghost compass",
    readyObjective: "Restore the ghost compass"
  },
  crownVault: {
    statusLabel: "Crown",
    items: [
      { name: CROWN_ITEMS[0], label: "Gem" },
      { name: CROWN_ITEMS[1], label: "Lever" },
      { name: CROWN_ITEMS[2], label: "Fragment" }
    ],
    findObjective: "Recover the crown relics",
    readyObjective: "Reassemble the Banana King's crown"
  }
};

const maps = {
  island: {
    name: "Banana Skull Island",
    quest: "raft",
    voidTile: "~",
    tiles: buildIslandMap()
  },
  cave: {
    name: "Moon Banana Cave",
    quest: "raft",
    voidTile: "#",
    tiles: buildCaveMap()
  },
  atoll: {
    name: "Coconut Crown Atoll",
    quest: "beacon",
    voidTile: "~",
    tiles: buildAtollMap()
  },
  reef: {
    name: "Rusty Rudder Reef",
    quest: "reefBell",
    voidTile: "~",
    tiles: buildReefMap()
  },
  shipHold: {
    name: "Sunken Ship Hold",
    quest: "reefBell",
    voidTile: "#",
    tiles: buildShipHoldMap()
  },
  volcano: {
    name: "Mango Volcano Isle",
    quest: "volcanoCalm",
    voidTile: "~",
    tiles: buildVolcanoMap()
  },
  cove: {
    name: "Sugarcane Smuggler Cove",
    quest: "coveChart",
    voidTile: "~",
    tiles: buildCoveMap()
  },
  storehouse: {
    name: "Smuggler Storehouse",
    quest: "coveChart",
    voidTile: "#",
    tiles: buildStorehouseMap()
  },
  mangrove: {
    name: "Moonlit Mangrove",
    quest: "mangroveCompass",
    voidTile: "~",
    tiles: buildMangroveMap()
  },
  moonGrotto: {
    name: "Moon Grotto",
    quest: "mangroveCompass",
    voidTile: "#",
    tiles: buildMoonGrottoMap()
  },
  stormglass: {
    name: "Stormglass Shoal",
    quest: "stormMast",
    voidTile: "~",
    tiles: buildStormglassMap()
  },
  dunes: {
    name: "Pearlbone Dunes",
    quest: "duneDial",
    voidTile: "~",
    tiles: buildDunesMap()
  },
  wreckyard: {
    name: "Whispering Wreckyard",
    quest: "wreckCompass",
    voidTile: "~",
    tiles: buildWreckyardMap()
  },
  crownRuins: {
    name: "Crown of the Banana King",
    quest: "crownVault",
    voidTile: "~",
    tiles: buildCrownRuinsMap()
  },
  throneVault: {
    name: "Throne Vault",
    quest: "crownVault",
    voidTile: "#",
    tiles: buildThroneVaultMap()
  }
};

function makeFreshInventory() {
  const inventory = {};
  Object.values(QUESTS).forEach((quest) => {
    quest.items.forEach((item) => {
      inventory[item.name] = false;
    });
  });
  inventory["Moonlit Key"] = false;
  return inventory;
}

function makeInteractables() {
  return [
    {
      id: "sailChest",
      map: "island",
      type: "chest",
      x: 8,
      y: 18,
      item: "Sail Cloth",
      solid: true,
      visibleWhenInactive: true,
      lines: [
        "The chest creaks open with a sandy burp.",
        "Inside: Sail Cloth! Also three grains of heroic lint."
      ]
    },
    {
      id: "bananaChest",
      map: "island",
      type: "chest",
      x: 14,
      y: 20,
      bananas: 2,
      solid: true,
      visibleWhenInactive: true,
      lines: [
        "A tiny stash chest rattles open.",
        "Captain Bananas pockets 2 emergency bananas."
      ]
    },
    {
      id: "wreckage",
      map: "island",
      type: "wreckage",
      x: 5,
      y: 14,
      item: "Wooden Planks",
      solid: true,
      lines: [
        "The wreck coughs up some sturdy planks.",
        "They smell like salt, thunder, and poor decisions."
      ]
    },
    {
      id: "parrot",
      map: "island",
      type: "parrot",
      x: 13,
      y: 16,
      solid: true
    },
    {
      id: "caveEntrance",
      map: "island",
      type: "cave",
      x: 24,
      y: 5,
      solid: true
    },
    {
      id: "raft",
      map: "island",
      type: "raft",
      x: 27,
      y: 16,
      solid: true
    },
    {
      id: "caveExit",
      map: "cave",
      type: "exit",
      x: 8,
      y: 10,
      solid: false
    },
    {
      id: "compassChest",
      map: "cave",
      type: "chest",
      x: 8,
      y: 4,
      item: "Golden Compass",
      solid: true,
      visibleWhenInactive: true,
      lines: [
        "The cave chest pops open with a dramatic echo.",
        "Golden Compass found! It points toward snacks and freedom."
      ]
    },
    {
      id: "arrivalRaft",
      map: "atoll",
      type: "arrivalRaft",
      x: 2,
      y: 14,
      solid: true
    },
    {
      id: "lensChest",
      map: "atoll",
      type: "chest",
      x: 6,
      y: 6,
      item: "Signal Lens",
      solid: true,
      visibleWhenInactive: true,
      lines: [
        "A blue supply chest pops open with a polite little clack.",
        "Signal Lens found! It catches sunlight like bottled lightning."
      ]
    },
    {
      id: "emberTidepool",
      map: "atoll",
      type: "tidepool",
      x: 8,
      y: 12,
      item: "Ember Shell",
      solid: false,
      lines: [
        "Captain Bananas fishes around the warm tidepool.",
        "Ember Shell found! It glows like a campfire with manners."
      ]
    },
    {
      id: "lookout",
      map: "atoll",
      type: "lookout",
      x: 12,
      y: 13,
      solid: true
    },
    {
      id: "beacon",
      map: "atoll",
      type: "beacon",
      x: 18,
      y: 5,
      solid: true
    },
    {
      id: "reefRaft",
      map: "reef",
      type: "reefRaft",
      x: 2,
      y: 14,
      solid: true
    },
    {
      id: "messageBottle",
      map: "reef",
      type: "messageBottle",
      x: 6,
      y: 14,
      item: "Coral Key",
      solid: false,
      lines: [
        "A bottle rolls in with a soggy little thunk.",
        "Inside: Coral Key. It matches that locked coral gate up the reef path."
      ]
    },
    {
      id: "sunkenDinghy",
      map: "reef",
      type: "dinghy",
      x: 9,
      y: 12,
      item: "Rusty Rudder",
      solid: true,
      lines: [
        "The half-sunk dinghy gives up after one heroic tug.",
        "Rusty Rudder found! It squeaks with nautical importance."
      ]
    },
    {
      id: "coralGate",
      map: "reef",
      type: "coralGate",
      x: 14,
      y: 9,
      solid: true
    },
    {
      id: "shipHoldEntrance",
      map: "reef",
      type: "portal",
      sprite: "shipHold",
      x: 18,
      y: 6,
      solid: true,
      targetMap: "shipHold",
      targetX: 7,
      targetY: 7,
      targetFacing: { x: 0, y: -1 },
      lines: [
        "A broken hatch yawns open in the old wreck.",
        "Captain Bananas climbs down into the Sunken Ship Hold."
      ]
    },
    {
      id: "shipHoldExit",
      map: "shipHold",
      type: "portal",
      sprite: "exit",
      x: 7,
      y: 8,
      solid: false,
      targetMap: "reef",
      targetX: 18,
      targetY: 7,
      targetFacing: { x: 0, y: -1 },
      lines: [
        "Captain Bananas scrambles back through the hatch.",
        "Rusty Rudder Reef creaks in the salty light."
      ]
    },
    {
      id: "bellChest",
      map: "shipHold",
      type: "chest",
      x: 7,
      y: 4,
      item: "Brass Bell",
      solid: true,
      visibleWhenInactive: true,
      lines: [
        "The hold chest opens with a barnacle-crunching pop.",
        "Brass Bell found! This belongs on the cracked ship bell frame outside."
      ]
    },
    {
      id: "shipBell",
      map: "reef",
      type: "shipBell",
      x: 22,
      y: 5,
      solid: true
    },
    {
      id: "volcanoRaft",
      map: "volcano",
      type: "volcanoRaft",
      x: 2,
      y: 14,
      solid: true
    },
    {
      id: "mangoTree",
      map: "volcano",
      type: "mangoTree",
      x: 7,
      y: 13,
      item: "Cool Mango",
      solid: true,
      lines: [
        "Captain Bananas shakes the stubborn mango tree with pirate dignity.",
        "Cool Mango found! This should cool the steam vent up the volcano path."
      ]
    },
    {
      id: "altarMangoTree",
      map: "volcano",
      type: "mangoTree",
      x: 17,
      y: 9,
      item: "Cool Mango",
      solid: true,
      lines: [
        "A second mango tree grows in the newly quiet steam grove.",
        "Cool Mango found! This one belongs on Mango Volcano's altar after the steam vent took the first."
      ]
    },
    {
      id: "volcanoSage",
      map: "volcano",
      type: "volcanoSage",
      x: 10,
      y: 14,
      solid: true
    },
    {
      id: "steamVent",
      map: "volcano",
      type: "steamVent",
      x: 14,
      y: 10,
      solid: true
    },
    {
      id: "obsidianPlug",
      map: "volcano",
      type: "obsidianPlug",
      x: 12,
      y: 9,
      item: "Obsidian Plug",
      solid: true,
      lines: [
        "A perfect chunk of black stone sits beside a lava crack.",
        "Obsidian Plug found! It fits the volcano altar's round black socket."
      ]
    },
    {
      id: "smokeCharmChest",
      map: "volcano",
      type: "chest",
      x: 18,
      y: 6,
      item: "Smoke Charm",
      solid: true,
      visibleWhenInactive: true,
      lines: [
        "The hot little chest opens with a cough of smoke.",
        "Smoke Charm found! The volcano altar has a smoky hook just its size."
      ]
    },
    {
      id: "volcanoAltar",
      map: "volcano",
      type: "volcanoAltar",
      x: 22,
      y: 5,
      solid: true
    },
    {
      id: "coveRaft",
      map: "cove",
      type: "coveRaft",
      x: 2,
      y: 14,
      solid: true
    },
    {
      id: "quartermaster",
      map: "cove",
      type: "quartermaster",
      x: 7,
      y: 13,
      solid: true
    },
    {
      id: "suspiciousCrates",
      map: "cove",
      type: "suspiciousCrates",
      x: 10,
      y: 12,
      item: "Crate Hook",
      solid: true,
      lines: [
        "Captain Bananas pries open the suspicious crates.",
        "Crate Hook found! It fits the crane pulley blocking the lookout pier on Sugarcane Smuggler Cove."
      ]
    },
    {
      id: "storehouseDoor",
      map: "cove",
      type: "storehouseDoor",
      sprite: "storehouse",
      x: 13,
      y: 8,
      solid: true,
      targetMap: "storehouse",
      targetX: 7,
      targetY: 9,
      targetFacing: { x: 0, y: -1 },
      lines: [
        "The Storehouse Key clicks in the sugarcane-stamped lock.",
        "Captain Bananas slips into the Smuggler Storehouse."
      ]
    },
    {
      id: "cratePulley",
      map: "cove",
      type: "cratePulley",
      x: 18,
      y: 8,
      solid: true
    },
    {
      id: "coveLookout",
      map: "cove",
      type: "coveLookout",
      x: 24,
      y: 5,
      solid: true
    },
    {
      id: "storehouseExit",
      map: "storehouse",
      type: "portal",
      sprite: "exit",
      x: 7,
      y: 10,
      solid: false,
      targetMap: "cove",
      targetX: 13,
      targetY: 9,
      targetFacing: { x: 0, y: 1 },
      lines: [
        "Captain Bananas ducks back out through the crooked storehouse door.",
        "Sugarcane Smuggler Cove rustles in the sea breeze."
      ]
    },
    {
      id: "starChartChest",
      map: "storehouse",
      type: "chest",
      x: 7,
      y: 4,
      item: "Star Chart",
      solid: true,
      visibleWhenInactive: true,
      lines: [
        "The storehouse chest opens with a dusty pirate cough.",
        "Star Chart found! Use it at the lookout pier on Sugarcane Smuggler Cove to reveal Moonlit Mangrove."
      ]
    },
    {
      id: "moonStampedCrate",
      map: "storehouse",
      type: "moonStampedCrate",
      x: 11,
      y: 8,
      item: "Glow Reed",
      solid: true,
      visibleWhenInactive: true,
      lines: [
        "The Moonlit Key turns inside the moon-stamped crate.",
        "Glow Reed found! It belongs in the glowing reed notch at Moonlit Mangrove's compass stone."
      ]
    },
    {
      id: "mangroveRaft",
      map: "mangrove",
      type: "mangroveRaft",
      x: 2,
      y: 14,
      solid: true
    },
    {
      id: "silverLeafTree",
      map: "mangrove",
      type: "silverLeaf",
      x: 9,
      y: 11,
      item: "Silver Leaf",
      solid: true,
      lines: [
        "Captain Bananas plucks a leaf that shines like moonlit tin.",
        "Silver Leaf found! It fits the leaf-shaped groove in Moonlit Mangrove's compass stone."
      ]
    },
    {
      id: "moonGrottoEntrance",
      map: "mangrove",
      type: "portal",
      sprite: "moonGrotto",
      x: 15,
      y: 7,
      solid: true,
      targetMap: "moonGrotto",
      targetX: 7,
      targetY: 9,
      targetFacing: { x: 0, y: -1 },
      lines: [
        "A hollow root glows with pale blue fireflies.",
        "Captain Bananas ducks into the Moon Grotto."
      ]
    },
    {
      id: "moonCompassStone",
      map: "mangrove",
      type: "moonCompassStone",
      x: 24,
      y: 5,
      solid: true
    },
    {
      id: "moonGrottoExit",
      map: "moonGrotto",
      type: "portal",
      sprite: "exit",
      x: 7,
      y: 10,
      solid: false,
      targetMap: "mangrove",
      targetX: 15,
      targetY: 8,
      targetFacing: { x: 0, y: 1 },
      lines: [
        "Captain Bananas climbs back through the glowing root.",
        "Moonlit Mangrove hums outside."
      ]
    },
    {
      id: "moonPearlPool",
      map: "moonGrotto",
      type: "moonPool",
      x: 7,
      y: 4,
      item: "Moon Pearl",
      keyItem: "Moonlit Key",
      solid: false,
      visibleWhenInactive: true,
      lines: [
        "Captain Bananas reaches into the silver pool and tries not to sneeze.",
        "Moon Pearl found! It fits the round pearl socket in Moonlit Mangrove's compass stone.",
        "Moonlit Key found! This unlocks the moon-stamped crate back in the Smuggler Storehouse on Sugarcane Smuggler Cove."
      ]
    },
    {
      id: "stormSkiff",
      map: "stormglass",
      type: "stormSkiff",
      x: 2,
      y: 14,
      solid: true
    },
    {
      id: "stormWatcher",
      map: "stormglass",
      type: "stormWatcher",
      x: 7,
      y: 13,
      solid: true
    },
    {
      id: "stormglassShard",
      map: "stormglass",
      type: "stormglassShard",
      x: 9,
      y: 8,
      item: "Stormglass Shard",
      solid: false,
      lines: [
        "Captain Bananas lifts a blue shard from a rain-slick rock.",
        "Stormglass Shard found! It fits the cracked lens mount on Stormglass Shoal's broken lightning mast."
      ]
    },
    {
      id: "copperRod",
      map: "stormglass",
      type: "copperRod",
      x: 16,
      y: 12,
      item: "Copper Rod",
      solid: true,
      lines: [
        "A bright rod hums under a tangle of wet rope.",
        "Copper Rod found! It completes the conductor slot on Stormglass Shoal's broken lightning mast."
      ]
    },
    {
      id: "kiteString",
      map: "stormglass",
      type: "kiteString",
      x: 21,
      y: 6,
      item: "Kite String",
      solid: true,
      lines: [
        "Captain Bananas untangles a heroic amount of string from the washed-up kite frame.",
        "Kite String found! Tie it to the kite arm on Stormglass Shoal's broken lightning mast."
      ]
    },
    {
      id: "stormMast",
      map: "stormglass",
      type: "stormMast",
      x: 24,
      y: 5,
      solid: true
    },
    {
      id: "duneRaft",
      map: "dunes",
      type: "duneRaft",
      x: 2,
      y: 14,
      solid: true
    },
    {
      id: "duneGuide",
      map: "dunes",
      type: "duneGuide",
      x: 7,
      y: 13,
      solid: true
    },
    {
      id: "buriedChest",
      map: "dunes",
      type: "buriedChest",
      x: 9,
      y: 11,
      item: "Sun Dial",
      solid: true,
      visibleWhenInactive: true,
      lines: [
        "Captain Bananas digs until the white sand gives up its secret.",
        "Sun Dial found! Its bronze face matches the empty center of Pearlbone Dunes' sun dial puzzle."
      ]
    },
    {
      id: "miragePool",
      map: "dunes",
      type: "miragePool",
      x: 15,
      y: 8,
      item: "Pearl Token",
      solid: false,
      lines: [
        "The mirage pool flickers, then becomes just real enough to be smug.",
        "Pearl Token found! It fits the bright pearl socket on Pearlbone Dunes' sun dial puzzle."
      ]
    },
    {
      id: "cactusCanteen",
      map: "dunes",
      type: "cactusCanteen",
      x: 20,
      y: 12,
      item: "Cactus Canteen",
      solid: true,
      lines: [
        "A canteen hangs from a cactus that looks extremely proud of itself.",
        "Cactus Canteen found! Pour it into the dry trough beside Pearlbone Dunes' sun dial puzzle."
      ]
    },
    {
      id: "duneSunDial",
      map: "dunes",
      type: "duneSunDial",
      x: 24,
      y: 5,
      solid: true
    },
    {
      id: "wreckyardRaft",
      map: "wreckyard",
      type: "wreckyardRaft",
      x: 2,
      y: 14,
      solid: true
    },
    {
      id: "whisperingMast",
      map: "wreckyard",
      type: "whisperingMast",
      x: 7,
      y: 13,
      solid: true
    },
    {
      id: "ghostCompassAlcove",
      map: "wreckyard",
      type: "ghostCompassAlcove",
      x: 9,
      y: 8,
      item: "Ghost Compass",
      solid: false,
      lines: [
        "A half-visible compass spins inside a broken wreck alcove.",
        "Ghost Compass found! Restore it at the whispering compass stand in Whispering Wreckyard."
      ]
    },
    {
      id: "anchorCharm",
      map: "wreckyard",
      type: "anchorCharm",
      x: 15,
      y: 12,
      item: "Anchor Charm",
      solid: true,
      lines: [
        "Captain Bananas pries a cold charm from an anchor tangled in fog.",
        "Anchor Charm found! It unlocks the anchor gate blocking the captain statue in Whispering Wreckyard."
      ]
    },
    {
      id: "anchorGate",
      map: "wreckyard",
      type: "anchorGate",
      x: 18,
      y: 8,
      solid: true
    },
    {
      id: "captainStatue",
      map: "wreckyard",
      type: "captainStatue",
      x: 22,
      y: 5,
      item: "Captain's Token",
      solid: true,
      lines: [
        "The broken captain statue tips its hat with a stone little scrape.",
        "Captain's Token found! It fits the captain seal on Whispering Wreckyard's ghost compass stand."
      ]
    },
    {
      id: "ghostCompassStand",
      map: "wreckyard",
      type: "ghostCompassStand",
      x: 24,
      y: 5,
      solid: true
    },
    {
      id: "royalDock",
      map: "crownRuins",
      type: "royalDock",
      x: 2,
      y: 14,
      solid: true
    },
    {
      id: "bananaKingGhost",
      map: "crownRuins",
      type: "bananaKingGhost",
      x: 7,
      y: 13,
      solid: true
    },
    {
      id: "royalBananaGem",
      map: "crownRuins",
      type: "royalBananaGem",
      x: 9,
      y: 8,
      item: "Royal Banana Gem",
      solid: false,
      lines: [
        "A golden gem blinks from a cracked royal plinth.",
        "Royal Banana Gem found! It fits the banana-shaped eye socket on the ancient monkey statues in the royal ruins."
      ]
    },
    {
      id: "ancientMonkeyStatues",
      map: "crownRuins",
      type: "ancientMonkeyStatues",
      x: 14,
      y: 9,
      item: "Throne Lever",
      solid: true,
      visibleWhenInactive: true,
      lines: [
        "The Royal Banana Gem clicks into the ancient monkey statues.",
        "Throne Lever found! It opens the lever slot on the Throne Vault door in the royal ruins."
      ]
    },
    {
      id: "throneVaultDoor",
      map: "crownRuins",
      type: "throneVaultDoor",
      sprite: "throneVault",
      x: 24,
      y: 5,
      solid: true,
      targetMap: "throneVault",
      targetX: 7,
      targetY: 9,
      targetFacing: { x: 0, y: -1 },
      lines: [
        "Captain Bananas pulls the Throne Lever in the royal door's slot.",
        "The Throne Vault opens with a golden cough."
      ]
    },
    {
      id: "throneVaultExit",
      map: "throneVault",
      type: "portal",
      sprite: "exit",
      x: 7,
      y: 10,
      solid: false,
      targetMap: "crownRuins",
      targetX: 24,
      targetY: 6,
      targetFacing: { x: 0, y: 1 },
      lines: [
        "Captain Bananas steps back through the royal doorway.",
        "The Crown of the Banana King gleams outside."
      ]
    },
    {
      id: "finalTreasureChest",
      map: "throneVault",
      type: "finalTreasureChest",
      x: 5,
      y: 5,
      item: "Crown Fragment",
      solid: true,
      visibleWhenInactive: true,
      lines: [
        "The final treasure chest springs open with a bright royal snap.",
        "Crown Fragment found! It completes the cracked crown socket on the Banana King's throne in the Throne Vault."
      ]
    },
    {
      id: "bananaKingThrone",
      map: "throneVault",
      type: "bananaKingThrone",
      x: 7,
      y: 3,
      solid: true
    },
    {
      id: "goldenEscapeShip",
      map: "throneVault",
      type: "goldenEscapeShip",
      x: 10,
      y: 7,
      solid: false,
      active: false
    }
  ];
}

function makeEnemies() {
  return [
    {
      id: "crab",
      map: "island",
      type: "crab",
      name: "Cranky Crab",
      x: 11,
      y: 17,
      hp: 7,
      maxHp: 7,
      power: 2,
      active: true,
      moveTimer: 700,
      cooldown: 0,
      intro: "A Cranky Crab challenges ye to a pinch-off!"
    },
    {
      id: "snake",
      map: "island",
      type: "snake",
      name: "Sneaky Snake",
      x: 17,
      y: 11,
      hp: 9,
      maxHp: 9,
      power: 3,
      active: true,
      moveTimer: 1200,
      cooldown: 0,
      intro: "A Sneaky Snake hisses, 'No monkeys past this vine!'"
    },
    {
      id: "bat",
      map: "cave",
      type: "bat",
      name: "Jungle Bat",
      x: 6,
      y: 6,
      hp: 6,
      maxHp: 6,
      power: 2,
      active: true,
      moveTimer: 900,
      cooldown: 0,
      intro: "A Jungle Bat flaps in like a tiny spooky umbrella!"
    },
    {
      id: "reefGull",
      map: "atoll",
      type: "gull",
      name: "Reef Gull",
      x: 12,
      y: 7,
      hp: 8,
      maxHp: 8,
      power: 2,
      active: true,
      moveTimer: 850,
      cooldown: 0,
      intro: "A Reef Gull dive-bombs in defense of shiny things!"
    },
    {
      id: "coconutCrab",
      map: "atoll",
      type: "crab",
      name: "Coconut Crab",
      x: 15,
      y: 12,
      hp: 10,
      maxHp: 10,
      power: 3,
      active: true,
      moveTimer: 1150,
      cooldown: 0,
      intro: "A Coconut Crab blocks the path with maximum side-eye!"
    },
    {
      id: "hermitCrab",
      map: "reef",
      type: "crab",
      name: "Hermit Crab",
      x: 11,
      y: 13,
      hp: 9,
      maxHp: 9,
      power: 2,
      active: true,
      moveTimer: 850,
      cooldown: 0,
      intro: "A Hermit Crab claims this dock is private property!"
    },
    {
      id: "reefEel",
      map: "reef",
      type: "eel",
      name: "Reef Eel",
      x: 16,
      y: 10,
      hp: 10,
      maxHp: 10,
      power: 3,
      active: true,
      moveTimer: 1000,
      cooldown: 0,
      intro: "A Reef Eel zips from the coral with shocking confidence!"
    },
    {
      id: "barnacleBrute",
      map: "shipHold",
      type: "barnacle",
      name: "Barnacle Brute",
      x: 5,
      y: 5,
      hp: 12,
      maxHp: 12,
      power: 3,
      active: true,
      moveTimer: 1250,
      cooldown: 0,
      intro: "A Barnacle Brute creaks awake in the ship hold!"
    },
    {
      id: "ashBat",
      map: "volcano",
      type: "ashBat",
      name: "Ash Bat",
      x: 11,
      y: 11,
      hp: 9,
      maxHp: 9,
      power: 2,
      active: true,
      moveTimer: 850,
      cooldown: 0,
      intro: "An Ash Bat flutters through the steam like bad laundry!"
    },
    {
      id: "lavaCrab",
      map: "volcano",
      type: "lavaCrab",
      name: "Lava Crab",
      x: 16,
      y: 8,
      hp: 11,
      maxHp: 11,
      power: 3,
      active: true,
      moveTimer: 1100,
      cooldown: 0,
      intro: "A Lava Crab clacks with spicy confidence!"
    },
    {
      id: "smokeSnake",
      map: "volcano",
      type: "smokeSnake",
      name: "Smoke Snake",
      x: 19,
      y: 10,
      hp: 12,
      maxHp: 12,
      power: 3,
      active: true,
      moveTimer: 1250,
      cooldown: 0,
      intro: "A Smoke Snake coils from the haze and blocks the shrine path!"
    },
    {
      id: "caneCorsair",
      map: "cove",
      type: "caneCorsair",
      name: "Cane Corsair",
      x: 12,
      y: 14,
      hp: 11,
      maxHp: 11,
      power: 3,
      active: true,
      moveTimer: 900,
      cooldown: 0,
      intro: "A Cane Corsair leaps from the sugarcane with a rustly growl!"
    },
    {
      id: "dockSneak",
      map: "cove",
      type: "dockSneak",
      name: "Dock Sneak",
      x: 21,
      y: 6,
      hp: 10,
      maxHp: 10,
      power: 3,
      active: true,
      moveTimer: 850,
      cooldown: 0,
      intro: "A Dock Sneak skitters out from behind the pier ropes!"
    },
    {
      id: "barrelBruiser",
      map: "storehouse",
      type: "barrelBruiser",
      name: "Barrel Bruiser",
      x: 10,
      y: 6,
      hp: 13,
      maxHp: 13,
      power: 3,
      active: true,
      moveTimer: 1200,
      cooldown: 0,
      intro: "A Barrel Bruiser rolls forward like a very angry supply problem!"
    },
    {
      id: "mudCrab",
      map: "mangrove",
      type: "mudCrab",
      name: "Mud Crab",
      x: 10,
      y: 13,
      hp: 11,
      maxHp: 11,
      power: 3,
      active: true,
      moveTimer: 900,
      cooldown: 0,
      intro: "A Mud Crab bubbles out of the bank with soggy confidence!"
    },
    {
      id: "vineSnake",
      map: "mangrove",
      type: "vineSnake",
      name: "Vine Snake",
      x: 18,
      y: 10,
      hp: 12,
      maxHp: 12,
      power: 3,
      active: true,
      moveTimer: 1150,
      cooldown: 0,
      intro: "A Vine Snake untangles itself and hisses at the moonlight!"
    },
    {
      id: "nightBat",
      map: "moonGrotto",
      type: "nightBat",
      name: "Night Bat",
      x: 5,
      y: 6,
      hp: 10,
      maxHp: 10,
      power: 3,
      active: true,
      moveTimer: 850,
      cooldown: 0,
      intro: "A Night Bat flaps from the grotto roof in a tiny velvet panic!"
    },
    {
      id: "stormGull",
      map: "stormglass",
      type: "stormGull",
      name: "Storm Gull",
      x: 11,
      y: 10,
      hp: 11,
      maxHp: 11,
      power: 3,
      active: true,
      moveTimer: 850,
      cooldown: 0,
      intro: "A Storm Gull dives through the rain with thunder in its feathers!"
    },
    {
      id: "sparkCrab",
      map: "stormglass",
      type: "sparkCrab",
      name: "Spark Crab",
      x: 18,
      y: 8,
      hp: 12,
      maxHp: 12,
      power: 3,
      active: true,
      moveTimer: 1000,
      cooldown: 0,
      intro: "A Spark Crab crackles across the wet stone, claws fizzing!"
    },
    {
      id: "rainSnake",
      map: "stormglass",
      type: "rainSnake",
      name: "Rain Snake",
      x: 20,
      y: 13,
      hp: 12,
      maxHp: 12,
      power: 3,
      active: true,
      moveTimer: 1150,
      cooldown: 0,
      intro: "A Rain Snake slides from a puddle with a hiss like drizzle!"
    },
    {
      id: "sandCrab",
      map: "dunes",
      type: "sandCrab",
      name: "Sand Crab",
      x: 10,
      y: 13,
      hp: 11,
      maxHp: 11,
      power: 3,
      active: true,
      moveTimer: 900,
      cooldown: 0,
      intro: "A Sand Crab erupts from the white sand with tiny royal outrage!"
    },
    {
      id: "mirageBat",
      map: "dunes",
      type: "mirageBat",
      name: "Mirage Bat",
      x: 16,
      y: 9,
      hp: 10,
      maxHp: 10,
      power: 3,
      active: true,
      moveTimer: 850,
      cooldown: 0,
      intro: "A Mirage Bat flickers into view, then rudely becomes real!"
    },
    {
      id: "boneSnake",
      map: "dunes",
      type: "boneSnake",
      name: "Bone Snake",
      x: 21,
      y: 11,
      hp: 12,
      maxHp: 12,
      power: 3,
      active: true,
      moveTimer: 1150,
      cooldown: 0,
      intro: "A Bone Snake rattles across the pearl sand like loose dice!"
    },
    {
      id: "ghostCrab",
      map: "wreckyard",
      type: "ghostCrab",
      name: "Ghost Crab",
      x: 11,
      y: 10,
      hp: 12,
      maxHp: 12,
      power: 3,
      active: true,
      moveTimer: 900,
      cooldown: 0,
      intro: "A Ghost Crab phases out of a plank pile, offended by footsteps!"
    },
    {
      id: "fogBat",
      map: "wreckyard",
      type: "fogBat",
      name: "Fog Bat",
      x: 16,
      y: 7,
      hp: 11,
      maxHp: 11,
      power: 3,
      active: true,
      moveTimer: 850,
      cooldown: 0,
      intro: "A Fog Bat flickers through the wreck mist with a whispery shriek!"
    },
    {
      id: "anchorBrute",
      map: "wreckyard",
      type: "anchorBrute",
      name: "Anchor Brute",
      x: 21,
      y: 10,
      hp: 14,
      maxHp: 14,
      power: 4,
      active: true,
      moveTimer: 1200,
      cooldown: 0,
      intro: "An Anchor Brute lumbers from the fog, dragging a chain behind it!"
    },
    {
      id: "royalCrabGuard",
      map: "crownRuins",
      type: "royalCrabGuard",
      name: "Royal Crab Guard",
      x: 11,
      y: 13,
      hp: 13,
      maxHp: 13,
      power: 4,
      active: true,
      moveTimer: 900,
      cooldown: 0,
      intro: "A Royal Crab Guard snaps to attention, crown-polished claws ready!"
    },
    {
      id: "crownSnake",
      map: "crownRuins",
      type: "crownSnake",
      name: "Crown Snake",
      x: 19,
      y: 8,
      hp: 13,
      maxHp: 13,
      power: 4,
      active: true,
      moveTimer: 1150,
      cooldown: 0,
      intro: "A Crown Snake coils through the gold dust and hisses at trespassers!"
    },
    {
      id: "treasureBat",
      map: "throneVault",
      type: "treasureBat",
      name: "Treasure Bat",
      x: 9,
      y: 6,
      hp: 12,
      maxHp: 12,
      power: 4,
      active: true,
      moveTimer: 850,
      cooldown: 0,
      intro: "A Treasure Bat drops from the vault roof in a shower of old coins!"
    }
  ];
}

function buildIslandMap() {
  const w = 32;
  const h = 24;
  const map = makeMap(w, h, "~");

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const dx = (x - 16) / 14;
      const dy = (y - 12) / 10;
      const d = dx * dx + dy * dy;
      if (d < 1) {
        map[y][x] = d > 0.58 ? "." : ",";
      }
    }
  }

  fillRect(map, 3, 13, 5, 4, "W");
  fillRect(map, 8, 5, 4, 2, "J");
  fillRect(map, 12, 7, 4, 3, "J");
  fillRect(map, 19, 8, 3, 4, "J");
  fillRect(map, 23, 7, 3, 3, "J");
  fillRect(map, 10, 13, 5, 2, "J");
  fillRect(map, 5, 8, 3, 3, "J");

  const trees = [
    [9, 16], [10, 17], [18, 15], [20, 18], [22, 13],
    [6, 12], [15, 5], [26, 11], [12, 19], [17, 7]
  ];
  trees.forEach(([x, y]) => setTile(map, x, y, "T"));

  const rocks = [
    [18, 4], [19, 5], [23, 4], [25, 4], [22, 5],
    [21, 6], [4, 18], [25, 20], [28, 14], [7, 7]
  ];
  rocks.forEach(([x, y]) => setTile(map, x, y, "R"));

  for (let y = 12; y <= 20; y += 1) {
    setTile(map, 7, y, y > 15 ? "." : ",");
  }
  for (let x = 7; x <= 24; x += 1) {
    setTile(map, x, 11, ",");
  }
  for (let y = 5; y <= 16; y += 1) {
    setTile(map, 24, y, ",");
  }
  for (let x = 14; x <= 25; x += 1) {
    setTile(map, x, 16, ",");
  }
  for (let x = 5; x <= 14; x += 1) {
    setTile(map, x, 19, ".");
  }
  setTile(map, 6, 14, ".");

  carveLagoon(map, 25, 16, 4, 3);
  for (let x = 21; x <= 27; x += 1) {
    setTile(map, x, 16, "=");
  }
  setTile(map, 24, 15, "=");
  setTile(map, 24, 17, "=");

  setTile(map, 24, 5, ".");
  setTile(map, 24, 6, ",");
  setTile(map, 23, 5, "R");
  setTile(map, 25, 5, "R");

  setTile(map, 7, 19, ".");
  setTile(map, 8, 19, ".");
  setTile(map, 8, 18, ".");
  setTile(map, 13, 16, ",");
  setTile(map, 14, 20, ".");
  return map;
}

function buildCaveMap() {
  const map = makeMap(16, 12, "#");
  fillRect(map, 2, 2, 12, 8, "f");
  fillRect(map, 4, 5, 2, 1, "R");
  fillRect(map, 10, 7, 2, 1, "R");
  setTile(map, 8, 10, "f");
  setTile(map, 8, 4, "f");
  setTile(map, 6, 6, "f");
  return map;
}

function buildAtollMap() {
  const w = 24;
  const h = 18;
  const map = makeMap(w, h, "~");

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const dx = (x - 12) / 10;
      const dy = (y - 9) / 7;
      const d = dx * dx + dy * dy;
      if (d < 1) {
        map[y][x] = d > 0.66 ? "." : ",";
      }
    }
  }

  fillRect(map, 3, 13, 5, 3, ".");
  fillRect(map, 5, 5, 4, 2, "J");
  fillRect(map, 14, 9, 3, 2, "J");
  fillRect(map, 16, 4, 5, 2, ".");

  const trees = [
    [4, 9], [7, 8], [9, 14], [16, 13], [20, 8]
  ];
  trees.forEach(([x, y]) => setTile(map, x, y, "T"));

  const rocks = [
    [15, 5], [20, 5], [18, 7], [5, 11], [21, 11], [10, 4]
  ];
  rocks.forEach(([x, y]) => setTile(map, x, y, "R"));

  carveLagoon(map, 8, 12, 2, 1);
  for (let x = 2; x <= 4; x += 1) {
    setTile(map, x, 14, "=");
  }
  for (let x = 4; x <= 18; x += 1) {
    setTile(map, x, 14, x < 8 ? "." : ",");
  }
  for (let y = 6; y <= 14; y += 1) {
    setTile(map, 18, y, ",");
  }
  setTile(map, 6, 6, ".");
  setTile(map, 7, 12, ".");
  setTile(map, 8, 12, "L");
  setTile(map, 9, 12, ".");
  setTile(map, 12, 13, ",");
  setTile(map, 18, 5, ".");
  setTile(map, 18, 6, ",");
  return map;
}

function buildReefMap() {
  const w = 26;
  const h = 18;
  const map = makeMap(w, h, "~");

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const dx = (x - 13) / 11;
      const dy = (y - 9) / 7;
      const d = dx * dx + dy * dy;
      if (d < 1) {
        map[y][x] = d > 0.62 ? "." : ",";
      }
    }
  }

  fillRect(map, 2, 13, 5, 3, ".");
  fillRect(map, 16, 4, 7, 3, ".");
  fillRect(map, 7, 10, 3, 3, "L");
  fillRect(map, 4, 5, 4, 2, "J");
  fillRect(map, 11, 6, 3, 2, "J");
  fillRect(map, 19, 10, 3, 2, "J");

  for (let x = 2; x <= 5; x += 1) {
    setTile(map, x, 14, "=");
  }
  for (let x = 5; x <= 14; x += 1) {
    setTile(map, x, 14, x < 8 ? "." : ",");
  }
  for (let y = 9; y <= 14; y += 1) {
    setTile(map, 14, y, ",");
  }
  for (let x = 14; x <= 22; x += 1) {
    setTile(map, x, 9, ",");
  }
  for (let y = 5; y <= 9; y += 1) {
    setTile(map, 22, y, y === 5 ? "." : ",");
  }
  for (let x = 18; x <= 22; x += 1) {
    setTile(map, x, 6, ".");
  }

  const coral = [
    [7, 7], [8, 7], [9, 8], [13, 8], [15, 8], [16, 8],
    [17, 9], [18, 9], [19, 8], [21, 4], [23, 6], [12, 12],
    [6, 11], [10, 15], [20, 13]
  ];
  coral.forEach(([x, y]) => setTile(map, x, y, "C"));

  const rocks = [
    [5, 9], [8, 4], [10, 5], [13, 4], [17, 5], [23, 10], [15, 13]
  ];
  rocks.forEach(([x, y]) => setTile(map, x, y, "R"));

  setTile(map, 3, 14, "=");
  setTile(map, 6, 14, ".");
  setTile(map, 9, 12, ".");
  setTile(map, 11, 13, ",");
  setTile(map, 14, 9, ",");
  for (let x = 15; x <= 22; x += 1) {
    setTile(map, x, 9, ",");
  }
  setTile(map, 16, 10, ",");
  setTile(map, 17, 6, ".");
  setTile(map, 18, 6, ".");
  setTile(map, 18, 7, ".");
  setTile(map, 20, 7, ".");
  setTile(map, 21, 5, ".");
  setTile(map, 22, 5, ".");
  setTile(map, 22, 6, ",");
  return map;
}

function buildShipHoldMap() {
  const map = makeMap(14, 10, "#");
  fillRect(map, 2, 2, 10, 6, "b");
  fillRect(map, 4, 5, 2, 1, "W");
  fillRect(map, 9, 3, 2, 1, "R");
  setTile(map, 7, 8, "b");
  setTile(map, 7, 7, "b");
  setTile(map, 7, 4, "b");
  setTile(map, 5, 5, "b");
  return map;
}

function buildVolcanoMap() {
  const w = 26;
  const h = 18;
  const map = makeMap(w, h, "~");

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const dx = (x - 13) / 11;
      const dy = (y - 9) / 7;
      const d = dx * dx + dy * dy;
      if (d < 1) {
        map[y][x] = d > 0.62 ? "." : "a";
      }
    }
  }

  fillRect(map, 2, 13, 5, 3, ".");
  fillRect(map, 5, 11, 4, 3, ",");
  fillRect(map, 16, 4, 7, 3, "a");
  fillRect(map, 13, 7, 5, 4, "v");
  fillRect(map, 18, 9, 2, 3, "v");

  for (let x = 2; x <= 5; x += 1) {
    setTile(map, x, 14, "=");
  }
  for (let x = 5; x <= 14; x += 1) {
    setTile(map, x, 14, x < 9 ? "," : "a");
  }
  for (let y = 9; y <= 14; y += 1) {
    setTile(map, 14, y, "a");
  }
  for (let x = 14; x <= 22; x += 1) {
    setTile(map, x, 9, "a");
  }
  for (let y = 5; y <= 10; y += 1) {
    setTile(map, 22, y, "a");
  }
  for (let x = 18; x <= 22; x += 1) {
    setTile(map, x, 6, "a");
  }

  const trees = [
    [6, 12], [8, 12], [7, 13], [5, 10], [9, 15], [16, 8]
  ];
  trees.forEach(([x, y]) => setTile(map, x, y, "T"));

  const rocks = [
    [9, 9], [11, 8], [13, 6], [16, 12], [20, 8],
    [23, 7], [10, 5], [6, 8], [21, 13]
  ];
  rocks.forEach(([x, y]) => setTile(map, x, y, "R"));

  setTile(map, 3, 14, "=");
  setTile(map, 7, 14, ",");
  setTile(map, 10, 14, "a");
  setTile(map, 11, 11, "a");
  setTile(map, 12, 9, "a");
  for (let x = 8; x <= 21; x += 1) {
    setTile(map, x, 4, "v");
  }
  for (let x = 7; x <= 21; x += 1) {
    setTile(map, x, 5, "v");
  }
  for (let x = 7; x <= 15; x += 1) {
    setTile(map, x, 7, "v");
  }
  for (let x = 8; x <= 15; x += 1) {
    setTile(map, x, 6, "v");
  }
  setTile(map, 8, 8, "v");
  setTile(map, 9, 8, "v");
  setTile(map, 9, 7, "v");
  setTile(map, 10, 7, "v");
  setTile(map, 11, 7, "v");
  setTile(map, 10, 8, "v");
  setTile(map, 12, 8, "v");
  setTile(map, 12, 7, "v");
  setTile(map, 14, 10, "a");
  setTile(map, 15, 10, "v");
  setTile(map, 16, 10, "v");
  setTile(map, 17, 10, "v");
  setTile(map, 15, 11, "v");
  setTile(map, 16, 11, "v");
  setTile(map, 17, 11, "v");
  setTile(map, 15, 9, "a");
  setTile(map, 16, 9, "a");
  setTile(map, 17, 9, "a");
  setTile(map, 18, 9, "a");
  setTile(map, 16, 8, "a");
  setTile(map, 16, 8, "T");
  setTile(map, 18, 6, "a");
  setTile(map, 19, 10, "a");
  setTile(map, 20, 10, "v");
  setTile(map, 21, 10, "v");
  setTile(map, 22, 10, "v");
  setTile(map, 18, 11, "v");
  setTile(map, 19, 11, "v");
  setTile(map, 20, 11, "v");
  setTile(map, 21, 11, "v");
  setTile(map, 22, 11, "v");
  setTile(map, 19, 12, "v");
  setTile(map, 20, 12, "v");
  setTile(map, 21, 12, "v");
  setTile(map, 22, 12, "v");
  setTile(map, 20, 13, "v");
  setTile(map, 22, 5, "a");
  setTile(map, 22, 6, "a");
  return map;
}

function buildCoveMap() {
  const w = 28;
  const h = 18;
  const map = makeMap(w, h, "~");

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const dx = (x - 14) / 12;
      const dy = (y - 9) / 7;
      const d = dx * dx + dy * dy;
      if (d < 1) {
        map[y][x] = d > 0.64 ? "." : ",";
      }
    }
  }

  fillRect(map, 2, 13, 5, 3, ".");
  fillRect(map, 21, 4, 5, 3, ".");
  fillRect(map, 4, 6, 4, 5, "S");
  fillRect(map, 8, 5, 5, 3, "S");
  fillRect(map, 8, 9, 3, 2, "S");
  fillRect(map, 15, 5, 4, 2, "S");
  fillRect(map, 15, 10, 3, 3, "S");
  fillRect(map, 20, 10, 4, 3, "S");
  fillRect(map, 11, 11, 2, 3, "S");

  const palms = [
    [5, 12], [6, 15], [15, 14], [19, 7], [24, 8]
  ];
  palms.forEach(([x, y]) => setTile(map, x, y, "T"));

  const rocks = [
    [5, 5], [13, 5], [19, 4], [24, 11], [9, 15], [16, 7]
  ];
  rocks.forEach(([x, y]) => setTile(map, x, y, "R"));

  for (let x = 2; x <= 5; x += 1) {
    setTile(map, x, 14, "=");
  }
  for (let x = 3; x <= 13; x += 1) {
    setTile(map, x, 14, x < 7 ? "." : ",");
  }
  for (let x = 7; x <= 14; x += 1) {
    setTile(map, x, 13, ",");
  }
  for (let x = 9; x <= 13; x += 1) {
    setTile(map, x, 12, ".");
  }
  for (let y = 8; y <= 14; y += 1) {
    setTile(map, 13, y, ",");
  }
  for (let x = 13; x <= 17; x += 1) {
    setTile(map, x, 9, ",");
  }
  for (let x = 18; x <= 22; x += 1) {
    setTile(map, x, 9, "S");
  }
  for (let x = 14; x <= 21; x += 1) {
    setTile(map, x, 7, "S");
  }
  for (let x = 14; x <= 22; x += 1) {
    setTile(map, x, 8, ",");
  }
  for (let y = 5; y <= 8; y += 1) {
    setTile(map, 22, y, y === 5 ? "=" : ".");
  }
  for (let x = 22; x <= 24; x += 1) {
    setTile(map, x, 5, "=");
  }

  setTile(map, 7, 13, ",");
  setTile(map, 10, 12, ".");
  setTile(map, 12, 14, ",");
  setTile(map, 13, 8, ".");
  setTile(map, 18, 8, "=");
  setTile(map, 21, 6, ".");
  setTile(map, 24, 5, "=");
  return map;
}

function buildStorehouseMap() {
  const map = makeMap(16, 12, "#");
  fillRect(map, 2, 2, 12, 8, "b");
  fillRect(map, 3, 3, 2, 2, "W");
  fillRect(map, 10, 3, 3, 1, "W");
  fillRect(map, 4, 7, 2, 1, "W");
  fillRect(map, 11, 8, 2, 1, "W");
  setTile(map, 7, 10, "b");
  setTile(map, 7, 9, "b");
  setTile(map, 7, 5, "b");
  setTile(map, 7, 4, "b");
  setTile(map, 10, 6, "b");
  return map;
}

function buildMangroveMap() {
  const w = 28;
  const h = 18;
  const map = makeMap(w, h, "~");

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const dx = (x - 14) / 12;
      const dy = (y - 9) / 7;
      const d = dx * dx + dy * dy;
      if (d < 1) {
        map[y][x] = d > 0.65 ? "m" : "g";
      }
    }
  }

  fillRect(map, 2, 13, 5, 3, "m");
  fillRect(map, 21, 4, 5, 3, "m");
  fillRect(map, 4, 5, 3, 5, "r");
  fillRect(map, 7, 6, 4, 2, "r");
  fillRect(map, 12, 5, 3, 2, "r");
  fillRect(map, 17, 5, 4, 2, "r");
  fillRect(map, 16, 11, 5, 2, "r");
  fillRect(map, 21, 10, 3, 3, "r");
  fillRect(map, 10, 14, 3, 2, "p");

  for (let x = 2; x <= 5; x += 1) {
    setTile(map, x, 14, "=");
  }
  for (let x = 4; x <= 13; x += 1) {
    setTile(map, x, 14, x < 7 ? "m" : "g");
  }
  for (let x = 7; x <= 15; x += 1) {
    setTile(map, x, 13, "g");
  }
  for (let y = 8; y <= 13; y += 1) {
    setTile(map, 15, y, "g");
  }
  for (let x = 15; x <= 24; x += 1) {
    setTile(map, x, 8, "g");
  }
  for (let y = 5; y <= 8; y += 1) {
    setTile(map, 24, y, y === 5 ? "=" : "m");
  }
  for (let x = 22; x <= 24; x += 1) {
    setTile(map, x, 5, "=");
  }
  for (let x = 9; x <= 15; x += 1) {
    setTile(map, x, 11, "g");
  }
  for (let y = 11; y <= 13; y += 1) {
    setTile(map, 9, y, "g");
  }
  for (let x = 16; x <= 22; x += 1) {
    setTile(map, x, 10, "g");
  }
  for (let y = 8; y <= 10; y += 1) {
    setTile(map, 22, y, "g");
  }

  const roots = [
    [6, 11], [7, 12], [11, 9], [13, 10], [18, 13],
    [20, 8], [23, 11], [25, 7], [8, 4], [3, 10]
  ];
  roots.forEach(([x, y]) => setTile(map, x, y, "r"));

  const pools = [
    [6, 8], [7, 9], [18, 6], [19, 6], [20, 12], [21, 12]
  ];
  pools.forEach(([x, y]) => setTile(map, x, y, "p"));

  setTile(map, 3, 14, "=");
  setTile(map, 9, 12, "g");
  setTile(map, 10, 13, "g");
  setTile(map, 15, 8, "g");
  setTile(map, 18, 10, "g");
  setTile(map, 23, 5, "=");
  setTile(map, 24, 5, "=");
  return map;
}

function buildMoonGrottoMap() {
  const map = makeMap(16, 12, "#");
  fillRect(map, 2, 2, 12, 8, "f");
  fillRect(map, 3, 3, 2, 2, "R");
  fillRect(map, 10, 7, 2, 1, "R");
  fillRect(map, 5, 6, 2, 1, "p");
  fillRect(map, 9, 4, 2, 1, "p");
  setTile(map, 7, 10, "f");
  setTile(map, 7, 9, "f");
  setTile(map, 7, 5, "f");
  setTile(map, 7, 4, "f");
  setTile(map, 5, 6, "f");
  return map;
}

function buildStormglassMap() {
  const w = 28;
  const h = 18;
  const map = makeMap(w, h, "~");

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const dx = (x - 14) / 12;
      const dy = (y - 9) / 7;
      const d = dx * dx + dy * dy;
      if (d < 1) {
        map[y][x] = d > 0.65 ? "." : "q";
      }
    }
  }

  fillRect(map, 2, 13, 5, 3, ".");
  fillRect(map, 20, 4, 6, 3, "q");
  fillRect(map, 6, 6, 4, 3, "q");
  fillRect(map, 12, 11, 5, 3, "q");
  fillRect(map, 18, 8, 3, 2, "q");
  fillRect(map, 6, 4, 2, 2, "R");
  fillRect(map, 11, 5, 3, 1, "R");
  fillRect(map, 18, 12, 2, 2, "R");

  for (let x = 2; x <= 5; x += 1) {
    setTile(map, x, 14, "=");
  }
  for (let x = 4; x <= 13; x += 1) {
    setTile(map, x, 14, x < 7 ? "." : "q");
  }
  for (let y = 8; y <= 14; y += 1) {
    setTile(map, 13, y, "q");
  }
  for (let x = 8; x <= 13; x += 1) {
    setTile(map, x, 8, "q");
  }
  for (let x = 13; x <= 24; x += 1) {
    setTile(map, x, 10, "q");
  }
  for (let y = 5; y <= 10; y += 1) {
    setTile(map, 24, y, y === 5 ? "=" : "q");
  }
  for (let x = 21; x <= 24; x += 1) {
    setTile(map, x, 5, "=");
  }
  for (let x = 13; x <= 21; x += 1) {
    setTile(map, x, 12, "q");
  }
  for (let y = 6; y <= 12; y += 1) {
    setTile(map, 21, y, "q");
  }

  const rocks = [
    [5, 10], [7, 11], [10, 6], [14, 6], [17, 7],
    [19, 10], [22, 8], [25, 7], [15, 15], [23, 13]
  ];
  rocks.forEach(([x, y]) => setTile(map, x, y, "R"));

  setTile(map, 3, 14, "=");
  setTile(map, 7, 13, "q");
  setTile(map, 9, 8, "q");
  setTile(map, 11, 10, "q");
  setTile(map, 16, 12, "q");
  setTile(map, 18, 8, "q");
  setTile(map, 21, 6, "q");
  setTile(map, 23, 5, "=");
  setTile(map, 24, 5, "=");
  return map;
}

function buildDunesMap() {
  const w = 28;
  const h = 18;
  const map = makeMap(w, h, "~");

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const dx = (x - 14) / 12;
      const dy = (y - 9) / 7;
      const d = dx * dx + dy * dy;
      if (d < 1) {
        map[y][x] = d > 0.64 ? "." : "d";
      }
    }
  }

  fillRect(map, 2, 13, 5, 3, ".");
  fillRect(map, 21, 4, 5, 3, "d");
  fillRect(map, 6, 5, 4, 3, "x");
  fillRect(map, 11, 9, 3, 2, "x");
  fillRect(map, 16, 5, 4, 2, "x");
  fillRect(map, 19, 13, 4, 2, "x");
  fillRect(map, 14, 7, 3, 2, "o");

  for (let x = 2; x <= 5; x += 1) {
    setTile(map, x, 14, "=");
  }
  for (let x = 4; x <= 13; x += 1) {
    setTile(map, x, 14, x < 7 ? "." : "d");
  }
  for (let y = 8; y <= 14; y += 1) {
    setTile(map, 13, y, "d");
  }
  for (let x = 9; x <= 16; x += 1) {
    setTile(map, x, 11, "d");
  }
  for (let x = 13; x <= 24; x += 1) {
    setTile(map, x, 8, "d");
  }
  for (let y = 5; y <= 8; y += 1) {
    setTile(map, 24, y, y === 5 ? "=" : "d");
  }
  for (let x = 21; x <= 24; x += 1) {
    setTile(map, x, 5, "=");
  }
  for (let x = 16; x <= 22; x += 1) {
    setTile(map, x, 12, "d");
  }
  for (let y = 8; y <= 12; y += 1) {
    setTile(map, 22, y, "d");
  }

  const bones = [
    [5, 10], [7, 9], [10, 6], [15, 5], [18, 10],
    [21, 9], [25, 8], [11, 15], [17, 14], [23, 13]
  ];
  bones.forEach(([x, y]) => setTile(map, x, y, "x"));

  setTile(map, 3, 14, "=");
  setTile(map, 7, 13, "d");
  setTile(map, 9, 11, "d");
  setTile(map, 9, 12, "d");
  setTile(map, 13, 11, "d");
  setTile(map, 15, 8, "d");
  setTile(map, 16, 12, "d");
  setTile(map, 19, 12, "d");
  setTile(map, 19, 13, "d");
  setTile(map, 20, 12, "d");
  setTile(map, 20, 13, "d");
  setTile(map, 21, 6, "d");
  setTile(map, 23, 5, "=");
  setTile(map, 24, 5, "=");
  return map;
}

function buildWreckyardMap() {
  const w = 28;
  const h = 18;
  const map = makeMap(w, h, "~");

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const dx = (x - 14) / 12;
      const dy = (y - 9) / 7;
      const d = dx * dx + dy * dy;
      if (d < 1) {
        map[y][x] = d > 0.64 ? "." : "w";
      }
    }
  }

  fillRect(map, 2, 13, 5, 3, ".");
  fillRect(map, 21, 4, 5, 3, "w");
  fillRect(map, 5, 5, 5, 3, "h");
  fillRect(map, 11, 9, 4, 2, "h");
  fillRect(map, 16, 5, 3, 2, "h");
  fillRect(map, 20, 12, 4, 2, "h");
  fillRect(map, 13, 7, 3, 2, "u");

  for (let x = 2; x <= 5; x += 1) {
    setTile(map, x, 14, "=");
  }
  for (let x = 4; x <= 13; x += 1) {
    setTile(map, x, 14, x < 7 ? "." : "w");
  }
  for (let y = 8; y <= 14; y += 1) {
    setTile(map, 13, y, "w");
  }
  for (let x = 8; x <= 18; x += 1) {
    setTile(map, x, 8, "w");
  }
  for (let x = 13; x <= 24; x += 1) {
    setTile(map, x, 10, "w");
  }
  for (let y = 5; y <= 10; y += 1) {
    setTile(map, 24, y, y === 5 ? "=" : "w");
  }
  for (let x = 21; x <= 24; x += 1) {
    setTile(map, x, 5, "=");
  }
  for (let x = 15; x <= 22; x += 1) {
    setTile(map, x, 12, "w");
  }
  for (let y = 8; y <= 12; y += 1) {
    setTile(map, 22, y, "w");
  }

  const hulls = [
    [5, 10], [7, 9], [10, 6], [15, 5], [17, 13],
    [20, 9], [25, 8], [11, 15], [18, 14], [23, 13]
  ];
  hulls.forEach(([x, y]) => setTile(map, x, y, "h"));

  setTile(map, 3, 14, "=");
  setTile(map, 7, 13, "w");
  setTile(map, 9, 8, "w");
  setTile(map, 11, 10, "w");
  setTile(map, 15, 12, "w");
  setTile(map, 16, 7, "w");
  for (let y = 2; y <= 15; y += 1) {
    setTile(map, 18, y, "h");
  }
  setTile(map, 18, 8, "=");
  setTile(map, 19, 8, "w");
  setTile(map, 20, 8, "w");
  setTile(map, 21, 6, "w");
  setTile(map, 22, 5, "=");
  setTile(map, 23, 5, "=");
  setTile(map, 24, 5, "=");
  return map;
}

function buildCrownRuinsMap() {
  const w = 28;
  const h = 18;
  const map = makeMap(w, h, "~");

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const dx = (x - 14) / 12;
      const dy = (y - 9) / 7;
      const d = dx * dx + dy * dy;
      if (d < 1) {
        map[y][x] = d > 0.64 ? "." : "y";
      }
    }
  }

  fillRect(map, 2, 13, 5, 3, ".");
  fillRect(map, 20, 4, 6, 3, "y");
  fillRect(map, 5, 5, 5, 3, "n");
  fillRect(map, 11, 6, 3, 2, "n");
  fillRect(map, 16, 4, 3, 2, "n");
  fillRect(map, 20, 11, 4, 2, "n");
  fillRect(map, 12, 10, 5, 2, "y");

  for (let x = 2; x <= 5; x += 1) {
    setTile(map, x, 14, "=");
  }
  for (let x = 4; x <= 13; x += 1) {
    setTile(map, x, 14, x < 7 ? "." : "y");
  }
  for (let y = 9; y <= 14; y += 1) {
    setTile(map, 13, y, "y");
  }
  for (let x = 8; x <= 18; x += 1) {
    setTile(map, x, 9, "y");
  }
  for (let x = 13; x <= 24; x += 1) {
    setTile(map, x, 8, "y");
  }
  for (let y = 5; y <= 8; y += 1) {
    setTile(map, 24, y, "y");
  }
  for (let x = 21; x <= 24; x += 1) {
    setTile(map, x, 5, "y");
  }
  for (let x = 15; x <= 22; x += 1) {
    setTile(map, x, 12, "y");
  }
  for (let y = 8; y <= 12; y += 1) {
    setTile(map, 22, y, "y");
  }

  const pillars = [
    [6, 10], [7, 9], [10, 6], [15, 5], [17, 13],
    [20, 9], [25, 8], [11, 15], [18, 14], [23, 13]
  ];
  pillars.forEach(([x, y]) => setTile(map, x, y, "n"));

  setTile(map, 3, 14, "=");
  setTile(map, 7, 13, "y");
  setTile(map, 9, 8, "y");
  setTile(map, 11, 13, "y");
  setTile(map, 14, 9, "y");
  setTile(map, 19, 8, "y");
  setTile(map, 24, 5, "y");
  return map;
}

function buildThroneVaultMap() {
  const map = makeMap(16, 12, "#");
  fillRect(map, 2, 2, 12, 8, "y");
  fillRect(map, 3, 3, 2, 2, "n");
  fillRect(map, 11, 3, 2, 2, "n");
  fillRect(map, 3, 7, 2, 1, "n");
  fillRect(map, 11, 7, 2, 1, "n");
  setTile(map, 7, 10, "y");
  setTile(map, 7, 9, "y");
  setTile(map, 7, 3, "y");
  setTile(map, 5, 5, "y");
  setTile(map, 9, 6, "y");
  setTile(map, 10, 7, "y");
  return map;
}

function makeMap(w, h, fill) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => fill));
}

function fillRect(map, x, y, w, h, tile) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setTile(map, xx, yy, tile);
    }
  }
}

function carveLagoon(map, cx, cy, rx, ry) {
  for (let y = cy - ry; y <= cy + ry; y += 1) {
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        setTile(map, x, y, "L");
      }
    }
  }
}

function setTile(map, x, y, tile) {
  if (map[y] && map[y][x] !== undefined) {
    map[y][x] = tile;
  }
}
