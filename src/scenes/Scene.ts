import { Container } from "pixi.js";

// This method is called by the SceneManager on every frame
export abstract class Scene extends Container {
  public abstract update(delta: number): void;
}
