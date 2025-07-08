import { Combatant, Skill } from "./Combatant";
import { CombatScene } from "../scenes/CombatScene";
import { TurnResult } from "./TurnManager";
import { AudioManager } from "../managers/AudioManager";

// This file handles the execution of combat actions, like its name implies xd
export class CombatActionHandler {
  private scene: CombatScene;

  constructor(scene: CombatScene) {
    this.scene = scene;
  }

  private get ui() {
    return this.scene.ui;
  }

  public handleDirectAction(
    command: "attack" | "gun",
    active: Combatant,
    target: Combatant,
  ): void {
    let message = "";
    let result = TurnResult.Normal;

    switch (command) {
      case "attack":
        AudioManager.instance.play("sfx_attack");
        const attackResult = target.calculateDamage(
          { type: "physical" } as Skill,
          20,
          active.damageMultiplier,
        );
        result = attackResult.result;
        const takeDamageResult = target.takeDamage(attackResult.damage);
        this.ui.showDamageNumber(attackResult.damage, target);
        if (takeDamageResult.typeChanged) this.ui.showActionText("Type Shift!", target);
        if (attackResult.isCritical) this.ui.showActionText("Critical!", target);
        this.scene.animateHit(target, attackResult.result, attackResult.damage);
        if (target.isDefeated()) {
          this.scene.animateDeath(target);
        }
        message = `${active.name} attacks ${target.name}!`;
        break;
      case "gun":
        if (active.ammo > 0) {
          active.useAmmo(1);
          AudioManager.instance.play("sfx_gun_single");
          if (Math.random() * 100 <= 95) {
            const gunResult = target.calculateDamage(
              { type: "gun" } as Skill,
              35,
              active.damageMultiplier,
            );
            result = gunResult.result;
            const takeDamageResult = target.takeDamage(gunResult.damage);
            this.ui.showDamageNumber(gunResult.damage, target);
            if (takeDamageResult.typeChanged) this.ui.showActionText("Type Shift!", target);
            if (gunResult.isCritical) this.ui.showActionText("Critical!", target);
            this.scene.animateHit(target);
            if (target.isDefeated()) {
              this.scene.animateDeath(target);
            }
            message = `${active.name} fires at ${target.name}!`;
            if (result === TurnResult.Weakness) message += " A weak point!";
          } else {
            result = TurnResult.Miss;
            message = `${active.name}'s shot missed!`;
            this.ui.showActionText("Miss", target);
          }
        } else {
          message = "Out of ammo!";
          this.scene.isAcceptingInput = true;
        }
        break;
    }

    if (message !== "Out of ammo!") {
      this.endPlayerAction(active, result);
    }

    this.ui.logText.text = message;
    this.ui.updateAllStatus();
    this.scene.processEndOfTurn(active);

    if (this.scene.enemies.every((e) => e.isDefeated())) {
      this.scene.endBattle(true);
    } else if (!this.scene.enemies.every((e) => e.isDefeated())) {
      setTimeout(() => this.scene.promptNextAction(), 1000);
    }
  }

  public handleTargetedSkill(
    skill: Skill,
    active: Combatant,
    target: Combatant,
  ): void {
    let message = "";
    let result = TurnResult.Normal;
    let actionIsValid = true;

    if (skill.name === "Fiery Rage") {
      if (active.hasEnoughSp(skill.cost)) {
        active.useSp(skill.cost);
        active.applyStatusEffect("charged", { target: target });
        message = `${active.name} focuses his rage on ${target.name}!`;
      } else {
        message = "Not enough SP!";
        actionIsValid = false;
      }
    }
    else {
      if (active.hasEnoughSp(skill.cost)) {
        active.useSp(skill.cost);
        if (Math.random() * 100 <= skill.accuracy) {
          const skillResult = target.calculateDamage(
            skill,
            skill.power,
            active.damageMultiplier,
          );
          result = skillResult.result;
          const takeDamageResult = target.takeDamage(skillResult.damage);
          this.ui.showDamageNumber(skillResult.damage, target);
          if (takeDamageResult.typeChanged) this.ui.showActionText("Type Shift!", target);
          if (skillResult.isCritical) this.ui.showActionText("Critical!", target);
          this.scene.animateHit(target);
          if (target.isDefeated()) {
            this.scene.animateDeath(target);
          }
          message = `${active.name} uses ${skill.name} on ${target.name}!`;
          if (skill.name === "Sub-zero Quake" && Math.random() < 0.4) {
            target.applyStatusEffect("freeze", { duration: 1 });
            message += ` ${target.name} was frozen!`;
          }
        } else {
          result = TurnResult.Miss;
          this.ui.showActionText("Miss", target);
          message = `${active.name}'s ${skill.name} missed!`;
        }
      } else {
        message = "Not enough SP!";
        actionIsValid = false;
      }
    }

    if (!actionIsValid) {
      this.scene.isAcceptingInput = true;
    } else {
      this.endPlayerAction(active, result);
    }

    this.ui.logText.text = message;
    this.ui.updateAllStatus();
    this.scene.processEndOfTurn(active);

    if (this.scene.enemies.every((e) => e.isDefeated())) {
      this.scene.endBattle(true);
    } else if (!actionIsValid) {
    } else {
      setTimeout(() => this.scene.promptNextAction(), 1000);
    }
  }

  public handleAoeSkill(skill: Skill, active: Combatant): void {
    let message = "";
    let result = TurnResult.Normal;
    let actionIsValid = true;

    if (active.hasEnoughSp(skill.cost)) {
      active.useSp(skill.cost);

      const targets = this.scene.enemies.filter((e) => !e.isDefeated());
      let hitSomething = false;

      for (const target of targets) {
        if (Math.random() * 100 <= skill.accuracy) {
          hitSomething = true;
          const skillResult = target.calculateDamage(
            skill,
            skill.power,
            active.damageMultiplier,
          );
          result = skillResult.result;
          const takeDamageResult = target.takeDamage(skillResult.damage);
          this.ui.showDamageNumber(skillResult.damage, target);
          if (takeDamageResult.typeChanged) this.ui.showActionText("Type Shift!", target);
          if (skillResult.isCritical) this.ui.showActionText("Critical!", target);
          this.scene.animateHit(target);
          if (target.isDefeated()) this.scene.animateDeath(target);

          if (skill.name === "Flame Blast" && Math.random() < 0.3) {
            target.applyStatusEffect("burn", { duration: 3, power: 10 });
            message += ` ${target.name} was burned!`;
          }
        } else {
          this.ui.showActionText("Miss", target);
          if (targets.length === 1) result = TurnResult.Miss;
        }
      }

      if (!hitSomething && targets.length > 1) {
        message = `${active.name}'s ${skill.name} missed all targets!`;
        result = TurnResult.Miss;
      } else {
        message = `${active.name} uses ${skill.name}!`;
      }

      if (active.name === "Toxic Gunner" && Math.random() < 0.1) {
        const firstTarget = targets.find((t) => !t.isDefeated());
        if (firstTarget) {
          firstTarget.applyStatusEffect("toxic", { stacks: 1 });
          message += ` ${firstTarget.name} is afflicted by toxic!`;
        }
      }
    } else {
      message = "Not enough SP!";
      actionIsValid = false;
    }

    if (!actionIsValid) {
      this.scene.isAcceptingInput = true;
    } else {
      this.endPlayerAction(active, result);
    }

    this.ui.logText.text = message;
    this.ui.updateAllStatus();
    this.scene.processEndOfTurn(active);

    if (this.scene.enemies.every((e) => e.isDefeated())) {
      this.scene.endBattle(true);
    } else {
      setTimeout(() => this.scene.promptNextAction(), 1000);
    }
  }

  public handleSupportSkill(
    skill: Skill,
    active: Combatant,
    target: Combatant,
  ): void {
    let message = "";
    let actionIsValid = true;

    if (skill.name === "First Aid") {
      if (active.hasEnoughSp(skill.cost)) {
        active.useSp(skill.cost);
        target.heal(skill.power);
        message = `${active.name} heals ${target.name}!`;
        this.ui.showActionText("Heal", target);
      } else {
        message = "Not enough SP!";
        actionIsValid = false;
      }
    } else if (skill.name === "Ice Armor") {
      if (active.hasEnoughSp(skill.cost)) {
        active.useSp(skill.cost);
        target.applyStatusEffect("ice_armor", { duration: 3, power: 0.5 });
        message = `${active.name} shields ${target.name} with ice!`;
      } else {
        message = "Not enough SP!";
        actionIsValid = false;
      }
    }

    if (!actionIsValid) {
      this.scene.isAcceptingInput = true;
    } else {
      this.endPlayerAction(active, TurnResult.Normal);
    }

    this.ui.logText.text = message;
    this.ui.updateAllStatus();
    this.scene.processEndOfTurn(active);

    if (!this.scene.enemies.every((e) => e.isDefeated())) {
      setTimeout(() => this.scene.promptNextAction(), 1000);
    }
  }

  public handleSelfTargetSkill(skill: Skill, active: Combatant): void {
    let message = "";
    let actionIsValid = true;

    if (skill.name === "Call to Arms") {
      if (active.hasEnoughSp(skill.cost)) {
        active.useSp(skill.cost);
        const callToArmsSounds = [
          "sfx_call_to_arms_1",
          "sfx_call_to_arms_2",
          "sfx_call_to_arms_3",
        ];
        const randomSound =
          callToArmsSounds[Math.floor(Math.random() * callToArmsSounds.length)];
        AudioManager.instance.play(randomSound);
        this.scene.party.forEach(
          (member) => (member.damageMultiplier = skill.power),
        );
        message = `${active.name} uses ${skill.name}! The party is inspired!`;
      } else {
        message = "Not enough SP!";
        actionIsValid = false;
      }
    } else if (skill.name === "Venom Surge") {
      if (active.hp > skill.cost) {
        active.useHp(skill.cost);
        this.ui.turnManager.addHalfTurns(2);
        message = `${active.name} sacrifices his sanity for an advantage!`;
      } else {
        message = "Not enough HP!";
        actionIsValid = false;
      }
    } else if (skill.name === "Fiery Rage") {
      if (active.hasEnoughSp(skill.cost)) {
        active.useSp(skill.cost);
        active.applyStatusEffect("charged", {});
        message = `${active.name} is gathering immense heat!`;
      } else {
        message = "Not enough SP!";
        actionIsValid = false;
      }
    }

    if (!actionIsValid) {
      this.scene.isAcceptingInput = true;
    } else {
      this.endPlayerAction(active, TurnResult.Normal);
    }

    this.ui.logText.text = message;
    this.ui.updateAllStatus();
    this.scene.processEndOfTurn(active);

    if (this.scene.enemies.every((e) => e.isDefeated())) {
      this.scene.endBattle(true);
    } else {
      setTimeout(() => this.scene.promptNextAction(), 1000);
    }
  }

  public handlePass(active: Combatant): void {
    const message = `${active.name} passes the turn.`;
    this.ui.logText.text = message;
    this.endPlayerAction(active, TurnResult.Pass);
    this.ui.updateAllStatus();
    setTimeout(() => this.scene.promptNextAction(), 1000);
  }

  private endPlayerAction(active: Combatant, result: TurnResult): void {
    active.damageMultiplier = 1;
    this.scene.pendingCommand = null;
    this.scene.pendingSkill = null;
    this.ui.turnManager.consumeTurn(result);

    if (this.ui.turnManager.hasTurns()) {
      this.scene.activeCombatantIndex = this.scene.findNextLivingPartyMember(
        (this.scene.activeCombatantIndex + 1) % this.scene.party.length,
      );
    }
  }
}
