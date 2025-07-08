import { AssetManager } from "./AssetManager";
import { SceneManager } from "./SceneManager";
import { DialogueScene } from "../scenes/DialogueScene";
import { PointAndClickScene } from "../scenes/PointAndClickScene";
import { DialogueManager, RawDialogueLine } from "./DialogueManager";
import { CombatScene } from "../scenes/CombatScene";
import { Scene } from "../scenes/Scene";

interface DialogueEvent {
  type: "DIALOGUE";
  scriptId: string;
  onCompleteEventId?: string;
  background?: string;
}

interface ChangeLocationEvent {
  type: "CHANGE_LOCATION";
  locationId: string;
}

interface RecruitmentEvent {
  type: "RECRUITMENT";
}

interface ChangeSceneEvent {
  type: "CHANGE_SCENE";
  scene: "COMBAT" | "PointAndClick";
  enemyId?: string;
  sceneData?: string;
  onWinEventId?: string; // optional event to trigger on combat win
  background?: string;
}

interface ReturnToMapEvent {
  type: "RETURN_TO_MAP";
  sceneData: string; // e.g 'marshlandsSceneData'
  locationId: string; // e.g. 'marshlands9'
}

export type GameEvent =
  | DialogueEvent
  | ChangeLocationEvent
  | RecruitmentEvent
  | ChangeSceneEvent
  | ReturnToMapEvent;

export class EventHandler {
  private static events: Map<string, GameEvent>;

  public static initialize(): void {
    const eventData = AssetManager.get("eventData");
    this.events = new Map(Object.entries(eventData));
    console.log(`[EventHandler] Initialized with ${this.events.size} events.`);
  }

  public static trigger(eventId: string, sceneContext?: Scene): void {
    console.log(`[EventHandler] Triggering event: ${eventId} `);
    const event = this.events.get(eventId);
    if (!event) {
      console.warn(`[EventHandler] Event with ID "${eventId}" not found.`);
      return;
    }
    console.log(event);

    if (
      event.type !== "CHANGE_SCENE" &&
      event.type !== "RETURN_TO_MAP" &&
      !(sceneContext instanceof PointAndClickScene)
    ) {
      console.error(
        `[EventHandler] Event type "${event.type}" requires a PointAndClickScene context.`,
      );
      return;
    }

    switch (event.type) {
      case "DIALOGUE":
        this.handleDialogue(event, sceneContext as PointAndClickScene);
        break;
      case "CHANGE_LOCATION":
        this.handleChangeLocation(event, sceneContext as PointAndClickScene);
        break;
      case "RECRUITMENT":
        this.handleRecruitment(sceneContext as PointAndClickScene);
        break;
      case "CHANGE_SCENE":
        this.handleChangeScene(event);
        break;
      case "RETURN_TO_MAP":
        this.handleReturnToMap(event);
        break;
      default:
        console.warn(
          `[EventHandler] Unknown event type for event ID "${eventId}"`,
        );
    }
  }

  private static getScript(scriptId: string): RawDialogueLine[] { // will do something about this later
    let rawScript: RawDialogueLine[];

    if (scriptId.includes("/")) {
      const [dataAlias, scriptName] = scriptId.split("/");
      const sceneData = AssetManager.get(dataAlias);
      if (sceneData && sceneData.scripts && sceneData.scripts[scriptName]) {
        rawScript = sceneData.scripts[scriptName];
      } else {
        console.error(
          `[EventHandler] Embedded script "${scriptName}" not found in data asset "${dataAlias}".`,
        );
        return [];
      }
    } else {
      rawScript = AssetManager.get(scriptId);
    }

    if (!Array.isArray(rawScript)) {
      console.error(
        `[EventHandler] Resolved script for "${scriptId}" is not a valid dialogue array.`,
        rawScript,
      );
      return [];
    }

    return rawScript;
  }

  private static handleDialogue(
    event: DialogueEvent,
    sceneContext: PointAndClickScene,
  ): void {
    let rawScript: RawDialogueLine[];

    if (event.scriptId.includes("/")) {
      const [dataAlias, scriptName] = event.scriptId.split("/");
      const sceneData = AssetManager.get(dataAlias);
      if (sceneData && sceneData.scripts && sceneData.scripts[scriptName]) {
        rawScript = sceneData.scripts[scriptName];
      } else {
        console.error(
          `[EventHandler] Embedded script "${scriptName}" not found in data asset "${dataAlias}".`,
        );
        return;
      }
    } else {
      rawScript = AssetManager.get(event.scriptId);
    }

    if (!Array.isArray(rawScript)) {
      console.error(
        `[EventHandler] Resolved script for "${event.scriptId}" is not a valid dialogue array.`,
        rawScript,
      );
      return;
    }

    const processedScript = DialogueManager.processScript(rawScript);

    if (event.background) {
      sceneContext.changeBackground(event.background);
      sceneContext.hideHotspots();
    }

    const onComplete = () => {
      SceneManager.popScene();
      if (event.onCompleteEventId) {
        this.trigger(event.onCompleteEventId, sceneContext);
      } else if (event.background) {
        // If this was a blocking dialogue (had a background) and there's no next event,
        sceneContext.showHotspots();
      }
    };

    const dialogueScene = new DialogueScene(processedScript, onComplete);
    SceneManager.pushScene(dialogueScene);
  }

  private static handleChangeLocation(
    event: ChangeLocationEvent,
    sceneContext: PointAndClickScene,
  ): void {
    sceneContext.changeLocation(event.locationId);
  }

  private static handleRecruitment(sceneContext: PointAndClickScene): void {
    sceneContext.setupRecruitment();
  }

  private static handleChangeScene(event: ChangeSceneEvent): void {
    switch (event.scene) {
      case "PointAndClick":
        if (!event.sceneData) {
          console.error(
            `[EventHandler] Event type "${event.type}" to scene "PointAndClick" is missing required 'sceneData' property.`,
          );
          return;
        }
        SceneManager.changeScene(new PointAndClickScene(event.sceneData));
        break;
      case "COMBAT":
        if (!event.enemyId) {
          console.error(
            `[EventHandler] Event type "${event.type}" to scene "COMBAT" is missing required 'enemyId' property.`,
          );
          return;
        }
        SceneManager.changeScene(
          new CombatScene(
            event.enemyId,
            event.onWinEventId,
            event.background,
          ),
        );
        break;
    }
  }

  private static handleReturnToMap(event: ReturnToMapEvent): void {
    const newScene = new PointAndClickScene(event.sceneData, event.locationId);
    SceneManager.changeScene(newScene);
  }
}
