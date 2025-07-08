import { Sprite } from "pixi.js";
import { TurnResult } from "./TurnManager";
import { AffinityManager } from "./AffinityManager";

export type SkillType =
  | "physical"
  | "gun"
  | "support"
  | "toxic"
  | "fire"
  | "ice"
  | "void";
export type Affinity = "weak" | "resist" | "null" | "drain";
export type StatusEffect =
  | "toxic"
  | "freeze"
  | "ice_armor"
  | "charged"
  | "burn";

export interface StatusEffectProperties {
  duration?: number;
  power?: number;
  stacks?: number;
  target?: Combatant;
}

export interface Skill {
  name: string;
  cost: number;
  costType?: "hp" | "sp";
  power: number;
  type: SkillType;
  accuracy: number;
  description: string;
}

export class Combatant {
  public name: string;
  public hp: number;
  public maxHp: number;
  public sp: number;
  public maxSp: number;
  public ammo: number;
  public usesAmmo: boolean;
  public sprite: Sprite;
  public skills: Skill[];
  public type: SkillType; // The combatant's own elemental type
  public affinities: Map<SkillType, Affinity>;
  public statusEffects: Map<StatusEffect, StatusEffectProperties> = new Map();
  public damageSound?: string;
  public damageMultiplier: number = 1;
  public deathSound?: string;

  constructor(
    name: string,
    hp: number,
    sp: number,
    ammo: number,
    sprite: Sprite,
    type: SkillType,
    skills: Skill[] = [],
    affinities: [SkillType, Affinity][] = [],
    damageSound?: string,
    deathSound?: string,
  ) {
    this.name = name;
    this.hp = hp;
    this.maxHp = hp;
    this.sp = sp;
    this.maxSp = sp;
    this.ammo = ammo;
    this.usesAmmo = ammo > 0;
    this.sprite = sprite;
    this.type = type;
    this.skills = skills;
    this.affinities = new Map(affinities);
    this.damageSound = damageSound;
    this.deathSound = deathSound;
  }

  public applyStatusEffect(
    effect: StatusEffect,
    properties: StatusEffectProperties,
  ): void {
    if (effect === "toxic" && this.statusEffects.has("toxic")) {
      const existing = this.statusEffects.get("toxic")!;
      existing.stacks = (existing.stacks || 1) + 1;
    } else {
      this.statusEffects.set(effect, properties);
    }
    console.log(`${this.name} is afflicted with ${effect}!`);
  }

  public calculateDamage(
    skill: Skill,
    basePower: number,
    damageMultiplier: number,
  ): { damage: number; result: TurnResult; isCritical: boolean } {
    let interaction = AffinityManager.getInteraction(skill.type, this);
    let isCritical = false;

    if (skill.type !== "support") {
      if (Math.random() < 0.1) {
        isCritical = true;
      }
    }

    if (isCritical && interaction.damage > 0) {
      interaction = { damage: 1.5, result: TurnResult.Weakness };
    }

    const toxicEffect = this.statusEffects.get("toxic");
    const toxicMultiplier = toxicEffect
      ? 1 + (toxicEffect.stacks || 1) * 0.1
      : 1;

    const calculatedDamage =
      basePower * damageMultiplier * interaction.damage * toxicMultiplier;

    const damageVariation = Math.random() * 0.2 + 0.9;
    const finalDamage = Math.floor(calculatedDamage * damageVariation);

    return { damage: finalDamage, result: interaction.result, isCritical };
  }

  public takeDamage(amount: number): { typeChanged: boolean } {
    let finalAmount = amount;
    const iceArmor = this.statusEffects.get("ice_armor");
    if (iceArmor) {
      finalAmount = Math.floor(finalAmount * (1 - iceArmor.power!));
      iceArmor.duration!--;
      if (iceArmor.duration! <= 0) {
        this.statusEffects.delete("ice_armor");
        console.log(`${this.name}'s Ice Armor broke!`);
      }
    }

    this.hp = Math.max(0, this.hp - finalAmount);
    console.log(`${this.name} takes ${finalAmount} damage!`);

    if (
      this.name === "Commander's Ego" &&
      this.type === "physical" &&
      this.hp / this.maxHp <= 0.3
    ) {
      this.type = "void";
      console.log("[BOSS] Commander's Ego is cornered! Type changed to Void.");
      return { typeChanged: true };
    }

    return { typeChanged: false };
  }

  public heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    console.log(`${this.name} recovers ${amount} HP!`);
  }

  public useSp(amount: number): void {
    this.sp = Math.max(0, this.sp - amount);
  }

  public useHp(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
  }

  public useAmmo(amount: number): void {
    this.ammo = Math.max(0, this.ammo - amount);
  }

  public hasEnoughSp(cost: number): boolean {
    return this.sp >= cost;
  }

  public isDefeated(): boolean {
    return this.hp <= 0;
  }
}
