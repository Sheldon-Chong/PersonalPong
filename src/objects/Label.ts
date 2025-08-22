import { GameObject } from '../GameUtils'
import { Point2D, Vector2D, interpolate, randomBetween } from '../Coordinates'
import { PongGame } from '../pong'

export class Label extends GameObject {
    constructor(
        public text: string,
        position: Point2D,
        public game: PongGame,
        public font: string = "20px Arial",
        public color: string = "black",
    ) {
        super(position, game);
        this.hitbox = null;
        this.name = "string";
    }

    Draw() {
        this.ctx.font = this.font;
        this.ctx.fillStyle = this.color;
        const textWidth = this.ctx.measureText(this.text).width;
        const metrics = this.ctx.measureText(this.text);
        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        const x = this.getWorldPosition().x - textWidth / 2;
        const y = this.getWorldPosition().y + textHeight / 2;
        this.ctx.fillText(this.text, x, y);
    }
}



