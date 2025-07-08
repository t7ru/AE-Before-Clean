import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { Combatant, Skill } from "../combat/Combatant";
import { StatusDisplay } from "./StatusDisplay";
import { TurnManager } from "../combat/TurnManager";
import { AudioManager } from "../managers/AudioManager";
import { gsap } from "gsap";

export class CombatUI extends Container {
  public commandMenu: Container;
  public skillMenu: Container;
  public partyTargetMenu: Container;
  public enemyTargetMenu: Container;
  public logText: Text;
  public turnManager: TurnManager;
  public enemyTurnManager: TurnManager;
  public partyStatusDisplays: StatusDisplay[] = [];
  private enemyStatusDisplays: StatusDisplay[] = [];
  private descriptionBox: Container;
  private descriptionText: Text;
  private commandDescriptions: Map<string, string>;

  constructor(party: Combatant[], enemies: Combatant[]) {
    super();

    // main commands
    this.commandDescriptions = new Map([
      ["attack", "A standard physical attack against one foe."],
      [
        "gun",
        "A powerful shot that consumes ammo. Effective against normal foes.",
      ],
      ["skill", "Use a special ability that consumes SP or HP."],
      [
        "pass",
        "End this character's action but gain a half-turn icon for later.",
      ],
    ]);

    // Main UI Panel
    const bottomPanel = new Graphics()
      .moveTo(0, 720)
      .lineTo(1280, 720)
      .lineTo(1280, 500)
      .bezierCurveTo(1280, 490, 1200, 490, 1180, 490)
      .lineTo(100, 490)
      .bezierCurveTo(0, 490, 0, 500, 0, 510)
      .closePath()
      .fill({ color: 0x0a0a1a, alpha: 0.9 });
    this.addChild(bottomPanel);

    // Player Party Status
    const startX = 40;
    party.forEach((member, index) => {
      const statusDisplay = new StatusDisplay(member);
      statusDisplay.position.set(startX + index * 260, 540);
      this.addChild(statusDisplay);
      this.partyStatusDisplays.push(statusDisplay);
    });

    // Enemy Status
    enemies.forEach((enemy, index) => {
      const enemyStatus = new StatusDisplay(enemy);
      enemyStatus.position.set(20 + index * 260, 20);
      this.addChild(enemyStatus);
      this.enemyStatusDisplays.push(enemyStatus);
    });

    // Description Box
    this.descriptionBox = new Container();
    this.descriptionBox.position.set(40, 520);
    const descBg = new Graphics()
      .roundRect(0, 0, 250, 180, 8)
      .fill({ color: 0x1a1a2e, alpha: 0.9 });
    descBg.stroke({ width: 1, color: 0x8888ff });
    this.descriptionBox.addChild(descBg);

    const descTitleStyle = new TextStyle({
      fill: "#e0e0ff",
      fontSize: 18,
      fontWeight: "bold",
      fontFamily: "Montserrat",
    });
    const descTitle = new Text({ text: "Description", style: descTitleStyle });
    descTitle.position.set(10, 10);
    this.descriptionBox.addChild(descTitle);

    const descTextStyle = new TextStyle({
      fill: "white",
      fontSize: 16,
      wordWrap: true,
      wordWrapWidth: 230,
      fontFamily: "Montserrat",
    });
    this.descriptionText = new Text({ text: "", style: descTextStyle });
    this.descriptionText.position.set(10, 40);
    this.descriptionBox.addChild(this.descriptionText);
    this.descriptionBox.visible = false;
    this.addChild(this.descriptionBox);

    // Command Menu
    this.commandMenu = new Container();
    this.commandMenu.position.set(1020, 520);
    this.addChild(this.commandMenu);
    this.createCommandMenu();

    // Skill & Target Menus
    this.skillMenu = new Container();
    this.skillMenu.position.set(680, 520);
    this.skillMenu.visible = false;
    this.addChild(this.skillMenu);

    this.partyTargetMenu = new Container();
    this.partyTargetMenu.position.set(680, 520);
    this.partyTargetMenu.visible = false;
    this.addChild(this.partyTargetMenu);

    this.enemyTargetMenu = new Container();
    this.enemyTargetMenu.position.set(680, 520);
    this.enemyTargetMenu.visible = false;
    this.addChild(this.enemyTargetMenu);

    // Log Text
    this.logText = new Text({
      text: "Battle Start!",
      style: {
        fill: "white",
        fontSize: 24,
        fontFamily: "Montserrat",
        align: "right",
      },
    });
    this.logText.position.set(20, 450);
    this.addChild(this.logText);

    // Turn icons
    this.turnManager = new TurnManager(false);
    this.turnManager.position.set(1240, 40);
    this.addChild(this.turnManager);

    this.enemyTurnManager = new TurnManager(true);
    this.enemyTurnManager.position.set(1240, 40);
    this.enemyTurnManager.visible = false;
    this.addChild(this.enemyTurnManager);
  }

  public highlightPartyMember(activeCombatant: Combatant | null): void {
    this.partyStatusDisplays.forEach((display) => {
      const isTarget = display.combatant === activeCombatant;
      display.setHighlighted(isTarget);
    });
  }

  private createStyledButton(
    text: string,
    width: number,
    height: number,
  ): Container {
    const button = new Container();
    const style = new TextStyle({
      fill: "#c0c0ff",
      fontSize: 24,
      fontFamily: "Montserrat",
      align: "center",
    });
    const textObj = new Text({ text, style });
    textObj.anchor.set(0.5);
    textObj.position.set(width / 2, height / 2);

    const bg = new Graphics()
      .roundRect(0, 0, width, height, 8)
      .fill({ color: 0x2a2a4e, alpha: 0.9 });
    bg.stroke({ width: 1, color: 0x8888ff });

    button.addChild(bg, textObj);
    button.eventMode = "static";
    button.cursor = "pointer";

    button.on("pointerover", () => {
      bg.tint = 0xaaaaff;
      textObj.style.fill = "#ffffff";
    });
    button.on("pointerout", () => {
      bg.tint = 0xffffff;
      textObj.style.fill = "#c0c0ff";
    });

    return button;
  }

  private createCommandMenu(): void {
    this.commandMenu.removeChildren();
    const commands = ["Attack", "Gun", "Skill", "Pass"];

    commands.forEach((cmd, i) => {
      const btn = this.createStyledButton(cmd, 220, 40);
      btn.position.set(0, i * 45);

      const cmdKey = cmd.toLowerCase();
      btn.on("pointerover", () => {
        this.descriptionText.text = this.commandDescriptions.get(cmdKey) || "";
        this.descriptionBox.visible = true;
      });
      btn.on("pointerout", () => {
        this.descriptionBox.visible = false;
      });

      btn.on("pointerdown", () => {
        AudioManager.instance.play("sfx_confirm");
        this.emit("command", cmdKey);
      });
      this.commandMenu.addChild(btn);
    });
  }

  public createSkillMenu(skills: Skill[]): void {
    this.skillMenu.removeChildren();
    const bg = new Graphics()
      .roundRect(0, 0, 320, 180, 8)
      .fill({ color: 0x1a1a2e, alpha: 0.9 });
    this.skillMenu.addChild(bg);

    skills.forEach((skill, index) => {
      let costText = "";
      if (skill.cost > 0) {
        const resource = skill.costType === "hp" ? "HP" : "SP";
        costText = `(${skill.cost} ${resource})`;
      }
      const btnText = `${skill.name} ${costText}`.trim();
      const btn = this.createStyledButton(btnText, 300, 35);
      btn.position.set(10, 10 + index * 40);

      btn.on("pointerover", () => {
        this.descriptionText.text = skill.description;
        this.descriptionBox.visible = true;
      });
      btn.on("pointerout", () => {
        this.descriptionBox.visible = false;
      });
      btn.on("pointerdown", () => {
        AudioManager.instance.play("sfx_confirm");
        this.emit("command", "skill", skill);
      });
      this.skillMenu.addChild(btn);
    });

    const backButton = this.createStyledButton("Back", 100, 35);
    backButton.position.set(10, 10 + skills.length * 40);
    backButton.on("pointerdown", () => {
      AudioManager.instance.play("sfx_cancel");
      this.showSubMenu("none");
    });
    this.skillMenu.addChild(backButton);
  }

  public createPartyTargetMenu(party: Combatant[]): void {
    this.partyTargetMenu.removeChildren();
    const bg = new Graphics()
      .roundRect(0, 0, 320, 180, 8)
      .fill({ color: 0x1a1a2e, alpha: 0.9 });
    this.partyTargetMenu.addChild(bg);

    party.forEach((member, index) => {
      const btn = this.createStyledButton(member.name, 300, 35);
      btn.position.set(10, 10 + index * 40);
      btn.on("pointerdown", () => {
        AudioManager.instance.play("sfx_confirm");
        this.emit("targetSelected", member);
      });
      this.partyTargetMenu.addChild(btn);
    });

    const backButton = this.createStyledButton("Back", 100, 35);
    backButton.position.set(10, 10 + party.length * 40);
    backButton.on("pointerdown", () => {
      AudioManager.instance.play("sfx_cancel");
      this.showSubMenu("none"); // Go back to the main command menu
    });
    this.partyTargetMenu.addChild(backButton);
  }

  public createEnemyTargetMenu(enemies: Combatant[]): void {
    this.enemyTargetMenu.removeChildren();
    const bg = new Graphics()
      .roundRect(0, 0, 320, 180, 8)
      .fill({ color: 0x1a1a2e, alpha: 0.9 });
    this.enemyTargetMenu.addChild(bg);

    enemies.forEach((enemy, index) => {
      const btn = this.createStyledButton(enemy.name, 300, 35);
      btn.position.set(10, 10 + index * 40);
      btn.on("pointerdown", () => {
        AudioManager.instance.play("sfx_confirm");
        this.emit("targetSelected", enemy);
      });
      this.enemyTargetMenu.addChild(btn);
    });

    const backButton = this.createStyledButton("Back", 100, 35);
    backButton.position.set(10, 10 + enemies.length * 40);
    backButton.on("pointerdown", () => {
      AudioManager.instance.play("sfx_cancel");
      this.showSubMenu("none");
    });
    this.enemyTargetMenu.addChild(backButton);
  }

  public showSubMenu(
    menu: "skill" | "partyTarget" | "enemyTarget" | "none",
  ): void {
    this.skillMenu.visible = menu === "skill";
    this.partyTargetMenu.visible = menu === "partyTarget";
    this.enemyTargetMenu.visible = menu === "enemyTarget";

    if (menu === "none") {
      this.commandMenu.alpha = 1.0;
      this.commandMenu.eventMode = "static";
    } else {
      this.commandMenu.alpha = 0.5;
      this.commandMenu.eventMode = "none";
    }

    this.partyStatusDisplays.forEach((display) => {
      display.visible = menu === "none";
    });

    // Hide description box if not in a relevant menu
    if (menu === "partyTarget" || menu === "enemyTarget") {
      this.descriptionBox.visible = false;
    }
  }

  public updateAllStatus(): void {
    this.partyStatusDisplays.forEach((d) => d.update());
    this.enemyStatusDisplays.forEach((d) => d.update());
  }

  public setCommandsActive(isActive: boolean): void {
    this.commandMenu.alpha = isActive ? 1.0 : 0.5;
    this.commandMenu.eventMode = isActive ? "static" : "none";
  }

  public showActionText(text: string, target: Combatant): void {
    let color = "#ffffff";
    if (text === "Weakness") color = "#ffdd00";
    if (text === "Resist") color = "#88aaff";
    if (text === "Miss") color = "#aaaaaa";
    if (text === "Critical!") color = "#ff8800";
    if (text === "Type Shift!") color = "#cc88ff";

    const style = new TextStyle({
      fontFamily: "Uni Sans Heavy",
      fontSize: 48,
      fill: color,
      stroke: { color: "black", width: 5 },
      fontWeight: "bold",
    });

    const actionText = new Text({ text, style });
    actionText.anchor.set(0.5);

    const isPlayer = this.partyStatusDisplays.some(
      (d) => (d as any).combatant === target,
    );
    if (isPlayer) {
      const display = this.partyStatusDisplays.find(
        (d) => (d as any).combatant === target,
      );
      if (display) {
        actionText.position.set(display.x + display.width / 2, display.y);
      } else {
        return;
      }
    } else {
      actionText.position.set(
        target.sprite.x,
        target.sprite.y - target.sprite.height / 4,
      );
    }

    this.addChild(actionText);

    gsap.to(actionText, {
      y: actionText.y - 60,
      alpha: 0,
      duration: 1.5,
      ease: "power1.out",
      onComplete: () => {
        this.removeChild(actionText);
        actionText.destroy();
      },
    });
  }

  public showDamageNumber(damage: number, target: Combatant): void {
    let displayText = damage.toString();
    let color = "#ff4d4d";

    // Check for nullified attack
    if (damage === 0) {
      displayText = "Nulled";
      color = "#36013F";
    }

    const style = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 48,
      fill: color,
      stroke: { color: "white", width: 4 },
      fontWeight: "bold",
    });

    const damageText = new Text({ text: displayText, style });
    damageText.anchor.set(0.5);

    const isPlayer = this.partyStatusDisplays.some(
      (d) => (d as any).combatant === target,
    );
    if (isPlayer) {
      const display = this.partyStatusDisplays.find(
        (d) => (d as any).combatant === target,
      );
      if (display) {
        damageText.position.set(display.x + display.width / 2, display.y);
      } else {
        return; // Should not happen, if it does, we're fucked
      }
    } else {
      damageText.position.set(
        target.sprite.x,
        target.sprite.y - target.sprite.height / 4,
      );
    }

    this.addChild(damageText);

    gsap.to(damageText, {
      y: damageText.y - 60,
      alpha: 0,
      duration: 1.5,
      ease: "power1.out",
      onComplete: () => {
        this.removeChild(damageText);
        damageText.destroy();
      },
    });
  }
}
