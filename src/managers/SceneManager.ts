import { Application, Ticker } from "pixi.js";
import { Scene } from "../scenes/Scene.ts";

export class SceneManager {
  public static app: Application;
  public static currentScene: Scene;

  private constructor() {
  }

  public static initialize(app: Application): void {
    this.app = app;
    this.app.ticker.add(this.update.bind(this));
  }

  public static changeScene(newScene: Scene): void {
    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene);
      this.currentScene.destroy();
    }
    this.currentScene = newScene;
    this.app.stage.addChild(this.currentScene);
    console.log(`Scene changed to: ${newScene.constructor.name}`);
  }

  // fuck this is confusing
  // Adds a scene on top of the current one without destroying it
  public static pushScene(newScene: Scene): void {
    if (this.currentScene) {
      this.currentScene.eventMode = "none"; // disable interaction on the scene below
    }
    this.app.stage.addChild(newScene);
    this.currentScene = newScene; // so the new scene is now the active one
    console.log(`Scene pushed: ${newScene.constructor.name}`);
  }

  // Removes the topmost scene and restores the one below it
  public static popScene(): void {
    if (this.app.stage.children.length > 1) {
      const oldScene = this.app.stage.children.pop() as Scene;
      oldScene.destroy();
      this.currentScene = this.app.stage.getChildAt(
        this.app.stage.children.length - 1,
      ) as Scene;
      this.currentScene.eventMode = "static"; // Reenable interaction
      console.log(
        `Scene popped. Current scene: ${this.currentScene.constructor.name}`,
      );
    }
  }

  public static update(ticker: Ticker): void {
    if (this.currentScene) {
      const deltaSeconds = ticker.deltaMS / 1000;
      this.currentScene.update(deltaSeconds);
    }
  }
}
