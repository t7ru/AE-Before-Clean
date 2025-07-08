import { Text, TextStyle, Sprite, Container } from "pixi.js";
import { GifSprite } from "pixi.js/gif";
import { Scene } from "./Scene";
import { GameManager } from "../managers/GameManager";
import { AudioManager } from "../managers/AudioManager";
import { AssetManager } from "../managers/AssetManager";
import { DialogueBox } from "../ui/DialogueBox";
import { ProfileBox } from "../ui/ProfileBox";
import { EventHandler } from "../managers/EventHandler";

interface Hotspot {
  x: number;
  y: number;
  destination: string;
}

interface Location {
  background: string;
  hotspots: Hotspot[];
  onEnterEventId?: string;
}

interface RecruitInfo {
  name: string;
  dialogue: string;
  bio: string;
  portrait: string;
  removeDialogue: string;
  partyFullDialogue: string;
  sprite: string;
  x: number;
  y: number;
}

export class PointAndClickScene extends Scene {
  private locations: Map<string, Location>;
  private currentLocation!: Location;
  private background: Sprite;
  private hotspotsContainer: Container;
  private recruitmentContainer: Container | null = null;
  private partySelected: boolean = false; // future use
  private sceneData: any;
  private activeRecruitmentDialogue: DialogueBox | null = null;
  private hasInitialized: boolean = false;

  constructor(
    sceneDataAlias: string,
    private startingLocation?: string,
  ) {
    super();

    this.sceneData = AssetManager.get(sceneDataAlias);
    if (!this.sceneData) {
      throw new Error(`Scene data with alias "${sceneDataAlias}" not found.`);
    }

    this.background = new Sprite();
    this.background.width = 1280;
    this.background.height = 720;
    this.addChild(this.background);

    this.hotspotsContainer = new Container();
    this.addChild(this.hotspotsContainer);

    this.locations = new Map(Object.entries(this.sceneData.locations));
  }

  /** A public method to allow the EventHandler to change the background */
  public changeBackground(backgroundAlias: string): void {
    this.background.texture = AssetManager.getTexture(backgroundAlias);
  }

  /** A public method to allow the EventHandler to hide hotspots */
  public hideHotspots(): void {
    this.hotspotsContainer.visible = false;
  }

  /** A public method to allow the EventHandler to show hotspots */
  public showHotspots(): void {
    this.hotspotsContainer.visible = true;
  }

  public changeLocation(name: string): void {
    const location = this.locations.get(name);
    if (!location) {
      console.error(`Location "${name}" not found.`);
      return;
    }
    console.log(`Changing location to: ${name}`);

    this.currentLocation = location;
    this.background.texture = AssetManager.getTexture(location.background);

    this.hotspotsContainer.visible = true;
    this.drawHotspots();

    if (location.onEnterEventId) {
      EventHandler.trigger(location.onEnterEventId, this);
    }
  }

  private drawHotspots(): void {
    this.hotspotsContainer.removeChildren();
    this.currentLocation.hotspots.forEach((hotspotInfo) => {
      const hotspot = new GifSprite({
        source: AssetManager.get("circleMark"),
        autoPlay: true,
      });
      hotspot.width = 50;
      hotspot.height = 50;
      hotspot.anchor.set(0.5);
      hotspot.position.set(hotspotInfo.x, hotspotInfo.y);
      hotspot.eventMode = "static";
      hotspot.cursor = "pointer";
      hotspot.on("pointerdown", () => {
        if (this.locations.has(hotspotInfo.destination)) {
          this.changeLocation(hotspotInfo.destination);
        } else {
          EventHandler.trigger(hotspotInfo.destination, this);
        }
      });
      this.hotspotsContainer.addChild(hotspot);
    });
  }

  public setupRecruitment(): void {
    if (this.recruitmentContainer) return;
    console.log("Setting up recruitment screen...");
    this.hotspotsContainer.visible = false;

    const recruitmentData = this.sceneData.recruitment;
    this.background.texture = AssetManager.getTexture(
      recruitmentData.background,
    );
    this.recruitmentContainer = new Container();
    this.addChild(this.recruitmentContainer);

    const style = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 36,
      fill: "white",
      align: "center",
    });
    const message = new Text({
      text: `Approach and select your squad.`,
      style,
    });
    message.anchor.set(0.5);
    message.position.set(
      recruitmentData.ui.messagePosition.x,
      recruitmentData.ui.messagePosition.y,
    );
    this.recruitmentContainer.addChild(message);

    const infoText = new Text({
      text: `Party: ${GameManager.instance.party.length}/3`,
      style: { ...style, fontSize: 24 },
    });
    infoText.anchor.set(0.5);
    infoText.position.set(
      recruitmentData.ui.infoTextPosition.x,
      recruitmentData.ui.infoTextPosition.y,
    );
    this.recruitmentContainer.addChild(infoText);

    const recruits: RecruitInfo[] = recruitmentData.recruits;

    const recruitSprites = new Map<string, Sprite>();

    recruits.forEach((recruitInfo) => {
      const sprite = new Sprite(AssetManager.getTexture(recruitInfo.sprite));
      sprite.anchor.set(0.5, 1);
      sprite.position.set(recruitInfo.x, recruitInfo.y);
      sprite.scale.set(0.25);
      sprite.eventMode = "static";
      sprite.cursor = "pointer";
      sprite.on("pointerdown", (e) => {
        AudioManager.instance.play("sfx_menu_ability");
        const isRecruited = GameManager.instance.party.some(
          (p) => p.name === recruitInfo.name,
        );
        const isPartyFull = GameManager.instance.party.length >= 3;

        if (isRecruited) {
          this.presentRemoveDialogue(
            recruitInfo,
            sprite,
            infoText,
            recruitSprites,
          );
        } else if (isPartyFull) {
          this.presentPartyFullDialogue(
            recruitInfo,
            sprite,
            infoText,
            recruitSprites,
          );
        } else {
          this.presentRecruitmentDialogue(
            recruitInfo,
            sprite,
            infoText,
            recruitSprites,
          );
        }
        e.stopPropagation(); // Stop the click from falling through to the dialogue buttons
      });

      this.recruitmentContainer!.addChild(sprite);
      recruitSprites.set(recruitInfo.name, sprite);
    });

    const buttonStyle = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 28,
      fill: "#99ff99",
    });
    const continueButton = new Text({
      text: `Confirm Squad`,
      style: buttonStyle,
    });
    continueButton.anchor.set(0.5);
    continueButton.position.set(
      recruitmentData.ui.confirmButtonPosition.x,
      recruitmentData.ui.confirmButtonPosition.y,
    );
    continueButton.eventMode = "static";
    continueButton.cursor = "pointer";
    continueButton.on("pointerdown", () => this.finishRecruitment());
    this.recruitmentContainer.addChild(continueButton);
  }

  private presentRecruitmentDialogue(
    recruitInfo: RecruitInfo,
    recruitSprite: Sprite,
    infoText: Text,
    allSprites: Map<string, Sprite>,
  ): void {
    if (this.activeRecruitmentDialogue) return;

    console.log(
      `[PointAndClickScene] Presenting recruitment dialogue for: ${recruitInfo.name}`,
    );
    // Disable all character sprites and the confirm button specifically
    allSprites.forEach((s) => (s.eventMode = "none"));
    const confirmButton = this.recruitmentContainer!.children.at(-1)!;
    confirmButton.eventMode = "none";

    const combatant = GameManager.instance.getRecruit(recruitInfo.name);
    if (!combatant) return;

    const profileBox = new ProfileBox(
      combatant,
      recruitInfo.bio,
      recruitInfo.portrait,
    );
    const dialogueBox = new DialogueBox();
    dialogueBox.slideIn();
    this.activeRecruitmentDialogue = dialogueBox; // Keep track of the active dialogue box
    console.log(
      "[PointAndClickScene] Assigned new DialogueBox to activeRecruitmentDialogue:",
      this.activeRecruitmentDialogue,
    );
    dialogueBox.showDialogue(recruitInfo.name, recruitInfo.dialogue);
    this.recruitmentContainer!.addChild(dialogueBox);

    const choiceStyle = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 22,
      fill: "white",
      stroke: { color: "black", width: 2 },
    });

    const acceptButton = new Text({
      text: "Recruit",
      style: { ...choiceStyle, fill: "#aaffaa" },
    });
    acceptButton.position.set(900, 100);
    acceptButton.eventMode = "none";
    acceptButton.cursor = "pointer";

    const declineButton = new Text({
      text: "Decline",
      style: { ...choiceStyle, fill: "#ffaaaa" },
    });
    declineButton.position.set(1050, 100);
    declineButton.eventMode = "none";
    declineButton.cursor = "pointer";

    const closeDialogue = () => {
      console.log("[PointAndClickScene] Closing recruitment dialogue.");
      this.recruitmentContainer!.removeChild(dialogueBox, profileBox);
      this.activeRecruitmentDialogue = null;
      console.log("[PointAndClickScene] activeRecruitmentDialogue cleared.");
      allSprites.forEach((s) => (s.eventMode = "static"));
      confirmButton.eventMode = "static";
    };

    // Defer adding listeners + enabling buttons to prevent click through
    setTimeout(() => {
      console.log("[setTimeout] Enabling recruit/decline buttons.");
      acceptButton.eventMode = "static";
      declineButton.eventMode = "static";

      acceptButton.on("pointerdown", () => {
        console.log("[acceptButton] Clicked!");
        if (GameManager.instance.party.length < 3) {
          const success = GameManager.instance.addPartyMember(recruitInfo.name);
          if (success) {
            AudioManager.instance.play("sfx_recruit");
            infoText.text = `${recruitInfo.name} has joined! Party: ${GameManager.instance.party.length}/3`;
            recruitSprite.alpha = 0.5;
          }
        }
        if (GameManager.instance.party.length >= 3) {
          infoText.text = `Party is full. Confirm your squad.`;
          allSprites.forEach((sprite, name) => {
            if (!GameManager.instance.party.some((p) => p.name === name)) {
              sprite.eventMode = "none";
              sprite.alpha = 0.5;
            }
          });
        }
        closeDialogue();
      });

      declineButton.on("pointerdown", () => {
        console.log("[declineButton] Clicked!");
        AudioManager.instance.play("sfx_decline");
        closeDialogue();
      });
    }, 0);

    dialogueBox.addChild(acceptButton, declineButton);
    this.recruitmentContainer!.addChild(profileBox);
  }

  private presentRemoveDialogue(
    recruitInfo: RecruitInfo,
    recruitSprite: Sprite,
    infoText: Text,
    allSprites: Map<string, Sprite>,
  ): void {
    if (this.activeRecruitmentDialogue) return;

    console.log(
      `[PointAndClickScene] Presenting REMOVAL dialogue for: ${recruitInfo.name}`,
    );
    allSprites.forEach((s) => (s.eventMode = "none"));
    const confirmButton = this.recruitmentContainer!.children.at(-1)!;
    confirmButton.eventMode = "none";

    const combatant = GameManager.instance.getRecruit(recruitInfo.name);
    if (!combatant) return;

    const profileBox = new ProfileBox(
      combatant,
      recruitInfo.bio,
      recruitInfo.portrait,
    );
    const dialogueBox = new DialogueBox();
    dialogueBox.slideIn();
    this.activeRecruitmentDialogue = dialogueBox;
    dialogueBox.showDialogue(recruitInfo.name, recruitInfo.removeDialogue);
    this.recruitmentContainer!.addChild(dialogueBox);

    const choiceStyle = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 22,
      fill: "white",
      stroke: { color: "black", width: 2 },
    });

    const removeButton = new Text({
      text: "Remove",
      style: { ...choiceStyle, fill: "#ffaaaa" },
    });
    removeButton.position.set(900, 100);
    removeButton.eventMode = "none";
    removeButton.cursor = "pointer";

    const cancelButton = new Text({
      text: "Cancel",
      style: { ...choiceStyle, fill: "#aaffaa" },
    });
    cancelButton.position.set(1050, 100);
    cancelButton.eventMode = "none";
    cancelButton.cursor = "pointer";

    const closeDialogue = () => {
      this.recruitmentContainer!.removeChild(dialogueBox, profileBox);
      this.activeRecruitmentDialogue = null;
      allSprites.forEach((s) => (s.eventMode = "static"));
      confirmButton.eventMode = "static";
    };

    setTimeout(() => {
      console.log("[setTimeout] Enabling remove/cancel buttons.");
      removeButton.eventMode = "static";
      cancelButton.eventMode = "static";

      removeButton.on("pointerdown", () => {
        console.log("[removeButton] Clicked!");
        AudioManager.instance.play("sfx_decline");
        GameManager.instance.removePartyMember(recruitInfo.name);
        infoText.text = `${recruitInfo.name} has left the squad. Party: ${GameManager.instance.party.length}/3`;
        recruitSprite.alpha = 1.0;
        closeDialogue();
      });

      cancelButton.on("pointerdown", () => {
        console.log("[cancelButton] Clicked!");
        closeDialogue();
      });
    }, 0);

    dialogueBox.addChild(removeButton, cancelButton);
    this.recruitmentContainer!.addChild(profileBox);
  }

  private presentPartyFullDialogue(
    recruitInfo: RecruitInfo,
    recruitSprite: Sprite, // future use
    infoText: Text,
    allSprites: Map<string, Sprite>,
  ): void {
    if (this.activeRecruitmentDialogue) return;

    console.log(
      `[PointAndClickScene] Presenting PARTY FULL dialogue for: ${recruitInfo.name}`,
    );
    allSprites.forEach((s) => (s.eventMode = "none"));
    const confirmButton = this.recruitmentContainer!.children.at(-1)!;
    confirmButton.eventMode = "none";

    const combatant = GameManager.instance.getRecruit(recruitInfo.name);
    if (!combatant) return;

    const profileBox = new ProfileBox(
      combatant,
      recruitInfo.bio,
      recruitInfo.portrait,
    );
    const dialogueBox = new DialogueBox();
    dialogueBox.slideIn();
    this.activeRecruitmentDialogue = dialogueBox;
    dialogueBox.showDialogue(recruitInfo.name, recruitInfo.partyFullDialogue);
    this.recruitmentContainer!.addChild(dialogueBox);

    const closeDialogue = () => {
      this.recruitmentContainer!.removeChild(dialogueBox, profileBox);
      this.activeRecruitmentDialogue = null;
      allSprites.forEach((s) => (s.eventMode = "static"));
      confirmButton.eventMode = "static";
    };

    const choiceStyle = new TextStyle({
      fontFamily: "Montserrat",
      fontSize: 22,
      fill: "white",
      stroke: { color: "black", width: 2 },
    });

    const understoodButton = new Text({
      text: "Understood",
      style: { ...choiceStyle, fill: "#aaffaa" },
    });
    understoodButton.position.set(975, 100);
    understoodButton.eventMode = "none";
    understoodButton.cursor = "pointer";

    setTimeout(() => {
      understoodButton.eventMode = "static";
      understoodButton.on("pointerdown", () => {
        AudioManager.instance.play("sfx_cancel");
        closeDialogue();
      });
    }, 0);

    dialogueBox.addChild(understoodButton);
    this.recruitmentContainer!.addChild(profileBox);
  }

  private finishRecruitment(): void {
    console.log("Finishing recruitment. Party confirmed.");
    this.partySelected = true;
    this.removeChild(this.recruitmentContainer!);
    this.recruitmentContainer = null;

    EventHandler.trigger("finishRecruitment", this);
    this.hotspotsContainer.visible = true;
  }

  public update(delta: number): void {
    if (!this.hasInitialized) {
      this.hasInitialized = true;
      const locationToGo =
        this.startingLocation || this.sceneData.initialLocation;
      if (locationToGo) {
        this.changeLocation(locationToGo);
      }
    }

    if (this.activeRecruitmentDialogue) {
      this.activeRecruitmentDialogue.update(delta * 1000);
    }
  }
}
