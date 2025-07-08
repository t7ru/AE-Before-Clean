import { sound } from "@pixi/sound";

export class AudioManager {
  private static _instance: AudioManager;

  private constructor() {
    // will use soon i think
  }

  public static get instance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }
    return AudioManager._instance;
  }

  public play(alias: string, volume: number = 1): void {
    sound.play(alias, { volume });
  }
}
