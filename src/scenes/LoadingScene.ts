import { Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from './Scene';

export class LoadingScene extends Scene {
    private progressBar: Graphics;
    private progressText: Text;
    private barWidth = 400;
    private barHeight = 30;

    constructor() {
        super();

        const barX = (1280 - this.barWidth) / 2;
        const barY = (720 - this.barHeight) / 2;

        const bg = new Graphics()
            .rect(0, 0, 1280, 720)
            .fill(0x101010);
        this.addChild(bg);

        const bgBar = new Graphics();
        bgBar.rect(barX, barY, this.barWidth, this.barHeight).fill(0x333333);
        this.addChild(bgBar);

        this.progressBar = new Graphics();
        this.addChild(this.progressBar);

        const style = new TextStyle({
            fontFamily: 'Montserrat',
            fontSize: 24,
            fill: 'white',
        });
        this.progressText = new Text({text: 'Loading... 0%', style});
        this.progressText.anchor.set(0.5);
        this.progressText.position.set(1280 / 2, barY + this.barHeight + 30);
        this.addChild(this.progressText);

        this.updateProgress(0);
    }

    public updateProgress(progress: number): void {
        const barX = (1280 - this.barWidth) / 2;
        const barY = (720 - this.barHeight) / 2;

        this.progressBar.clear();
        this.progressBar.rect(barX, barY, this.barWidth * progress, this.barHeight).fill(0xeeeeee);

        this.progressText.text = `Loading... ${Math.round(progress * 100)}%`;
    }

    public update(_delta: number): void {}
}