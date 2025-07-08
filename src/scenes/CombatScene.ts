import {
  Sprite,
  Text,
  TextStyle,
  BlurFilter,
} from "pixi.js";
import * as PIXI from "pixi.js";
import { Scene } from "./Scene";
import { Combatant, Skill } from "../combat/Combatant";
import { SceneManager } from "../managers/SceneManager";
import { TitleScene } from "./TitleScene";
import { CombatUI } from "../ui/CombatUI";
import { TurnResult } from "../combat/TurnManager";
import { GameManager } from "../managers/GameManager";
import { AudioManager } from "../managers/AudioManager";
import { AssetManager } from "../managers/AssetManager";
import { CombatActionHandler } from "../combat/CombatActionHandler";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
import { EventHandler } from "../managers/EventHandler";

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

export class CombatScene extends Scene {
  public party: Combatant[];
  public enemies: Combatant[];
  public ui: CombatUI;
  public activeCombatantIndex: number = 0;
  public isAcceptingInput: boolean = true;
  public pendingSkill: Skill | null = null;
  private turnIndicatorText: Text;
  private egoBlessingUses: number = 0;
  private hasStarted: boolean = false;
  public pendingCommand: string | null = null;
  private actionHandler: CombatActionHandler;
  private currentEnemyIndex: number = 0;
  private onWinEventId?: string;

  constructor(
    enemyId: string,
    onWinEventId?: string,
    backgroundAlias?: string,
  ) {
    super();

    if (backgroundAlias) {
      const background = new Sprite(AssetManager.getTexture(backgroundAlias));
      background.width = 1280;
      background.height = 720;
      this.addChild(background);
    }

    this.onWinEventId = onWinEventId;

    this.party = GameManager.instance.party;

    const allEnemyData = AssetManager.get("enemyData");
    const encounterData = allEnemyData[enemyId];

    if (!encounterData) {
      throw new Error(
        `Enemy or encounter with ID "${enemyId}" not found in enemy data.`,
      );
    }

    this.enemies = [];
    const encounterList = Array.isArray(encounterData)
      ? encounterData
      : [encounterData];

    encounterList.forEach((enemyInfo, _index) => {
      // If the encounterData was a single object, enemyInfo is that object.
      // If it was an array, enemyInfo is an element from that array.
      const baseEnemyId = enemyInfo.id || enemyId;
      const baseEnemyData = allEnemyData[baseEnemyId];

      if (!baseEnemyData) {
        throw new Error(
          `Base enemy with ID "${baseEnemyId}" not found for encounter.`,
        );
      }

      const enemy = new Combatant(
        baseEnemyData.name,
        baseEnemyData.hp,
        baseEnemyData.sp,
        baseEnemyData.ammo,
        new Sprite(AssetManager.getTexture(baseEnemyData.sprite)),
        baseEnemyData.type,
        baseEnemyData.skills,
        baseEnemyData.affinities,
        baseEnemyData.damageSound,
        baseEnemyData.deathSound,
      );

      // enemy sprite pos
      enemy.sprite.anchor.set(0.5);
      enemy.sprite.scale.set(0.325);
      if (encounterList.length > 1) {
        enemy.sprite.position.set(enemyInfo.x, enemyInfo.y);
      } else {
        enemy.sprite.position.set(1280 / 2, 720 / 2 - 50);
      }
      this.addChild(enemy.sprite);
      this.enemies.push(enemy);
    });

    this.ui = new CombatUI(this.party, this.enemies);
    this.addChild(this.ui);

    this.actionHandler = new CombatActionHandler(this);

    this.ui.on("command", (command: string, data?: any) =>
      this.handlePlayerCommand(command, data),
    );
    this.ui.on("targetSelected", (target: Combatant) =>
      this.handleTargetSelected(target),
    );

    const indicatorStyle = new TextStyle({
      fontFamily: "Uni Sans Heavy",
      fontSize: 80,
      fill: "yellow",
      stroke: { color: "black", width: 8 },
      fontWeight: "bold",
      dropShadow: {
        color: "#000000",
        blur: 4,
        angle: Math.PI / 6,
        distance: 6,
      },
    });
    this.turnIndicatorText = new Text({ text: "", style: indicatorStyle });
    this.turnIndicatorText.anchor.set(0.5);
    this.turnIndicatorText.position.set(1280 / 2, 720 / 2);
    this.turnIndicatorText.visible = false;
    this.addChild(this.turnIndicatorText);

  }

  public startPlayerTurn(): void {
    const livingParty = this.party.filter((member) => !member.isDefeated());
    if (livingParty.length === 0) {
      this.endBattle(false);
      return;
    }

    this.activeCombatantIndex = this.party.findIndex(
      (member) => !member.isDefeated(),
    );
    this.egoBlessingUses = 0;
    this.ui.turnManager.startTurn(livingParty.length);
    this.ui.turnManager.visible = true;
    this.ui.enemyTurnManager.visible = false;

    this.animateTurnIndicator("Your Turn", "yellow", () => {
      this.ui.logText.text = "Your Turn!";
      this.promptNextAction();
    });
  }

  public promptNextAction(): void {
    if (!this.ui.turnManager.hasTurns()) {
    this.ui.highlightPartyMember(null);
    this.ui.setCommandsActive(false);
      this.animateTurnIndicator("Enemy Turn", "#ff4d4d", () => {
        this.ui.logText.text = "Enemy's Turn!";
        this.isAcceptingInput = false; // Lock input for enemy turn
        this.enemyTurn();
      });
      return;
    }
    const activeCombatant = this.party[this.activeCombatantIndex];

    if (activeCombatant.statusEffects.has("freeze")) {
      const freezeEffect = activeCombatant.statusEffects.get("freeze")!;
      freezeEffect.duration!--;
      this.ui.logText.text = `${activeCombatant.name} is frozen and cannot move!`;
      this.ui.showActionText("Frozen!", activeCombatant);
      if (freezeEffect.duration! <= 0) {
        activeCombatant.statusEffects.delete("freeze");
      }
      this.ui.turnManager.consumeTurn(TurnResult.Normal); // Consume the turn
      setTimeout(() => this.promptNextAction(), 1200);
      return;
    }

    if (activeCombatant.statusEffects.has("charged")) {
      console.log(
        `[PYRO] ${activeCombatant.name} has 'charged' status. Unleashing attack.`,
      );
      const chargeProperties = activeCombatant.statusEffects.get("charged")!;
      activeCombatant.statusEffects.delete("charged");

      let finalTarget = chargeProperties.target;
      if (!finalTarget || finalTarget.isDefeated()) {
        finalTarget = this.enemies
          .filter((e) => !e.isDefeated())
          .sort((a, b) => a.hp - b.hp)[0];
      }

      const unleashedSkill: Skill = {
        name: "Fiery Rage Unleashed",
        cost: 0,
        power: 60,
        type: "fire",
        accuracy: 100,
        description: "",
      };

      this.actionHandler.handleTargetedSkill(
        unleashedSkill,
        activeCombatant,
        finalTarget,
      );
      return;
    }

    console.log(`[PROMPT] Prompting action for ${activeCombatant.name}.`);
    this.ui.highlightPartyMember(activeCombatant);
    this.ui.logText.text = `What will ${activeCombatant.name} do?`;
    this.ui.createSkillMenu(activeCombatant.skills);
    this.ui.setCommandsActive(true);
    this.ui.showSubMenu("none");
    this.isAcceptingInput = true;
  }

  private handlePlayerCommand(
    command: string,
    skill?: Skill,
    isAutoAction: boolean = false,
  ): void {
    if (!this.isAcceptingInput && !isAutoAction) {
      console.log(`[INPUT LOCK] Command '${command}' blocked.`);
      return;
    }

    const active = this.party[this.activeCombatantIndex];
    console.log(
      `[COMMAND] Handling '${command}' for ${active.name}. Skill: ${skill?.name || "N/A"}`,
    );

    if (command === "skill" && !skill) {
      this.ui.showSubMenu("skill");
      return; // Exit here to prevent turn consumption
    }

    if (
      skill &&
      skill.type === "support" &&
      (skill.name === "First Aid" || skill.name === "Ice Armor")
    ) {
      this.pendingSkill = skill;
      this.ui.createPartyTargetMenu(this.party);
      this.ui.showSubMenu("partyTarget");
      return; // Wait for target selection
    }

    const aoESkills = ["Toxic Fumes", "Flame Blast"];
    const needsEnemyTarget =
      command === "attack" ||
      command === "gun" ||
      (skill && skill.type !== "support" && !aoESkills.includes(skill.name));
    if (needsEnemyTarget) {
      this.pendingCommand = command;
      this.pendingSkill = skill || null;
      this.ui.createEnemyTargetMenu(
        this.enemies.filter((e) => !e.isDefeated()),
      );
      this.ui.showSubMenu("enemyTarget");
      return;
    }

    this.isAcceptingInput = false;
    this.ui.highlightPartyMember(null); // Turn off highlight
    console.log(`[INPUT LOCK] Input locked for action processing.`);

    if (
      skill &&
      skill.type === "support" &&
      (skill.name === "Call to Arms" ||
        skill.name === "Venom Surge" ||
        skill.name === "Fiery Rage")
    ) {
      this.ui.showSubMenu("none"); // Close the skill menu
      this.actionHandler.handleSelfTargetSkill(skill, active);
      return;
    }

    if (command === "skill" && skill) {
      this.ui.showSubMenu("none");
      this.actionHandler.handleAoeSkill(skill, active);
      return;
    }

    if (command === "pass") {
      this.actionHandler.handlePass(active);
      return;
    }
  }

  private handleTargetSelected(target: Combatant): void {
    const active = this.party[this.activeCombatantIndex];

    this.isAcceptingInput = false;
    this.ui.highlightPartyMember(null); // Turn off highlight
    console.log(`[INPUT LOCK] Input locked for action processing.`);
    this.ui.showSubMenu("none");

    if (this.party.includes(target)) {
      if (this.pendingSkill) {
        this.actionHandler.handleSupportSkill(
          this.pendingSkill,
          active,
          target,
        );
      }
      return;
    }
    else if (this.enemies.includes(target)) {
      const command = this.pendingCommand;
      const skill = this.pendingSkill;

      if (command === "attack" || command === "gun") {
        this.actionHandler.handleDirectAction(command, active, target);
      }
      else if (command === "skill" && skill) {
        this.actionHandler.handleTargetedSkill(skill, active, target);
      }
      return; // Return here because the helper methods handle the rest of the turn
    }
  }

  private enemyTurn(): void {
    this.ui.turnManager.visible = false;
    // Set turns based on the number of living enemies
    const livingEnemies = this.enemies.filter((e) => !e.isDefeated());
    this.ui.enemyTurnManager.startTurn(livingEnemies.length);
    this.ui.enemyTurnManager.visible = true;
    this.currentEnemyIndex = 0; // Start with the first enemy
    this.processEnemyAction();
  }

  private processEnemyAction(): void {
    if (!this.ui.enemyTurnManager.hasTurns()) {
      this.ui.enemyTurnManager.visible = false;
      this.startPlayerTurn();
      return;
    }

    let actingEnemy: Combatant | null = null;
    for (let i = 0; i < this.enemies.length; i++) {
      const index = (this.currentEnemyIndex + i) % this.enemies.length;
      if (!this.enemies[index].isDefeated()) {
        this.currentEnemyIndex = index;
        actingEnemy = this.enemies[index];
        break;
      }
    }

    if (!actingEnemy) {
      this.endBattle(true);
      return;
    }

    const enemy = actingEnemy;

    if (enemy.statusEffects.has("freeze")) {
      const freezeEffect = enemy.statusEffects.get("freeze")!;
      freezeEffect.duration!--;
      this.ui.logText.text = `${enemy.name} is frozen and cannot move!`;
      this.ui.showActionText("Frozen!", enemy);
      if (freezeEffect.duration! <= 0) {
        enemy.statusEffects.delete("freeze");
      }
      this.ui.enemyTurnManager.consumeTurn(TurnResult.Normal); // Consume the turn
      // Move to the next enemy for the next action
      this.currentEnemyIndex =
        (this.currentEnemyIndex + 1) % this.enemies.length;
      setTimeout(() => this.processEnemyAction(), 1200);
      return;
    }

    let skillToUse: Skill;

    if (enemy.name === "Commander's Ego") {
      // Boss AI (currently only commanders ego)
      const isCornered = enemy.hp / enemy.maxHp <= 0.3;
      const isFirstMove =
        this.ui.enemyTurnManager.getTurnCount() ===
        this.enemies.filter((e) => !e.isDefeated()).length;

      if (isCornered && isFirstMove && this.egoBlessingUses === 0) {
        skillToUse = enemy.skills.find((s) => s.name === "Ego's Blessing")!;
        this.ui.logText.text = `${enemy.name} is cornered! It's lashing out!`;
      } else {
        let blessingChance = 0;
        if (this.egoBlessingUses === 0) blessingChance = 0.5;
        else if (this.egoBlessingUses === 1) blessingChance = 0.1;

        if (Math.random() < blessingChance) {
          skillToUse = enemy.skills.find((s) => s.name === "Ego's Blessing")!;
        } else {
          const useMalice = Math.random() < 0.4;
          skillToUse = useMalice
            ? enemy.skills.find((s) => s.name === "Ego's Malice")!
            : enemy.skills.find((s) => s.name === "Ego's Wrath")!;
        }
      }
    } else {
      skillToUse = enemy.skills[0];
    }

    setTimeout(() => {
      this.ui.enemyTurnManager.consumeTurn(TurnResult.Normal);

      if (skillToUse.type === "support") {
        this.egoBlessingUses++;
        this.ui.enemyTurnManager.addHalfTurns(2);
        this.ui.logText.text = `${enemy.name} uses ${skillToUse.name}!`;
        this.ui.showActionText("More Actions!", enemy);
      } else {
        const livingParty = this.party.filter((member) => !member.isDefeated());
        if (livingParty.length === 0) {
          this.endBattle(false);
          return;
        }
        const target =
          livingParty[Math.floor(Math.random() * livingParty.length)];

        const attackResult = target.calculateDamage(
          skillToUse,
          skillToUse.power,
          1,
        );

        const takeDamageResult = target.takeDamage(attackResult.damage);
        this.ui.showDamageNumber(attackResult.damage, target);
        if (takeDamageResult.typeChanged) this.ui.showActionText("Type Shift!", target);
        this.animateHit(target);
        this.ui.logText.text = `${enemy.name} uses ${skillToUse.name} on ${target.name}!`;
        if (skillToUse.name === "Ego's Malice" && Math.random() < 0.3) {
          const statusEffect = Math.random() < 0.5 ? "burn" : "freeze";
          if (statusEffect === "burn") {
            target.applyStatusEffect("burn", { duration: 3, power: 10 });
            this.ui.showActionText("Burned!", target);
          } else {
            target.applyStatusEffect("freeze", { duration: 1 });
            this.ui.showActionText("Frozen!", target);
          }
        }
      }

      this.ui.updateAllStatus();
      this.processEndOfTurn(enemy);

      if (this.party.every((p) => p.isDefeated())) {
        this.endBattle(false);
      } else {
        this.currentEnemyIndex =
          (this.currentEnemyIndex + 1) % this.enemies.length;
        this.processEnemyAction();
      }
    }, 1000);
  }

  public processEndOfTurn(combatant: Combatant): void {
    if (combatant.statusEffects.has("burn")) {
      const burn = combatant.statusEffects.get("burn")!;
      const burnDamage = burn.power || 10;
      const takeDamageResult = combatant.takeDamage(burnDamage);
      this.ui.showDamageNumber(burnDamage, combatant);
      if (takeDamageResult.typeChanged) this.ui.showActionText("Type Shift!", combatant);
      this.ui.showActionText("Burn", combatant);
      burn.duration!--;
      if (burn.duration! <= 0) {
        combatant.statusEffects.delete("burn");
      }
    }

    if (this.enemies.every((e) => e.isDefeated())) {
      this.endBattle(true);
    } else if (this.party.every((p) => p.isDefeated())) {
      this.endBattle(false);
    }
  }

  private animateTurnIndicator(
    text: string,
    color: string,
    onComplete: () => void,
  ): void {
    this.turnIndicatorText.text = text;
    this.turnIndicatorText.style.fill = color;
    this.turnIndicatorText.visible = true;
    this.turnIndicatorText.alpha = 0;
    this.turnIndicatorText.scale.set(0.5);

    gsap
      .timeline({
        onComplete: () => {
          this.turnIndicatorText.visible = false;
          onComplete();
        },
      })
      .to(this.turnIndicatorText, {
        alpha: 1,
        duration: 0.4,
        ease: "power2.out",
      })
      .to(
        this.turnIndicatorText.scale,
        { x: 1, y: 1, duration: 0.4, ease: "back.out(1.7)" },
        "<",
      )
      .to(
        this.turnIndicatorText,
        { alpha: 0, duration: 0.3, ease: "power2.in" },
        "+=0.8",
      );
  }

  public animateHit(target: Combatant, result?: TurnResult, damage?: number): void {
    if (result === TurnResult.Resist && damage === 0) {
      this.ui.showDamageNumber(0, target);
      return;
    }

    if (target.damageSound && target.hp > 0) {
      AudioManager.instance.play(target.damageSound);
    } else if (target.deathSound && target.hp <= 0) {
      AudioManager.instance.play(target.deathSound);
    }

    const isPlayer = this.party.includes(target);

    if (isPlayer) {
      const display = this.ui.partyStatusDisplays.find(
        (d) => (d as any).combatant === target,
      );
      if (display) {
        gsap
          .timeline()
          .to(display, {
            pixi: { tint: 0xffffff },
            duration: 0.1,
            yoyo: true,
            repeat: 1,
          });
      }
    } else {
      const sprite = target.sprite;
      const originalX = sprite.x;

      const flashOverlay = new Sprite(sprite.texture);
      flashOverlay.tint = 0xffffff;
      flashOverlay.width = sprite.width;
      flashOverlay.height = sprite.height;
      flashOverlay.anchor.copyFrom(sprite.anchor);
      flashOverlay.position.copyFrom(sprite.position);
      flashOverlay.alpha = 0;
      this.addChild(flashOverlay);

      gsap
        .timeline()
        .to(flashOverlay, {
          pixi: { alpha: 0.8 },
          duration: 0.05,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            this.removeChild(flashOverlay);
            flashOverlay.destroy();
            console.log(`[animateHit] Flash complete for ${target.name}.`);
          },
        })
        .to(
          sprite,
          { x: originalX + 5, yoyo: true, repeat: 5, duration: 0.03 },
          0,
        );
    }
  }

  public animateDeath(target: Combatant): void {
    console.log(
      `[animateDeath] Starting new dissolve animation for ${target.name}.`,
    );
    const sprite = target.sprite;

    const deathSound = target.deathSound || "sfx_death";
    AudioManager.instance.play(deathSound);

    let blurFilter: BlurFilter;
    if (
      sprite.filters &&
      sprite.filters.length > 0 &&
      sprite.filters[0] instanceof BlurFilter
    ) {
      blurFilter = sprite.filters[0] as BlurFilter;
    } else {
      blurFilter = new BlurFilter();
      sprite.filters = [blurFilter];
    }
    blurFilter.strength = 0;

    gsap
      .timeline({
        onComplete: () => {
          console.log(`[animateDeath] Animation complete for ${target.name}.`);
          sprite.visible = false;
        },
      })
      // violent shake for crit
      .to(sprite, {
        x: sprite.x - 6,
        yoyo: true,
        repeat: 10,
        duration: 0.05,
        ease: "power1.inOut",
      })
      // white flash
      .to(sprite, { pixi: { tint: 0xff0000 }, duration: 0.1 }, "-=0.2")
      // dissolve
      .to(sprite, {
        pixi: {
          alpha: 0,
          scale: sprite.scale.x * 0.7,
          strength: 15,
        },
        duration: 0.7,
        ease: "power2.in",
      });
  }

  public endBattle(playerWon: boolean): void {
    this.isAcceptingInput = false;
    this.ui.commandMenu.visible = false;
    if (playerWon) {
      AudioManager.instance.play("sfx_victory");
      this.ui.logText.text = "You won!";
      // allow death animations to finish
      setTimeout(() => {
        if (this.onWinEventId) {
          EventHandler.trigger(this.onWinEventId);
        } else {
          SceneManager.changeScene(new TitleScene());
        }
      }, 2000);
    } else {
      this.ui.logText.text = "You were defeated...";
      setTimeout(() => SceneManager.changeScene(new TitleScene()), 3000);
    }
  }

  public findNextLivingPartyMember(startIndex: number): number {
    const partySize = this.party.length;
    for (let i = 0; i < partySize; i++) {
      const index = (startIndex + i) % partySize;
      if (!this.party[index].isDefeated()) {
        return index;
      }
    }
    return -1;
  }

  public update(_delta: number): void {
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.startPlayerTurn();
    }
  }
}
