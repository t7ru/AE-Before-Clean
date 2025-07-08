import * as PIXI from "pixi.js";
import { SceneManager } from "./managers/SceneManager";
import { GameManager } from "./managers/GameManager";
import { TitleScene } from "./scenes/TitleScene";
import { AssetManager } from "./managers/AssetManager";
import { EventHandler } from "./managers/EventHandler";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
import { LoadingScene } from "./scenes/LoadingScene";

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

const gameWidth = 1280;
const gameHeight = 720;

const app = new PIXI.Application();

function resizeGame() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const scale = Math.min(screenWidth / gameWidth, screenHeight / gameHeight);

  const newWidth = gameWidth * scale;
  const newHeight = gameHeight * scale;

  if (app.canvas) {
    app.canvas.style.width = `${newWidth}px`;
    app.canvas.style.height = `${newHeight}px`;
  }
}

function checkOrientation() {
  const warningElement = document.getElementById('orientation-warning');
  if (!warningElement) return;

  const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isPortrait = window.innerHeight > window.innerWidth;

  if (isMobile && isPortrait) {
    warningElement.style.display = 'flex';
  } else {
    warningElement.style.display = 'none';
  }
}

async function init() {
  console.log("Initializing game...");
  await document.fonts.load("1em Montserrat");
  await document.fonts.load('1em "Uni Sans Heavy"');
  console.log("Custom fonts loaded.");

  await app.init({
    width: gameWidth,
    height: gameHeight,
    backgroundColor: 0x000000,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.appendChild(app.canvas);
  } else {
    document.body.appendChild(app.canvas);
    console.error("Could not find #game-container, appending to body.");
  }
  console.log("PixiJS Application initialized and canvas appended to body.");

  resizeGame();
  checkOrientation();
  window.addEventListener('resize', () => {
    resizeGame();
    checkOrientation();
  });

  SceneManager.initialize(app);

  const loadingScene = new LoadingScene();
  SceneManager.changeScene(loadingScene);

  // assets list
  const assets = [
    // Scripts
    { alias: "stationSceneData", src: "data/stationScene.json" },
    { alias: "marshlandsSceneData", src: "data/marshlandsScene.json" },
    { alias: "eventData", src: "data/events.json" },
    { alias: "enemyData", src: "enemies/enemies.json" },
    { alias: "prologueScript", src: "data/prologue.json" },
    { alias: "part1Script", src: "data/part1.json" },

    // Backgrounds
    {
      alias: "nightStationDepartTrain",
      src: "background/NightStation/NightStationDepartTrain.png",
    },
    {
      alias: "nightStationAfterDepart",
      src: "background/NightStation/NightStationAfterDepart.png",
    },
    {
      alias: "nightStationPartySelect",
      src: "background/NightStation/NightStationPartySelect.png",
    },
    {
      alias: "nightStationBeforeExit",
      src: "background/NightStation/NightStationBeforeExit.png",
    },
    {
      alias: "nightStationExit",
      src: "background/NightStation/NightStationExit.png",
    },
    {
      alias: "nightStationCliff",
      src: "background/NightStation/NightStationCliff.png",
    },

    {
      alias: "marshlandsCliff",
      src: "background/Marshlands/MarshlandsCliff.png",
    },
    { alias: "marshlands1", src: "background/Marshlands/Marshlands1.png" },
    { alias: "marshlands2", src: "background/Marshlands/Marshlands2.png" },
    { alias: "marshlands3", src: "background/Marshlands/Marshlands3.png" },
    { alias: "marshlands31", src: "background/Marshlands/Marshlands31.png" },
    { alias: "marshlands32", src: "background/Marshlands/Marshlands32.png" },
    { alias: "marshlands4", src: "background/Marshlands/Marshlands4.png" },
    { alias: "marshlands5", src: "background/Marshlands/Marshlands5.png" },
    { alias: "marshlands6", src: "background/Marshlands/Marshlands6.png" },
    { alias: "marshlands7", src: "background/Marshlands/Marshlands7.png" },
    { alias: "marshlands8", src: "background/Marshlands/Marshlands8.png" },
    { alias: "marshlands9", src: "background/Marshlands/Marshlands9.png" },

    // Commander Sprites
    {
      alias: "commanderDefault",
      src: "characters/commander/Commander_Default_Dialogue.png",
    },
    {
      alias: "commanderDefault2",
      src: "characters/commander/Commander_Default_Dialogue_2.png",
    },
    {
      alias: "commanderAggressive",
      src: "characters/commander/Commander_Aggresive.png",
    },
    {
      alias: "commanderDisappointed",
      src: "characters/commander/Commander_Disappointed.png",
    },
    {
      alias: "commanderScarred",
      src: "characters/commander/Commander_Scarred.png",
    },
    {
      alias: "commanderSkeptical",
      src: "characters/commander/Commander_Skeptical.png",
    },
    {
      alias: "commanderSneaky",
      src: "characters/commander/Commander_Sneaky.png",
    },
    {
      alias: "commanderTeaching",
      src: "characters/commander/Commander_Teaching.png",
    },

    // Recruit Portraits
    { alias: "scoutPortrait", src: "characters/scout/Scout_Portrait.png" },
    {
      alias: "toxicGunnerPortrait",
      src: "characters/toxicgunner/ToxicGunner_Portrait.png",
    },
    {
      alias: "pyromancerPortrait",
      src: "characters/pyromancer/Pyromancer_Portrait.png",
    },
    {
      alias: "sledgerPortrait",
      src: "characters/sledger/Sledger_Portrait.png",
    },

    // Scout Sprites
    { alias: "scoutDefault", src: "characters/scout/Scout_Default.png" },
    {
      alias: "toxicGunnerDefault",
      src: "characters/toxicgunner/ToxicGunner_Default.png",
    },

    // Pyromancer Sprites
    {
      alias: "pyromancerDefault",
      src: "characters/pyromancer/Pyromancer_Default.png",
    },

    // Sledger Sprites
    { alias: "sledgerDefault", src: "characters/sledger/Sledger_Default.png" },

    // Enemy Sprites
    { alias: "commanderEgo", src: "enemies/CommanderEgo.png" },

    // Dispatcher Sprites
    {
      alias: "dispatcherAggressive",
      src: "characters/dispatcher/DispatcherAggressive.png",
    },
    {
      alias: "dispatcherDisappointed",
      src: "characters/dispatcher/DispatcherDisappointed.png",
    },
    {
      alias: "dispatcherNeutral",
      src: "characters/dispatcher/DispatcherNeutral.png",
    },
    {
      alias: "dispatcherScared",
      src: "characters/dispatcher/DispatcherScared.png",
    },
    {
      alias: "dispatcherSneaky",
      src: "characters/dispatcher/DispatcherSneaky.png",
    },
    {
      alias: "dispatcherThinking",
      src: "characters/dispatcher/DispatcherThinking.png",
    },
    {
      alias: "dispatcherThinking2",
      src: "characters/dispatcher/DispatcherThinking2.png",
    },

    // Void Caster Sprites
    {
      alias: "voidCasterChallenge",
      src: "characters/voidcaster/VoidCasterChallenge.png",
    },
    {
      alias: "voidCasterCommand",
      src: "characters/voidcaster/VoidCasterCommand.png",
    },
    {
      alias: "voidCasterDepressed",
      src: "characters/voidcaster/VoidCasterDepressed.png",
    },
    {
      alias: "voidCasterFurious",
      src: "characters/voidcaster/VoidCasterFurious.png",
    },
    {
      alias: "voidCasterLaugh",
      src: "characters/voidcaster/VoidCasterLaugh.png",
    },
    {
      alias: "voidCasterReading",
      src: "characters/voidcaster/VoidCasterReading.png",
    },
    {
      alias: "voidCasterSpellCast",
      src: "characters/voidcaster/VoidCasterSpellCast.png",
    },

    // Narrator sprites
    { alias: "narratorTalk", src: "characters/narrator/NarratorTalk.png" },
    { alias: "narratorEvil", src: "characters/narrator/NarratorEvil.png" },
    {
      alias: "narratorSinister",
      src: "characters/narrator/NarratorSinister.png",
    },

    // Misc
    { alias: "circleMark", src: "circlemark_white.gif" }, // New
    { alias: "placeholder", src: "characters/placeholder.png" },

    // Enemies
    { alias: "normal", src: "enemies/Normal.png" },
    { alias: "commanderEgo", src: "enemies/CommanderEgo.png" },

    // Sounds
    { alias: "sfx_cursor", src: "sounds/Btl_system_cursor.wav" },
    { alias: "sfx_confirm", src: "sounds/SE_dialog_sign.wav" },
    { alias: "sfx_victory", src: "sounds/Btl_result_rank.wav" },
    { alias: "sfx_attack", src: "sounds/SE_010_tailattack.wav" },
    { alias: "sfx_gun_single", src: "sounds/SE_B000_firing_single.wav" },
    { alias: "sfx_ego_damage", src: "sounds/SE_CBOS_damage.wav" },
    { alias: "sfx_ego_death", src: "sounds/SE_CBOS_dying.wav" },
    { alias: "sfx_death", src: "sounds/SE_CBOS_kemuri_haki.wav" },
    { alias: "sfx_call_to_arms_1", src: "sounds/CommanderRework1.wav" },
    { alias: "sfx_call_to_arms_2", src: "sounds/CommanderRework2.wav" },
    { alias: "sfx_call_to_arms_3", src: "sounds/CommanderRework3.wav" },
    { alias: "sfx_menu_ability", src: "sounds/Menu_shop_ability.wav" },
    { alias: "sfx_recruit", src: "sounds/EV_se_timer.wav" },
    { alias: "sfx_decline", src: "sounds/EV_se_timer_disappear.wav" },
    { alias: "sfx_cancel", src: "sounds/Menu_Mscratch.wav" },
  ];
  console.log(`Defined ${assets.length} assets. Starting load...`);

  try {
    const onProgress = (progress: number) => {
      loadingScene.updateProgress(progress);
    };

    const loadedAssets = await PIXI.Assets.load(
      assets.map((a) => ({ alias: a.alias, src: a.src })),
      onProgress,
    );
    console.log("All assets loaded successfully via Pixi.");

    for (const asset of assets) {
      AssetManager.add(asset.alias, loadedAssets[asset.alias]);
    }
    console.log("All assets stored in AssetManager.");

    EventHandler.initialize();
    console.log("EventHandler initialized.");
    GameManager.instance.initializeParty();
    console.log("GameManager party initialized.");

    console.log("Changing to TitleScene...");
    SceneManager.changeScene(new TitleScene());
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}

init();
