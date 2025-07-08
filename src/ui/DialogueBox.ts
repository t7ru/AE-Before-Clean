import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class DialogueBox extends Container {
  private nameText: Text;
  private dialogueText: Text;

  private fullText: string = "";
  private revealedText: string = "";
  private characterIndex: number = 0;

  private isAnimating: boolean = false;
  private animationTimer: number = 0;
  private readonly animationSpeed: number = 40; // typewriter effect
  private isSliding: boolean = false;
  private targetY: number = 550;

  constructor() {
    super();

    const boxWidth = 1240;
    const boxHeight = 150;
    const boxX = 20;

    const box = new Graphics()
      .roundRect(0, 0, boxWidth, boxHeight, 8)
      .fill({ color: 0x000033, alpha: 0.8 })
      .stroke({ width: 2, color: 0x9999ff });
    this.addChild(box);

    const nameStyle = new TextStyle({
      fontFamily: "Uni Sans Heavy",
      fontSize: 24,
      fill: "white",
    });
    this.nameText = new Text({ text: "", style: nameStyle });
    this.nameText.position.set(20, 10);
    box.addChild(this.nameText);

    const dialogueStyle = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 20,
      fill: "white",
      wordWrap: true,
      wordWrapWidth: boxWidth - 40,
    });
    this.dialogueText = new Text({ text: "", style: dialogueStyle });
    this.dialogueText.position.set(20, 50);
    box.addChild(this.dialogueText);

    this.position.set(boxX, this.targetY);
  }

  public showDialogue(name: string, text: string): void {
    this.nameText.text = name;
    this.fullText = text;
    this.revealedText = "";
    this.characterIndex = 0;
    this.dialogueText.text = "";
    this.isAnimating = true;
  }

  /**
   * Starts the slide-in animation for the dialogue box.
   */
  public slideIn(): void {
    this.y = 720;
    this.isSliding = true;
  }

  public isFinished(): boolean {
    return this.characterIndex >= this.fullText.length;
  }

  public revealAll(): void {
    this.revealedText = this.fullText;
    this.dialogueText.text = this.revealedText;
    this.characterIndex = this.fullText.length;
  }

  public update(delta: number): void {
    if (this.isSliding) {
      this.y -= (this.y - this.targetY) * 0.1;
      if (Math.abs(this.y - this.targetY) < 1) {
        this.y = this.targetY;
        this.isSliding = false;
      }
    }

    if (!this.isAnimating) return;

    this.animationTimer += delta;
    if (this.animationTimer >= this.animationSpeed) {
      this.animationTimer = 0;
      this.characterIndex++;
      this.revealedText = this.fullText.substring(0, this.characterIndex);
      this.dialogueText.text = this.revealedText;

      if (this.characterIndex >= this.fullText.length) {
        this.isAnimating = false;
      }
    }
  }
}
