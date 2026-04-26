"use strict";

// Game state
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const hudOverlay = document.getElementById("hudOverlay");
const hudHp = document.getElementById("hudHp");
const hudBananas = document.getElementById("hudBananas");
const hudParts = document.getElementById("hudParts");
const hudMap = document.getElementById("hudMap");
const hudPartList = document.getElementById("hudPartList");
const hudObjective = document.getElementById("hudObjective");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TILE = 16;
const HUD_H = 40;
const VIEW_COLS = Math.ceil(WIDTH / TILE);
const VIEW_ROWS = Math.ceil((HEIGHT - HUD_H) / TILE);
const MOVE_DELAY = 135;

const STATE = {
  MENU: "MENU",
  INTRO: "INTRO",
  EXPLORE: "EXPLORE",
  DIALOGUE: "DIALOGUE",
  BATTLE: "BATTLE",
  PAUSE: "PAUSE",
  GAME_OVER: "GAME_OVER",
  VICTORY: "VICTORY"
};

let state = STATE.MENU;
let previousState = STATE.MENU;
let battleIndex = 0;
let controlsPulse = 0;
let frameTime = 0;
let lastTime = 0;
let moveCooldown = 0;
let camera = { x: 0, y: 0 };
let dialogue = null;
let battle = null;

const keys = {};
let game = makeFreshGame();

const muteButton = document.getElementById("muteButton");
const audio = {
  muted: false,
  ctx: null,
  titleMusic: {
    osc: null,
    gain: null,
    timer: null,
    noteIndex: 0
  }
};
const TITLE_MUSIC_NOTES = [
  392, 523, 659, 587, 523, 440, 494, 523,
  392, 523, 698, 659, 587, 523, 440, 0
];

muteButton.addEventListener("click", () => {
  initAudio();
  toggleMute();
});

setupTouchControls();

window.addEventListener("keydown", (event) => {
  const key = normalizeKey(event.key);
  if (shouldPreventKey(key)) {
    event.preventDefault();
  }
  initAudio();
  if (!keys[key]) {
    handleKeyPress(key);
  }
  keys[key] = true;
});

window.addEventListener("keyup", (event) => {
  keys[normalizeKey(event.key)] = false;
});

requestAnimationFrame(loop);

function makeFreshGame() {
  return {
    currentMap: "island",
    player: {
      x: 7,
      y: 19,
      hp: 20,
      maxHp: 20,
      bananas: 4,
      facing: { x: 0, y: -1 },
      steps: 0
    },
    inventory: makeFreshInventory(),
    spentInventory: {},
    interactables: makeInteractables(),
    enemies: makeEnemies(),
    raftFixed: false,
    signalLit: false,
    reefBellRung: false,
    volcanoCalmed: false,
    coveChartRead: false,
    mangroveCompassAligned: false,
    stormMastRaised: false,
    duneDialAligned: false,
    wreckCompassRestored: false,
    royalStatuesOpened: false,
    throneVaultOpened: false,
    crownReassembled: false
  };
}

// Map/collision
function tileAt(mapName, x, y) {
  const tiles = maps[mapName].tiles;
  if (!tiles[y] || tiles[y][x] === undefined) {
    return maps[mapName].voidTile || "~";
  }
  return tiles[y][x];
}

function isSolidTile(tile) {
  return tile === "~" || tile === "L" || tile === "J" || tile === "T" ||
    tile === "R" || tile === "W" || tile === "#" || tile === "C" || tile === "v" ||
    tile === "S" || tile === "r" || tile === "p" || tile === "x" || tile === "h" ||
    tile === "n";
}

function isBlocked(x, y, includeEnemies = true, ignoreEnemy = null) {
  if (isSolidTile(tileAt(game.currentMap, x, y))) {
    return true;
  }
  if (game.interactables.some((obj) =>
    obj.map === game.currentMap &&
    obj.solid &&
    isObjectActive(obj) &&
    obj.x === x &&
    obj.y === y
  )) {
    return true;
  }
  if (includeEnemies && game.enemies.some((enemy) =>
    enemy !== ignoreEnemy &&
    enemy.map === game.currentMap &&
    enemy.active &&
    enemy.x === x &&
    enemy.y === y
  )) {
    return true;
  }
  return false;
}

function isObjectActive(obj) {
  return obj.active !== false;
}

// Input
function normalizeKey(key) {
  if (key === " ") {
    return "space";
  }
  return key.toLowerCase();
}

function shouldPreventKey(key) {
  return key === "space" || key === "arrowup" || key === "arrowdown" ||
    key === "arrowleft" || key === "arrowright";
}

function setupTouchControls() {
  document.querySelectorAll("[data-hold-key]").forEach((button) => {
    const key = button.dataset.holdKey;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (button.setPointerCapture) {
        button.setPointerCapture(event.pointerId);
      }
      pressTouchKey(key, true);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
      button.addEventListener(eventName, (event) => {
        event.preventDefault();
        keys[key] = false;
      });
    });
  });

  document.querySelectorAll("[data-tap-key]").forEach((button) => {
    const key = button.dataset.tapKey;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      initAudio();
      handleKeyPress(key);
    });
  });
}

function pressTouchKey(key, hold) {
  initAudio();
  if (!keys[key]) {
    handleKeyPress(key);
  }
  if (hold) {
    keys[key] = true;
  }
}

function handleKeyPress(key) {
  if (key === "m") {
    toggleMute();
    if (state !== STATE.INTRO) {
      return;
    }
  }

  if (state === STATE.MENU) {
    handleMenuKey(key);
  } else if (state === STATE.INTRO) {
    state = STATE.EXPLORE;
    beep("start");
  } else if (state === STATE.EXPLORE) {
    if (isConfirm(key)) {
      interact();
    } else if (key === "escape") {
      previousState = state;
      state = STATE.PAUSE;
    }
  } else if (state === STATE.DIALOGUE) {
    if (isConfirm(key) || key === "escape") {
      advanceDialogue();
    }
  } else if (state === STATE.BATTLE) {
    handleBattleKey(key);
  } else if (state === STATE.PAUSE) {
    if (key === "escape" || isConfirm(key)) {
      state = previousState;
    }
  } else if (state === STATE.GAME_OVER || state === STATE.VICTORY) {
    if (isConfirm(key)) {
      startNewRun();
    } else if (key === "escape") {
      state = STATE.MENU;
    }
  }
}

function handleMenuKey(key) {
  if (isConfirm(key)) {
    startNewRun();
  }
}

function isConfirm(key) {
  return key === "enter" || key === "space" || key === "e";
}

function heldDirection() {
  if (keys.arrowup || keys.w) {
    return { x: 0, y: -1 };
  }
  if (keys.arrowdown || keys.s) {
    return { x: 0, y: 1 };
  }
  if (keys.arrowleft || keys.a) {
    return { x: -1, y: 0 };
  }
  if (keys.arrowright || keys.d) {
    return { x: 1, y: 0 };
  }
  return null;
}

// Game loop
function loop(timestamp) {
  const dt = Math.min(50, timestamp - lastTime || 16);
  lastTime = timestamp;
  frameTime += dt;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function update(dt) {
  controlsPulse += dt;
  syncTitleMusic();
  if (state !== STATE.EXPLORE) {
    return;
  }

  moveCooldown -= dt;
  const dir = heldDirection();
  if (dir && moveCooldown <= 0) {
    attemptMove(dir.x, dir.y);
    moveCooldown = MOVE_DELAY;
  }

  updateEnemies(dt);
  updateCamera();
}

function attemptMove(dx, dy) {
  const player = game.player;
  player.facing = { x: dx, y: dy };
  const nx = player.x + dx;
  const ny = player.y + dy;
  const enemy = enemyAt(nx, ny);
  if (enemy && enemy.cooldown <= 0) {
    startBattle(enemy);
    return;
  }
  if (!isBlocked(nx, ny, true)) {
    player.x = nx;
    player.y = ny;
    player.steps += 1;
    beep("move");
  }
}

function updateEnemies(dt) {
  game.enemies.forEach((enemy) => {
    if (!enemy.active || enemy.map !== game.currentMap) {
      return;
    }
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);
    enemy.moveTimer -= dt;
    if (enemy.moveTimer > 0) {
      return;
    }
    enemy.moveTimer = 650 + Math.random() * 900;
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 }
    ];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = enemy.x + dir.x;
    const ny = enemy.y + dir.y;
    if (game.player.x === nx && game.player.y === ny && enemy.cooldown <= 0) {
      startBattle(enemy);
      return;
    }
    if (!isBlocked(nx, ny, false, enemy) &&
      !(game.player.x === nx && game.player.y === ny)) {
      enemy.x = nx;
      enemy.y = ny;
    }
  });
}

function enemyAt(x, y) {
  return game.enemies.find((enemy) =>
    enemy.map === game.currentMap &&
    enemy.active &&
    enemy.x === x &&
    enemy.y === y
  );
}

function updateCamera() {
  const tiles = maps[game.currentMap].tiles;
  camera.x = clamp(game.player.x - Math.floor(VIEW_COLS / 2), 0, Math.max(0, tiles[0].length - VIEW_COLS));
  camera.y = clamp(game.player.y - Math.floor(VIEW_ROWS / 2), 0, Math.max(0, tiles.length - VIEW_ROWS));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Interactions
const INTERACTION_HANDLERS = {
  chest: handleChest,
  wreckage: collectItemAndSpeak,
  parrot: () => startDialogue(parrotLines()),
  cave: handleCaveEntrance,
  exit: handleCaveExit,
  raft: handleRaft,
  arrivalRaft: () => sailToIsland(),
  reefRaft: () => sailToAtollFromReef(),
  tidepool: collectItemAndSpeak,
  messageBottle: collectItemAndSpeak,
  dinghy: collectItemAndSpeak,
  lookout: () => startDialogue(lookoutLines()),
  beacon: handleBeacon,
  coralGate: handleCoralGate,
  shipBell: handleShipBell,
  portal: handlePortal,
  volcanoRaft: () => sailToReefFromVolcano(),
  mangoTree: collectItemAndSpeak,
  volcanoSage: () => startDialogue(volcanoSageLines()),
  steamVent: handleSteamVent,
  obsidianPlug: collectItemAndSpeak,
  volcanoAltar: handleVolcanoAltar,
  coveRaft: () => sailToVolcanoFromCove(),
  quartermaster: handleQuartermaster,
  suspiciousCrates: handleSuspiciousCrates,
  storehouseDoor: handleStorehouseDoor,
  cratePulley: handleCratePulley,
  coveLookout: handleCoveLookout,
  moonStampedCrate: handleMoonStampedCrate,
  mangroveRaft: () => sailToCoveFromMangrove(),
  silverLeaf: handleSilverLeaf,
  moonPool: handleMoonPool,
  moonCompassStone: handleMoonCompassStone,
  stormSkiff: () => sailToMangroveFromStormglass(),
  stormWatcher: () => startDialogue(stormWatcherLines()),
  stormglassShard: handleStormPickup,
  copperRod: handleStormPickup,
  kiteString: handleStormPickup,
  stormMast: handleStormMast,
  duneRaft: () => sailToStormglassFromDunes(),
  duneGuide: () => startDialogue(duneGuideLines()),
  buriedChest: handleDunePickup,
  miragePool: handleDunePickup,
  cactusCanteen: handleDunePickup,
  duneSunDial: handleDuneSunDial,
  wreckyardRaft: () => sailToDunesFromWreckyard(),
  whisperingMast: () => startDialogue(whisperingMastLines()),
  ghostCompassAlcove: handleWreckPickup,
  anchorCharm: handleWreckPickup,
  anchorGate: handleAnchorGate,
  captainStatue: handleCaptainStatue,
  ghostCompassStand: handleGhostCompassStand,
  royalDock: () => sailToWreckyardFromCrown(),
  bananaKingGhost: () => startDialogue(bananaKingGhostLines()),
  royalBananaGem: handleCrownPickup,
  ancientMonkeyStatues: handleAncientMonkeyStatues,
  throneVaultDoor: handleThroneVaultDoor,
  finalTreasureChest: handleFinalTreasureChest,
  bananaKingThrone: handleBananaKingThrone,
  goldenEscapeShip: handleGoldenEscapeShip
};

function interact() {
  const obj = nearbyInteractable();
  if (!obj) {
    startDialogue(["Captain Bananas pats the air. Nothing piratey happens."]);
    return;
  }

  const handler = INTERACTION_HANDLERS[obj.type];
  if (!handler) {
    startDialogue(["Captain Bananas gives it a careful pirate inspection. Nothing happens."]);
    return;
  }
  handler(obj);
}

function collectItemAndSpeak(obj, options = {}) {
  obj.active = false;
  if (options.opened) {
    obj.opened = true;
  }
  if (obj.item) {
    grantInventoryItem(obj.item);
  }
  if (obj.keyItem) {
    grantInventoryItem(obj.keyItem);
  }
  if (obj.bananas) {
    game.player.bananas += obj.bananas;
  }
  beep("pickup");
  startDialogue(obj.lines);
}

function handleChest(obj) {
  collectItemAndSpeak(obj, { opened: true });
}

function handleCaveEntrance() {
  startDialogue([
    "A cave mouth grins in the rock.",
    "Captain Bananas whispers, 'If treasure had a smell, it would be damp.'"
  ], () => {
    enterMap("cave", 8, 9, 0, -1);
  });
}

function handleCaveExit() {
  startDialogue(["Fresh island air! Slightly less batty."], () => {
    enterMap("island", 24, 6, 0, 1);
  });
}

function handleGoldenEscapeShip() {
  startDialogue([
    "The golden escape ship hums with banana-bright sails.",
    "Captain Bananas has found his way home."
  ]);
}

function nearbyInteractable() {
  const p = game.player;
  const front = { x: p.x + p.facing.x, y: p.y + p.facing.y };
  const active = game.interactables.filter((obj) => obj.map === game.currentMap && isObjectActive(obj));
  const exact = active.find((obj) => obj.x === front.x && obj.y === front.y);
  if (exact) {
    return exact;
  }
  return active.find((obj) => Math.abs(obj.x - p.x) + Math.abs(obj.y - p.y) <= 1);
}

function parrotLines() {
  if (!hasPart("Sail Cloth")) {
    return [
      "Squawk! Captain Bananas!",
      "A chest on the beach has cloth fit for a tiny proud sail."
    ];
  }
  if (!hasPart("Wooden Planks")) {
    return [
      "Squawk! Ye need planks!",
      "Try the busted ship. It owes ye a refund."
    ];
  }
  if (!hasPart("Golden Compass")) {
    return [
      "Squawk! Shiny compass waits in the cave!",
      "Mind the flappy cave customer."
    ];
  }
  return [
    "Squawk! That's all the raft loot!",
    "Fix the raft at the lagoon and sail like a legend with thumbs."
  ];
}

function handleRaft() {
  if (!hasAllParts()) {
    startDialogue([
      "The escape raft bobs sadly at the lagoon.",
      "It needs Sail Cloth, Wooden Planks, and a Golden Compass."
    ]);
    return;
  }
  if (game.raftFixed) {
    sailToAtollReturn();
    return;
  }
  game.raftFixed = true;
  spendQuestItems(QUESTS.raft);
  startDialogue([
    "Captain Bananas repairs the raft, salutes Banana Skull Island,",
    "and paddles beyond the reef toward Coconut Crown Atoll!"
  ], () => {
    sailToAtoll();
  });
}

function sailToAtoll() {
  travelToMap("atoll", 3, 14, -1, 0, [
    "After a moonlit wobble across the sea, the raft bumps into Coconut Crown Atoll.",
    "A lonely hilltop beacon waits above the palms. Time to make a bigger signal."
  ], 4);
}

function sailToIsland() {
  travelToMap("island", 26, 16, 1, 0, [
    "Captain Bananas paddles back along the familiar lagoon current.",
    "Banana Skull Island waits with old footprints and unfinished business."
  ], 4);
}

function sailToAtollReturn() {
  travelToMap("atoll", 3, 14, -1, 0, [
    "The raft bobs across the short channel.",
    "Coconut Crown Atoll rises ahead, bright beacon and all."
  ], 4);
}

function lookoutLines() {
  if (!hasBeaconItem("Signal Lens")) {
    return [
      "A sun-baked lookout taps the broken beacon with a stick.",
      "Need a Signal Lens. Blue chest, north grove. Mind the gull."
    ];
  }
  if (!hasBeaconItem("Ember Shell")) {
    return [
      "Good lens, captain. Now it needs spark.",
      "An Ember Shell glows in the warm tidepool south of here."
    ];
  }
  return [
    "Lens bright, shell hot. That beacon is ready.",
    "Light it before my dramatic pointing arm gives out."
  ];
}

function handleBeacon() {
  if (!hasAllBeaconItems()) {
    const missing = formatItemList(missingQuestItems(QUESTS.beacon));
    startDialogue([
      "The hilltop beacon is cracked but eager.",
      `It still needs ${missing}.`
    ]);
    return;
  }
  if (game.signalLit) {
    sailToReefReturn();
    return;
  }
  game.signalLit = true;
  spendQuestItems(QUESTS.beacon);
  startDialogue([
    "Captain Bananas slots the Signal Lens and Ember Shell into place.",
    "The beacon erupts in golden light, revealing Rusty Rudder Reef!"
  ], () => {
    sailToReef();
  });
}

function sailToReef() {
  travelToMap("reef", 3, 14, 1, 0, [
    "The beacon's glow guides the raft through fog and foam to Rusty Rudder Reef.",
    "An old ship bell hangs silent above the wrecks. Ring it to call the bold current."
  ], 5);
}

function sailToAtollFromReef() {
  travelToMap("atoll", 3, 14, -1, 0, [
    "The raft slides away from Rusty Rudder Reef.",
    "Coconut Crown Atoll glows back into view."
  ], 5);
}

function sailToReefReturn() {
  travelToMap("reef", 3, 14, 1, 0, [
    "The raft follows the beacon-lit current.",
    "Rusty Rudder Reef clatters ahead, all coral and old planks."
  ], 5);
}

function handleCoralGate(obj) {
  if (!hasReefItem("Coral Key")) {
    startDialogue([
      "A coral gate pinches the channel shut.",
      "The lock is shaped like a tiny, smug seashell."
    ]);
    return;
  }
  obj.active = false;
  spendInventoryItem("Coral Key");
  beep("pickup");
  startDialogue([
    "The Coral Key clicks into the reef lock.",
    "The gate folds open like a very dramatic flower."
  ]);
}

function handleShipBell() {
  if (!hasAllReefItems()) {
    const missing = formatItemList(missingQuestItems(QUESTS.reefBell));
    startDialogue([
      "The old ship bell hangs in a cracked frame.",
      `It still needs ${missing}.`
    ]);
    return;
  }
  if (game.reefBellRung) {
    sailToVolcanoReturn();
    return;
  }
  game.reefBellRung = true;
  spendQuestItems(QUESTS.reefBell);
  startDialogue([
    "Captain Bananas fits the Rusty Rudder, hangs the Brass Bell, and rings it hard.",
    "A friendly current roars awake and points the raft toward Mango Volcano Isle!"
  ], () => {
    sailToVolcano();
  });
}

function handlePortal(obj) {
  startDialogue(obj.lines, () => {
    const facing = obj.targetFacing || { x: 0, y: 1 };
    enterMap(obj.targetMap, obj.targetX, obj.targetY, facing.x, facing.y);
  });
}

function sailToVolcano() {
  travelToMap("volcano", 3, 14, 1, 0, [
    "The current flings the raft onto warm black sand beneath Mango Volcano.",
    "A smoky altar waits above the lava cracks. The island wants an offering."
  ], 6);
}

function sailToReefFromVolcano() {
  travelToMap("reef", 3, 14, 1, 0, [
    "Captain Bananas kicks the raft off the warm black sand.",
    "The current carries him back to Rusty Rudder Reef."
  ], 6);
}

function sailToVolcanoReturn() {
  travelToMap("volcano", 3, 14, 1, 0, [
    "The restored ship bell sings again.",
    "Its current points Captain Bananas back to Mango Volcano Isle."
  ], 6);
}

function sailToCove() {
  travelToMap("cove", 3, 14, 1, 0, [
    "The calmed volcano exhales a warm wind across the waves.",
    "Captain Bananas follows it to Sugarcane Smuggler Cove, where crates hide in the cane."
  ], 7);
}

function sailToVolcanoFromCove() {
  travelToMap("volcano", 3, 14, 1, 0, [
    "Captain Bananas shoves off from the cove dock.",
    "Mango Volcano Isle smolders peacefully one island back."
  ], 7);
}

function sailToCoveReturn() {
  travelToMap("cove", 3, 14, 1, 0, [
    "The volcano altar glows softly and points downwind.",
    "Sugarcane Smuggler Cove waits beyond the warm current."
  ], 7);
}

function sailToMangrove() {
  travelToMap("mangrove", 3, 14, 1, 0, [
    "The Star Chart pulls moonlight across the water like a silver rope.",
    "Captain Bananas sails into Moonlit Mangrove, where roots whisper over black water."
  ], 8);
}

function sailToCoveFromMangrove() {
  travelToMap("cove", 23, 5, 1, 0, [
    "Captain Bananas follows the moonlit current back west.",
    "Sugarcane Smuggler Cove waits, with that old storehouse still creaking."
  ], 8);
}

function sailToMangroveReturn() {
  travelToMap("mangrove", 3, 14, 1, 0, [
    "The Star Chart shines again over the lookout pier.",
    "Moonlit Mangrove opens its dark channel for another crossing."
  ], 8);
}

function sailToStormglass() {
  travelToMap("stormglass", 3, 14, 1, 0, [
    "The moon compass throws a silver line into a bruised storm cloud.",
    "Captain Bananas lands on Stormglass Shoal, where every puddle looks guilty."
  ], 9);
}

function sailToMangroveFromStormglass() {
  travelToMap("mangrove", 3, 14, 1, 0, [
    "Captain Bananas rows the storm skiff away from the lightning.",
    "Moonlit Mangrove curls back into view, all roots and quiet glow."
  ], 9);
}

function sailToStormglassReturn() {
  travelToMap("stormglass", 3, 14, 1, 0, [
    "The moon compass stone hums under Captain Bananas' hand.",
    "Stormglass Shoal flashes ahead beneath a stack of thunderclouds."
  ], 9);
}

function sailToDunes() {
  travelToMap("dunes", 3, 14, 1, 0, [
    "The raised mast catches one clean bolt and points the sea east.",
    "Captain Bananas lands on Pearlbone Dunes, where the sand shines like old coral."
  ], 10);
}

function sailToStormglassFromDunes() {
  travelToMap("stormglass", 3, 14, 1, 0, [
    "Captain Bananas pushes off from the pale dune shore.",
    "Stormglass Shoal flashes back into view under rumbling clouds."
  ], 10);
}

function sailToDunesReturn() {
  travelToMap("dunes", 3, 14, 1, 0, [
    "The storm mast hums and bends the current east again.",
    "Pearlbone Dunes glitters ahead, bright enough to make a pirate squint."
  ], 10);
}

function sailToWreckyard() {
  travelToMap("wreckyard", 3, 14, 1, 0, [
    "The aligned sun dial cuts a bright path through the mirage.",
    "Captain Bananas reaches Whispering Wreckyard, where old masts mutter in the fog."
  ], 11);
}

function sailToDunesFromWreckyard() {
  travelToMap("dunes", 3, 14, 1, 0, [
    "Captain Bananas shoves off from the foggy wreck raft.",
    "Pearlbone Dunes shines back into view beyond the hush."
  ], 11);
}

function sailToWreckyardReturn() {
  travelToMap("wreckyard", 3, 14, 1, 0, [
    "The sun dial points through the mirage again.",
    "Whispering Wreckyard waits, all fog and half-remembered sea songs."
  ], 11);
}

function sailToCrownRuins() {
  travelToMap("crownRuins", 3, 14, 1, 0, [
    "The restored Ghost Compass points through the fog to a shore of gold.",
    "Captain Bananas reaches the Crown of the Banana King, where royal ruins glitter in the sea wind."
  ], 12);
}

function sailToWreckyardFromCrown() {
  travelToMap("wreckyard", 23, 5, 1, 0, [
    "Captain Bananas pushes off from the royal dock.",
    "Whispering Wreckyard drifts back into view, muttering over the fog."
  ], 12);
}

function sailToCrownRuinsReturn() {
  travelToMap("crownRuins", 3, 14, 1, 0, [
    "The Ghost Compass glows again at the wreckyard stand.",
    "The royal current carries Captain Bananas back to the Crown of the Banana King."
  ], 12);
}

function travelToMap(mapName, x, y, fx, fy, lines, minBananas) {
  enterMap(mapName, x, y, fx, fy);
  game.player.hp = game.player.maxHp;
  if (minBananas !== undefined) {
    game.player.bananas = Math.max(game.player.bananas, minBananas);
  }
  beep("start");
  startDialogue(lines);
}

function volcanoSageLines() {
  if (!hasVolcanoItem("Cool Mango")) {
    if (hasInventoryItem("Cool Mango")) {
      return [
        "That first Cool Mango did its brave work on the steam vent.",
        "A second mango tree waits beyond the cooled steam path. That one is for the altar."
      ];
    }
    return [
      "The mango sage fans himself with a leaf.",
      "Bring a Cool Mango first. Steam respects snacks with confidence."
    ];
  }
  if (!hasVolcanoItem("Obsidian Plug")) {
    return [
      "Good mango. Now plug the volcano's grumpy little cough.",
      "Black stone near the lava crack should do."
    ];
  }
  if (!hasVolcanoItem("Smoke Charm")) {
    return [
      "One last thing: a Smoke Charm from the upper shrine chest.",
      "Then the altar might stop making that dramatic noise."
    ];
  }
  return [
    "Mango, plug, charm. Perfect.",
    "Place them at the altar before my eyebrows finish evaporating."
  ];
}

function handleSteamVent(obj) {
  if (!hasVolcanoItem("Cool Mango")) {
    startDialogue([
      "A steam vent blasts across the path.",
      "It needs something cool enough to make it reconsider."
    ]);
    return;
  }
  obj.active = false;
  spendInventoryItem("Cool Mango");
  beep("pickup");
  startDialogue([
    "Captain Bananas rolls the Cool Mango through the steam.",
    "The vent sighs, chills out, and clears the path."
  ]);
}

function handleVolcanoAltar() {
  if (!hasAllVolcanoItems()) {
    const missing = formatItemList(missingVolcanoItems());
    startDialogue([
      "The smoky altar rumbles under a mango-shaped carving.",
      `It still needs ${missing}.`
    ]);
    return;
  }
  if (game.volcanoCalmed) {
    sailToCoveReturn();
    return;
  }
  game.volcanoCalmed = true;
  spendQuestItems(QUESTS.volcanoCalm);
  startDialogue([
    "Captain Bananas sets the Cool Mango, Obsidian Plug, and Smoke Charm on the altar.",
    "Mango Volcano puffs one last heart-shaped cloud and opens a warm current east!"
  ], () => {
    sailToCove();
  });
}

function handleQuartermaster() {
  if (!hasCoveItem("Storehouse Key")) {
    grantInventoryItem("Storehouse Key");
    beep("pickup");
    startDialogue([
      "The retired quartermaster squints, then fishes a key from his sash.",
      "Storehouse Key found! This unlocks the smuggler storehouse door beside the sugarcane maze."
    ]);
    return;
  }
  if (!hasCoveItem("Crate Hook")) {
    startDialogue([
      "The quartermaster taps a stack of crates with his cane.",
      "One suspicious crate hides the hook for the pulley blocking the lookout pier."
    ]);
    return;
  }
  if (!hasCoveItem("Star Chart")) {
    startDialogue([
      "That hook will clear the pier, but the route needs proof.",
      "The Star Chart is locked in the Smuggler Storehouse chest."
    ]);
    return;
  }
  startDialogue([
    "Key, hook, chart. That's the old smuggler recipe.",
    "Read the Star Chart at the lookout pier and make the horizon behave."
  ]);
}

function handleSuspiciousCrates(obj) {
  collectItemAndSpeak(obj);
}

function handleStorehouseDoor(obj) {
  if (!hasCoveItem("Storehouse Key")) {
    startDialogue([
      "The storehouse door is locked with a sugarcane-stamped lock.",
      "The retired quartermaster probably knows where its key is hiding."
    ]);
    return;
  }
  spendInventoryItem("Storehouse Key");
  handlePortal(obj);
}

function handleCratePulley(obj) {
  if (!hasCoveItem("Crate Hook")) {
    startDialogue([
      "A crane rope lifts a crate just enough to be annoying.",
      "The pulley has a hook-shaped slot that matches no banana in Captain Bananas' pockets."
    ]);
    return;
  }
  obj.active = false;
  spendInventoryItem("Crate Hook");
  beep("pickup");
  startDialogue([
    "Captain Bananas snaps the Crate Hook into the crane pulley.",
    "The heavy crate swings aside, clearing the lookout pier path."
  ]);
}

function handleCoveLookout() {
  if (!hasAllCoveItems()) {
    const missing = formatItemList(missingQuestItems(QUESTS.coveChart));
    startDialogue([
      "The lookout pier points toward dark mangrove water.",
      `It still needs ${missing}.`
    ]);
    return;
  }
  if (game.coveChartRead) {
    sailToMangroveReturn();
    return;
  }
  game.coveChartRead = true;
  spendQuestItems(QUESTS.coveChart);
  startDialogue([
    "Captain Bananas spreads the Star Chart over the lookout rail.",
    "Moonlit Mangrove gleams on the horizon. The next pirate route is revealed!"
  ], () => {
    sailToMangrove();
  });
}

function handleMoonStampedCrate(obj) {
  if (!hasInventoryItem("Moonlit Key")) {
    startDialogue([
      "A moon-stamped crate sits under the storehouse dust.",
      "Its lock needs a Moonlit Key from somewhere deeper in Moonlit Mangrove."
    ]);
    return;
  }
  spendInventoryItem("Moonlit Key");
  collectItemAndSpeak(obj, { opened: true });
}

function handleSilverLeaf(obj) {
  collectItemAndSpeak(obj);
}

function handleMoonPool(obj) {
  collectItemAndSpeak(obj);
}

function handleMoonCompassStone() {
  if (!hasAllMangroveItems()) {
    const missing = formatItemList(missingQuestItems(QUESTS.mangroveCompass));
    const lines = [
      "The moon compass stone waits beside the whispering roots.",
      `It still needs ${missing}.`
    ];
    if (!hasMangroveItem("Glow Reed")) {
      lines.push("The empty reed notch points back toward the moon-stamped crate in the Smuggler Storehouse.");
    }
    startDialogue(lines);
    return;
  }
  if (game.mangroveCompassAligned) {
    sailToStormglassReturn();
    return;
  }
  game.mangroveCompassAligned = true;
  spendQuestItems(QUESTS.mangroveCompass);
  startDialogue([
    "Captain Bananas sets the Moon Pearl, Silver Leaf, and Glow Reed into the compass stone.",
    "The mangrove water mirrors a stormy shoal beyond the moon. Stormglass Shoal is revealed!"
  ], () => {
    sailToStormglass();
  });
}

function stormWatcherLines() {
  if (!hasStormItem("Stormglass Shard")) {
    return [
      "The storm watcher grips his hat against the rain.",
      "The mast needs its Stormglass Shard. Blue sparkle, west rocks, very dramatic."
    ];
  }
  if (!hasStormItem("Copper Rod")) {
    return [
      "Good glass. Now the mast needs a Copper Rod.",
      "I saw one humming beside the middle rocks. It bit my spoon."
    ];
  }
  if (!hasStormItem("Kite String")) {
    return [
      "One last bit: Kite String from the washed-up kite frame.",
      "Lightning likes a proper invitation."
    ];
  }
  return [
    "Glass, rod, string. That mast is ready to argue with the sky.",
    "Raise it and try to look electrically responsible."
  ];
}

function handleStormPickup(obj) {
  collectItemAndSpeak(obj);
}

function handleStormMast() {
  if (!hasAllStormItems()) {
    const missing = formatItemList(missingQuestItems(QUESTS.stormMast));
    startDialogue([
      "The broken lightning mast creaks over a kite frame and copper sockets.",
      `It still needs ${missing}.`
    ]);
    return;
  }
  if (game.stormMastRaised) {
    sailToDunesReturn();
    return;
  }
  game.stormMastRaised = true;
  spendQuestItems(QUESTS.stormMast);
  startDialogue([
    "Captain Bananas slots the Stormglass Shard, Copper Rod, and Kite String into the mast.",
    "Lightning snaps down, the storm cheers, and Pearlbone Dunes glitters beyond the rain!"
  ], () => {
    sailToDunes();
  });
}

function duneGuideLines() {
  if (!hasDuneItem("Sun Dial")) {
    return [
      "The dune guide shades his eyes with a shell fan.",
      "Find the Sun Dial first. Buried chest, west ridge, suspiciously lumpy."
    ];
  }
  if (!hasDuneItem("Pearl Token")) {
    return [
      "Good dial. Now the puzzle needs its Pearl Token.",
      "The mirage pool gives up treasure only when you stop believing its nonsense."
    ];
  }
  if (!hasDuneItem("Cactus Canteen")) {
    return [
      "One dry trough still waits at the dial.",
      "The Cactus Canteen hangs from the proud cactus near the bone ridge."
    ];
  }
  return [
    "Dial, pearl, canteen. The sun puzzle is ready.",
    "Align it before the mirage changes its mind."
  ];
}

function handleDunePickup(obj) {
  collectItemAndSpeak(obj, { opened: true });
}

function handleDuneSunDial() {
  if (!hasAllDuneItems()) {
    const missing = formatItemList(missingQuestItems(QUESTS.duneDial));
    startDialogue([
      "The sun dial puzzle waits in a ring of bleached coral markers.",
      `It still needs ${missing}.`
    ]);
    return;
  }
  if (game.duneDialAligned) {
    sailToWreckyardReturn();
    return;
  }
  game.duneDialAligned = true;
  spendQuestItems(QUESTS.duneDial);
  startDialogue([
    "Captain Bananas sets the Sun Dial, Pearl Token, and Cactus Canteen into the coral ring.",
    "The noon shadow points through the mirage, revealing Whispering Wreckyard beyond the dunes!"
  ], () => {
    sailToWreckyard();
  });
}

function whisperingMastLines() {
  if (!hasWreckItem("Ghost Compass")) {
    return [
      "The whispering mast creaks without wind.",
      "A Ghost Compass spins in the west wreck alcove. Bring it back before it forgets north."
    ];
  }
  if (!hasWreckItem("Anchor Charm")) {
    return [
      "Compass found. Now the anchor gate wants its charm.",
      "Search the chain-tangled anchor by the lower wreck ribs."
    ];
  }
  if (!hasWreckItem("Captain's Token")) {
    return [
      "The anchor gate should open now.",
      "Beyond it, the broken captain statue keeps the token for the compass stand."
    ];
  }
  return [
    "Compass, charm, token. The wrecks are listening.",
    "Restore the ghost compass stand before the fog starts giving speeches."
  ];
}

function handleWreckPickup(obj) {
  collectItemAndSpeak(obj);
}

function handleAnchorGate(obj) {
  if (!hasWreckItem("Anchor Charm")) {
    startDialogue([
      "An anchor gate bars the foggy wreck path.",
      "Its lock is shaped like the Anchor Charm hidden near the lower wreck ribs."
    ]);
    return;
  }
  obj.active = false;
  spendInventoryItem("Anchor Charm");
  beep("pickup");
  startDialogue([
    "The Anchor Charm sinks into the gate lock with a cold little clank.",
    "The anchor gate lifts, clearing the way to the broken captain statue."
  ]);
}

function handleCaptainStatue(obj) {
  const gate = game.interactables.find((item) => item.id === "anchorGate");
  if (!hasWreckItem("Anchor Charm") || isObjectActive(gate)) {
    startDialogue([
      "The broken captain statue is lost behind the anchor gate.",
      "Open the gate with the Anchor Charm first."
    ]);
    return;
  }
  collectItemAndSpeak(obj);
}

function handleGhostCompassStand() {
  if (!hasAllWreckItems()) {
    const missing = formatItemList(missingQuestItems(QUESTS.wreckCompass));
    startDialogue([
      "The ghost compass stand whispers over a cracked captain seal.",
      `It still needs ${missing}.`
    ]);
    return;
  }
  if (game.wreckCompassRestored) {
    sailToCrownRuinsReturn();
    return;
  }
  game.wreckCompassRestored = true;
  spendQuestItems(QUESTS.wreckCompass);
  startDialogue([
    "Captain Bananas restores the Ghost Compass with the Anchor Charm and Captain's Token.",
    "The fog parts around a golden ruin. The Crown of the Banana King is revealed!"
  ], () => {
    sailToCrownRuins();
  });
}

function bananaKingGhostLines() {
  if (!hasCrownItem("Royal Banana Gem")) {
    return [
      "The Banana King ghost adjusts a crown that is mostly moonlight.",
      "Find the Royal Banana Gem. My statues stare better when both eyes sparkle."
    ];
  }
  if (!hasCrownItem("Throne Lever")) {
    return [
      "A fine gem, brave captain.",
      "Set it into the ancient monkey statues, and they will release the lever for my vault door."
    ];
  }
  if (!hasCrownItem("Crown Fragment")) {
    return [
      "The Throne Lever will open the vault door.",
      "Inside, the final treasure chest keeps the Crown Fragment for my broken throne."
    ];
  }
  return [
    "Gem, lever, fragment. The royal crown remembers itself.",
    "Reassemble it at the throne, and the golden escape ship will wake."
  ];
}

function handleCrownPickup(obj) {
  collectItemAndSpeak(obj);
}

function handleAncientMonkeyStatues(obj) {
  if (!hasCrownItem("Royal Banana Gem")) {
    startDialogue([
      "Ancient monkey statues guard the upper ruin path with empty banana-shaped eye sockets.",
      "The missing socket matches the Royal Banana Gem somewhere in the royal ruins."
    ]);
    return;
  }
  if (hasCrownItem("Throne Lever")) {
    startDialogue([
      "The ancient monkey statues gleam with the Royal Banana Gem in place.",
      "Their hidden lever slot is empty now, ready for the vault door."
    ]);
    return;
  }
  game.royalStatuesOpened = true;
  spendInventoryItem("Royal Banana Gem");
  collectItemAndSpeak(obj, { opened: true });
}

function handleThroneVaultDoor(obj) {
  if (!hasCrownItem("Throne Lever")) {
    startDialogue([
      "The throne room door is sealed by a royal lever slot.",
      "It needs the Throne Lever hidden in the ancient monkey statues."
    ]);
    return;
  }
  game.throneVaultOpened = true;
  spendInventoryItem("Throne Lever");
  handlePortal(obj);
}

function handleFinalTreasureChest(obj) {
  collectItemAndSpeak(obj, { opened: true });
}

function handleBananaKingThrone() {
  if (!hasAllCrownItems()) {
    const missing = formatItemList(missingQuestItems(QUESTS.crownVault));
    startDialogue([
      "The Banana King's throne cradles a cracked crown socket.",
      `It still needs ${missing}.`
    ]);
    return;
  }
  if (game.crownReassembled) {
    startDialogue([
      "The reassembled crown shines from the throne.",
      "The golden escape ship waits in the Throne Vault's lower chamber."
    ]);
    return;
  }
  const ship = game.interactables.find((item) => item.id === "goldenEscapeShip");
  if (ship) {
    ship.active = true;
  }
  game.crownReassembled = true;
  spendQuestItems(QUESTS.crownVault);
  beep("victory");
  startDialogue([
    "Captain Bananas fits the Royal Banana Gem, Throne Lever, and Crown Fragment into the throne.",
    "The Banana King's crown reassembles in a flash of gold.",
    "A golden escape ship rises from the vault floor, sails glowing for home!"
  ], () => {
    state = STATE.VICTORY;
  });
}

function enterMap(mapName, x, y, fx, fy) {
  game.currentMap = mapName;
  game.player.x = x;
  game.player.y = y;
  game.player.facing = { x: fx, y: fy };
  updateCamera();
}

function startDialogue(lines, onDone = null) {
  dialogue = { lines, index: 0, onDone };
  state = STATE.DIALOGUE;
}

function advanceDialogue() {
  if (!dialogue) {
    state = STATE.EXPLORE;
    return;
  }
  dialogue.index += 1;
  if (dialogue.index >= dialogue.lines.length) {
    const done = dialogue.onDone;
    dialogue = null;
    state = STATE.EXPLORE;
    if (done) {
      done();
    }
  }
}

function hasPart(part) {
  return hasInventoryItem(part);
}

function hasBeaconItem(item) {
  return hasInventoryItem(item);
}

function hasReefItem(item) {
  return hasInventoryItem(item);
}

function hasVolcanoItem(item) {
  if (item === "Cool Mango") {
    return hasActiveInventoryItem(item);
  }
  return hasInventoryItem(item);
}

function hasCoveItem(item) {
  return hasInventoryItem(item);
}

function hasMangroveItem(item) {
  return hasInventoryItem(item);
}

function hasStormItem(item) {
  return hasInventoryItem(item);
}

function hasDuneItem(item) {
  return hasInventoryItem(item);
}

function hasWreckItem(item) {
  return hasInventoryItem(item);
}

function hasCrownItem(item) {
  return hasInventoryItem(item);
}

function hasInventoryItem(item) {
  return Boolean(game.inventory[item]);
}

function hasActiveInventoryItem(item) {
  return hasInventoryItem(item) && !game.spentInventory[item];
}

function grantInventoryItem(item) {
  game.inventory[item] = true;
  game.spentInventory[item] = false;
}

function spendInventoryItem(item) {
  if (hasInventoryItem(item)) {
    game.spentInventory[item] = true;
  }
}

function spendQuestItems(quest) {
  quest.items.forEach((item) => {
    spendInventoryItem(item.name);
  });
}

function currentQuest() {
  const map = maps[game.currentMap];
  return QUESTS[(map && map.quest) || "raft"];
}

function hasAllQuestItems(quest = currentQuest()) {
  return quest.items.every((item) => hasInventoryItem(item.name));
}

function questItemCount(quest = currentQuest()) {
  return quest.items.filter((item) => hasInventoryItem(item.name)).length;
}

function missingQuestItems(quest = currentQuest()) {
  return quest.items.filter((item) => !hasInventoryItem(item.name));
}

function inventoryItems() {
  return Object.keys(game.inventory).filter((item) => hasActiveInventoryItem(item));
}

function inventoryStatusText() {
  return `Inventory ${inventoryItems().length}`;
}

function inventoryListText() {
  const items = inventoryItems();
  if (items.length === 0) {
    return "Inventory: Empty";
  }
  return `Inventory: ${items.join(" | ")}`;
}

function formatItemList(items) {
  const names = items.map((item) => item.name);
  if (names.length <= 2) {
    return names.join(" and ");
  }
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function hasAllParts() {
  return hasAllQuestItems(QUESTS.raft);
}

function partCount() {
  return questItemCount(QUESTS.raft);
}

function hasAllBeaconItems() {
  return hasAllQuestItems(QUESTS.beacon);
}

function beaconItemCount() {
  return questItemCount(QUESTS.beacon);
}

function hasAllReefItems() {
  return hasAllQuestItems(QUESTS.reefBell);
}

function hasAllVolcanoItems() {
  return missingVolcanoItems().length === 0;
}

function missingVolcanoItems() {
  return QUESTS.volcanoCalm.items.filter((item) => {
    if (item.name === "Cool Mango") {
      return !hasActiveInventoryItem(item.name);
    }
    return !hasInventoryItem(item.name);
  });
}

function hasAllCoveItems() {
  return hasAllQuestItems(QUESTS.coveChart);
}

function hasAllMangroveItems() {
  return hasAllQuestItems(QUESTS.mangroveCompass);
}

function hasAllStormItems() {
  return hasAllQuestItems(QUESTS.stormMast);
}

function hasAllDuneItems() {
  return hasAllQuestItems(QUESTS.duneDial);
}

function hasAllWreckItems() {
  return hasAllQuestItems(QUESTS.wreckCompass);
}

function hasAllCrownItems() {
  return hasAllQuestItems(QUESTS.crownVault);
}

function currentObjective() {
  if (state === STATE.VICTORY || game.crownReassembled) {
    return "Golden escape ship revealed!";
  }
  const quest = currentQuest();
  if (quest === QUESTS.raft && game.raftFixed) {
    return "Sail to Coconut Crown Atoll";
  }
  if (quest === QUESTS.beacon && game.signalLit) {
    return "Sail to Rusty Rudder Reef";
  }
  if (quest === QUESTS.reefBell && game.reefBellRung) {
    return "Sail to Mango Volcano Isle";
  }
  if (quest === QUESTS.volcanoCalm && game.volcanoCalmed) {
    return "Sail to Sugarcane Smuggler Cove";
  }
  if (quest === QUESTS.coveChart && game.coveChartRead) {
    return "Sail to Moonlit Mangrove";
  }
  if (quest === QUESTS.mangroveCompass && game.mangroveCompassAligned) {
    return "Sail to Stormglass Shoal";
  }
  if (quest === QUESTS.stormMast && game.stormMastRaised) {
    return "Sail to Pearlbone Dunes";
  }
  if (quest === QUESTS.duneDial && game.duneDialAligned) {
    return "Sail to Whispering Wreckyard";
  }
  if (quest === QUESTS.wreckCompass && game.wreckCompassRestored) {
    return "Sail to Crown of the Banana King";
  }
  if (quest === QUESTS.crownVault && game.throneVaultOpened && !hasCrownItem("Crown Fragment")) {
    return "Open the final treasure chest";
  }
  if (quest === QUESTS.volcanoCalm) {
    return hasAllVolcanoItems() ? quest.readyObjective : quest.findObjective;
  }
  if (hasAllQuestItems(quest)) {
    return quest.readyObjective;
  }
  return quest.findObjective;
}

// Battle
function startBattle(enemy) {
  enemy.cooldown = 1000;
  battleIndex = 0;
  battle = {
    enemy,
    enemyHp: enemy.hp,
    message: enemy.intro,
    done: false
  };
  beep("battle");
  state = STATE.BATTLE;
}

function handleBattleKey(key) {
  if (!battle) {
    state = STATE.EXPLORE;
    return;
  }
  if (battle.done) {
    finishBattle();
    return;
  }
  if (key === "arrowup" || key === "w") {
    battleIndex = (battleIndex + 2) % 3;
    beep("menu");
  } else if (key === "arrowdown" || key === "s") {
    battleIndex = (battleIndex + 1) % 3;
    beep("menu");
  } else if (isConfirm(key)) {
    chooseBattleAction(battleIndex);
  } else if (key === "escape") {
    chooseBattleAction(2);
  }
}

function chooseBattleAction(index) {
  const enemy = battle.enemy;
  if (index === 0) {
    const dmg = randInt(3, 5);
    battle.enemyHp -= dmg;
    beep("attack");
    battle.message = `Captain Bananas swipes for ${dmg} damage!`;
  } else if (index === 1) {
    if (game.player.bananas <= 0) {
      battle.message = "No bananas left! The snack cannon is empty.";
      return;
    }
    game.player.bananas -= 1;
    const dmg = randInt(6, 8);
    battle.enemyHp -= dmg;
    beep("banana");
    battle.message = `Banana toss! ${enemy.name} takes ${dmg} damage.`;
  } else {
    if (Math.random() < 0.65) {
      battle.message = "Captain Bananas escapes with a stylish sidestep!";
      enemy.cooldown = 1800;
      battle.done = true;
      return;
    }
    battle.message = "No escape! The jungle says, 'Nice try.'";
  }

  if (battle.enemyHp <= 0) {
    enemy.active = false;
    enemy.hp = 0;
    game.player.bananas = Math.min(9, game.player.bananas + 1);
    battle.message = `${enemy.name} is defeated! Loot: 1 banana.`;
    battle.done = true;
    beep("pickup");
    return;
  }

  enemyTurn();
}

function enemyTurn() {
  const enemy = battle.enemy;
  const dmg = randInt(enemy.power, enemy.power + 2);
  game.player.hp -= dmg;
  battle.message += ` ${enemy.name} bonks back for ${dmg}!`;
  beep("hurt");
  if (game.player.hp <= 0) {
    game.player.hp = 0;
    state = STATE.GAME_OVER;
    battle = null;
  }
}

function finishBattle() {
  if (battle && battle.enemy.active) {
    battle.enemy.hp = Math.max(1, battle.enemyHp);
  }
  battle = null;
  state = STATE.EXPLORE;
  updateCamera();
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startNewRun() {
  stopTitleMusic();
  game = makeFreshGame();
  dialogue = null;
  battle = null;
  battleIndex = 0;
  moveCooldown = 0;
  updateCamera();
  state = STATE.INTRO;
}

// Rendering
function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  updateHudOverlay(false);

  if (state === STATE.MENU) {
    drawMenu();
  } else if (state === STATE.INTRO) {
    drawIntro();
  } else if (state === STATE.GAME_OVER) {
    drawEndScreen("GAME OVER", "The jungle claims Captain Bananas... for now.", "#ff6b6b");
  } else if (state === STATE.VICTORY) {
    drawEndScreen("VICTORY!", "The Banana King's crown reveals the golden escape ship!", "#74f29c");
  } else {
    drawExplore();
    if (state === STATE.DIALOGUE) {
      drawDialogueBox();
    } else if (state === STATE.BATTLE) {
      drawBattle();
    } else if (state === STATE.PAUSE) {
      drawPause();
    }
  }
}

function drawMenu() {
  drawOceanBackdrop();
  drawCenteredPixelText("MONKEY", WIDTH / 2, 54, 3, "#ffd166");
  drawCenteredPixelText("ADVENTURE", WIDTH / 2, 86, 2, "#fff1b8");
  drawCenteredPixelText("PIRATE", WIDTH / 2, 106, 2, "#fff1b8");
  drawTinyPlayer(184, 122, 2);
  drawPanel(122, 156, 140, 21, "#364f7a");
  useTextFont(11);
  ctx.fillStyle = "#ffd166";
  ctx.fillText("> Start Game", 144, 170);
  drawPanel(67, 190, 250, 25, "#1d2540");
  drawCenteredText("Move: Arrows / WASD", 200, 9, "#fff1b8", "#101018");
  drawCenteredText("Action: E / Space   Pause: Esc", 211, 8, "#dfe8ef", "#101018");
  drawCenteredText("Press Enter, Space, or E", 231, 9, "#101018", "#fff1b8");
}

function drawIntro() {
  drawOceanBackdrop();
  drawPanel(28, 40, 328, 154, "#1d2540");
  ctx.fillStyle = "#ffd166";
  useTextFont(14);
  ctx.fillText("A salty disaster!", 116, 68);
  useTextFont(11);
  ctx.fillStyle = "#fff1b8";
  wrapText(
    "Captain Bananas has shipwrecked on Banana Skull Island. Find the lost raft parts, avoid danger, and escape before the jungle claims ye!",
    55,
    96,
    276,
    15
  );
  drawTinyPlayer(176, 146, 2);
  ctx.fillStyle = controlsPulse % 900 < 450 ? "#74f29c" : "#94b0c2";
  ctx.fillText("Press any key", 154, 222);
}

function drawExplore() {
  drawMap();
  drawHud();
}

function drawMap() {
  const map = maps[game.currentMap].tiles;
  updateCamera();
  for (let y = camera.y; y < camera.y + VIEW_ROWS; y += 1) {
    for (let x = camera.x; x < camera.x + VIEW_COLS; x += 1) {
      const sx = (x - camera.x) * TILE;
      const sy = HUD_H + (y - camera.y) * TILE;
      drawTile(tileAt(game.currentMap, x, y), sx, sy, x, y);
    }
  }

  game.interactables.forEach((obj) => {
    if (obj.map !== game.currentMap) {
      return;
    }
    if (!isObjectActive(obj) && !obj.visibleWhenInactive) {
      return;
    }
    drawObject(obj);
  });

  game.enemies.forEach((enemy) => {
    if (enemy.map === game.currentMap && enemy.active) {
      const pos = worldToScreen(enemy.x, enemy.y);
      drawEnemy(enemy.type, pos.x, pos.y, 1);
    }
  });

  const playerPos = worldToScreen(game.player.x, game.player.y);
  drawPlayer(playerPos.x, playerPos.y, 1);
}

function drawTile(tile, x, y, tx, ty) {
  if (tile === "~") {
    ctx.fillStyle = "#2477c9";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = (tx + ty + Math.floor(frameTime / 420)) % 2 === 0 ? "#51a7e8" : "#1d61a8";
    ctx.fillRect(x + 2, y + 5, 5, 2);
    ctx.fillRect(x + 9, y + 11, 5, 2);
  } else if (tile === "L") {
    ctx.fillStyle = "#2cb3c9";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = (tx + Math.floor(frameTime / 360)) % 2 === 0 ? "#8debe8" : "#1f8ca0";
    ctx.fillRect(x + 3, y + 6, 10, 2);
  } else if (tile === ".") {
    ctx.fillStyle = "#f3d27a";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#d9ad54";
    speckle(x, y, tx, ty, 5);
  } else if (tile === "d") {
    ctx.fillStyle = "#efe7c8";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#cfc6a0";
    speckle(x, y, tx, ty, 5);
    ctx.fillStyle = "#fff8d8";
    ctx.fillRect(x + ((tx * 4 + ty) % 10), y + 4, 5, 1);
  } else if (tile === "x") {
    ctx.fillStyle = "#efe7c8";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#d8d1b8";
    ctx.fillRect(x + 2, y + 9, 12, 3);
    ctx.fillRect(x + 5, y + 5, 7, 3);
    ctx.fillStyle = "#fff8d8";
    ctx.fillRect(x + 4, y + 8, 9, 1);
    ctx.fillStyle = "#9aa7b0";
    ctx.fillRect(x + 10, y + 6, 2, 2);
  } else if (tile === "o") {
    ctx.fillStyle = "#efe7c8";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = controlsPulse % 900 < 450 ? "#8debe8" : "#dfe8ef";
    ctx.fillRect(x + 2, y + 6, 12, 2);
    ctx.fillRect(x + 4, y + 10, 8, 2);
    ctx.fillStyle = "#fff8d8";
    ctx.fillRect(x + 6, y + 4, 5, 1);
  } else if (tile === "w") {
    ctx.fillStyle = "#66707d";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#3f4a54";
    speckle(x, y, tx, ty, 4);
    ctx.fillStyle = controlsPulse % 900 < 450 ? "#dfe8ef" : "#94b0c2";
    ctx.fillRect(x + ((tx * 5 + ty) % 11), y + 4, 4, 1);
  } else if (tile === "h") {
    ctx.fillStyle = "#66707d";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#5b351c";
    ctx.fillRect(x + 1, y + 8, 14, 3);
    ctx.fillRect(x + 5, y + 4, 3, 10);
    ctx.fillStyle = "#8f5a2a";
    ctx.fillRect(x + 7, y + 6, 7, 2);
    ctx.fillRect(x + 2, y + 12, 8, 2);
  } else if (tile === "u") {
    ctx.fillStyle = "#4d5868";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = (tx + ty + Math.floor(frameTime / 520)) % 2 === 0 ? "#94b0c2" : "#66707d";
    ctx.fillRect(x + 2, y + 5, 12, 2);
    ctx.fillRect(x + 5, y + 10, 8, 2);
  } else if (tile === "y") {
    ctx.fillStyle = "#d8b455";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#f4d879";
    speckle(x, y, tx, ty, 4);
    ctx.fillStyle = "#9b6736";
    ctx.fillRect(x + 1, y + 12, 14, 1);
    ctx.fillRect(x + ((tx * 4 + ty) % 11), y + 4, 4, 1);
  } else if (tile === "n") {
    ctx.fillStyle = "#b89345";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#6c7a89";
    ctx.fillRect(x + 2, y + 9, 12, 5);
    ctx.fillRect(x + 4, y + 4, 8, 6);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(x + 5, y + 3, 6, 2);
    ctx.fillStyle = "#3f4a54";
    ctx.fillRect(x + 7, y + 7, 2, 2);
  } else if (tile === ",") {
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#2f8f3f";
    speckle(x, y, tx, ty, 6);
    ctx.fillRect(x + ((tx * 3 + ty) % 10), y + 11, 3, 2);
  } else if (tile === "m") {
    ctx.fillStyle = "#273a39";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#3f5a55";
    speckle(x, y, tx, ty, 5);
    ctx.fillStyle = "#161923";
    ctx.fillRect(x + ((tx * 5 + ty) % 10), y + 12, 4, 2);
  } else if (tile === "g") {
    ctx.fillStyle = "#2f5b4a";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#4c8a65";
    speckle(x, y, tx, ty, 6);
    ctx.fillStyle = controlsPulse % 900 < 450 ? "#a8f5ff" : "#74f29c";
    ctx.fillRect(x + ((tx * 3 + ty * 2) % 12), y + 3, 1, 1);
  } else if (tile === "r") {
    ctx.fillStyle = "#2f5b4a";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#5b351c";
    ctx.fillRect(x + 1, y + 8, 14, 3);
    ctx.fillRect(x + 5, y + 2, 3, 13);
    ctx.fillStyle = "#8f5a2a";
    ctx.fillRect(x + 7, y + 5, 7, 2);
    ctx.fillRect(x + 2, y + 11, 8, 2);
  } else if (tile === "p") {
    ctx.fillStyle = "#172f44";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = controlsPulse % 900 < 450 ? "#8debe8" : "#5d8fff";
    ctx.fillRect(x + 2, y + 5, 12, 2);
    ctx.fillRect(x + 4, y + 10, 8, 2);
    ctx.fillStyle = "#fff1b8";
    ctx.fillRect(x + 7, y + 7, 2, 1);
  } else if (tile === "J") {
    ctx.fillStyle = "#1f6f3b";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#0f3f28";
    ctx.fillRect(x + 1, y + 1, 14, 14);
    ctx.fillStyle = "#59c135";
    ctx.fillRect(x + 2, y + 4, 5, 3);
    ctx.fillRect(x + 9, y + 9, 4, 4);
  } else if (tile === "S") {
    ctx.fillStyle = "#8aa33a";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#5f7f2d";
    ctx.fillRect(x + 2, y + 1, 2, 14);
    ctx.fillRect(x + 7, y + 0, 2, 15);
    ctx.fillRect(x + 12, y + 2, 2, 13);
    ctx.fillStyle = "#d8c65a";
    ctx.fillRect(x + 1, y + 5, 14, 2);
    ctx.fillRect(x + 3, y + 10, 12, 2);
  } else if (tile === "T") {
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(x + 7, y + 7, 3, 8);
    ctx.fillStyle = "#1f8f45";
    ctx.fillRect(x + 4, y + 2, 8, 4);
    ctx.fillRect(x + 2, y + 5, 12, 4);
    ctx.fillStyle = "#34c759";
    ctx.fillRect(x + 6, y, 4, 7);
  } else if (tile === "R") {
    ctx.fillStyle = "#6c7a89";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#9aa7b0";
    ctx.fillRect(x + 3, y + 3, 5, 3);
    ctx.fillStyle = "#3f4a54";
    ctx.fillRect(x + 7, y + 9, 6, 4);
  } else if (tile === "C") {
    ctx.fillStyle = "#2cb3c9";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#ff7a8a";
    ctx.fillRect(x + 3, y + 8, 3, 6);
    ctx.fillRect(x + 7, y + 5, 3, 9);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(x + 10, y + 10, 3, 4);
    ctx.fillStyle = "#8debe8";
    ctx.fillRect(x + 2, y + 3, 8, 2);
  } else if (tile === "a") {
    ctx.fillStyle = "#4a4650";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#6b6470";
    speckle(x, y, tx, ty, 5);
    ctx.fillStyle = "#2b2930";
    ctx.fillRect(x + ((tx * 5 + ty) % 10), y + 12, 4, 2);
  } else if (tile === "q") {
    ctx.fillStyle = "#46566f";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#6f8098";
    speckle(x, y, tx, ty, 4);
    ctx.fillStyle = controlsPulse % 700 < 350 ? "#8debe8" : "#2f3a52";
    ctx.fillRect(x + 2, y + 3, 12, 1);
    ctx.fillRect(x + ((tx * 5 + ty) % 10), y + 11, 4, 1);
  } else if (tile === "v") {
    ctx.fillStyle = "#4a1f18";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = (tx + ty + Math.floor(frameTime / 260)) % 2 === 0 ? "#ff5a2e" : "#d62828";
    ctx.fillRect(x + 1, y + 5, 14, 4);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(x + 4, y + 8, 8, 2);
  } else if (tile === "W") {
    ctx.fillStyle = "#6b3f24";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#b8793a";
    ctx.fillRect(x + 1, y + 3, 14, 3);
    ctx.fillRect(x + 2, y + 10, 12, 3);
    ctx.fillStyle = "#2b1b12";
    ctx.fillRect(x + 4, y + 6, 3, 3);
  } else if (tile === "=") {
    ctx.fillStyle = "#2cb3c9";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#9b6736";
    ctx.fillRect(x, y + 3, TILE, 4);
    ctx.fillRect(x, y + 10, TILE, 4);
    ctx.fillStyle = "#5b351c";
    ctx.fillRect(x + 3, y + 2, 2, 13);
    ctx.fillRect(x + 11, y + 2, 2, 13);
  } else if (tile === "#") {
    ctx.fillStyle = "#27202f";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#45394d";
    ctx.fillRect(x + 2, y + 2, 5, 5);
    ctx.fillRect(x + 9, y + 8, 5, 4);
  } else if (tile === "f") {
    ctx.fillStyle = "#5b4b59";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#74617a";
    speckle(x, y, tx, ty, 4);
  } else if (tile === "b") {
    ctx.fillStyle = "#5b351c";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#8f5a2a";
    ctx.fillRect(x + 1, y + 3, 14, 3);
    ctx.fillRect(x + 1, y + 10, 14, 3);
    ctx.fillStyle = "#2b1b12";
    ctx.fillRect(x + ((tx * 5 + ty) % 12), y + 6, 3, 2);
  }
}

function speckle(x, y, tx, ty, count) {
  for (let i = 0; i < count; i += 1) {
    const sx = (tx * 7 + ty * 3 + i * 5) % 14;
    const sy = (ty * 5 + tx * 2 + i * 7) % 14;
    ctx.fillRect(x + sx + 1, y + sy + 1, 1, 1);
  }
}

function drawObject(obj) {
  const pos = worldToScreen(obj.x, obj.y);
  if (obj.type === "chest") {
    drawChest(pos.x, pos.y, obj.opened);
  } else if (obj.type === "wreckage") {
    drawWreckage(pos.x, pos.y);
  } else if (obj.type === "parrot") {
    drawParrot(pos.x, pos.y);
  } else if (obj.type === "cave") {
    drawCaveEntrance(pos.x, pos.y);
  } else if (obj.type === "raft" || obj.type === "arrivalRaft" || obj.type === "coveRaft") {
    drawRaft(pos.x, pos.y);
  } else if (obj.type === "exit") {
    drawExit(pos.x, pos.y);
  } else if (obj.type === "tidepool") {
    drawTidepool(pos.x, pos.y);
  } else if (obj.type === "lookout") {
    drawLookout(pos.x, pos.y);
  } else if (obj.type === "beacon") {
    drawBeacon(pos.x, pos.y, hasAllBeaconItems());
  } else if (obj.type === "reefRaft") {
    drawRaft(pos.x, pos.y);
  } else if (obj.type === "messageBottle") {
    drawBottle(pos.x, pos.y);
  } else if (obj.type === "dinghy") {
    drawDinghy(pos.x, pos.y);
  } else if (obj.type === "coralGate") {
    drawCoralGate(pos.x, pos.y);
  } else if (obj.type === "shipBell") {
    drawShipBell(pos.x, pos.y, hasAllReefItems());
  } else if (obj.type === "volcanoRaft") {
    drawRaft(pos.x, pos.y);
  } else if (obj.type === "mangoTree") {
    drawMangoTree(pos.x, pos.y);
  } else if (obj.type === "volcanoSage") {
    drawVolcanoSage(pos.x, pos.y);
  } else if (obj.type === "steamVent") {
    drawSteamVent(pos.x, pos.y);
  } else if (obj.type === "obsidianPlug") {
    drawObsidianPlug(pos.x, pos.y);
  } else if (obj.type === "volcanoAltar") {
    drawVolcanoAltar(pos.x, pos.y, hasAllVolcanoItems());
  } else if (obj.type === "quartermaster") {
    drawQuartermaster(pos.x, pos.y);
  } else if (obj.type === "suspiciousCrates") {
    drawCrates(pos.x, pos.y);
  } else if (obj.type === "moonStampedCrate") {
    drawMoonStampedCrate(pos.x, pos.y, obj.opened);
  } else if (obj.type === "storehouseDoor") {
    drawStorehouseDoor(pos.x, pos.y);
  } else if (obj.type === "cratePulley") {
    drawCratePulley(pos.x, pos.y, hasCoveItem("Crate Hook"));
  } else if (obj.type === "coveLookout") {
    drawCoveLookout(pos.x, pos.y, hasAllCoveItems());
  } else if (obj.type === "mangroveRaft") {
    drawRaft(pos.x, pos.y);
  } else if (obj.type === "silverLeaf") {
    drawSilverLeaf(pos.x, pos.y);
  } else if (obj.type === "moonPool") {
    drawMoonPool(pos.x, pos.y, isObjectActive(obj));
  } else if (obj.type === "moonCompassStone") {
    drawMoonCompassStone(pos.x, pos.y, hasAllMangroveItems());
  } else if (obj.type === "stormSkiff") {
    drawStormSkiff(pos.x, pos.y);
  } else if (obj.type === "stormWatcher") {
    drawStormWatcher(pos.x, pos.y);
  } else if (obj.type === "stormglassShard") {
    drawStormglassShard(pos.x, pos.y);
  } else if (obj.type === "copperRod") {
    drawCopperRod(pos.x, pos.y);
  } else if (obj.type === "kiteString") {
    drawKiteString(pos.x, pos.y);
  } else if (obj.type === "stormMast") {
    drawStormMast(pos.x, pos.y, hasAllStormItems());
  } else if (obj.type === "duneRaft") {
    drawRaft(pos.x, pos.y);
  } else if (obj.type === "duneGuide") {
    drawDuneGuide(pos.x, pos.y);
  } else if (obj.type === "buriedChest") {
    drawBuriedChest(pos.x, pos.y, obj.opened);
  } else if (obj.type === "miragePool") {
    drawMiragePool(pos.x, pos.y, isObjectActive(obj));
  } else if (obj.type === "cactusCanteen") {
    drawCactusCanteen(pos.x, pos.y);
  } else if (obj.type === "duneSunDial") {
    drawDuneSunDial(pos.x, pos.y, hasAllDuneItems());
  } else if (obj.type === "wreckyardRaft") {
    drawRaft(pos.x, pos.y);
  } else if (obj.type === "whisperingMast") {
    drawWhisperingMast(pos.x, pos.y);
  } else if (obj.type === "ghostCompassAlcove") {
    drawGhostCompassAlcove(pos.x, pos.y);
  } else if (obj.type === "anchorCharm") {
    drawAnchorCharm(pos.x, pos.y);
  } else if (obj.type === "anchorGate") {
    drawAnchorGate(pos.x, pos.y);
  } else if (obj.type === "captainStatue") {
    drawCaptainStatue(pos.x, pos.y);
  } else if (obj.type === "ghostCompassStand") {
    drawGhostCompassStand(pos.x, pos.y, hasAllWreckItems());
  } else if (obj.type === "royalDock") {
    drawRoyalDock(pos.x, pos.y);
  } else if (obj.type === "bananaKingGhost") {
    drawBananaKingGhost(pos.x, pos.y);
  } else if (obj.type === "royalBananaGem") {
    drawRoyalBananaGem(pos.x, pos.y);
  } else if (obj.type === "ancientMonkeyStatues") {
    drawAncientMonkeyStatues(pos.x, pos.y, obj.opened);
  } else if (obj.type === "throneVaultDoor") {
    drawThroneVaultDoor(pos.x, pos.y, hasCrownItem("Throne Lever"));
  } else if (obj.type === "finalTreasureChest") {
    drawFinalTreasureChest(pos.x, pos.y, obj.opened);
  } else if (obj.type === "bananaKingThrone") {
    drawBananaKingThrone(pos.x, pos.y, hasAllCrownItems());
  } else if (obj.type === "goldenEscapeShip") {
    drawGoldenEscapeShip(pos.x, pos.y);
  } else if (obj.type === "portal") {
    drawPortal(obj, pos.x, pos.y);
  }
}

function drawPortal(obj, x, y) {
  if (obj.sprite === "shipHold") {
    drawShipHoldEntrance(x, y);
  } else if (obj.sprite === "storehouse") {
    drawStorehouseDoor(x, y);
  } else if (obj.sprite === "moonGrotto") {
    drawMoonGrottoEntrance(x, y);
  } else if (obj.sprite === "throneVault") {
    drawThroneVaultDoor(x, y, hasCrownItem("Throne Lever"));
  } else if (obj.sprite === "exit") {
    drawExit(x, y);
  }
}

function worldToScreen(x, y) {
  return {
    x: (x - camera.x) * TILE,
    y: HUD_H + (y - camera.y) * TILE
  };
}

function drawHud() {
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, WIDTH, HUD_H);
  ctx.fillStyle = "#3a4466";
  ctx.fillRect(0, HUD_H - 2, WIDTH, 2);
  updateHudOverlay(true);
}

function updateHudOverlay(show) {
  hudOverlay.classList.toggle("is-hidden", !show);
  if (!show) {
    return;
  }
  hudHp.textContent = `HP ${game.player.hp}/${game.player.maxHp}`;
  hudBananas.textContent = `Bananas ${game.player.bananas}`;
  hudParts.textContent = inventoryStatusText();
  hudMap.textContent = maps[game.currentMap].name;
  hudPartList.textContent = inventoryListText();
  hudObjective.textContent = `Objective: ${currentObjective()}`;
}

function drawDialogueBox() {
  drawPanel(10, 181, 364, 64, "#101018");
  useTextFont(11);
  ctx.fillStyle = "#fff1b8";
  wrapText(dialogue.lines[dialogue.index], 24, 202, 334, 14);
  ctx.fillStyle = controlsPulse % 900 < 450 ? "#ffd166" : "#94b0c2";
  ctx.fillText("E / Space", 309, 235);
}

function drawBattle() {
  ctx.fillStyle = "rgba(8, 10, 18, 0.78)";
  ctx.fillRect(0, HUD_H, WIDTH, HEIGHT - HUD_H);
  drawPanel(18, 54, 348, 182, "#1d2540");

  const enemy = battle.enemy;
  drawPlayer(64, 104, 2);
  drawEnemy(enemy.type, 260, 92, 2);

  useTextFont(11);
  ctx.fillStyle = "#fff1b8";
  ctx.fillText(`Captain Bananas HP ${game.player.hp}/${game.player.maxHp}`, 38, 82);
  ctx.fillText(`${enemy.name} HP ${Math.max(0, battle.enemyHp)}/${enemy.maxHp}`, 220, 82);

  drawPanel(34, 150, 316, 44, "#101018");
  ctx.fillStyle = "#fff1b8";
  wrapText(battle.message, 46, 166, 292, 13);

  drawPanel(34, 202, 316, 26, "#101018");

  if (battle.done) {
    ctx.fillStyle = "#ffd166";
    useTextFont(10);
    ctx.fillText("Press E / Space", 232, 219);
    return;
  }

  const opts = ["Attack", `Throw Banana (${game.player.bananas})`, "Run"];
  useTextFont(10);
  opts.forEach((opt, i) => {
    const x = 40 + i * 106;
    ctx.fillStyle = i === battleIndex ? "#ffd166" : "#94b0c2";
    ctx.fillText((i === battleIndex ? "> " : "  ") + opt, x, 219);
  });
}

function drawPause() {
  ctx.fillStyle = "rgba(8, 10, 18, 0.72)";
  ctx.fillRect(0, HUD_H, WIDTH, HEIGHT - HUD_H);
  drawPanel(104, 100, 176, 54, "#1d2540");
  ctx.fillStyle = "#ffd166";
  useTextFont(16);
  ctx.fillText("PAUSED", 158, 124);
  useTextFont(9);
  ctx.fillStyle = "#fff1b8";
  ctx.fillText("Press Escape, E, or Space", 126, 143);
}

function drawEndScreen(title, subtitle, color) {
  drawOceanBackdrop();
  drawPanel(30, 54, 324, 138, "#1d2540");
  ctx.fillStyle = color;
  useTextFont(24);
  ctx.fillText(title, title === "VICTORY!" ? 136 : 126, 92);
  useTextFont(11);
  ctx.fillStyle = "#fff1b8";
  wrapText(subtitle, 68, 124, 250, 14);
  ctx.fillStyle = controlsPulse % 900 < 450 ? "#ffd166" : "#94b0c2";
  ctx.fillText("Press E / Space / Enter to Restart", 78, 174);
}

function drawOceanBackdrop() {
  ctx.fillStyle = "#2477c9";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let y = 0; y < HEIGHT; y += 16) {
    for (let x = 0; x < WIDTH; x += 16) {
      ctx.fillStyle = (x / 16 + y / 16 + Math.floor(frameTime / 420)) % 2 === 0 ? "#51a7e8" : "#1d61a8";
      ctx.fillRect(x + 3, y + 7, 7, 2);
    }
  }
  ctx.fillStyle = "#f3d27a";
  ctx.fillRect(0, 208, WIDTH, 48);
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(0, 220, WIDTH, 36);
}

function drawPanel(x, y, w, h, fill) {
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function drawPixelText(text, x, y, scale, color) {
  useTextFont(8 * scale);
  ctx.fillStyle = "#101018";
  ctx.fillText(text, x + scale, y + scale);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawCenteredPixelText(text, centerX, y, scale, color) {
  useTextFont(8 * scale);
  const x = Math.round(centerX - ctx.measureText(text).width / 2);
  drawPixelText(text, x, y, scale, color);
}

function drawCenteredText(text, y, size, color, shadow = "#101018") {
  useTextFont(size);
  const x = Math.round((WIDTH - ctx.measureText(text).width) / 2);
  ctx.fillStyle = shadow;
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function useTextFont(size) {
  ctx.font = `700 ${size}px Consolas, "Lucida Console", "Courier New", monospace`;
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (let i = 0; i < words.length; i += 1) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y);
}

// Pixel sprites
function p(x, y, w, h, color, scale = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * scale, h * scale);
}

function drawPlayer(x, y, scale) {
  const s = scale;
  p(x + 1 * s, y + 9 * s, 3, 2, "#6b3f24", s);
  p(x + 0 * s, y + 10 * s, 2, 2, "#6b3f24", s);
  p(x + 5 * s, y + 7 * s, 7, 7, "#8b542e", s);
  p(x + 6 * s, y + 13 * s, 2, 3, "#5a321d", s);
  p(x + 10 * s, y + 13 * s, 2, 3, "#5a321d", s);
  p(x + 4 * s, y + 3 * s, 9, 8, "#9a6335", s);
  p(x + 6 * s, y + 6 * s, 5, 4, "#e2a765", s);
  p(x + 5 * s, y + 2 * s, 7, 2, "#d62828", s);
  p(x + 11 * s, y + 1 * s, 2, 3, "#d62828", s);
  p(x + 4 * s, y + 0 * s, 9, 3, "#161923", s);
  p(x + 3 * s, y + 2 * s, 11, 2, "#161923", s);
  p(x + 7 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 10 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 7 * s, y + 9 * s, 3, 1, "#5a321d", s);
  if (Math.floor(frameTime / 300) % 2 === 0) {
    p(x + 4 * s, y + 12 * s, 2, 2, "#6b3f24", s);
    p(x + 12 * s, y + 12 * s, 2, 2, "#6b3f24", s);
  }
}

function drawTinyPlayer(x, y, scale) {
  drawPlayer(x, y, scale);
}

function drawEnemy(type, x, y, scale) {
  if (type === "crab") {
    drawCrab(x, y, scale);
  } else if (type === "snake") {
    drawSnake(x, y, scale);
  } else if (type === "bat") {
    drawBat(x, y, scale);
  } else if (type === "gull") {
    drawGull(x, y, scale);
  } else if (type === "eel") {
    drawEel(x, y, scale);
  } else if (type === "barnacle") {
    drawBarnacle(x, y, scale);
  } else if (type === "ashBat") {
    drawAshBat(x, y, scale);
  } else if (type === "lavaCrab") {
    drawLavaCrab(x, y, scale);
  } else if (type === "smokeSnake") {
    drawSmokeSnake(x, y, scale);
  } else if (type === "caneCorsair") {
    drawCaneCorsair(x, y, scale);
  } else if (type === "barrelBruiser") {
    drawBarrelBruiser(x, y, scale);
  } else if (type === "dockSneak") {
    drawDockSneak(x, y, scale);
  } else if (type === "mudCrab") {
    drawMudCrab(x, y, scale);
  } else if (type === "vineSnake") {
    drawVineSnake(x, y, scale);
  } else if (type === "nightBat") {
    drawNightBat(x, y, scale);
  } else if (type === "stormGull") {
    drawStormGull(x, y, scale);
  } else if (type === "sparkCrab") {
    drawSparkCrab(x, y, scale);
  } else if (type === "rainSnake") {
    drawRainSnake(x, y, scale);
  } else if (type === "sandCrab") {
    drawSandCrab(x, y, scale);
  } else if (type === "mirageBat") {
    drawMirageBat(x, y, scale);
  } else if (type === "boneSnake") {
    drawBoneSnake(x, y, scale);
  } else if (type === "ghostCrab") {
    drawGhostCrab(x, y, scale);
  } else if (type === "fogBat") {
    drawFogBat(x, y, scale);
  } else if (type === "anchorBrute") {
    drawAnchorBrute(x, y, scale);
  } else if (type === "royalCrabGuard") {
    drawRoyalCrabGuard(x, y, scale);
  } else if (type === "crownSnake") {
    drawCrownSnake(x, y, scale);
  } else if (type === "treasureBat") {
    drawTreasureBat(x, y, scale);
  } else {
    drawBat(x, y, scale);
  }
}

function drawCrab(x, y, scale) {
  const s = scale;
  p(x + 4 * s, y + 7 * s, 8, 5, "#d64545", s);
  p(x + 2 * s, y + 8 * s, 3, 2, "#ff6b6b", s);
  p(x + 11 * s, y + 8 * s, 3, 2, "#ff6b6b", s);
  p(x + 3 * s, y + 5 * s, 2, 2, "#d64545", s);
  p(x + 11 * s, y + 5 * s, 2, 2, "#d64545", s);
  p(x + 6 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 9 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 3 * s, y + 12 * s, 2, 2, "#8f2d2d", s);
  p(x + 11 * s, y + 12 * s, 2, 2, "#8f2d2d", s);
}

function drawSnake(x, y, scale) {
  const s = scale;
  p(x + 3 * s, y + 9 * s, 10, 3, "#2e9e4f", s);
  p(x + 9 * s, y + 5 * s, 5, 5, "#44c767", s);
  p(x + 12 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 14 * s, y + 7 * s, 2, 1, "#ff6b6b", s);
  p(x + 5 * s, y + 8 * s, 2, 1, "#74f29c", s);
}

function drawBat(x, y, scale) {
  const s = scale;
  p(x + 6 * s, y + 6 * s, 4, 5, "#3b2f5c", s);
  p(x + 2 * s, y + 5 * s, 5, 3, "#5d4b8f", s);
  p(x + 9 * s, y + 5 * s, 5, 3, "#5d4b8f", s);
  p(x + 1 * s, y + 8 * s, 4, 2, "#3b2f5c", s);
  p(x + 11 * s, y + 8 * s, 4, 2, "#3b2f5c", s);
  p(x + 7 * s, y + 7 * s, 1, 1, "#fff1b8", s);
  p(x + 9 * s, y + 7 * s, 1, 1, "#fff1b8", s);
  p(x + 6 * s, y + 11 * s, 1, 2, "#fff1b8", s);
  p(x + 9 * s, y + 11 * s, 1, 2, "#fff1b8", s);
}

function drawGull(x, y, scale) {
  const s = scale;
  const wingLift = Math.floor(frameTime / 260) % 2 === 0 ? 0 : 2;
  p(x + 5 * s, y + 7 * s, 7, 4, "#f7f7ef", s);
  p(x + 2 * s, y + (5 + wingLift) * s, 5, 3, "#dfe8ef", s);
  p(x + 10 * s, y + (5 + wingLift) * s, 5, 3, "#dfe8ef", s);
  p(x + 11 * s, y + 6 * s, 3, 2, "#ffd166", s);
  p(x + 8 * s, y + 8 * s, 1, 1, "#101018", s);
  p(x + 6 * s, y + 11 * s, 2, 1, "#ffb347", s);
  p(x + 10 * s, y + 11 * s, 2, 1, "#ffb347", s);
}

function drawEel(x, y, scale) {
  const s = scale;
  p(x + 2 * s, y + 9 * s, 4, 3, "#2cb3c9", s);
  p(x + 5 * s, y + 7 * s, 4, 3, "#1f8ca0", s);
  p(x + 8 * s, y + 8 * s, 5, 3, "#2cb3c9", s);
  p(x + 12 * s, y + 6 * s, 3, 4, "#8debe8", s);
  p(x + 13 * s, y + 7 * s, 1, 1, "#101018", s);
  p(x + 14 * s, y + 9 * s, 2, 1, "#ffd166", s);
  p(x + 6 * s, y + 6 * s, 2, 1, "#ffd166", s);
}

function drawBarnacle(x, y, scale) {
  const s = scale;
  p(x + 4 * s, y + 8 * s, 9, 6, "#6c7a89", s);
  p(x + 5 * s, y + 6 * s, 7, 4, "#9aa7b0", s);
  p(x + 7 * s, y + 4 * s, 4, 4, "#fff1b8", s);
  p(x + 8 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 10 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 3 * s, y + 11 * s, 3, 2, "#ff7a8a", s);
  p(x + 12 * s, y + 11 * s, 3, 2, "#ff7a8a", s);
}

function drawAshBat(x, y, scale) {
  const s = scale;
  p(x + 6 * s, y + 6 * s, 4, 5, "#3f3a45", s);
  p(x + 2 * s, y + 5 * s, 5, 3, "#6b6470", s);
  p(x + 9 * s, y + 5 * s, 5, 3, "#6b6470", s);
  p(x + 1 * s, y + 8 * s, 4, 2, "#4a4650", s);
  p(x + 11 * s, y + 8 * s, 4, 2, "#4a4650", s);
  p(x + 7 * s, y + 7 * s, 1, 1, "#ffd166", s);
  p(x + 9 * s, y + 7 * s, 1, 1, "#ffd166", s);
  p(x + 7 * s, y + 11 * s, 3, 1, "#ff5a2e", s);
}

function drawLavaCrab(x, y, scale) {
  const s = scale;
  p(x + 4 * s, y + 7 * s, 8, 5, "#d62828", s);
  p(x + 2 * s, y + 8 * s, 3, 2, "#ff5a2e", s);
  p(x + 11 * s, y + 8 * s, 3, 2, "#ff5a2e", s);
  p(x + 5 * s, y + 6 * s, 6, 2, "#ffb347", s);
  p(x + 6 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 9 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 3 * s, y + 12 * s, 2, 2, "#7a1f1f", s);
  p(x + 11 * s, y + 12 * s, 2, 2, "#7a1f1f", s);
}

function drawSmokeSnake(x, y, scale) {
  const s = scale;
  p(x + 3 * s, y + 9 * s, 10, 3, "#6b6470", s);
  p(x + 9 * s, y + 5 * s, 5, 5, "#9aa7b0", s);
  p(x + 12 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 14 * s, y + 7 * s, 2, 1, "#ffd166", s);
  p(x + 5 * s, y + 8 * s, 2, 1, "#d8c48a", s);
  p(x + 1 * s, y + 10 * s, 2, 1, "#4a4650", s);
}

function drawCaneCorsair(x, y, scale) {
  const s = scale;
  p(x + 5 * s, y + 8 * s, 7, 6, "#8b542e", s);
  p(x + 6 * s, y + 4 * s, 6, 6, "#9a6335", s);
  p(x + 7 * s, y + 6 * s, 4, 3, "#e2a765", s);
  p(x + 4 * s, y + 2 * s, 10, 3, "#8aa33a", s);
  p(x + 6 * s, y + 1 * s, 6, 2, "#d8c65a", s);
  p(x + 6 * s, y + 5 * s, 1, 1, "#101018", s);
  p(x + 10 * s, y + 5 * s, 1, 1, "#101018", s);
  p(x + 2 * s, y + 8 * s, 4, 2, "#5f7f2d", s);
  p(x + 11 * s, y + 9 * s, 4, 1, "#d8c65a", s);
  p(x + 4 * s, y + 14 * s, 3, 2, "#5a321d", s);
  p(x + 10 * s, y + 14 * s, 3, 2, "#5a321d", s);
}

function drawBarrelBruiser(x, y, scale) {
  const s = scale;
  p(x + 4 * s, y + 4 * s, 8, 10, "#8f5a2a", s);
  p(x + 3 * s, y + 6 * s, 10, 2, "#b8793a", s);
  p(x + 3 * s, y + 11 * s, 10, 2, "#5b351c", s);
  p(x + 5 * s, y + 3 * s, 6, 2, "#5b351c", s);
  p(x + 5 * s, y + 14 * s, 6, 1, "#2b1b12", s);
  p(x + 6 * s, y + 8 * s, 1, 1, "#101018", s);
  p(x + 10 * s, y + 8 * s, 1, 1, "#101018", s);
  p(x + 1 * s, y + 9 * s, 3, 2, "#9a6335", s);
  p(x + 12 * s, y + 9 * s, 3, 2, "#9a6335", s);
}

function drawDockSneak(x, y, scale) {
  const s = scale;
  p(x + 5 * s, y + 7 * s, 7, 7, "#253047", s);
  p(x + 6 * s, y + 4 * s, 6, 5, "#364f7a", s);
  p(x + 7 * s, y + 6 * s, 4, 2, "#e2a765", s);
  p(x + 5 * s, y + 3 * s, 8, 2, "#101018", s);
  p(x + 7 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 10 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 2 * s, y + 9 * s, 4, 1, "#9b6736", s);
  p(x + 10 * s, y + 10 * s, 5, 1, "#d8c48a", s);
  p(x + 4 * s, y + 14 * s, 3, 2, "#2b1b12", s);
  p(x + 10 * s, y + 14 * s, 3, 2, "#2b1b12", s);
}

function drawMudCrab(x, y, scale) {
  const s = scale;
  p(x + 4 * s, y + 8 * s, 8, 5, "#5b351c", s);
  p(x + 2 * s, y + 9 * s, 3, 2, "#8f5a2a", s);
  p(x + 11 * s, y + 9 * s, 3, 2, "#8f5a2a", s);
  p(x + 5 * s, y + 6 * s, 6, 2, "#3f5a55", s);
  p(x + 6 * s, y + 7 * s, 1, 1, "#a8f5ff", s);
  p(x + 9 * s, y + 7 * s, 1, 1, "#a8f5ff", s);
  p(x + 3 * s, y + 13 * s, 2, 2, "#273a39", s);
  p(x + 11 * s, y + 13 * s, 2, 2, "#273a39", s);
}

function drawVineSnake(x, y, scale) {
  const s = scale;
  p(x + 2 * s, y + 10 * s, 11, 3, "#2f5b4a", s);
  p(x + 9 * s, y + 6 * s, 5, 5, "#4c8a65", s);
  p(x + 12 * s, y + 7 * s, 1, 1, "#101018", s);
  p(x + 14 * s, y + 8 * s, 2, 1, "#a8f5ff", s);
  p(x + 5 * s, y + 9 * s, 3, 1, "#74f29c", s);
  p(x + 1 * s, y + 11 * s, 2, 1, "#5b351c", s);
}

function drawNightBat(x, y, scale) {
  const s = scale;
  p(x + 6 * s, y + 6 * s, 4, 5, "#161923", s);
  p(x + 2 * s, y + 5 * s, 5, 3, "#364f7a", s);
  p(x + 9 * s, y + 5 * s, 5, 3, "#364f7a", s);
  p(x + 1 * s, y + 8 * s, 4, 2, "#253047", s);
  p(x + 11 * s, y + 8 * s, 4, 2, "#253047", s);
  p(x + 7 * s, y + 7 * s, 1, 1, "#a8f5ff", s);
  p(x + 9 * s, y + 7 * s, 1, 1, "#a8f5ff", s);
  p(x + 7 * s, y + 11 * s, 3, 1, "#fff1b8", s);
}

function drawStormGull(x, y, scale) {
  const s = scale;
  const wingLift = Math.floor(frameTime / 220) % 2 === 0 ? 0 : 2;
  p(x + 5 * s, y + 7 * s, 7, 4, "#dfe8ef", s);
  p(x + 2 * s, y + (5 + wingLift) * s, 5, 3, "#6f8098", s);
  p(x + 10 * s, y + (5 + wingLift) * s, 5, 3, "#6f8098", s);
  p(x + 11 * s, y + 6 * s, 3, 2, "#ffd166", s);
  p(x + 8 * s, y + 8 * s, 1, 1, "#101018", s);
  p(x + 6 * s, y + 11 * s, 2, 1, "#8debe8", s);
  p(x + 10 * s, y + 11 * s, 2, 1, "#8debe8", s);
}

function drawSparkCrab(x, y, scale) {
  const s = scale;
  p(x + 4 * s, y + 7 * s, 8, 5, "#46566f", s);
  p(x + 2 * s, y + 8 * s, 3, 2, "#8debe8", s);
  p(x + 11 * s, y + 8 * s, 3, 2, "#8debe8", s);
  p(x + 5 * s, y + 6 * s, 6, 2, "#ffd166", s);
  p(x + 6 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 9 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 3 * s, y + 12 * s, 2, 2, "#2f3a52", s);
  p(x + 11 * s, y + 12 * s, 2, 2, "#2f3a52", s);
  if (controlsPulse % 600 < 300) {
    p(x + 1 * s, y + 5 * s, 2, 1, "#fff1b8", s);
    p(x + 13 * s, y + 4 * s, 2, 1, "#fff1b8", s);
  }
}

function drawRainSnake(x, y, scale) {
  const s = scale;
  p(x + 3 * s, y + 9 * s, 10, 3, "#364f7a", s);
  p(x + 9 * s, y + 5 * s, 5, 5, "#5d8fff", s);
  p(x + 12 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 14 * s, y + 7 * s, 2, 1, "#8debe8", s);
  p(x + 5 * s, y + 8 * s, 2, 1, "#a8f5ff", s);
  p(x + 1 * s, y + 10 * s, 2, 1, "#2f3a52", s);
}

function drawSandCrab(x, y, scale) {
  const s = scale;
  p(x + 4 * s, y + 7 * s, 8, 5, "#d8c48a", s);
  p(x + 2 * s, y + 8 * s, 3, 2, "#fff8d8", s);
  p(x + 11 * s, y + 8 * s, 3, 2, "#fff8d8", s);
  p(x + 5 * s, y + 6 * s, 6, 2, "#b8ad85", s);
  p(x + 6 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 9 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 3 * s, y + 12 * s, 2, 2, "#9f9168", s);
  p(x + 11 * s, y + 12 * s, 2, 2, "#9f9168", s);
}

function drawMirageBat(x, y, scale) {
  const s = scale;
  p(x + 6 * s, y + 6 * s, 4, 5, "#dfe8ef", s);
  p(x + 2 * s, y + 5 * s, 5, 3, "#8debe8", s);
  p(x + 9 * s, y + 5 * s, 5, 3, "#8debe8", s);
  p(x + 1 * s, y + 8 * s, 4, 2, "#cfc6a0", s);
  p(x + 11 * s, y + 8 * s, 4, 2, "#cfc6a0", s);
  p(x + 7 * s, y + 7 * s, 1, 1, "#101018", s);
  p(x + 9 * s, y + 7 * s, 1, 1, "#101018", s);
  p(x + 7 * s, y + 11 * s, 3, 1, "#fff8d8", s);
}

function drawBoneSnake(x, y, scale) {
  const s = scale;
  p(x + 3 * s, y + 9 * s, 10, 3, "#d8d1b8", s);
  p(x + 9 * s, y + 5 * s, 5, 5, "#fff8d8", s);
  p(x + 12 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 14 * s, y + 7 * s, 2, 1, "#8debe8", s);
  p(x + 5 * s, y + 8 * s, 2, 1, "#9aa7b0", s);
  p(x + 1 * s, y + 10 * s, 2, 1, "#cfc6a0", s);
}

function drawGhostCrab(x, y, scale) {
  const s = scale;
  p(x + 4 * s, y + 7 * s, 8, 5, "#94b0c2", s);
  p(x + 2 * s, y + 8 * s, 3, 2, "#dfe8ef", s);
  p(x + 11 * s, y + 8 * s, 3, 2, "#dfe8ef", s);
  p(x + 5 * s, y + 6 * s, 6, 2, "#66707d", s);
  p(x + 6 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 9 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 3 * s, y + 12 * s, 2, 2, "#4d5868", s);
  p(x + 11 * s, y + 12 * s, 2, 2, "#4d5868", s);
}

function drawFogBat(x, y, scale) {
  const s = scale;
  p(x + 6 * s, y + 6 * s, 4, 5, "#4d5868", s);
  p(x + 2 * s, y + 5 * s, 5, 3, "#94b0c2", s);
  p(x + 9 * s, y + 5 * s, 5, 3, "#94b0c2", s);
  p(x + 1 * s, y + 8 * s, 4, 2, "#66707d", s);
  p(x + 11 * s, y + 8 * s, 4, 2, "#66707d", s);
  p(x + 7 * s, y + 7 * s, 1, 1, "#fff1b8", s);
  p(x + 9 * s, y + 7 * s, 1, 1, "#fff1b8", s);
  p(x + 7 * s, y + 11 * s, 3, 1, "#dfe8ef", s);
}

function drawAnchorBrute(x, y, scale) {
  const s = scale;
  p(x + 4 * s, y + 7 * s, 8, 7, "#5b351c", s);
  p(x + 5 * s, y + 4 * s, 7, 5, "#8f5a2a", s);
  p(x + 6 * s, y + 6 * s, 4, 2, "#d8c48a", s);
  p(x + 6 * s, y + 5 * s, 1, 1, "#101018", s);
  p(x + 10 * s, y + 5 * s, 1, 1, "#101018", s);
  p(x + 2 * s, y + 10 * s, 4, 2, "#6c7a89", s);
  p(x + 11 * s, y + 10 * s, 4, 2, "#6c7a89", s);
  p(x + 7 * s, y + 1 * s, 4, 3, "#6c7a89", s);
  p(x + 8 * s, y + 0 * s, 2, 4, "#9aa7b0", s);
  p(x + 4 * s, y + 14 * s, 3, 2, "#2b1b12", s);
  p(x + 10 * s, y + 14 * s, 3, 2, "#2b1b12", s);
}

function drawRoyalCrabGuard(x, y, scale) {
  const s = scale;
  p(x + 4 * s, y + 7 * s, 8, 5, "#b8793a", s);
  p(x + 2 * s, y + 8 * s, 3, 2, "#ffd166", s);
  p(x + 11 * s, y + 8 * s, 3, 2, "#ffd166", s);
  p(x + 5 * s, y + 6 * s, 6, 2, "#f4d879", s);
  p(x + 6 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 9 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 6 * s, y + 2 * s, 5, 3, "#ffd166", s);
  p(x + 7 * s, y + 1 * s, 1, 2, "#fff1b8", s);
  p(x + 9 * s, y + 1 * s, 1, 2, "#fff1b8", s);
  p(x + 3 * s, y + 12 * s, 2, 2, "#8f5a2a", s);
  p(x + 11 * s, y + 12 * s, 2, 2, "#8f5a2a", s);
}

function drawCrownSnake(x, y, scale) {
  const s = scale;
  p(x + 3 * s, y + 9 * s, 10, 3, "#5f7f2d", s);
  p(x + 9 * s, y + 5 * s, 5, 5, "#8aa33a", s);
  p(x + 10 * s, y + 3 * s, 4, 2, "#ffd166", s);
  p(x + 11 * s, y + 2 * s, 1, 2, "#fff1b8", s);
  p(x + 13 * s, y + 2 * s, 1, 2, "#fff1b8", s);
  p(x + 12 * s, y + 6 * s, 1, 1, "#101018", s);
  p(x + 14 * s, y + 7 * s, 2, 1, "#d62828", s);
  p(x + 5 * s, y + 8 * s, 2, 1, "#f4d879", s);
}

function drawTreasureBat(x, y, scale) {
  const s = scale;
  p(x + 6 * s, y + 6 * s, 4, 5, "#8f5a2a", s);
  p(x + 2 * s, y + 5 * s, 5, 3, "#b8793a", s);
  p(x + 9 * s, y + 5 * s, 5, 3, "#b8793a", s);
  p(x + 1 * s, y + 8 * s, 4, 2, "#5b351c", s);
  p(x + 11 * s, y + 8 * s, 4, 2, "#5b351c", s);
  p(x + 7 * s, y + 7 * s, 1, 1, "#ffd166", s);
  p(x + 9 * s, y + 7 * s, 1, 1, "#ffd166", s);
  p(x + 7 * s, y + 11 * s, 3, 1, "#fff1b8", s);
  p(x + 6 * s, y + 3 * s, 5, 2, "#f4d879", s);
}

function drawChest(x, y, opened) {
  p(x + 3, y + 7, 10, 6, "#8f5a2a");
  p(x + 2, y + 6, 12, 3, opened ? "#4a2c1c" : "#b8793a");
  p(x + 7, y + 9, 2, 2, "#ffd166");
  if (opened) {
    p(x + 4, y + 5, 8, 2, "#101018");
  }
}

function drawWreckage(x, y) {
  p(x + 2, y + 5, 12, 3, "#b8793a");
  p(x + 4, y + 9, 10, 3, "#6b3f24");
  p(x + 7, y + 1, 2, 12, "#5b351c");
  p(x + 9, y + 2, 4, 5, "#fff1b8");
  p(x + 9, y + 6, 3, 2, "#d8c48a");
}

function drawParrot(x, y) {
  p(x + 7, y + 4, 4, 7, "#2fbf71");
  p(x + 6, y + 3, 4, 3, "#d62828");
  p(x + 10, y + 5, 3, 2, "#ffd166");
  p(x + 8, y + 4, 1, 1, "#101018");
  p(x + 5, y + 7, 3, 4, "#2477c9");
  p(x + 6, y + 11, 6, 2, "#6b3f24");
}

function drawCaveEntrance(x, y) {
  p(x + 1, y + 5, 14, 10, "#45394d");
  p(x + 4, y + 6, 8, 9, "#101018");
  p(x + 2, y + 3, 5, 4, "#6c7a89");
  p(x + 9, y + 2, 5, 5, "#6c7a89");
  p(x + 6, y + 8, 2, 2, "#27202f");
}

function drawRaft(x, y) {
  p(x + 1, y + 10, 14, 3, "#9b6736");
  p(x + 2, y + 13, 12, 2, "#5b351c");
  p(x + 7, y + 2, 2, 10, "#5b351c");
  p(x + 9, y + 3, 5, 6, hasAllParts() ? "#fff1b8" : "#7d7d7d");
  p(x + 10, y + 8, 3, 2, "#d8c48a");
}

function drawExit(x, y) {
  p(x + 3, y + 8, 10, 3, "#f3d27a");
  p(x + 5, y + 6, 6, 2, "#ffd166");
  p(x + 7, y + 4, 2, 2, "#fff1b8");
}

function drawBottle(x, y) {
  p(x + 4, y + 9, 8, 3, "#8debe8");
  p(x + 11, y + 8, 3, 2, "#5b351c");
  p(x + 5, y + 10, 5, 1, "#fff1b8");
  p(x + 6, y + 8, 3, 1, "#d8c48a");
}

function drawDinghy(x, y) {
  p(x + 1, y + 9, 14, 4, "#9b6736");
  p(x + 3, y + 7, 10, 3, "#b8793a");
  p(x + 5, y + 6, 2, 7, "#5b351c");
  p(x + 9, y + 6, 4, 2, "#6c7a89");
  p(x + 2, y + 13, 12, 2, "#1f8ca0");
}

function drawCoralGate(x, y) {
  p(x + 3, y + 3, 3, 12, "#ff7a8a");
  p(x + 10, y + 3, 3, 12, "#ff7a8a");
  p(x + 5, y + 6, 7, 3, "#ffd166");
  p(x + 6, y + 10, 5, 2, "#8debe8");
  p(x + 8, y + 7, 1, 1, "#101018");
}

function drawShipHoldEntrance(x, y) {
  p(x + 2, y + 6, 12, 8, "#5b351c");
  p(x + 3, y + 5, 10, 3, "#8f5a2a");
  p(x + 5, y + 8, 6, 5, "#101018");
  p(x + 4, y + 4, 8, 1, "#d8c48a");
  p(x + 12, y + 7, 2, 6, "#2b1b12");
}

function drawShipBell(x, y, ready) {
  p(x + 4, y + 3, 3, 12, "#5b351c");
  p(x + 11, y + 3, 3, 12, "#5b351c");
  p(x + 4, y + 3, 10, 2, "#9b6736");
  p(x + 7, y + 5, 5, 6, ready ? "#ffd166" : "#6c7a89");
  p(x + 6, y + 10, 7, 2, ready ? "#ffb347" : "#9aa7b0");
  p(x + 9, y + 12, 1, 2, "#fff1b8");
  if (ready && controlsPulse % 700 < 350) {
    p(x + 3, y + 6, 2, 1, "#fff1b8");
    p(x + 14, y + 6, 2, 1, "#fff1b8");
  }
}

function drawMangoTree(x, y) {
  p(x + 7, y + 7, 3, 8, "#8b5a2b");
  p(x + 4, y + 2, 9, 5, "#1f8f45");
  p(x + 2, y + 5, 13, 5, "#34c759");
  p(x + 5, y + 1, 7, 3, "#59c135");
  p(x + 7, y + 5, 2, 2, "#ffd166");
  p(x + 11, y + 7, 2, 2, "#ffb347");
}

function drawVolcanoSage(x, y) {
  p(x + 5, y + 8, 7, 6, "#8b542e");
  p(x + 6, y + 4, 6, 6, "#9a6335");
  p(x + 7, y + 6, 4, 3, "#e2a765");
  p(x + 5, y + 3, 7, 2, "#ffb347");
  p(x + 6, y + 5, 2, 1, "#101018");
  p(x + 10, y + 5, 1, 1, "#101018");
  p(x + 11, y + 7, 4, 1, "#59c135");
  p(x + 4, y + 14, 3, 2, "#5a321d");
  p(x + 10, y + 14, 3, 2, "#5a321d");
}

function drawSteamVent(x, y) {
  p(x + 4, y + 11, 9, 4, "#6c7a89");
  p(x + 6, y + 9, 5, 3, "#9aa7b0");
  if (controlsPulse % 700 < 350) {
    p(x + 5, y + 3, 2, 5, "#dfe8ef");
    p(x + 9, y + 1, 2, 7, "#fff1b8");
    p(x + 12, y + 4, 1, 4, "#dfe8ef");
  } else {
    p(x + 4, y + 2, 1, 5, "#dfe8ef");
    p(x + 8, y + 4, 2, 4, "#fff1b8");
    p(x + 12, y + 1, 2, 7, "#dfe8ef");
  }
}

function drawObsidianPlug(x, y) {
  p(x + 4, y + 6, 9, 8, "#161923");
  p(x + 5, y + 5, 7, 3, "#3f3a45");
  p(x + 7, y + 8, 3, 2, "#6b6470");
  p(x + 11, y + 11, 2, 2, "#ff5a2e");
}

function drawVolcanoAltar(x, y, ready) {
  p(x + 4, y + 10, 9, 5, "#6c7a89");
  p(x + 5, y + 7, 7, 4, "#9aa7b0");
  p(x + 7, y + 4, 3, 4, ready ? "#ffd166" : "#4a4650");
  p(x + 6, y + 3, 5, 2, "#ffb347");
  p(x + 8, y + 1, 1, 2, ready ? "#fff1b8" : "#6b6470");
  if (ready && controlsPulse % 700 < 350) {
    p(x + 3, y + 5, 2, 1, "#fff1b8");
    p(x + 12, y + 5, 2, 1, "#fff1b8");
  }
}

function drawTidepool(x, y) {
  p(x + 2, y + 6, 12, 6, "#1f8ca0");
  p(x + 3, y + 7, 10, 4, "#8debe8");
  p(x + 6, y + 8, 4, 2, "#ffb347");
  p(x + 7, y + 7, 2, 4, "#ffd166");
  p(x + 10, y + 9, 2, 1, "#fff1b8");
}

function drawLookout(x, y) {
  p(x + 5, y + 8, 7, 6, "#8b542e");
  p(x + 6, y + 4, 6, 6, "#9a6335");
  p(x + 7, y + 6, 4, 3, "#e2a765");
  p(x + 5, y + 3, 7, 2, "#2477c9");
  p(x + 6, y + 5, 2, 1, "#101018");
  p(x + 9, y + 6, 1, 1, "#101018");
  p(x + 12, y + 7, 3, 1, "#5b351c");
  p(x + 4, y + 14, 3, 2, "#5a321d");
  p(x + 10, y + 14, 3, 2, "#5a321d");
}

function drawBeacon(x, y, ready) {
  p(x + 5, y + 10, 7, 5, "#6c7a89");
  p(x + 6, y + 7, 5, 4, "#9aa7b0");
  p(x + 7, y + 3, 3, 5, "#5b351c");
  p(x + 5, y + 2, 7, 3, "#b8793a");
  p(x + 7, y + 1, 3, 3, ready ? "#ffd166" : "#45394d");
  if (ready && controlsPulse % 800 < 400) {
    p(x + 4, y + 0, 9, 1, "#fff1b8");
    p(x + 2, y + 1, 3, 1, "#ffd166");
    p(x + 12, y + 1, 3, 1, "#ffd166");
  }
}

function drawQuartermaster(x, y) {
  p(x + 5, y + 8, 7, 6, "#5b351c");
  p(x + 6, y + 4, 6, 6, "#9a6335");
  p(x + 7, y + 6, 4, 3, "#e2a765");
  p(x + 5, y + 3, 7, 2, "#6c7a89");
  p(x + 7, y + 8, 5, 3, "#dfe8ef");
  p(x + 6, y + 5, 1, 1, "#101018");
  p(x + 10, y + 5, 1, 1, "#101018");
  p(x + 13, y + 7, 1, 8, "#8aa33a");
  p(x + 4, y + 14, 3, 2, "#2b1b12");
  p(x + 10, y + 14, 3, 2, "#2b1b12");
}

function drawCrates(x, y) {
  p(x + 2, y + 7, 7, 7, "#8f5a2a");
  p(x + 9, y + 5, 6, 9, "#9b6736");
  p(x + 3, y + 8, 5, 1, "#b8793a");
  p(x + 5, y + 7, 1, 7, "#5b351c");
  p(x + 10, y + 7, 4, 1, "#b8793a");
  p(x + 12, y + 5, 1, 9, "#5b351c");
  p(x + 6, y + 11, 2, 2, "#ffd166");
}

function drawStorehouseDoor(x, y) {
  p(x + 2, y + 4, 12, 11, "#5b351c");
  p(x + 3, y + 3, 10, 3, "#8f5a2a");
  p(x + 4, y + 6, 2, 8, "#9b6736");
  p(x + 7, y + 6, 2, 8, "#8f5a2a");
  p(x + 10, y + 6, 2, 8, "#9b6736");
  p(x + 5, y + 8, 6, 3, "#d8c65a");
  p(x + 7, y + 9, 2, 1, "#5f7f2d");
  p(x + 11, y + 10, 2, 2, "#ffd166");
}

function drawCratePulley(x, y, ready) {
  p(x + 3, y + 3, 2, 12, "#5b351c");
  p(x + 3, y + 3, 9, 2, "#8f5a2a");
  p(x + 11, y + 4, 1, 6, "#d8c48a");
  p(x + 8, y + 10, 7, 5, "#8f5a2a");
  p(x + 9, y + 11, 5, 1, "#b8793a");
  p(x + 11, y + 10, 1, 5, "#5b351c");
  if (ready) {
    p(x + 10, y + 7, 3, 3, "#ffd166");
    p(x + 12, y + 9, 1, 2, "#fff1b8");
  }
}

function drawCoveLookout(x, y, ready) {
  p(x + 2, y + 11, 12, 3, "#9b6736");
  p(x + 3, y + 7, 2, 7, "#5b351c");
  p(x + 11, y + 7, 2, 7, "#5b351c");
  p(x + 5, y + 7, 6, 2, "#d8c48a");
  p(x + 6, y + 5, 6, 2, ready ? "#ffd166" : "#6c7a89");
  p(x + 11, y + 4, 3, 1, ready ? "#fff1b8" : "#9aa7b0");
  if (ready && controlsPulse % 800 < 400) {
    p(x + 13, y + 3, 2, 1, "#fff1b8");
    p(x + 15, y + 2, 1, 1, "#ffd166");
  }
}

function drawMoonStampedCrate(x, y, opened) {
  p(x + 2, y + 7, 12, 7, "#5b351c");
  p(x + 3, y + 5, 10, 4, opened ? "#2b1b12" : "#8f5a2a");
  p(x + 4, y + 9, 8, 1, "#b8793a");
  p(x + 7, y + 6, 2, 6, "#6c7a89");
  p(x + 5, y + 7, 6, 2, opened ? "#101018" : "#a8f5ff");
  if (!opened && controlsPulse % 800 < 400) {
    p(x + 6, y + 4, 4, 1, "#fff1b8");
  }
}

function drawMoonGrottoEntrance(x, y) {
  p(x + 1, y + 5, 14, 10, "#2f5b4a");
  p(x + 4, y + 6, 8, 9, "#101018");
  p(x + 2, y + 3, 5, 4, "#5b351c");
  p(x + 9, y + 2, 5, 5, "#8f5a2a");
  p(x + 6, y + 8, 2, 2, "#172f44");
  if (controlsPulse % 800 < 400) {
    p(x + 4, y + 5, 2, 1, "#a8f5ff");
    p(x + 11, y + 7, 1, 1, "#fff1b8");
  }
}

function drawSilverLeaf(x, y) {
  p(x + 7, y + 7, 3, 8, "#5b351c");
  p(x + 4, y + 3, 9, 5, "#2f5b4a");
  p(x + 2, y + 6, 13, 4, "#4c8a65");
  p(x + 8, y + 4, 3, 4, "#dfe8ef");
  p(x + 9, y + 3, 1, 6, "#fff1b8");
  if (controlsPulse % 700 < 350) {
    p(x + 7, y + 2, 3, 1, "#a8f5ff");
  }
}

function drawMoonPool(x, y, active) {
  p(x + 2, y + 6, 12, 6, "#172f44");
  p(x + 3, y + 7, 10, 4, active ? "#8debe8" : "#3f5a55");
  p(x + 5, y + 8, 6, 2, active ? "#fff1b8" : "#273a39");
  if (active && controlsPulse % 700 < 350) {
    p(x + 7, y + 5, 2, 2, "#a8f5ff");
    p(x + 10, y + 9, 2, 1, "#fff1b8");
  }
}

function drawMoonCompassStone(x, y, ready) {
  p(x + 3, y + 10, 10, 5, "#6c7a89");
  p(x + 4, y + 6, 8, 5, "#9aa7b0");
  p(x + 5, y + 4, 6, 3, "#5b4b59");
  p(x + 7, y + 2, 2, 3, ready ? "#a8f5ff" : "#45394d");
  p(x + 5, y + 8, 2, 2, hasMangroveItem("Moon Pearl") ? "#fff1b8" : "#4a4650");
  p(x + 9, y + 8, 2, 2, hasMangroveItem("Silver Leaf") ? "#dfe8ef" : "#4a4650");
  p(x + 7, y + 11, 2, 2, hasMangroveItem("Glow Reed") ? "#74f29c" : "#4a4650");
  if (ready && controlsPulse % 800 < 400) {
    p(x + 2, y + 5, 2, 1, "#fff1b8");
    p(x + 12, y + 5, 2, 1, "#fff1b8");
  }
}

function drawStormSkiff(x, y) {
  p(x + 1, y + 10, 14, 3, "#5b351c");
  p(x + 2, y + 13, 12, 2, "#2f3a52");
  p(x + 6, y + 7, 8, 3, "#8f5a2a");
  p(x + 4, y + 6, 3, 7, "#6f8098");
  p(x + 10, y + 5, 2, 6, "#ffd166");
}

function drawStormWatcher(x, y) {
  p(x + 5, y + 8, 7, 6, "#364f7a");
  p(x + 6, y + 4, 6, 6, "#9a6335");
  p(x + 7, y + 6, 4, 3, "#e2a765");
  p(x + 4, y + 3, 9, 2, "#6f8098");
  p(x + 5, y + 2, 7, 2, "#46566f");
  p(x + 6, y + 5, 1, 1, "#101018");
  p(x + 10, y + 5, 1, 1, "#101018");
  p(x + 12, y + 8, 3, 1, "#ffd166");
  p(x + 4, y + 14, 3, 2, "#2b1b12");
  p(x + 10, y + 14, 3, 2, "#2b1b12");
}

function drawStormglassShard(x, y) {
  p(x + 6, y + 5, 5, 8, "#5d8fff");
  p(x + 7, y + 4, 3, 2, "#8debe8");
  p(x + 5, y + 9, 7, 3, "#364f7a");
  p(x + 8, y + 6, 1, 5, "#fff1b8");
  if (controlsPulse % 700 < 350) {
    p(x + 4, y + 4, 2, 1, "#fff1b8");
    p(x + 11, y + 3, 1, 2, "#a8f5ff");
  }
}

function drawCopperRod(x, y) {
  p(x + 7, y + 3, 2, 11, "#ffb347");
  p(x + 6, y + 4, 4, 2, "#ffd166");
  p(x + 5, y + 12, 6, 2, "#8f5a2a");
  p(x + 8, y + 2, 1, 2, "#fff1b8");
}

function drawKiteString(x, y) {
  p(x + 3, y + 10, 10, 3, "#dfe8ef");
  p(x + 6, y + 6, 6, 5, "#6f8098");
  p(x + 7, y + 7, 4, 3, "#8debe8");
  p(x + 5, y + 5, 1, 8, "#fff1b8");
  p(x + 10, y + 5, 1, 8, "#fff1b8");
  p(x + 2, y + 13, 12, 1, "#5b351c");
}

function drawStormMast(x, y, ready) {
  p(x + 7, y + 2, 2, 13, "#5b351c");
  p(x + 4, y + 5, 8, 2, "#8f5a2a");
  p(x + 5, y + 8, 6, 1, ready ? "#fff1b8" : "#6f8098");
  p(x + 6, y + 3, 4, 3, hasStormItem("Stormglass Shard") ? "#5d8fff" : "#46566f");
  p(x + 10, y + 2, 2, 8, hasStormItem("Copper Rod") ? "#ffd166" : "#6c7a89");
  p(x + 3, y + 9, 9, 1, hasStormItem("Kite String") ? "#dfe8ef" : "#4a4650");
  p(x + 4, y + 13, 9, 2, "#6c7a89");
  if (ready && controlsPulse % 600 < 300) {
    p(x + 2, y + 1, 3, 1, "#fff1b8");
    p(x + 12, y + 2, 2, 1, "#8debe8");
    p(x + 5, y + 0, 6, 1, "#ffd166");
  }
}

function drawDuneGuide(x, y) {
  p(x + 5, y + 8, 7, 6, "#d8c48a");
  p(x + 6, y + 4, 6, 6, "#9a6335");
  p(x + 7, y + 6, 4, 3, "#e2a765");
  p(x + 4, y + 3, 9, 2, "#fff8d8");
  p(x + 5, y + 2, 7, 2, "#cfc6a0");
  p(x + 6, y + 5, 1, 1, "#101018");
  p(x + 10, y + 5, 1, 1, "#101018");
  p(x + 12, y + 8, 3, 1, "#5b351c");
  p(x + 4, y + 14, 3, 2, "#8f5a2a");
  p(x + 10, y + 14, 3, 2, "#8f5a2a");
}

function drawBuriedChest(x, y, opened) {
  p(x + 2, y + 10, 12, 4, "#cfc6a0");
  p(x + 3, y + 8, 10, 5, opened ? "#5b351c" : "#8f5a2a");
  p(x + 4, y + 7, 8, 3, opened ? "#2b1b12" : "#b8793a");
  p(x + 7, y + 10, 2, 2, "#ffd166");
  p(x + 1, y + 13, 14, 2, "#efe7c8");
}

function drawMiragePool(x, y, active) {
  p(x + 2, y + 6, 12, 6, active ? "#8debe8" : "#cfc6a0");
  p(x + 3, y + 7, 10, 4, active ? "#dfe8ef" : "#efe7c8");
  p(x + 5, y + 8, 6, 2, active ? "#fff8d8" : "#cfc6a0");
  if (active && controlsPulse % 700 < 350) {
    p(x + 7, y + 5, 2, 1, "#fff1b8");
    p(x + 10, y + 10, 2, 1, "#8debe8");
  }
}

function drawCactusCanteen(x, y) {
  p(x + 7, y + 5, 3, 10, "#5f7f2d");
  p(x + 4, y + 8, 3, 2, "#5f7f2d");
  p(x + 10, y + 9, 3, 2, "#5f7f2d");
  p(x + 5, y + 7, 2, 4, "#4c8a65");
  p(x + 12, y + 8, 2, 4, "#4c8a65");
  p(x + 3, y + 11, 4, 4, "#9b6736");
  p(x + 4, y + 10, 2, 1, "#d8c48a");
  p(x + 5, y + 12, 1, 2, "#2b1b12");
}

function drawDuneSunDial(x, y, ready) {
  p(x + 3, y + 10, 10, 5, "#d8d1b8");
  p(x + 4, y + 6, 8, 5, "#cfc6a0");
  p(x + 5, y + 4, 6, 3, hasDuneItem("Sun Dial") ? "#ffb347" : "#9aa7b0");
  p(x + 8, y + 5, 1, 6, ready ? "#5b351c" : "#6c7a89");
  p(x + 5, y + 8, 2, 2, hasDuneItem("Pearl Token") ? "#fff8d8" : "#6c7a89");
  p(x + 10, y + 8, 2, 2, hasDuneItem("Cactus Canteen") ? "#5f7f2d" : "#6c7a89");
  if (ready && controlsPulse % 800 < 400) {
    p(x + 2, y + 3, 3, 1, "#fff1b8");
    p(x + 12, y + 4, 2, 1, "#ffd166");
  }
}

function drawWhisperingMast(x, y) {
  p(x + 7, y + 2, 2, 13, "#5b351c");
  p(x + 4, y + 5, 8, 2, "#8f5a2a");
  p(x + 5, y + 8, 7, 1, "#dfe8ef");
  p(x + 3, y + 12, 11, 2, "#3f4a54");
  if (controlsPulse % 800 < 400) {
    p(x + 3, y + 4, 2, 1, "#94b0c2");
    p(x + 11, y + 7, 2, 1, "#dfe8ef");
  }
}

function drawGhostCompassAlcove(x, y) {
  p(x + 2, y + 6, 12, 8, "#5b351c");
  p(x + 3, y + 5, 10, 3, "#8f5a2a");
  p(x + 5, y + 8, 6, 5, "#101018");
  p(x + 6, y + 9, 4, 4, "#94b0c2");
  p(x + 7, y + 10, 2, 2, "#dfe8ef");
  if (controlsPulse % 800 < 400) {
    p(x + 8, y + 7, 1, 7, "#fff1b8");
  }
}

function drawAnchorCharm(x, y) {
  p(x + 7, y + 4, 2, 9, "#6c7a89");
  p(x + 5, y + 7, 6, 2, "#9aa7b0");
  p(x + 4, y + 10, 3, 3, "#6c7a89");
  p(x + 9, y + 10, 3, 3, "#6c7a89");
  p(x + 6, y + 3, 4, 2, "#dfe8ef");
  p(x + 7, y + 5, 2, 1, "#fff1b8");
}

function drawAnchorGate(x, y) {
  p(x + 3, y + 3, 3, 12, "#5b351c");
  p(x + 10, y + 3, 3, 12, "#5b351c");
  p(x + 4, y + 6, 8, 2, "#6c7a89");
  p(x + 5, y + 10, 7, 2, "#9aa7b0");
  p(x + 7, y + 7, 3, 3, "#dfe8ef");
  p(x + 8, y + 8, 1, 1, "#101018");
}

function drawCaptainStatue(x, y) {
  p(x + 4, y + 11, 9, 4, "#6c7a89");
  p(x + 5, y + 7, 7, 5, "#9aa7b0");
  p(x + 6, y + 4, 5, 4, "#dfe8ef");
  p(x + 5, y + 3, 7, 2, "#3f4a54");
  p(x + 7, y + 6, 1, 1, "#101018");
  p(x + 10, y + 6, 1, 1, "#101018");
  p(x + 8, y + 9, 2, 2, "#ffd166");
}

function drawGhostCompassStand(x, y, ready) {
  p(x + 3, y + 10, 10, 5, "#6c7a89");
  p(x + 4, y + 6, 8, 5, "#9aa7b0");
  p(x + 5, y + 4, 6, 3, hasWreckItem("Ghost Compass") ? "#94b0c2" : "#4a4650");
  p(x + 7, y + 5, 2, 5, ready ? "#fff1b8" : "#66707d");
  p(x + 5, y + 8, 2, 2, hasWreckItem("Anchor Charm") ? "#dfe8ef" : "#4a4650");
  p(x + 10, y + 8, 2, 2, hasWreckItem("Captain's Token") ? "#ffd166" : "#4a4650");
  if (ready && controlsPulse % 800 < 400) {
    p(x + 2, y + 3, 3, 1, "#fff1b8");
    p(x + 12, y + 4, 2, 1, "#94b0c2");
  }
}

function drawRoyalDock(x, y) {
  p(x + 1, y + 10, 14, 3, "#9b6736");
  p(x + 2, y + 13, 12, 2, "#5b351c");
  p(x + 4, y + 7, 8, 3, "#ffd166");
  p(x + 5, y + 6, 6, 2, "#f4d879");
  p(x + 7, y + 2, 2, 9, "#8f5a2a");
  p(x + 9, y + 3, 5, 5, "#fff1b8");
}

function drawBananaKingGhost(x, y) {
  const bob = Math.floor(frameTime / 420) % 2;
  p(x + 5, y + 7 - bob, 7, 7, "#dfe8ef");
  p(x + 6, y + 4 - bob, 6, 6, "#fff1b8");
  p(x + 5, y + 3 - bob, 8, 2, "#ffd166");
  p(x + 6, y + 2 - bob, 1, 2, "#fff1b8");
  p(x + 10, y + 2 - bob, 1, 2, "#fff1b8");
  p(x + 7, y + 6 - bob, 1, 1, "#101018");
  p(x + 10, y + 6 - bob, 1, 1, "#101018");
  p(x + 6, y + 13 - bob, 2, 2, "#94b0c2");
  p(x + 10, y + 13 - bob, 2, 2, "#94b0c2");
}

function drawRoyalBananaGem(x, y) {
  p(x + 6, y + 5, 5, 7, "#ffd166");
  p(x + 7, y + 4, 3, 2, "#fff1b8");
  p(x + 5, y + 8, 7, 3, "#ffb347");
  p(x + 8, y + 6, 1, 5, "#d8b455");
  if (controlsPulse % 700 < 350) {
    p(x + 4, y + 4, 2, 1, "#fff1b8");
    p(x + 11, y + 3, 1, 2, "#fff1b8");
  }
}

function drawAncientMonkeyStatues(x, y, opened) {
  p(x + 2, y + 8, 5, 7, "#6c7a89");
  p(x + 9, y + 8, 5, 7, "#6c7a89");
  p(x + 3, y + 4, 4, 5, "#9aa7b0");
  p(x + 9, y + 4, 4, 5, "#9aa7b0");
  p(x + 4, y + 5, 1, 1, hasCrownItem("Royal Banana Gem") ? "#ffd166" : "#3f4a54");
  p(x + 10, y + 5, 1, 1, hasCrownItem("Royal Banana Gem") ? "#ffd166" : "#3f4a54");
  p(x + 5, y + 7, 1, 1, "#101018");
  p(x + 11, y + 7, 1, 1, "#101018");
  p(x + 6, y + 2, 4, 2, opened ? "#5b351c" : "#ffd166");
  if (!opened && controlsPulse % 800 < 400) {
    p(x + 7, y + 1, 2, 1, "#fff1b8");
  }
}

function drawThroneVaultDoor(x, y, ready) {
  p(x + 2, y + 4, 12, 11, "#6c7a89");
  p(x + 3, y + 3, 10, 3, "#9aa7b0");
  p(x + 4, y + 7, 8, 7, "#5b351c");
  p(x + 6, y + 5, 4, 3, ready ? "#ffd166" : "#4a4650");
  p(x + 7, y + 9, 2, 4, ready ? "#fff1b8" : "#6c7a89");
  p(x + 11, y + 10, 2, 2, "#ffd166");
  if (ready && controlsPulse % 800 < 400) {
    p(x + 3, y + 2, 2, 1, "#fff1b8");
    p(x + 12, y + 5, 2, 1, "#fff1b8");
  }
}

function drawFinalTreasureChest(x, y, opened) {
  p(x + 3, y + 7, 10, 6, "#ffd166");
  p(x + 2, y + 6, 12, 3, opened ? "#5b351c" : "#f4d879");
  p(x + 7, y + 9, 2, 2, opened ? "#101018" : "#fff1b8");
  p(x + 4, y + 12, 8, 2, "#b8793a");
  if (!opened && controlsPulse % 700 < 350) {
    p(x + 5, y + 5, 6, 1, "#fff1b8");
  }
}

function drawBananaKingThrone(x, y, ready) {
  p(x + 3, y + 10, 10, 5, "#8f5a2a");
  p(x + 4, y + 5, 8, 7, "#b8793a");
  p(x + 5, y + 2, 6, 4, ready ? "#ffd166" : "#6c7a89");
  p(x + 6, y + 1, 1, 2, ready ? "#fff1b8" : "#4a4650");
  p(x + 10, y + 1, 1, 2, ready ? "#fff1b8" : "#4a4650");
  p(x + 6, y + 8, 2, 2, hasCrownItem("Royal Banana Gem") ? "#ffd166" : "#4a4650");
  p(x + 9, y + 8, 2, 2, hasCrownItem("Crown Fragment") ? "#fff1b8" : "#4a4650");
  p(x + 7, y + 11, 3, 2, hasCrownItem("Throne Lever") ? "#9aa7b0" : "#4a4650");
  if (ready && controlsPulse % 800 < 400) {
    p(x + 2, y + 4, 2, 1, "#fff1b8");
    p(x + 12, y + 4, 2, 1, "#ffd166");
  }
}

function drawGoldenEscapeShip(x, y) {
  p(x + 1, y + 10, 14, 3, "#ffd166");
  p(x + 2, y + 13, 12, 2, "#b8793a");
  p(x + 7, y + 2, 2, 10, "#8f5a2a");
  p(x + 9, y + 3, 5, 6, "#fff1b8");
  p(x + 3, y + 7, 5, 3, "#f4d879");
  p(x + 10, y + 8, 3, 2, "#ffb347");
  if (controlsPulse % 700 < 350) {
    p(x + 0, y + 9, 2, 1, "#fff1b8");
    p(x + 14, y + 8, 2, 1, "#fff1b8");
  }
}

// Audio
function initAudio() {
  if (!audio.ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audio.ctx = new AudioContext();
    }
  }
  if (audio.ctx && audio.ctx.state === "suspended" && audio.ctx.resume) {
    audio.ctx.resume();
  }
  syncTitleMusic();
}

function toggleMute() {
  audio.muted = !audio.muted;
  muteButton.textContent = audio.muted ? "Sound Off" : "Sound On";
  if (audio.muted) {
    stopTitleMusic();
    return;
  }
  if (!audio.muted) {
    beep("menu");
  }
  syncTitleMusic();
}

function syncTitleMusic() {
  if (!audio.ctx || audio.muted || state !== STATE.MENU) {
    stopTitleMusic();
    return;
  }
  if (audio.ctx.state === "suspended" && audio.ctx.resume) {
    audio.ctx.resume();
  }
  startTitleMusic();
}

function startTitleMusic() {
  if (audio.titleMusic.osc || !audio.ctx) {
    return;
  }
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = "triangle";
  gain.gain.setValueAtTime(0.024, audio.ctx.currentTime);
  osc.connect(gain);
  gain.connect(audio.ctx.destination);
  audio.titleMusic.osc = osc;
  audio.titleMusic.gain = gain;
  playTitleMusicNote();
  osc.start();
  audio.titleMusic.timer = setInterval(playTitleMusicNote, 220);
}

function playTitleMusicNote() {
  if (!audio.ctx || !audio.titleMusic.osc) {
    return;
  }
  const note = TITLE_MUSIC_NOTES[audio.titleMusic.noteIndex % TITLE_MUSIC_NOTES.length];
  audio.titleMusic.noteIndex += 1;
  const time = audio.ctx.currentTime;
  if (note > 0) {
    audio.titleMusic.osc.frequency.setValueAtTime(note, time);
    audio.titleMusic.gain.gain.cancelScheduledValues(time);
    audio.titleMusic.gain.gain.setValueAtTime(0.024, time);
  } else {
    audio.titleMusic.gain.gain.setValueAtTime(0.001, time);
  }
}

function stopTitleMusic() {
  if (audio.titleMusic.timer) {
    clearInterval(audio.titleMusic.timer);
    audio.titleMusic.timer = null;
  }
  if (audio.titleMusic.osc && audio.ctx) {
    const osc = audio.titleMusic.osc;
    const gain = audio.titleMusic.gain;
    const time = audio.ctx.currentTime;
    gain.gain.cancelScheduledValues(time);
    gain.gain.setValueAtTime(gain.gain.value || 0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.stop(time + 0.1);
  }
  audio.titleMusic.osc = null;
  audio.titleMusic.gain = null;
  audio.titleMusic.noteIndex = 0;
}

function beep(kind) {
  if (audio.muted || !audio.ctx) {
    return;
  }
  const specs = {
    move: [220, 0.035, "square", 0.02],
    menu: [360, 0.045, "square", 0.025],
    start: [520, 0.09, "triangle", 0.04],
    pickup: [740, 0.13, "triangle", 0.05],
    battle: [160, 0.12, "sawtooth", 0.04],
    attack: [300, 0.08, "square", 0.04],
    banana: [880, 0.11, "triangle", 0.05],
    hurt: [120, 0.08, "sawtooth", 0.04],
    victory: [660, 0.2, "triangle", 0.055]
  };
  const [freq, duration, type, volume] = specs[kind] || specs.menu;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audio.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audio.ctx.destination);
  osc.start();
  osc.stop(audio.ctx.currentTime + duration);
}
