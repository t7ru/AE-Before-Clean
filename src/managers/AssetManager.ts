import { Texture } from "pixi.js";

export class AssetManager {
  private static assets: Map<string, any> = new Map();

  public static add(alias: string, asset: any): void {
    this.assets.set(alias, asset);
  }

  public static get(alias: string): any {
    const asset = this.assets.get(alias);
    if (!asset) {
      console.error(`Asset with alias "${alias}" not found in AssetManager.`);
    }
    return asset;
  }

  public static getTexture(alias: string): Texture {
    const texture = this.assets.get(alias);
    if (!texture) {
      console.error(`Texture with alias "${alias}" not found in AssetManager.`);
      return Texture.EMPTY;
    }
    return texture;
  }
}
