import { Container, Graphics, Sprite, Text, TextStyle } from "pixi.js";
import { Combatant, SkillType } from "../combat/Combatant";
import { AssetManager } from "../managers/AssetManager";
import { AffinityManager } from "../combat/AffinityManager";

export class ProfileBox extends Container {
  constructor(combatant: Combatant, bio: string, portraitAlias: string) {
    super();

    const boxWidth = 1240;
    const boxHeight = 380;
    const boxX = 20;
    const boxY = 150;

    const box = new Graphics()
      .roundRect(0, 0, boxWidth, boxHeight, 8)
      .fill({ color: 0x000033, alpha: 0.8 })
      .stroke({ width: 2, color: 0x9999ff });
    this.addChild(box);

    // Portrait
    const portrait = new Sprite(AssetManager.getTexture(portraitAlias));
    portrait.position.set(20, 20);
    portrait.width = 128;
    portrait.height = 128;
    this.addChild(portrait);

    // Name
    const nameStyle = new TextStyle({
      fontFamily: "Uni Sans Heavy",
      fontSize: 32,
      fill: "white",
    });
    const nameText = new Text({ text: combatant.name, style: nameStyle });
    nameText.position.set(170, 20);
    this.addChild(nameText);

    // Bio
    const bioStyle = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 18,
      fill: "#cccccc",
      wordWrap: true,
      wordWrapWidth: 1000,
    });
    const bioText = new Text({ text: bio, style: bioStyle });
    bioText.position.set(170, 65);
    this.addChild(bioText);

    // Stats
    const statsStyle = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 20,
      fill: "white",
      fontWeight: "600",
    });
    const statsText = new Text({
      text: `HP: ${combatant.maxHp} | SP: ${combatant.maxSp} | Ammo: ${combatant.ammo > 0 ? combatant.ammo : "N/A"}`,
      style: statsStyle,
      resolution: window.devicePixelRatio || 1,
    });
    statsText.position.set(30, 160);
    this.addChild(statsText);

    // Affinities, Strengths, Effects
    const headerStyle = new TextStyle({
      fontFamily: "Uni Sans Heavy",
      fontSize: 20,
      fill: "#aaccff",
    });
    const affinityStyle = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 16,
      fill: "white",
    });

    const weaknesses: SkillType[] = [];
    const resistances: SkillType[] = [];
    const nullifies: SkillType[] = [];
    let effects = "None";

    combatant.affinities.forEach((value, key) => {
      if (value === "weak") weaknesses.push(key);
      if (value === "resist") resistances.push(key);
      if (value === "null") nullifies.push(key);
    });

    const inherentAffinities = AffinityManager.getInherentAffinities(
      combatant.type,
    );
    weaknesses.push(...inherentAffinities.weaknesses);
    resistances.push(...inherentAffinities.resistances);

    if (combatant.name === "Toxic Gunner")
      effects =
        "Skills can apply Toxic, increasing damage taken from all sources. Stacks.";
    if (combatant.name === "Sledger")
      effects = "Skills can Freeze foes, causing them to lose their next turn.";
    if (combatant.name === "Pyromancer")
      effects =
        "Skills can Burn foes, dealing damage at the end of their turn.";

    const startY = 195;
    const column1X = 30;
    const column2X = 250;
    const column3X = 470;
    const column4X = 630;

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    // Weaknesses
    const weakHeader = new Text({ text: "Weak To", style: headerStyle });
    weakHeader.position.set(column1X, startY);
    this.addChild(weakHeader);
    const weakText = new Text({
      text:
        weaknesses.length > 0 ? weaknesses.map(capitalize).join(", ") : "None",
      style: { ...affinityStyle, fill: "#ff8888" },
    });
    weakText.position.set(column1X, startY + 30);
    this.addChild(weakText);

    // Resistances + Nulls
    const resistHeader = new Text({ text: "Resists", style: headerStyle });
    resistHeader.position.set(column2X, startY);
    this.addChild(resistHeader);
    const resistText = new Text({
      text:
        resistances.length > 0
          ? resistances.map(capitalize).join(", ")
          : "None",
      style: { ...affinityStyle, fill: "#88aaff" },
    });
    resistText.position.set(column2X, startY + 30);
    this.addChild(resistText);

    const nullHeader = new Text({ text: "Nullifies", style: headerStyle });
    nullHeader.position.set(column2X, startY + 60);
    this.addChild(nullHeader);
    const nullText = new Text({
      text:
        nullifies.length > 0 ? nullifies.map(capitalize).join(", ") : "None",
      style: { ...affinityStyle, fill: "#cccccc" },
    });
    nullText.position.set(column2X, startY + 90);
    this.addChild(nullText);

    // Type
    const typeHeader = new Text({ text: "Type", style: headerStyle });
    typeHeader.position.set(column3X, startY);
    this.addChild(typeHeader);
    const typeText = new Text({
      text: capitalize(combatant.type),
      style: { ...affinityStyle, fill: "#ffff88" },
    });
    typeText.position.set(column3X, startY + 30);
    this.addChild(typeText);

    // Skills + Effects
    const skillHeader = new Text({ text: "Skills", style: headerStyle });
    skillHeader.position.set(column4X, startY);
    this.addChild(skillHeader);

    combatant.skills.forEach((skill, index) => {
      const skillText = new Text({
        text: `- ${skill.name}`,
        style: affinityStyle,
      });
      skillText.position.set(column4X, startY + 30 + index * 25);
      this.addChild(skillText);
    });

    const effectsHeader = new Text({ text: "Effects", style: headerStyle });
    effectsHeader.position.set(column4X, startY + 95);
    this.addChild(effectsHeader);
    const effectsText = new Text({
      text: effects,
      style: { ...affinityStyle, fill: "#aaff88" },
    });
    effectsText.position.set(column4X, startY + 120);
    this.addChild(effectsText);

    this.position.set(boxX, boxY);
  }
}
