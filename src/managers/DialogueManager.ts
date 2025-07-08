import { GameManager } from "./GameManager";

export interface RawDialogueLine {
  character?: string;
  text?: string;
  sprite?: string;
  background?: string;
  conditions?: {
    partySize?: number | number[];
    hasMember?: string | string[];
    lacksMember?: string | string[];
  };
  choices?: DialogueChoice[];
  lines?: RawDialogueLine[];
}

export interface DialogueChoice {
  conditions: {
    hasMember: string;
  };
  character?: string;
  text?: string;
  sprite?: string;
  lines?: RawDialogueLine[];
}

export interface ProcessedDialogueLine {
  character: string;
  text: string;
  sprite?: string;
  background?: string;
}

export class DialogueManager {
  public static processScript(
    rawScript: RawDialogueLine[],
  ): ProcessedDialogueLine[] {
    const processedScript: ProcessedDialogueLine[] = [];
    const party = GameManager.instance.party;
    const partySize = party.length;
    const partyMemberNames = party.map((p) => p.name);

    for (const line of rawScript) {
      if (line.choices) {
        const validChoices = line.choices.filter((choice) =>
          this.conditionsMet(choice.conditions, partySize, partyMemberNames),
        );

        if (validChoices.length > 0) {
          const randomIndex = Math.floor(Math.random() * validChoices.length);
          const chosenBlock = validChoices[randomIndex];
          const linesToAdd = Array.isArray(chosenBlock.lines)
            ? chosenBlock.lines
            : [chosenBlock];

          linesToAdd.forEach((choiceLine) => {
            processedScript.push(this.processLine(choiceLine, party));
          });
        }
        continue;
      }

      if (this.conditionsMet(line.conditions, partySize, partyMemberNames)) {
        processedScript.push(this.processLine(line, party));
      }
    }

    return processedScript;
  }

  private static processLine(
    line: RawDialogueLine,
    party: any[],
  ): ProcessedDialogueLine {
    return {
      character: line.character ?? "",
      text: this.replacePlaceholders(line.text ?? "", party),
      sprite: line.sprite,
      background: line.background,
    };
  }

  private static conditionsMet(
    conditions: RawDialogueLine["conditions"],
    partySize: number,
    partyMemberNames: string[],
  ): boolean {
    if (!conditions) {
      return true;
    }

    if (conditions.partySize !== undefined) {
      if (Array.isArray(conditions.partySize)) {
        if (!conditions.partySize.includes(partySize)) return false;
      } else {
        if (conditions.partySize !== partySize) return false;
      }
    }

    if (conditions.hasMember) {
      const membersToHave = Array.isArray(conditions.hasMember)
        ? conditions.hasMember
        : [conditions.hasMember];
      for (const member of membersToHave) {
        if (!partyMemberNames.includes(member)) return false;
      }
    }

    if (conditions.lacksMember) {
      const membersToLack = Array.isArray(conditions.lacksMember)
        ? conditions.lacksMember
        : [conditions.lacksMember];
      for (const member of membersToLack) {
        if (partyMemberNames.includes(member)) return false;
      }
    }

    return true;
  }

  // eg {party[1].name} -> Scout
  private static replacePlaceholders(text: string, party: any[]): string {
    return text.replace(/\{party\[(\d+)]\.name}/g, (match, indexStr) => {
      const index = parseInt(indexStr, 10);
      return party[index]?.name || match;
    });
  }
}
