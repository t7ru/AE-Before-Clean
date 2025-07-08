import { Sprite } from "pixi.js";
import { Scene } from "./Scene";
import { DialogueBox } from "../ui/DialogueBox";
import { AudioManager } from "../managers/AudioManager";
import { AssetManager } from "../managers/AssetManager";

export interface DialogueLine {
  character: string;
  text: string;
  sprite?: string;
  background?: string;
}

export class DialogueScene extends Scene {
  private dialogueBox: DialogueBox;
  private currentLine = 0;
  private script: DialogueLine[];
  private background: Sprite;
  private characterSprite: Sprite;
  private onComplete: () => void;

  constructor(script: DialogueLine[], onComplete: () => void) {
    super();

    this.script = script;
    this.onComplete = onComplete;

    // bg
    this.background = new Sprite();
    this.background.width = 1280;
    this.background.height = 720;
    this.addChild(this.background);

    // char
    this.characterSprite = new Sprite();
    this.characterSprite.anchor.set(0.5, 1); // Anchor at botcenter
    this.characterSprite.position.set(320, 550);
    this.addChild(this.characterSprite);

    // UI
    this.dialogueBox = new DialogueBox();
    this.dialogueBox.slideIn();
    this.addChild(this.dialogueBox);

    setTimeout(() => this.showNextLine(), 0);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", this.onAdvanceDialogue, this);
  }

  private onAdvanceDialogue(): void {
    if (!this.dialogueBox.isFinished()) {
      this.dialogueBox.revealAll();
      return;
    }

    AudioManager.instance.play("sfx_cursor");
    this.currentLine++;
    if (this.currentLine < this.script.length) {
      this.showNextLine();
    } else {
      this.onComplete();
    }
  }

  private showNextLine(): void {
    const line = this.script[this.currentLine];

    if (line.background) {
      this.background.texture = AssetManager.getTexture(line.background);
    }

    if (line.sprite) {
      this.characterSprite.texture = AssetManager.getTexture(line.sprite);

      const targetHeight = 400;
      const scale = targetHeight / this.characterSprite.texture.height;
      this.characterSprite.scale.set(scale);

      this.characterSprite.visible = true;
    } else {
      this.characterSprite.visible = false;
    }

    this.dialogueBox.showDialogue(line.character, line.text);
  }

  public update(delta: number): void {
    const deltaMS = delta * 1000;
    this.dialogueBox.update(deltaMS);
  }
}
