import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { Combatant } from "../combat/Combatant";
import { gsap } from "gsap";

export class StatusDisplay extends Container {
  public readonly combatant: Combatant;
  private hpBar: Graphics;
  private spBar: Graphics;
  private hpText: Text;
  private spText: Text;
  private ammoText: Text;
  private statusIconContainer: Container;
  private nameText: Text;
  private highlightTween: gsap.core.Tween | null = null;

  private readonly barWidth = 220;
  private readonly barHeight = 20;

  constructor(combatant: Combatant) {
    super();
    this.combatant = combatant;

    const bg = new Graphics()
      .roundRect(0, 0, 240, 85, 10)
      .fill({ color: 0x1a1a2e, alpha: 0.85 });
    this.addChild(bg);

    const nameStyle = new TextStyle({
      fill: "#e0e0ff",
      fontSize: 20,
      fontWeight: "bold",
      fontFamily: "Montserrat",
    });
    this.nameText = new Text({ text: this.combatant.name, style: nameStyle });
    this.nameText.position.set(10, 5);
    this.addChild(this.nameText);

    this.statusIconContainer = new Container();
    this.statusIconContainer.position.set(
      this.nameText.x + this.nameText.width + 10,
      8,
    );
    this.addChild(this.statusIconContainer);

    const barTextStyle = new TextStyle({
      fill: "white",
      fontSize: 12,
      fontFamily: "Montserrat",
      fontWeight: "600",
      stroke: { color: "black", width: 2 },
    });

    // HP Bar
    const hpBarY = 35;
    const hpBarBg = new Graphics()
      .roundRect(0, 0, this.barWidth, this.barHeight, 5)
      .fill(0x101020);
    hpBarBg.position.set(10, hpBarY);
    this.addChild(hpBarBg);
    this.hpBar = new Graphics();
    this.hpBar.roundRect(0, 0, this.barWidth, this.barHeight, 5).fill(0x44ff88); // Draw green HP bar
    this.hpBar.position.set(10, hpBarY);
    this.addChild(this.hpBar);
    this.hpText = new Text({ text: "", style: barTextStyle });
    this.hpText.anchor.set(0, 0.5); // Align to the left
    this.hpText.position.set(15, hpBarY + this.barHeight / 2); // Position inside the bar, on the left
    this.addChild(this.hpText);

    // SP Bar
    const spBarY = 60;
    const spBarBg = new Graphics()
      .roundRect(0, 0, this.barWidth, this.barHeight, 5)
      .fill(0x101020);
    spBarBg.position.set(10, spBarY);
    this.addChild(spBarBg);
    this.spBar = new Graphics();
    this.spBar.roundRect(0, 0, this.barWidth, this.barHeight, 5).fill(0x6688ff); // Draw blue SP bar
    this.spBar.position.set(10, spBarY);
    this.addChild(this.spBar);
    this.spText = new Text({ text: "", style: barTextStyle });
    this.spText.anchor.set(0, 0.5); // Align to the left
    this.spText.position.set(15, spBarY + this.barHeight / 2); // Position inside the bar, on the left
    this.addChild(this.spText);

    // Ammo
    this.ammoText = new Text({
      text: "",
      style: { ...barTextStyle, fill: "#ffcc66" },
    });
    this.ammoText.anchor.set(0, 0.5);
    this.ammoText.position.set(15, spBarY + this.barHeight + 15);
    this.addChild(this.ammoText);

    this.update();
  }

  public setHighlighted(isHighlighted: boolean): void {
    if (this.highlightTween) {
      this.highlightTween.kill();
      this.highlightTween = null;
    }
    this.nameText.alpha = 1.0;
    this.nameText.style.fill = "#e0e0ff";

    if (isHighlighted) {
      this.nameText.style.fill = "#ffffaa";
      this.highlightTween = gsap.to(this.nameText, {
        alpha: 0.7,
        duration: 0.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }
  }

  public update(): void {
    const hpPercent = this.combatant.hp / this.combatant.maxHp;
    const spPercent = this.combatant.sp / this.combatant.maxSp;

    gsap.to(this.hpBar.scale, {
      x: hpPercent,
      duration: 0.5,
      ease: "power2.out",
    });
    gsap.to(this.spBar.scale, {
      x: spPercent,
      duration: 0.5,
      ease: "power2.out",
    });

    this.hpText.text = `HP: ${this.combatant.hp} / ${this.combatant.maxHp}`;
    this.spText.text = `SP: ${this.combatant.sp} / ${this.combatant.maxSp}`;

    if (this.combatant.usesAmmo) {
      this.ammoText.text = `Ammo: ${this.combatant.ammo}`;
      this.ammoText.visible = true;
    } else {
      this.ammoText.visible = false;
    }

    this.updateStatusIcons();
  }

  private updateStatusIcons(): void {
    this.statusIconContainer.removeChildren();
    let iconX = 0;
    this.combatant.statusEffects.forEach((_properties, effect) => {
      const icon = new Graphics();
      let color = 0xffffff;
      let text = "?";

      switch (effect) {
        case "burn":
          color = 0xff6600;
          text = "B";
          break;
        case "freeze":
          color = 0x00aaff;
          text = "F";
          break;
        case "toxic":
          color = 0x00e64d;
          text = "T";
          break;
        case "ice_armor":
          color = 0xadd8e6;
          text = "S";
          break;
        case "charged":
          color = 0xffff00;
          text = "C";
          break;
      }

      icon.circle(0, 0, 10).fill(color);
      const iconText = new Text({
        text,
        style: { fill: "black", fontSize: 14, fontWeight: "bold" },
      });
      iconText.anchor.set(0.5);
      icon.addChild(iconText);

      icon.x = iconX;
      this.statusIconContainer.addChild(icon);
      iconX += 25;
    });
  }
}
