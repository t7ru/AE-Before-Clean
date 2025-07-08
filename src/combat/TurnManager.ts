import { Container } from "pixi.js";
import { IconState, TurnIcon } from "../ui/TurnIcon";
import { gsap } from "gsap";

export enum TurnResult {
  Normal,
  Weakness, // or crit
  Resist,
  Miss,
  Pass,
}

export class TurnManager extends Container {
  private icons: TurnIcon[] = [];
  private isEnemy: boolean;

  constructor(isEnemy: boolean = false) {
    super();
    this.isEnemy = isEnemy;
  }

  public startTurn(partySize: number): void {
    console.log(`[TurnManager] Starting turn with ${partySize} icons.`);
    this.removeChildren();
    this.icons = [];
    for (let i = 0; i < partySize; i++) {
      const icon = new TurnIcon(IconState.Full, this.isEnemy);
      this.icons.push(icon);
      this.addChild(icon);
      icon.animateIn(i * 0.05);
    }
    this.layoutIcons();
  }

  private layoutIcons(): void {
    let currentX = 0;
    this.icons.forEach((icon) => {
      icon.x = currentX;
      currentX += -30;
      currentX += -30;
    });
  }

  public consumeTurn(result: TurnResult): void {
    let iconToUpdate: TurnIcon | undefined;

    if (result === TurnResult.Weakness) {
      iconToUpdate = this.icons.find((icon) => icon.state === IconState.Full);
      if (iconToUpdate) {
        iconToUpdate.setState(IconState.Half);
      }
      else {
        iconToUpdate = this.icons.find((icon) => icon.state === IconState.Half);
        if (iconToUpdate) {
          iconToUpdate.setState(IconState.Used);
        }
      }
      this.reorderIcons();
      return;
    }

    if (result === TurnResult.Miss) {
      for (let i = 0; i < 4; i++) {
        let halfIcon = this.icons.find((icon) => icon.state === IconState.Half);
        if (halfIcon) {
          halfIcon.setState(IconState.Used);
        } else {
          let fullIcon = this.icons.find(
            (icon) => icon.state === IconState.Full,
          );
          if (fullIcon) {
            fullIcon.setState(IconState.Used);
          } else {
            break; // No more turns to consume
          }
        }
      }
      this.reorderIcons();
      return;
    }

    if (result === TurnResult.Pass) {
      iconToUpdate = this.icons.find((icon) => icon.state === IconState.Full);
      if (iconToUpdate) {
        iconToUpdate.setState(IconState.Half);
      } else {
        iconToUpdate = this.icons.find((icon) => icon.state === IconState.Half);
        if (iconToUpdate) {
          iconToUpdate.setState(IconState.Used);
        }
      }
      this.reorderIcons();
      return;
    }

    iconToUpdate = this.icons.find((icon) => icon.state === IconState.Half);
    if (!iconToUpdate) {
      iconToUpdate = this.icons.find((icon) => icon.state === IconState.Full);
    }

    if (iconToUpdate) {
      iconToUpdate.setState(IconState.Used);
    }

    if (!iconToUpdate) {
      console.log("[TurnManager] No turns left to consume.");
      return; // No turns left
    }

    this.reorderIcons();
  }

  private reorderIcons(): void {
    this.icons.sort((a, b) => a.state - b.state);
    this.icons.forEach((icon, index) => {
      this.setChildIndex(icon, index); // Reorder visually
      gsap.to(icon, { x: -index * 30, duration: 0.4, ease: "power2.out" });
    });
  }

  public addHalfTurns(count: number): void {
    for (let i = 0; i < count; i++) {
      const icon = new TurnIcon(IconState.Half, this.isEnemy);
      this.icons.push(icon);
      this.addChild(icon);
      icon.animateIn(i * 0.05);
    }
    this.reorderIcons();
  }

  public hasTurns(): boolean {
    return this.icons.some((icon) => icon.state !== IconState.Used);
  }

  public getTurnCount(): number {
    return this.icons.filter((icon) => icon.state !== IconState.Used).length;
  }
}
