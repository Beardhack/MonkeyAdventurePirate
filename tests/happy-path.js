"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function makeCanvasContext() {
  return {
    imageSmoothingEnabled: false,
    fillStyle: "#000",
    font: "",
    clearRect() {},
    fillRect() {},
    fillText() {},
    measureText(text) {
      return { width: String(text).length * 6 };
    }
  };
}

function makeElement(id) {
  return {
    id,
    textContent: "",
    dataset: {},
    classList: { toggle() {} },
    addEventListener() {},
    setPointerCapture() {}
  };
}

function makeHarnessContext() {
  const elements = new Map();
  const canvas = makeElement("game");
  canvas.width = 384;
  canvas.height = 256;
  canvas.getContext = () => makeCanvasContext();
  elements.set("game", canvas);
  elements.set("muteButton", makeElement("muteButton"));
  [
    "hudOverlay",
    "hudHp",
    "hudBananas",
    "hudParts",
    "hudMap",
    "hudPartList",
    "hudObjective"
  ].forEach((id) => {
    elements.set(id, makeElement(id));
  });

  const context = {
    console,
    document: {
      getElementById(id) {
        if (!elements.has(id)) {
          elements.set(id, makeElement(id));
        }
        return elements.get(id);
      },
      querySelectorAll() {
        return [];
      }
    },
    window: {
      addEventListener() {},
      AudioContext: null,
      webkitAudioContext: null
    },
    requestAnimationFrame() {}
  };
  context.__elements = elements;
  context.globalThis = context;
  vm.createContext(context);
  return context;
}

function loadGame() {
  const context = makeHarnessContext();
  vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8"), context, { filename: "data.js" });
  vm.runInContext(fs.readFileSync(path.join(root, "game.js"), "utf8"), context, { filename: "game.js" });
  return context;
}

const context = loadGame();

function run(code) {
  return vm.runInContext(code, context);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertMap(expected, label) {
  const actual = run("game.currentMap");
  assert(actual === expected, `${label}: expected ${expected}, got ${actual}`);
}

function hudText(id) {
  return context.__elements.get(id).textContent;
}

function refreshHud() {
  run("updateHudOverlay(true)");
}

function pathExists(mapName, start, target) {
  return run(`(() => {
    const previousMap = game.currentMap;
    game.currentMap = ${JSON.stringify(mapName)};
    const queue = [[${start[0]}, ${start[1]}]];
    const seen = new Set([${JSON.stringify(`${start[0]},${start[1]}`)}]);
    while (queue.length > 0) {
      const [x, y] = queue.shift();
      if (x === ${target[0]} && y === ${target[1]}) {
        game.currentMap = previousMap;
        return true;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        const key = nx + "," + ny;
        if (seen.has(key) || isBlocked(nx, ny, false)) {
          continue;
        }
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
    game.currentMap = previousMap;
    return false;
  })()`);
}

function drainDialogue() {
  for (let i = 0; i < 30; i += 1) {
    if (run("state") !== run("STATE.DIALOGUE")) {
      return;
    }
    run("advanceDialogue()");
  }
  throw new Error("Dialogue did not drain");
}

function interactAt(map, x, y, fx = 0, fy = -1) {
  run(`enterMap(${JSON.stringify(map)}, ${x}, ${y}, ${fx}, ${fy}); state = STATE.EXPLORE;`);
  run("interact()");
  drainDialogue();
}

function playThroughLevel10Victory() {
  run("startNewRun(); state = STATE.EXPLORE;");
  refreshHud();
  assert(hudText("hudParts") === "Inventory 0", "HUD should start with an empty inventory count");
  assert(hudText("hudPartList") === "Inventory: Empty", "HUD should start with an empty inventory list");

  interactAt("island", 8, 19);
  refreshHud();
  assert(hudText("hudParts") === "Inventory 1", "HUD should count active inventory");
  assert(hudText("hudPartList").includes("Sail Cloth"), "HUD should list active inventory items");
  interactAt("island", 5, 15);
  interactAt("island", 24, 6);
  interactAt("cave", 8, 5);
  interactAt("cave", 8, 9, 0, 1);
  interactAt("island", 27, 17);
  assertMap("atoll", "route to Level 2");
  refreshHud();
  assert(hudText("hudParts") === "Inventory 0", "HUD should clear spent raft items");
  assert(hudText("hudPartList") === "Inventory: Empty", "HUD should hide spent raft items");

  interactAt("atoll", 6, 7);
  interactAt("atoll", 8, 13);
  interactAt("atoll", 18, 6);
  assertMap("reef", "route to Level 3");

  interactAt("reef", 6, 15);
  interactAt("reef", 9, 13);
  interactAt("reef", 14, 10);
  interactAt("reef", 18, 7);
  interactAt("shipHold", 7, 5);
  interactAt("shipHold", 7, 9, 0, 1);
  interactAt("reef", 22, 6);
  assertMap("volcano", "route to Level 4");
  assert(
    pathExists("volcano", [3, 14], [16, 9]) === false,
    "second volcano mango should be blocked before cooling the steam vent"
  );

  interactAt("volcano", 7, 14);
  interactAt("volcano", 14, 11);
  assert(
    pathExists("volcano", [3, 14], [16, 9]) === true,
    "second volcano mango should be reachable after cooling the steam vent"
  );
  assert(
    pathExists("volcano", [3, 14], [22, 6]) === false,
    "volcano altar path should still be blocked by the second mango tree"
  );
  refreshHud();
  assert(!hudText("hudPartList").includes("Cool Mango"), "HUD should remove the mango consumed by the steam vent");
  interactAt("volcano", 16, 9);
  assert(
    pathExists("volcano", [3, 14], [22, 6]) === true,
    "volcano altar path should open after picking the second mango tree"
  );
  refreshHud();
  assert(hudText("hudPartList").includes("Cool Mango"), "HUD should show the second mango for the altar");
  interactAt("volcano", 12, 10);
  interactAt("volcano", 18, 7);
  interactAt("volcano", 22, 6);
  assertMap("cove", "route to Level 5");

  interactAt("cove", 7, 14);
  interactAt("cove", 10, 13);
  interactAt("cove", 13, 9);
  interactAt("storehouse", 7, 5);
  interactAt("storehouse", 7, 9, 0, 1);
  interactAt("cove", 18, 9);
  interactAt("cove", 24, 6);
  assertMap("mangrove", "route to Level 6");

  interactAt("mangrove", 9, 12);
  interactAt("mangrove", 15, 8);
  interactAt("moonGrotto", 7, 5);
  interactAt("moonGrotto", 7, 9, 0, 1);
  interactAt("mangrove", 2, 15);
  assertMap("cove", "backtrack Level 6 to Level 5");
  interactAt("cove", 13, 9);
  interactAt("storehouse", 11, 9);
  interactAt("storehouse", 7, 9, 0, 1);
  interactAt("cove", 24, 6);
  assertMap("mangrove", "return to Level 6");
  interactAt("mangrove", 24, 6);
  assertMap("stormglass", "route to Level 7");

  interactAt("stormglass", 9, 9);
  interactAt("stormglass", 16, 13);
  interactAt("stormglass", 21, 7);
  interactAt("stormglass", 24, 6);
  assertMap("dunes", "route to Level 8");

  interactAt("dunes", 9, 12);
  interactAt("dunes", 15, 9);
  interactAt("dunes", 20, 13);
  interactAt("dunes", 24, 6);
  assertMap("wreckyard", "route to Level 9");

  interactAt("wreckyard", 9, 9);
  interactAt("wreckyard", 15, 13);
  interactAt("wreckyard", 18, 9);
  interactAt("wreckyard", 22, 6);
  interactAt("wreckyard", 24, 6);
  assertMap("crownRuins", "route to Level 10");
  assert(run("state") !== run("STATE.VICTORY"), "Level 9 should not trigger victory");

  interactAt("crownRuins", 3, 14, -1, 0);
  assertMap("wreckyard", "backtrack Level 10 to Level 9");
  interactAt("wreckyard", 23, 5, 1, 0);
  assertMap("crownRuins", "return Level 9 to Level 10");

  interactAt("crownRuins", 9, 9);
  interactAt("crownRuins", 14, 10);
  interactAt("crownRuins", 7, 14);
  interactAt("crownRuins", 24, 6);
  assertMap("throneVault", "enter Throne Vault");
  interactAt("throneVault", 5, 6);
  refreshHud();
  assert(hudText("hudPartList").includes("Crown Fragment"), "HUD should list currently carried late-game items");
  interactAt("throneVault", 7, 4);
  assert(run("state") === run("STATE.VICTORY"), "Level 10 throne should trigger victory");
  assert(run("game.crownReassembled") === true, "crownReassembled flag should be true");
  refreshHud();
  assert(hudText("hudParts") === "Inventory 0", "HUD should clear final crown relics after victory");
  assert(hudText("hudPartList") === "Inventory: Empty", "HUD should hide spent final crown relics");
  assert(
    run("game.interactables.find((item) => item.id === 'goldenEscapeShip').active") === true,
    "golden escape ship should be revealed"
  );
}

function verifyRestartReset() {
  run("startNewRun(); state = STATE.EXPLORE;");
  assertMap("island", "restart map reset");

  ["Royal Banana Gem", "Throne Lever", "Crown Fragment"].forEach((item) => {
    assert(run(`game.inventory[${JSON.stringify(item)}]`) === false, `restart should clear ${item}`);
  });

  ["royalCrabGuard", "crownSnake", "treasureBat"].forEach((id) => {
    assert(
      run(`game.enemies.find((enemy) => enemy.id === ${JSON.stringify(id)}).active`) === true,
      `restart should reactivate ${id}`
    );
  });

  ["royalBananaGem", "ancientMonkeyStatues", "throneVaultDoor", "finalTreasureChest"].forEach((id) => {
    assert(
      run(`game.interactables.find((item) => item.id === ${JSON.stringify(id)}).active !== false`) === true,
      `restart should reset ${id}`
    );
  });

  assert(
    run("game.interactables.find((item) => item.id === 'finalTreasureChest').opened") !== true,
    "restart should close final treasure chest"
  );
  assert(
    run("game.interactables.find((item) => item.id === 'goldenEscapeShip').active") === false,
    "restart should hide golden escape ship"
  );

  ["wreckCompassRestored", "royalStatuesOpened", "throneVaultOpened", "crownReassembled"].forEach((flag) => {
    assert(run(`game[${JSON.stringify(flag)}]`) === false, `restart should reset ${flag}`);
  });
  assert(run("Object.values(game.spentInventory).every((spent) => spent === false)") === true, "restart should clear spent inventory state");
}

playThroughLevel10Victory();
verifyRestartReset();

console.log("split-load happy path Level 1 -> Level 10 victory passed");
console.log("adjacent Level 9 <-> Level 10 backtracking passed");
console.log("restart reset checks for Level 10 passed");
