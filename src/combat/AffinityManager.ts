import { SkillType, Affinity } from "./Combatant";
import { TurnResult } from "./TurnManager";

const affinityChart = new Map<
  SkillType,
  Map<SkillType, { result: TurnResult; multiplier: number }>
>([
  [
    "gun",
    new Map([["physical", { result: TurnResult.Weakness, multiplier: 1.5 }]]),
  ],
  // element triangle
  [
    "fire",
    new Map([
      ["toxic", { result: TurnResult.Weakness, multiplier: 1.5 }],
      ["ice", { result: TurnResult.Resist, multiplier: 0.5 }], // Fire resists Ice
    ]),
  ],
  [
    "toxic",
    new Map([
      ["ice", { result: TurnResult.Weakness, multiplier: 1.5 }],
      ["fire", { result: TurnResult.Resist, multiplier: 0.5 }], // Toxic resists Fire
    ]),
  ],
  [
    "ice",
    new Map([
      ["fire", { result: TurnResult.Weakness, multiplier: 1.5 }],
      ["toxic", { result: TurnResult.Resist, multiplier: 0.5 }], // Ice resists Toxic
    ]),
  ],
  [
    "physical",
    new Map([["void", { result: TurnResult.Resist, multiplier: 0 }]]),
  ],
]);

export class AffinityManager {
  public static getInteraction(
    attackType: SkillType,
    target: { type: SkillType; affinities: Map<SkillType, Affinity> },
  ): { damage: number; result: TurnResult } {
    const override = target.affinities.get(attackType);
    if (override) {
      switch (override) {
        case "weak":
          return { damage: 1.5, result: TurnResult.Weakness };
        case "resist":
          return { damage: 0.5, result: TurnResult.Resist };
        case "null":
          return { damage: 0, result: TurnResult.Resist };
      }
    }

    const attackAffinities = affinityChart.get(attackType);
    if (attackAffinities && attackAffinities.has(target.type)) {
      const interaction = attackAffinities.get(target.type)!;
      return { damage: interaction.multiplier, result: interaction.result };
    }

    if (target.type === "void") {
      return { damage: 0.5, result: TurnResult.Resist };
    }

    return { damage: 1.0, result: TurnResult.Normal };
  }

  public static getInherentAffinities(targetType: SkillType): {
    weaknesses: SkillType[];
    resistances: SkillType[];
  } {
    const weaknesses: SkillType[] = [];
    const resistances: SkillType[] = [];

    affinityChart.forEach((interactions, attackType) => {
      const interaction = interactions.get(targetType);
      if (interaction) {
        if (interaction.result === TurnResult.Weakness) {
          weaknesses.push(attackType);
        } else if (interaction.result === TurnResult.Resist) {
          resistances.push(attackType);
        }
      }
    });

    return { weaknesses, resistances };
  }

  public static getInherentStrengths(attackType: SkillType): SkillType[] {
    const strengths: SkillType[] = [];
    const attackInteractions = affinityChart.get(attackType);

    if (attackInteractions) {
      attackInteractions.forEach((interaction, targetType) => {
        if (interaction.result === TurnResult.Weakness) {
          strengths.push(targetType);
        }
      });
    }

    return strengths;
  }
}
