import { Sprite } from "pixi.js";
import { Combatant, Skill } from "../combat/Combatant";
import { AssetManager } from "./AssetManager";

export class GameManager {
  private static _instance: GameManager;
  public party: Combatant[] = [];
  private allRecruits: Map<string, Combatant> = new Map();
  public availableRecruits: {
    id: string;
    combatant: Combatant;
    bio: string;
    portrait: string;
  }[] = [];

  private constructor() {
  }

  public static get instance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager();
    }
    return GameManager._instance;
  }

  public initializeParty(): void {
    const dropKick: Skill = {
      name: "Drop Kick",
      cost: 5,
      power: 45,
      type: "physical",
      accuracy: 90,
      description: "Runs at an enemy, delivering a cool looking kick.",
    };
    const firstAid: Skill = {
      name: "First Aid",
      cost: 10,
      power: 30,
      type: "support",
      accuracy: 100,
      description: "Heal a small amount of HP.",
    };
    const callToArms: Skill = {
      name: "Call to Arms",
      cost: 15,
      power: 1.8,
      type: "support",
      accuracy: 100,
      description: "Increase party's damage by 80% for one turn.",
    };

    // Toxic Gunner
    const toxicFumes: Skill = {
      name: "Toxic Fumes",
      cost: 10,
      power: 20,
      type: "toxic",
      accuracy: 101,
      description: "Deal toxic damage to all foes. Cannot miss.",
    };
    const venomSurge: Skill = {
      name: "Venom Surge",
      cost: 30,
      costType: "hp",
      power: 0,
      type: "support",
      accuracy: 100,
      description: "Sacrifice 30 HP to gain 2 half-turns for 1 full turn.",
    };

    // Sledger
    const subZeroQuake: Skill = {
      name: "Sub-zero Quake",
      cost: 10,
      power: 30,
      type: "ice",
      accuracy: 95,
      description: "Deal ice damage with a chance to Freeze.",
    };
    const iceArmor: Skill = {
      name: "Ice Armor",
      cost: 15,
      power: 0.5,
      type: "support",
      accuracy: 100,
      description: "Grant an ally 50% damage reduction for 3 hits.",
    };

    // Pyromancer
    const fieryRage: Skill = {
      name: "Fiery Rage",
      cost: 15,
      power: 0,
      type: "fire",
      accuracy: 100,
      description:
        "Focus on a target to unleash a powerful fire attack on your next turn.",
    };
    const flameBlast: Skill = {
      name: "Flame Blast",
      cost: 10,
      power: 15,
      type: "fire",
      accuracy: 90,
      description: "Deal fire damage to all foes with a chance to Burn.",
    };

    // Const All Potential Party Members
    const commander = new Combatant(
      "Commander",
      100,
      50,
      8,
      new Sprite(AssetManager.getTexture("commanderDefault")),
      "physical",
      [callToArms, firstAid],
    );
    const scout = new Combatant(
      "Scout",
      80,
      60,
      12,
      new Sprite(AssetManager.getTexture("scoutDefault")),
      "physical",
      [dropKick, firstAid],
    );
    const toxicGunner = new Combatant(
      "Toxic Gunner",
      90,
      40,
      10,
      new Sprite(AssetManager.getTexture("toxicGunnerDefault")),
      "toxic",
      [toxicFumes, venomSurge],
    );
    const pyromancer = new Combatant(
      "Pyromancer",
      70,
      80,
      0,
      new Sprite(AssetManager.getTexture("pyromancerDefault")),
      "fire",
      [fieryRage, flameBlast],
    );
    const sledger = new Combatant(
      "Sledger",
      110,
      30,
      0,
      new Sprite(AssetManager.getTexture("sledgerDefault")),
      "ice",
      [subZeroQuake, iceArmor],
    );

    this.availableRecruits = [
      {
        id: "scout",
        combatant: scout,
        bio: "A fast and agile fighter specializing in physical attacks and support.",
        portrait: "scoutPortrait",
      },
      {
        id: "toxicGunner",
        combatant: toxicGunner,
        bio: "A specialist in toxic attacks that weaken foes over time.",
        portrait: "toxicGunnerPortrait",
      },
      {
        id: "pyromancer",
        combatant: pyromancer,
        bio: "A master of fire magic, capable of dealing heavy damage with fiery spells.",
        portrait: "pyromancerPortrait",
      },
      {
        id: "sledger",
        combatant: sledger,
        bio: "A sturdy warrior with a strong affinity for ice, able to freeze enemies in their tracks.",
        portrait: "sledgerPortrait",
      },
    ];

    this.allRecruits.set(commander.name, commander);
    this.allRecruits.set(scout.name, scout);
    this.allRecruits.set(toxicGunner.name, toxicGunner);
    this.allRecruits.set(pyromancer.name, pyromancer);
    this.allRecruits.set(sledger.name, sledger);

    // Player starts with only the Commander
    this.party = [commander];
    console.log("Player party initialized with Commander.");
  }

  public getRecruit(name: string): Combatant | undefined {
    return this.allRecruits.get(name);
  }

  public addPartyMember(name: string): boolean {
    if (this.party.length >= 3) {
      console.log("Party is full. Cannot add more members.");
      return false;
    }

    if (this.party.some((member) => member.name === name)) {
      console.log(`${name} is already in the party.`);
      return false;
    }

    const recruit = this.allRecruits.get(name);
    if (recruit) {
      this.party.push(recruit);
      console.log(`${name} has been added to the party.`);
      return true;
    }

    console.log(`Recruit with name ${name} not found.`);
    return false;
  }

  public removePartyMember(name: string): void {
    if (name === "Commander") {
      console.log("Commander cannot be removed from the party.");
      return;
    }
    this.party = this.party.filter((member) => member.name !== name);
    console.log(`${name} has been removed from the party.`);
  }
}
