import { Container, Graphics, ColorMatrixFilter } from "pixi.js";
import { gsap } from "gsap";

export enum IconState {
  Full,
  Half,
  Used,
}

export class TurnIcon extends Container {
  private bg: Graphics;
  private fill: Graphics;
  public state: IconState;
  private isEnemy: boolean;
  private flashTween: gsap.core.Tween | null = null;

  constructor(initialState: IconState, isEnemy: boolean = false) {
    super();
    this.state = initialState;
    this.isEnemy = isEnemy;
    console.log("[TurnIcon] Created. Initial state:", this.state);

    this.bg = new Graphics()
      .circle(0, 0, 12)
      .fill({ color: 0x000000, alpha: 0.5 });

    this.fill = new Graphics();
    this.fill.circle(0, 0, 10).fill(0xffffff);
    this.fill.filters = [new ColorMatrixFilter()];
    (this.fill as any)._tintRGB = 0xffffff;

    this.addChild(this.bg, this.fill);
    this.updateVisuals(false);
  }

  private updateVisuals(animate: boolean): void {
    if (this.flashTween) {
      this.flashTween.kill();
      this.flashTween = null;
    }

    const target = {
      scale: 1.0,
      alpha: 1.0,
      color: this.isEnemy ? 0xff4444 : 0xffff00,
    };

    if (this.state === IconState.Half) {
      target.scale = 0.7;
      this.flashTween = gsap.to(this.fill.filters[0], {
        brightness: 1.5,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    } else if (this.state === IconState.Used) {
      target.alpha = 0.3;
      target.color = 0x888888;
    }

    if (animate) {
      gsap.to(this.fill, {
        pixi: { scale: target.scale, tint: target.color },
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(this.bg, {
        pixi: { alpha: target.alpha },
        duration: 0.3,
      });
    } else {
      this.fill.scale.set(target.scale);
      this.fill.tint = target.color;
      this.bg.alpha = target.alpha;
    }
  }

  public setState(newState: IconState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.updateVisuals(true);
  }

  public animateIn(delay: number): void {
    console.log("[TurnIcon] AnimateIn called. Delay:", delay);
    this.scale.set(0);
    gsap.to(this, {
      pixi: { scale: 1 },
      duration: 0.5,
      delay,
      ease: "back.out(1.7)",
    });
  }
}
