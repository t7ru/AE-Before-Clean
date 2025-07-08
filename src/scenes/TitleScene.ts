import { Text, TextStyle, Sprite, Container } from "pixi.js";
import { Scene } from "./Scene";
import { SceneManager } from "../managers/SceneManager";
import { PointAndClickScene } from "./PointAndClickScene";
import { EventHandler } from "../managers/EventHandler";
import { AssetManager } from "../managers/AssetManager";
import { gsap } from "gsap";

export class TitleScene extends Scene {
  private background: Sprite;

  constructor() {
    super();

    this.background = new Sprite(AssetManager.getTexture("nightStationCliff"));
    this.background.anchor.set(0.5);
    this.background.width = 1280;
    this.background.height = 720;
    this.background.position.set(1280 / 2, 720 / 2);
    this.addChild(this.background);

    const uiContainer = new Container();
    this.addChild(uiContainer);

    const titleStyle = new TextStyle({
      fontFamily: "Uni Sans Heavy",
      fontSize: 120,
      fill: "#ffffff",
      stroke: { color: "#000000", width: 8 },
      dropShadow: {
        color: "rgba(0,0,0,0.8)",
        blur: 15,
        distance: 10,
      },
    });
    const titleText = new Text({ text: "ALTER EGO", style: titleStyle });
    titleText.anchor.set(0.5);
    titleText.position.set(1280 / 2, 200);

    const subtitleStyle = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 48,
      fill: "#cccccc",
      stroke: { color: "#000000", width: 4 },
    });
    const subtitleText = new Text({ text: "Before", style: subtitleStyle });
    subtitleText.anchor.set(0.5);
    subtitleText.position.set(1280 / 2, 280);

    const promptStyle = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 28,
      fill: "white",
    });
    const promptText = new Text({ text: "Click to Start", style: promptStyle });
    promptText.anchor.set(0.5);
    promptText.position.set(1280 / 2, 600);

    uiContainer.addChild(titleText, subtitleText, promptText);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", this.startGame, this);

    this.runAnimations(uiContainer, promptText);
  }

  private runAnimations(ui: Container, prompt: Text): void {
    ui.alpha = 0;
    this.background.scale.set(1.1);

    gsap.to(ui, { alpha: 1, duration: 2, ease: "power2.out" });

    gsap.to(this.background.scale, {
      x: 1,
      y: 1,
      duration: 15,
      ease: "sine.inOut",
    });

    gsap.to(prompt, {
      alpha: 0.5,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  private startGame(): void {
    gsap.to(this, {
      alpha: 0,
      duration: 0.5,
      onComplete: () => {
        const pointAndClickScene = new PointAndClickScene("stationSceneData");
        SceneManager.changeScene(pointAndClickScene);
        EventHandler.trigger("startPrologue", pointAndClickScene);
      },
    });
  }

  public update(_delta: number): void {
  }
}
